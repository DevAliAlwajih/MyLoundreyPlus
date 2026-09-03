import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useReports } from '../../../hooks/useReports';
import { useReportStore, PeriodReport } from '../../../stores/reportStore';
import { PeriodSelector } from '../../../components/reports/PeriodSelector';
import { KPICard } from '../../../components/reports/KPICard';
import { PaymentBreakdownRow } from '../../../components/reports/PaymentBreakdownRow';
import { TopItemsTable } from '../../../components/reports/TopItemsTable';
import { RevenueChart } from '../../../components/reports/RevenueChart';
import { useThemeStore } from '../../../stores/themeStore';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { period } = useReportStore();
  const { colors } = useThemeStore();
  
  const { data: report, isLoading, isError, refetch } = useReports();

  const isPeriodView = period === 'week' || period === 'month' || period === 'custom';

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (isError || !report) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('reports.failedToLoad')}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={{ color: colors.primary }}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KPICard 
              title={t('reports.totalRevenue')} 
              value={`${report.totalRevenue.toFixed(2)} ${t('reports.currency')}`} 
              bgType="primary" 
            />
            <KPICard 
              title={t('reports.invoiceCount')} 
              value={report.invoiceCount} 
            />
          </View>
          <View style={styles.kpiRow}>
            <KPICard 
              title={t('reports.outstandingDeferred')} 
              value={`${report.outstandingDeferred.toFixed(2)} ${t('reports.currency')}`} 
              bgType={report.outstandingDeferred > 0 ? 'danger' : 'neutral'} 
            />
            <KPICard 
              title={t('reports.completedInvoices')} 
              value={report.completedCount} 
            />
          </View>
        </View>

        {/* Revenue Chart (Period Only) */}
        {isPeriodView && (report as PeriodReport).dailyBreakdown && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('reports.revenueChart')}</Text>
            <RevenueChart dailyBreakdown={(report as PeriodReport).dailyBreakdown} />
          </View>
        )}

        {/* Payment Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('reports.paymentBreakdown')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <PaymentBreakdownRow 
              type="cash" 
              amount={report.breakdown.cash.amount} 
              count={report.breakdown.cash.count} 
              totalAmount={report.totalRevenue} 
            />
            <PaymentBreakdownRow 
              type="card" 
              amount={report.breakdown.card.amount} 
              count={report.breakdown.card.count} 
              totalAmount={report.totalRevenue} 
            />
            <PaymentBreakdownRow 
              type="deferred" 
              amount={report.breakdown.deferred.amount} 
              count={report.breakdown.deferred.count} 
              totalAmount={report.totalRevenue} 
            />
            <PaymentBreakdownRow 
              type="electronic" 
              amount={report.breakdown.electronic.amount} 
              count={report.breakdown.electronic.count} 
              totalAmount={report.totalRevenue} 
            />
          </View>
        </View>

        {/* Invoice Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('reports.invoiceStatus')}</Text>
          <View style={[styles.card, styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.text }]}>{t('reports.statusCompleted')}: {report.completedCount} ✅</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.text }]}>{t('reports.statusCancelled')}: {report.cancelledCount} ❌</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.text }]}>{t('reports.statusPending')}: {report.pendingCount} 🔄</Text>
            </View>
          </View>
        </View>

        {/* Top Items */}
        {report.topItems && report.topItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('reports.topItems')}</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TopItemsTable items={report.topItems} />
            </View>
          </View>
        )}

      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('reports.title')}</Text>
      </View>
      
      <PeriodSelector />
      
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 8,
  },
  kpiGrid: {
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'left',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
