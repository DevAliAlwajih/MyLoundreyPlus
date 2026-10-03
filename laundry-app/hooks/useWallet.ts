import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export interface WalletData {
  balance: number;
  billingType: string;
  commissionRate: number | null;
  trialCommissionEndsAt: string | null;
}

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get('/my-laundry/wallet');
      return response.data?.data as WalletData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export type TransactionFilter = 'all' | 'invoices' | 'receipts';

export interface WalletTransaction {
  id: string;
  kind?: 'invoice' | 'receipt';
  type?: 'charge' | 'refund' | 'recharge' | 'receipt' | string;
  // Invoice transaction fields
  invoiceId?: string;
  invoiceNumber?: string | null;
  invoiceTotal?: number;
  commissionRate?: number;
  commissionAmount?: number;
  // Receipt voucher fields
  amount?: number;
  balanceBefore?: number;
  balanceAfter: number;
  paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'electronic' | 'other' | string;
  referenceNumber?: string | null;
  notes?: string | null;
  adminName?: string | null;
  createdAt: string;
}

export function useWalletTransactions(filter: TransactionFilter = 'all') {
  return useInfiniteQuery({
    queryKey: ['wallet-transactions', filter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/my-laundry/wallet/transactions', {
        params: { page: pageParam, limit: 15, filter },
      });
      return response.data; // { success, data: [...], meta: { page, limit, total, totalPages } }
    },
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      if (meta && meta.page < meta.totalPages) {
        return meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
