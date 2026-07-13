import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// ─── Types aligned with backend Prisma schema ───────────────────────────────

export interface Promotion {
  id: string;
  laundryId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Fields returned by getMyPromotions stats
  viewsCount?: number;
  isExpired?: boolean;
  isUpcoming?: boolean;
}

export interface AdminAd {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
}

// ─── Create promotion payload (matches CreatePromotionDto) ───────────────────

export interface CreatePromotionPayload {
  title: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const useMyPromotions = () => {
  return useQuery({
    queryKey: ['promotions', 'my'],
    queryFn: async () => {
      const response = await api.get('/promotions/my');
      return response.data?.data as Promotion[];
    },
  });
};

export const useAdminAds = () => {
  return useQuery({
    queryKey: ['promotions', 'ads'],
    queryFn: async () => {
      const response = await api.get('/ads/active');
      return response.data?.data as AdminAd[];
    },
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePromotionPayload) => {
      const response = await api.post('/promotions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', 'my'] });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePromotionPayload> }) => {
      const response = await api.patch(`/promotions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', 'my'] });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/promotions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', 'my'] });
    },
  });
};

/**
 * useTogglePromotion — calls PATCH /promotions/:id/toggle (no body needed).
 * Optimistic update: flips isActive locally immediately, rolls back on error.
 */
export const useTogglePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/promotions/${id}/toggle`);
      return response.data?.data as { id: string; isActive: boolean };
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['promotions', 'my'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<Promotion[]>(['promotions', 'my']);

      // Optimistically update
      queryClient.setQueryData<Promotion[]>(['promotions', 'my'], (old) =>
        old ? old.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)) : old,
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
      // Roll back on error
      if (context?.previousData) {
        queryClient.setQueryData(['promotions', 'my'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', 'my'] });
    },
  });
};

/**
 * useUploadPromotionImage — POST /promotions/upload
 * Reuses the same UploadService pattern as /my-laundry/logo and /chat/upload.
 * Returns the hosted URL string.
 */
export const useUploadPromotionImage = () => {
  return useMutation({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'promotion.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/promotions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data?.url as string;
    },
  });
};
