import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

interface UpdateMeData {
  fullName: string;
}

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  const updateRememberedAccount = useAuthStore((s) => s.updateRememberedAccount);

  return useMutation({
    mutationFn: async (data: UpdateMeData) => {
      const response = await api.patch('/auth/me', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Update remembered account with new fullName
      updateRememberedAccount({ fullName: variables.fullName });
      // Invalidate any queries that might depend on user info
      // Though most user info is in authStore
    },
  });
};

interface RequestEmailChangeData {
  newEmail: string;
}

export const useRequestEmailChange = () => {
  return useMutation({
    mutationFn: async (data: RequestEmailChangeData) => {
      const response = await api.post('/auth/me/email/request', data);
      return response.data;
    },
  });
};

interface ConfirmEmailChangeData {
  newEmail: string;
  otp: string;
}

export const useConfirmEmailChange = () => {
  const updateRememberedAccount = useAuthStore((s) => s.updateRememberedAccount);

  return useMutation({
    mutationFn: async (data: ConfirmEmailChangeData) => {
      const response = await api.post('/auth/me/email/confirm', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      updateRememberedAccount({ email: variables.newEmail });
    },
  });
};

