import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderRole: 'laundry' | 'customer' | 'admin';
  message?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
  isRead: boolean;
  sentAt: string; // ISO string from sent_at
}

// ─── Helper: نحوّل الرسالة من شكل الباكند إلى شكل الفرونت ────────────────────

function mapMessage(raw: any): ChatMessage {
  return {
    id: raw.id,
    senderId: raw.sender_id,
    senderName: raw.users_chat_messages_sender_idTousers?.fullName,
    senderRole: raw.users_chat_messages_sender_idTousers?.role ?? 'customer',
    message: raw.message ?? undefined,
    attachmentUrl: raw.attachment_url ?? undefined,
    attachmentType: raw.attachment_type ?? undefined,
    isRead: raw.is_read,
    sentAt: raw.sent_at,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useChatMessages = (targetId: string, isFocused: boolean) => {
  const isSupport = targetId === 'support';
  const endpoint = isSupport
    ? '/chat/support/messages'
    : `/chat/laundry/${targetId}/messages`;

  return useQuery({
    queryKey: ['chat-messages', targetId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any[] }>(endpoint);
      return (response.data.data ?? []).map(mapMessage);
    },
    refetchInterval: isFocused ? 5000 : false,
    enabled: !!targetId,
  });
};

export const useSendMessage = (targetId: string) => {
  const queryClient = useQueryClient();
  const isSupport = targetId === 'support';
  const endpoint = isSupport
    ? '/chat/support/messages'
    : `/chat/laundry/${targetId}/messages`;

  return useMutation({
    mutationFn: async (data: {
      message?: string;
      attachmentUrl?: string;
      attachmentType?: string;
    }) => {
      const response = await api.post(endpoint, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', targetId] });
    },
  });
};

export const useDeleteMessage = (targetId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await api.delete(`/chat/messages/${messageId}`);
      return response.data;
    },
    onSuccess: (_, messageId) => {
      // حذف الرسالة من الـ cache مباشرة بدون re-fetch
      queryClient.setQueryData(
        ['chat-messages', targetId],
        (old: ChatMessage[] | undefined) =>
          old ? old.filter((m) => m.id !== messageId) : [],
      );
    },
  });
};

export const useMarkChatAsRead = (targetId: string) => {
  const queryClient = useQueryClient();
  const isSupport = targetId === 'support';
  const endpoint = isSupport ? null : `/chat/laundry/${targetId}/read`;

  return useMutation({
    mutationFn: async () => {
      if (!endpoint) return null;
      const response = await api.patch(endpoint);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', targetId] });
    },
  });
};

export const useUploadChatAttachment = () => {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }) => {
      const formData = new FormData();

      formData.append('attachment', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      const response = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      return response.data.data as { url: string; type: 'image' | 'pdf' };
    },
  });
};

export interface ConversationListResponse {
  id: string;
  customer: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  lastMessage: {
    id: string;
    message?: string;
    attachmentUrl?: string;
    attachmentType?: string;
    isRead: boolean;
    sentAt: string;
    senderId: string;
  };
  unreadCount: number;
}

export const useLaundryConversations = () => {
  return useQuery({
    queryKey: ['laundry-conversations'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ConversationListResponse[] }>('/chat/laundry/conversations');
      return response.data.data;
    },
  });
};
