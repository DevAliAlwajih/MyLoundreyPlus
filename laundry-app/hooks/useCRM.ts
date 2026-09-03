import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Customer, CustomerDetail } from '../stores/crmStore';

export const useCustomers = (search?: string, filterDeferred?: boolean) => {
  return useQuery({
    queryKey: ['customers', search, filterDeferred],
    queryFn: async () => {
      const response = await api.get('/my-laundry/customers', {
        params: { search, has_debt: filterDeferred ? 'true' : undefined }
      });
      return response.data?.data as Customer[];
    },
  });
};

export const useCustomerDetail = (phone: string) => {
  return useQuery({
    queryKey: ['customerDetail', phone],
    queryFn: async () => {
      const response = await api.get(`/my-laundry/customers/${encodeURIComponent(phone)}`);
      return response.data?.data as CustomerDetail;
    },
    enabled: !!phone,
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paidAmount, paymentMethod }: { id: string; paidAmount: number; paymentMethod: string }) => {
      const response = await api.patch(`/invoices/${id}`, { paidAmount, paymentType: paymentMethod });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Invalidate specific customer detail and invoice queries to ensure freshness
      queryClient.invalidateQueries({ queryKey: ['customerDetail'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useRemindCustomer = () => {
  return useMutation({
    mutationFn: async ({ customerId, channel }: { customerId: string; channel: 'whatsapp' | 'app' | 'both' }) => {
      const response = await api.post(`/my-laundry/customers/${encodeURIComponent(customerId)}/remind`, { channel });
      return response.data;
    },
  });
};

export const useUpdateCustomerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, data }: { customerId: string; data: { localName?: string; localPhone?: string; notes?: string } }) => {
      const response = await api.patch(`/my-laundry/customers/${encodeURIComponent(customerId)}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customerDetail', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerDetail'] });
    },
  });
};
