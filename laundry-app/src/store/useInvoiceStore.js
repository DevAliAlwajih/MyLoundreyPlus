import { create } from 'zustand';
import api from '../services/api';

const useInvoiceStore = create((set, get) => ({
  invoices:      [],
  activeInvoice: null,
  stats:         { total: 0, received: 0, washing: 0, ready: 0 },
  isLoading:     false,
  error:         null,

  // ─── Fetch summary stats for dashboard ─────────────────────────
  fetchStats: async () => {
    try {
      const res = await api.get('/invoices/dashboard-stats');
      set({ stats: res.data.data });
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  },

  // ─── Fetch all invoices for this laundry ────────────────────────
  fetchInvoices: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/invoices?${params}`);
      const invoices = res.data.data?.invoices || res.data.data || [];
      
      set({ invoices, isLoading: false });
      get().fetchStats(); // Also update stats
    } catch (err) {
      set({ isLoading: false, error: 'فشل تحميل الفواتير' });
    }
  },

  // ─── Update invoice status ───────────────────────────────────────
  updateStatus: async (invoiceId, status) => {
    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status });
      set(state => ({
        invoices: state.invoices.map(inv =>
          inv.id === invoiceId ? { ...inv, status } : inv
        ),
      }));
      get().fetchInvoices(); // refresh stats
      return { success: true };
    } catch (err) {
      return { success: false, error: 'فشل تحديث الحالة' };
    }
  },

  // ─── Create new invoice ─────────────────────────────────────────
  createInvoice: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/invoices', data);
      const newInvoice = res.data.data;
      set(state => ({
        invoices: [newInvoice, ...state.invoices],
        isLoading: false,
      }));
      return { success: true, invoice: newInvoice };
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل إنشاء الفاتورة';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ─── Find customer by QR unique_id ──────────────────────────────
  findCustomerByQR: async (uniqueId) => {
    try {
      const res = await api.get(`/users/by-unique-id/${uniqueId}`);
      return { success: true, customer: res.data.data };
    } catch {
      return { success: false, error: 'لم يتم العثور على العميل' };
    }
  },

  setActiveInvoice: (invoice) => set({ activeInvoice: invoice }),
  clearError: () => set({ error: null }),
}));

export default useInvoiceStore;
