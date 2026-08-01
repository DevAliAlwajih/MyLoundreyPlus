import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useLaundryStore, LaundryProfile, LaundryHoliday } from '../stores/laundryStore';
import { useAuthStore } from '../stores/authStore';

export const useProfile = () => {
  const { setProfile } = useLaundryStore();

  return useQuery({
    queryKey: ['my-laundry-profile'],
    queryFn: async () => {
      const response = await api.get('/my-laundry');
      const data = response.data?.data as LaundryProfile;
      setProfile(data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateRememberedAccount = useAuthStore((s) => s.updateRememberedAccount);

  return useMutation({
    mutationFn: async (data: Partial<LaundryProfile>) => {
      const response = await api.patch('/my-laundry', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-laundry-profile'] });
      
      const updates: any = {};
      if (variables.name !== undefined) updates.laundryName = variables.name;
      if (variables.phoneNumber !== undefined) updates.phone = variables.phoneNumber;
      
      if (Object.keys(updates).length > 0) {
        updateRememberedAccount(updates);
      }
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  const updateRememberedAccount = useAuthStore((s) => s.updateRememberedAccount);

  return useMutation({
    mutationFn: async (imageUri: string) => {
      // Need to send as multipart/form-data
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop() || 'logo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('logo', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/my-laundry/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-laundry-profile'] });
      if (data?.data?.logoUrl) {
        updateRememberedAccount({ logoUrl: data.data.logoUrl });
      }
    },
  });
};

export const useDeleteLogo = () => {
  const queryClient = useQueryClient();
  const updateRememberedAccount = useAuthStore((s) => s.updateRememberedAccount);

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/my-laundry/logo');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-laundry-profile'] });
      updateRememberedAccount({ logoUrl: null });
    },
  });
};

export const useLaundryHolidays = (upcoming = true) => {
  return useQuery({
    queryKey: ['my-laundry-holidays', upcoming],
    queryFn: async () => {
      const response = await api.get(`/my-laundry/holidays?upcoming=${upcoming}`);
      return response.data?.data as LaundryHoliday[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { date: string; reason?: string }) => {
      const response = await api.post('/my-laundry/holidays', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-laundry-holidays'] });
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/my-laundry/holidays/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-laundry-holidays'] });
    },
  });
};
