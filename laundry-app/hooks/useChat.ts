import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

export interface ChatMessage {
  id: string;
  laundryId?: string;
  customerId?: string;
  senderRole: 'laundry' | 'customer' | 'admin';
  message?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
  isRead: boolean;
  createdAt: string;
}

export interface ChatResponse {
  success: boolean;
  data: ChatMessage[];
}

export const useChatMessages = (targetId: string, isFocused: boolean) => {
  const isSupport = targetId === 'support';
  const endpoint = isSupport 
    ? '/chat/support/messages' 
    : `/chat/laundry/${targetId}/messages`;

  return useQuery({
    queryKey: ['chat-messages', targetId],
    queryFn: async () => {
      const response = await api.get<ChatResponse>(endpoint);
      return response.data.data;
    },
    refetchInterval: isFocused ? 5000 : false, // Poll every 5s if screen is focused
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
    mutationFn: async (data: { message?: string; attachmentUrl?: string; attachmentType?: string }) => {
      const response = await api.post(endpoint, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', targetId] });
    },
  });
};

export const useMarkChatAsRead = (targetId: string) => {
  const queryClient = useQueryClient();
  // Support messages might not have a mark-as-read endpoint in ChatController, 
  // only laundry<->customer endpoints were defined for markAsRead.
  // We'll skip calling it if it's support, or call it if it exists.
  const isSupport = targetId === 'support';
  const endpoint = isSupport 
    ? null // No endpoint for support read in ChatController currently
    : `/chat/laundry/${targetId}/read`;

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
    mutationFn: async (fileUri: string) => {
      const formData = new FormData();
      
      const filename = fileUri.split('/').pop() || 'attachment';
      const isPdf = filename.toLowerCase().endsWith('.pdf');
      
      let type = 'image/jpeg'; // fallback
      if (isPdf) {
        type = 'application/pdf';
      } else {
        const match = /\.(\w+)$/.exec(filename);
        type = match ? `image/${match[1]}` : `image/jpeg`;
      }

      formData.append('attachment', {
        uri: fileUri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data as { url: string; type: 'image' | 'pdf' };
    },
  });
};
