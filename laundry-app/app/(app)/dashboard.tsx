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

const { width: SCREEN_W } = Dimensions.get('window');
const PRIMARY = '#1a5fa8';
const BG = '#f4f6fb';

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

// ── Ad-banner slides (static until backend ads endpoint is wired) ──────────

const AD_SLIDES = [
  {
    id: '1',
    badge: 'إعلان',
    title: 'خصم 20% على اشتراك المنصة',
    subtitle: 'عرض العيد الوطني — لفترة محدودة',
    bg: '#e8f0fb',
    accent: PRIMARY,
  },
  {
    id: '2',
    badge: 'جديد',
    title: 'ميزة الحجز الإلكتروني متاحة الآن',
    subtitle: 'اجعل عملاءك يحجزون بسهولة عبر التطبيق',
    bg: '#edf7f0',
    accent: '#1a8a4a',
  },
  {
    id: '3',
    badge: 'تذكير',
    title: 'اكتمل ملفك التجاري؟',
    subtitle: 'أضف موقعك وساعات العمل لزيادة الظهور',
    bg: '#fdf3e8',
    accent: '#d97706',
  },
];

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
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={PRIMARY} style={{ marginTop: 6 }} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
    </View>
  );
}

function AdBanner() {
  const flatRef = useRef<FlatList>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 32));
      setActiveIdx(idx);
    },
    [],
  );

  return (
    <View style={styles.adWrapper}>
      <FlatList
        ref={flatRef}
        data={AD_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        inverted={I18nManager.isRTL}
        renderItem={({ item }) => (
          <View style={[styles.adSlide, { backgroundColor: item.bg }]}>
            <View style={styles.adContent}>
              <View style={[styles.adBadge, { borderColor: item.accent }]}>
                <Text style={[styles.adBadgeText, { color: item.accent }]}>{item.badge}</Text>
              </View>
              <Text style={[styles.adTitle, { color: item.accent }]}>{item.title}</Text>
              <Text style={styles.adSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={item.accent} />
          </View>
        )}
      />
      {/* Dot indicators */}
      <View style={styles.dots}>
        {AD_SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIdx && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function QuickActions({ onPress }: { onPress: (route: string) => void }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

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
            <Ionicons name={action.iconName} size={24} color={PRIMARY} />
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
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const { profile } = useLaundryStore();
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

  // Recent invoices (latest 3)
  const { data: recentInvoices, isLoading: invLoading } = useInvoices({});

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
            colors={[PRIMARY]} 
            tintColor={PRIMARY}
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
            onPress={() => router.push('/(app)/settings')}
            accessibilityLabel="الإشعارات"
          >
            <Ionicons name="notifications-outline" size={22} color={PRIMARY} />
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

        {/* ── Ad Banner ── */}
        <AdBanner />

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
          <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
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
  received:  { bg: '#eff6ff', text: '#1d4ed8', label: 'تم الاستلام' },
  washing:   { bg: '#eff6ff', text: PRIMARY,    label: 'قيد الغسيل' },
  ironing:   { bg: '#f5f3ff', text: '#7c3aed', label: 'قيد الكوي' },
  ready:     { bg: '#f0fdf4', text: '#15803d', label: 'جاهزة' },
  completed: { bg: '#f0fdf4', text: '#15803d', label: 'مكتمل' },
  cancelled: { bg: '#fef2f2', text: '#dc2626', label: 'ملغي' },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  laundryName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e8f0fb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },

  // Ad Banner
  adWrapper: { marginBottom: 14 },
  adSlide: {
    width: SCREEN_W - 32,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adContent: { flex: 1 },
  adBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  adBadgeText: { fontSize: 10, fontWeight: '600' },
  adTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  adSubtitle: { fontSize: 11, color: '#6b7280' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  dotActive: { backgroundColor: PRIMARY, width: 16 },

  // Alert
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '600' },

  // Quick Access
  sectionLabel: {
    fontSize: 13,
    color: '#6b7280',
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
    backgroundColor: '#e8f0fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, color: '#374151', fontWeight: '500', textAlign: 'center' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seeAll: { fontSize: 12, color: PRIMARY, fontWeight: '600' },

  // Invoice card
  invCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  invCustomer: { fontSize: 14, fontWeight: '600', color: '#111827' },
  invNum: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Empty
  emptyInv: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyInvText: { fontSize: 14, color: '#9ca3af' },
});
