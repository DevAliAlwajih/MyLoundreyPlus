import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  referenceId: string | null;
  isRead: boolean;
  sentAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
  };
}

export function useNotifications(page = 1, limit = 20, unreadOnly = false) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<NotificationsResponse>({
    queryKey: ['notifications', page, limit, unreadOnly],
    queryFn: async () => {
      const res = await api.get('/notifications', {
        params: { page, limit, unreadOnly },
      });
      return res.data;
    },
  });

  const unreadCountQuery = useQuery<{ success: boolean; data: { count: number } }>({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 30000, // Refresh unread count every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/notifications/read-all');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  return {
    notifications: notificationsQuery.data?.data || [],
    meta: notificationsQuery.data?.meta,
    isLoading: notificationsQuery.isLoading,
    isRefetching: notificationsQuery.isRefetching,
    refetch: notificationsQuery.refetch,
    unreadCount: unreadCountQuery.data?.data?.count || 0,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
