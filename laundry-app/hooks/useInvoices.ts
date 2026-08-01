import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// --- Types ---
export interface CatalogItem {
  itemId: string;
  nameAr: string;
  nameEn?: string;
  fullServicePrice: number;
  washingPrice: number | null;
  ironingPrice: number | null;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface CatalogCategory {
  categoryId: string;
  categoryName: string;
  sortOrder: number;
  isActive: boolean;
  items: CatalogItem[];
}

export interface InvoiceItem {
  id: string;
  itemId?: string;
  itemName: string;
  itemNameAr?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  service_type?: string;
}

export interface StatusHistory {
  status: string;
  changedAt: string;
  notes: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'received' | 'washing' | 'ironing' | 'ready' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone: string;
  paymentType: 'cash' | 'card' | 'deferred' | 'electronic';
  isUrgent: boolean;
  notes: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  urgencyFeePercent: number;
  urgencyFeeAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  items: InvoiceItem[];
  statusHistory: StatusHistory[];
  createdAt: string;
  expectedDeliveryAt?: string;
}

// Normalize raw API response to frontend Invoice shape safely
function normalizeInvoice(raw: any): Invoice {
  const toNum = (v: any) => (v !== null && v !== undefined ? Number(v) : 0);
  return {
    id: raw.id,
    invoiceNumber: raw.invoiceNumber ?? raw.invoice_number ?? '--',
    status: raw.status,
    customerName: raw.customer?.fullName ?? raw.walk_in_name ?? '--',
    customerPhone: raw.customer?.phoneNumber ?? raw.walk_in_phone ?? '',
    paymentType: raw.paymentType ?? raw.payment_type ?? 'cash',
    isUrgent: toNum(raw.urgency_fee) > 0,
    notes: raw.notes ?? '',
    subtotal: toNum(raw.subtotal),
    discountPercent: toNum(raw.discountPercent ?? raw.discount_percent),
    discountAmount: toNum(raw.discountAmount ?? raw.discount),
    urgencyFeePercent: toNum(raw.urgencyFeePercent ?? raw.urgency_fee_percent),
    urgencyFeeAmount: toNum(raw.urgencyFeeAmount ?? raw.urgency_fee),
    taxPercent: toNum(raw.taxPercent ?? raw.tax_percent),
    taxAmount: toNum(raw.taxAmount ?? raw.tax_amount),
    total: toNum(raw.total ?? raw.totalAmount ?? raw.total_amount),
    items: (raw.items ?? []).map((item: any) => ({
      id: item.id,
      itemId: item.itemId,
      itemName: item.itemName ?? item.item_name ?? '',
      itemNameAr: item.item_name_ar ?? item.itemName ?? '',
      quantity: toNum(item.quantity),
      unitPrice: toNum(item.unitPrice ?? item.unit_price),
      totalPrice: toNum(item.subtotal ?? item.totalPrice ?? item.total_price ?? (toNum(item.unitPrice ?? item.unit_price) * toNum(item.quantity))),
      notes: item.notes ?? '',
      service_type: item.service_type,
    })),
    statusHistory: (raw.statusHistory ?? raw.statusLogs ?? []).map((h: any) => ({
      status: h.newStatus ?? h.status,
      changedAt: h.changedAt,
      notes: h.note ?? h.notes ?? '',
    })),
    createdAt: raw.createdAt,
    expectedDeliveryAt: raw.expected_delivery_at ?? raw.expectedDeliveryAt,
  };
}

// --- Hooks ---

// Fetch Invoices
export const useInvoices = (filters: any) => {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const response = await api.get('/invoices', { params: filters });
      return response.data?.data as Invoice[]; // Assuming paginated structure or flat list
    },
  });
};

// Fetch Single Invoice
export const useInvoiceById = (id: string) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await api.get(`/invoices/${id}`);
      return normalizeInvoice(response.data?.data);
    },
    enabled: !!id,
  });
};

// Create Invoice
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/invoices', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

// Update Invoice Status
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await api.patch(`/invoices/${id}/status`, { status, notes });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });
};

// Fetch Catalog Menu (Categories with Items)
export const useCatalogMenu = () => {
  return useQuery({
    queryKey: ['catalog-menu'],
    queryFn: async () => {
      const response = await api.get('/my-laundry/menu');
      return response.data?.data as CatalogCategory[];
    },
  });
};

// --- Category Mutations ---

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; sortOrder?: number }) => {
      const response = await api.post('/my-laundry/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-menu'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; sortOrder?: number; isActive?: boolean }) => {
      const response = await api.patch(`/my-laundry/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-menu'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/my-laundry/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-menu'] });
    },
  });
};

// --- Item Mutations ---

export const useCreateCatalogItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { categoryId: string; nameAr: string; nameEn?: string; basePrice: number; washing_price?: number; ironing_price?: number; sortOrder?: number }) => {
      const response = await api.post('/my-laundry/items', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-menu'] });
    },
  });
};

export const useUpdateCatalogItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await api.patch(`/my-laundry/items/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-menu'] });
    },
  });
};

export const useDeleteCatalogItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/my-laundry/items/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-menu'] });
    },
  });
};
