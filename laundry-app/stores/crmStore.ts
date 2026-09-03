import { create } from 'zustand';
import { Invoice } from '../hooks/useInvoices';

export interface Customer {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalInvoices: number;
  completedInvoices: number;
  deferredBalance: number;
  lastVisit: string | null;
}

export interface CustomerDetail extends Customer {
  totalSpent: number;
  invoices: Invoice[];
  notes?: string | null;
}

interface CRMStore {
  customers: Customer[];
  selectedCustomer: CustomerDetail | null;
  setCustomers: (customers: Customer[]) => void;
  setSelectedCustomer: (customer: CustomerDetail | null) => void;
}

export const useCRMStore = create<CRMStore>((set) => ({
  customers: [],
  selectedCustomer: null,
  setCustomers: (customers) => set({ customers }),
  setSelectedCustomer: (selectedCustomer) => set({ selectedCustomer }),
}));
