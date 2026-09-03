import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  I18nManager,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useLaundryStore } from '../../stores/laundryStore';
import { useBookings } from '../../hooks/useBookings';
import { useInvoices } from '../../hooks/useInvoices';
import { useWallet } from '../../hooks/useWallet';
import { AdCarousel } from '../../components/dashboard/AdCarousel';
import { useThemeStore } from '../../stores/themeStore';
import { useNotifications } from '../../hooks/useNotifications';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير ☀️';
  if (h < 17) return 'مساء الخير 🌤️';
  return 'مساء النور 🌙';
}

function fmtCurrency(n: number | undefined | null): string {
  if (n == null) return '—';
  return `${n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayRevenue: number;
  processingCount: number;
}

// ── Quick-access buttons ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { key: 'newInvoice', iconName: 'add-circle' as const, route: '/(app)/invoices/new', labelAr: 'فاتورة', labelEn: 'Invoice' },
  { key: 'customers', iconName: 'people' as const, route: '/(app)/crm', labelAr: 'العملاء', labelEn: 'Customers' },
  { key: 'bookings', iconName: 'calendar' as const, route: '/(app)/bookings', labelAr: 'الحجوزات', labelEn: 'Bookings' },
  { key: 'reports', iconName: 'bar-chart' as const, route: '/(app)/reports', labelAr: 'التقارير', labelEn: 'Reports' },
  { key: 'promotions', iconName: 'megaphone' as const, route: '/(app)/promotions', labelAr: 'العروض', labelEn: 'Promotions' },
];

// ── Ad Carousel ──────────────────────────────────────────────────────────────
// The AdCarousel component is now dynamically rendered from components/dashboard/AdCarousel

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 6 }} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
    </View>
  );
}



function QuickActions({ onPress }: { onPress: (route: string) => void }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors } = useThemeStore();
  const styles = getStyles(colors);

  return (
    <View style={styles.quickGrid}>
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={styles.quickBtn}
          onPress={() => onPress(action.route)}
          accessibilityLabel={isAr ? action.labelAr : action.labelEn}
        >
          <View style={styles.quickIconWrap}>
            <Ionicons name={action.iconName} size={24} color={colors.primary} />
          </View>
          <Text style={styles.quickLabel}>{isAr ? action.labelAr : action.labelEn}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const { colors } = useThemeStore();
  const styles = getStyles(colors);

  const [isFocused, setIsFocused] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['invoices'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
      queryClient.invalidateQueries({ queryKey: ['ads'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const { profile } = useLaundryStore();
  const { unreadCount } = useNotifications();
  const laundryName = isAr
    ? (profile?.nameAr || profile?.name || '—')
    : (profile?.name || '—');

  // Today's stats via a lightweight dedicated query
  const today = new Date().toISOString().split('T')[0];
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', today],
    queryFn: async () => {
      const res = await api.get('/my-laundry/reports', {
        params: { from: today, to: today },
      });
      const d = res.data?.data;
      return {
        todayRevenue: d?.paymentBreakdown?.total ?? 0,
        processingCount:
          (d?.statusSummary?.processing ?? 0) +
          (d?.statusSummary?.completed ?? 0),
      };
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: isFocused ? 5000 : false,
  });

  // Pending bookings count
  const { data: pendingBookings } = useBookings('pending');
  const pendingCount = pendingBookings?.length ?? 0;

  // Wallet
  const { data: walletData, isLoading: walletLoading } = useWallet();
  const balance = Number(walletData?.balance || 0);
  const isNegative = balance < 0;

  // Recent invoices (latest 3) — تُحدَّث عند كل عودة للشاشة
  const { data: recentInvoices, isLoading: invLoading, refetch: refetchInvoices } = useInvoices({});

  // أعد تحميل الفواتير كلما انتقل المستخدم إلى الداشبورد
  useFocusEffect(
    useCallback(() => {
      refetchInvoices();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }, [refetchInvoices, queryClient])
  );

  const navigate = (route: string) => router.push(route as any);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.laundryName}>{laundryName}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/(app)/notifications')}
            accessibilityLabel="الإشعارات"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Stats Grid ── */}
        <View style={styles.statsRow}>
          <StatCard
            label="إيرادات اليوم"
            value={fmtCurrency(stats?.todayRevenue)}
            loading={statsLoading}
          />
          <StatCard
            label="فواتير قيد التجهيز"
            value={String(stats?.processingCount ?? '—')}
            loading={statsLoading}
          />
        </View>

        {/* ── Wallet Card ── */}
        <TouchableOpacity
          style={styles.walletCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(app)/wallet')}
        >
          <View style={styles.walletIconWrap}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>رصيد المحفظة</Text>
            {walletLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <Text style={[styles.walletBalance, isNegative && styles.walletBalanceNegative]}>
                {fmtCurrency(balance)}
              </Text>
            )}
          </View>
          <Ionicons name={isAr ? "chevron-back" : "chevron-forward"} size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* ── Ad Carousel ── */}
        <AdCarousel />

        {/* ── Pending Bookings Alert ── */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => navigate('/(app)/bookings')}
            activeOpacity={0.8}
          >
            <Ionicons name="alarm-outline" size={18} color="#92400e" />
            <Text style={styles.alertText}>
              {pendingCount} حجوزات بانتظار الرد
            </Text>
            <Ionicons
              name={isAr ? 'chevron-back' : 'chevron-forward'}
              size={16}
              color="#92400e"
            />
          </TouchableOpacity>
        )}

        {/* ── Quick Access ── */}
        <Text style={styles.sectionLabel}>وصول سريع</Text>
        <QuickActions onPress={navigate} />

        {/* ── Recent Invoices ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>أحدث الفواتير</Text>
          <TouchableOpacity onPress={() => navigate('/(app)/invoices')}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </TouchableOpacity>
        </View>

        {invLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : !recentInvoices?.length ? (
          <View style={styles.emptyInv}>
            <Ionicons name="document-text-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyInvText}>لا توجد فواتير بعد</Text>
          </View>
        ) : (
          recentInvoices.slice(0, 3).map((inv: any) => (
            <TouchableOpacity
              key={inv.id}
              style={styles.invCard}
              onPress={() => navigate(`/(app)/invoices/${inv.id}`)}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.invCustomer}>{inv.customerName || '—'}</Text>
                <Text style={styles.invNum}>فاتورة #{inv.invoiceNumber || inv.id?.slice(-4)}</Text>
              </View>
              <InvoiceStatusBadge status={inv.status} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  draft:     { bg: '#f3f4f6', text: '#6b7280', label: 'مسودة' },
  received:  { bg: '#dbeafe', text: '#1e40af', label: 'قيد التجهيز' },
  washing:   { bg: '#dbeafe', text: '#1e40af', label: 'قيد التجهيز' },
  ironing:   { bg: '#dbeafe', text: '#1e40af', label: 'قيد التجهيز' },
  ready:     { bg: '#d1fae5', text: '#065f46', label: 'قيد التجهيز' },
  completed: { bg: '#d1fae5', text: '#065f46', label: 'تم التسليم' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'ملغي' },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  const { colors, themeMode } = useThemeStore();
  const styles = getStyles(colors);
  
  // Adjust badge colors slightly for dark mode for better contrast
  const isDark = themeMode === 'dark';
  const bgColor = isDark ? cfg.bg + '30' : cfg.bg; // Add transparency for dark mode
  const textColor = isDark ? (cfg.text === '#6b7280' ? '#9ca3af' : cfg.text) : cfg.text;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{cfg.label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  laundryName: { fontSize: 20, fontWeight: '700', color: colors.text },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceVariant || (colors.primary + '15'),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surfaceVariant || (colors.primary + '15'),
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.background === '#000000' || colors.background === '#121212' ? 0.3 : 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: colors.border ? 1 : 0,
    borderColor: colors.border,
  },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },

  // Wallet
  walletCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.background === '#000000' || colors.background === '#121212' ? 0.3 : 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
    borderWidth: colors.border ? 1 : 0,
    borderColor: colors.border,
  },
  walletIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant || (colors.primary + '15'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803d',
  },
  walletBalanceNegative: {
    color: '#dc2626',
  },

  // Alert
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background === '#000000' || colors.background === '#121212' ? '#78350f30' : '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b4530930',
  },
  alertText: { flex: 1, fontSize: 13, color: colors.background === '#000000' || colors.background === '#121212' ? '#fde68a' : '#92400e', fontWeight: '600' },

  // Quick Access
  sectionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    width: (SCREEN_W - 32 - 40) / 5,
    alignItems: 'center',
    gap: 6,
  },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant || (colors.primary + '15'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, color: colors.text, fontWeight: '500', textAlign: 'center' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seeAll: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  // Invoice card
  invCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.background === '#000000' || colors.background === '#121212' ? 0.3 : 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: colors.border ? 1 : 0,
    borderColor: colors.border,
  },
  invCustomer: { fontSize: 14, fontWeight: '600', color: colors.text },
  invNum: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Empty
  emptyInv: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyInvText: { fontSize: 14, color: colors.textSecondary },
});
