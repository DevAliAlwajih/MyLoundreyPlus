import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { getPeriodDates, useReportStore } from '../stores/reportStore';

export const useReports = () => {
  const { period, customStartDate, customEndDate } = useReportStore();
  const dates = getPeriodDates(period, customStartDate, customEndDate);

  return useQuery({
    queryKey: ['my-reports', period, dates.startDate, dates.endDate],
    queryFn: async () => {
      // Use the newly created laundry-specific endpoint instead of admin analytics
      const response = await api.get('/my-laundry/reports', {
        params: { from: dates.startDate, to: dates.endDate }
      });
      const data = response.data?.data;
      
      // Map backend payload to the existing UI format
      return {
        totalRevenue: data.paymentBreakdown.total,
        invoiceCount: data.statusSummary.completed + data.statusSummary.cancelled + data.statusSummary.processing,
        outstandingDeferred: data.totalOutstandingDebt,
        completedCount: data.statusSummary.completed,
        cancelledCount: data.statusSummary.cancelled,
        pendingCount: data.statusSummary.processing,
        breakdown: {
          cash: { amount: data.paymentBreakdown.cash, count: 0 },
          card: { amount: data.paymentBreakdown.card, count: 0 },
          deferred: { amount: data.paymentBreakdown.deferred, count: 0 },
          electronic: { amount: data.paymentBreakdown.electronic, count: 0 },
        },
        topItems: [],
        dailyBreakdown: null,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
