import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useLaundryStore } from '../stores/laundryStore';

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/profile/change-password', data);
      return response.data;
    },
  });
};

export const useUpdateNotificationPrefs = () => {
  const { updateNotificationPrefs } = useLaundryStore();
  
  return useMutation({
    mutationFn: async (prefs: any) => {
      await updateNotificationPrefs(prefs);
    },
  });
};
