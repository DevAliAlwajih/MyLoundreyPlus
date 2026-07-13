import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Booking, BookingStatus } from '../stores/bookingStore';

export const useBookings = (status?: BookingStatus | BookingStatus[], date?: string) => {
  return useQuery({
    queryKey: ['bookings', status, date],
    queryFn: async () => {
      const params: any = {};
      if (date) params.date = date;
      // For 'rejected' tab, we fetch both 'rejected' and 'cancelled'
      if (Array.isArray(status)) {
        params.status = status.join(',');
      } else if (status) {
        params.status = status;
      }
      const response = await api.get('/bookings/laundry', { params });
      return response.data?.data as Booking[];
    },
    refetchInterval: status === 'pending' ? 30000 : false, // Auto-refresh pending every 30s
  });
};

export const useAcceptBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.patch(`/bookings/laundry/${id}/status`, { status: 'confirmed', note: notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useRejectBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.patch(`/bookings/laundry/${id}/status`, { status: 'rejected', note: reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
