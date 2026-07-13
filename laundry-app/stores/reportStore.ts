import { create } from 'zustand';

export type ReportPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface PaymentBreakdown {
  cash: { amount: number; count: number };
  card: { amount: number; count: number };
  deferred: { amount: number; count: number };
  electronic: { amount: number; count: number };
}

export interface TopItem {
  itemNameAr: string;
  itemNameEn?: string;
  quantity: number;
  revenue: number;
}

export interface DailyReport {
  date: string;
  totalRevenue: number;
  invoiceCount: number;
  completedCount: number;
  cancelledCount: number;
  pendingCount: number;
  breakdown: PaymentBreakdown;
  outstandingDeferred: number;
  topItems: TopItem[];
}

export interface PeriodReport extends DailyReport {
  startDate: string;
  endDate: string;
  dailyBreakdown: {
    date: string;
    totalRevenue: number;
    invoiceCount: number;
  }[];
}

interface ReportStore {
  period: ReportPeriod;
  customStartDate: string | null;
  customEndDate: string | null;
  setPeriod: (period: ReportPeriod) => void;
  setCustomDates: (start: string | null, end: string | null) => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  period: 'today',
  customStartDate: null,
  customEndDate: null,
  setPeriod: (period) => set({ period }),
  setCustomDates: (start, end) => set({ customStartDate: start, customEndDate: end }),
}));

// Utility to get start/end dates for a period relative to today
export const getPeriodDates = (period: ReportPeriod, customStart: string | null, customEnd: string | null) => {
  const today = new Date();
  
  const formatDate = (date: Date) => {
    // Return YYYY-MM-DD
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  if (period === 'today') {
    const dateStr = formatDate(today);
    return { startDate: dateStr, endDate: dateStr, singleDate: dateStr };
  }
  
  if (period === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = formatDate(yesterday);
    return { startDate: dateStr, endDate: dateStr, singleDate: dateStr };
  }

  if (period === 'week') {
    const startOfWeek = new Date(today);
    // Assuming week starts on Sunday (0)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return { startDate: formatDate(startOfWeek), endDate: formatDate(endOfWeek) };
  }

  if (period === 'month') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { startDate: formatDate(startOfMonth), endDate: formatDate(endOfMonth) };
  }

  // Custom
  return { startDate: customStart || formatDate(today), endDate: customEnd || formatDate(today) };
};
