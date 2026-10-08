import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  useWallet,
  useWalletTransactions,
  WalletTransaction,
  TransactionFilter,
} from '../../../hooks/useWallet';
import { useThemeStore } from '../../../stores/themeStore';
import { useLaundryStore } from '../../../stores/laundryStore';
import { useCurrencyStore } from '../../../stores/currencyStore';

const PRIMARY = '#1a5fa8';

function useFmtCurrency() {
  const symbol = useCurrencyStore((s) => s.currency.symbol);
  return (n: number | string | undefined | null): string => {
    if (n == null) return '—';
    const num = Number(n);
    return `${num.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  };
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getPaymentMethodLabel(method?: string): string {
  switch (method) {
    case 'cash':
      return 'نقدي (كاش)';
    case 'bank_transfer':
      return 'تحويل بنكي';
    case 'electronic':
      return 'دفع إلكتروني';
    case 'cheque':
      return 'شيك بنكي';
    case 'other':
      return 'أخرى / تسوية';
    default:
      return method || 'سداد معتمد';
  }
}

function getPaymentMethodIcon(method?: string): keyof typeof Ionicons.glyphMap {
  switch (method) {
    case 'cash':
      return 'cash-outline';
    case 'bank_transfer':
      return 'business-outline';
    case 'electronic':
      return 'card-outline';
    case 'cheque':
      return 'document-text-outline';
    default:
      return 'wallet-outline';
  }
}

/**
 * دالة تحويل الأرقام إلى كلمات عربية رسمية (تفقيط) لسند القبض والاستلام
 */
function numberToArabicWords(num: number): string {
  if (!num || isNaN(num)) return '';
  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = [
    'عشرة',
    'أحد عشر',
    'اثنا عشر',
    'ثلاثة عشر',
    'أربعة عشر',
    'خمسة عشر',
    'ستة عشر',
    'سبعة عشر',
    'ثمانية عشر',
    'تسعة عشر',
  ];
  const hundreds = [
    '',
    'مائة',
    'مئتان',
    'ثلاثمائة',
    'أربعمائة',
    'خمسمائة',
    'ستمائة',
    'سبعمائة',
    'ثمانمائة',
    'تسعمائة',
  ];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'صفر ريال سعودي';

  function convert999(v: number): string {
    let res = '';
    const h = Math.floor(v / 100);
    const rem = v % 100;
    if (h > 0) {
      res += hundreds[h];
    }
    if (rem > 0) {
      if (res) res += ' و';
      if (rem < 10) {
        res += units[rem];
      } else if (rem < 20) {
        res += teens[rem - 10];
      } else {
        const u = rem % 10;
        const t = Math.floor(rem / 10);
        if (u > 0) {
          res += `${units[u]} و${tens[t]}`;
        } else {
          res += tens[t];
        }
      }
    }
    return res;
  }

  let result = '';
  const th = Math.floor(n / 1000);
  const rem1000 = n % 1000;

  if (th > 0) {
    if (th === 1) result += 'ألف';
    else if (th === 2) result += 'ألفان';
    else if (th >= 3 && th <= 10) result += `${convert999(th)} آلاف`;
    else result += `${convert999(th)} ألف`;
  }

  if (rem1000 > 0) {
    if (result) result += ' و';
    result += convert999(rem1000);
  }

  const fraction = Math.round((Math.abs(num) - n) * 100);
  let halalaText = '';
  if (fraction > 0) {
    halalaText = ` و${convert999(fraction)} هللة`;
  }

  return `${result} ريال سعودي${halalaText} فقط لا غير`;
}

export default function WalletScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { colors, themeMode } = useThemeStore();
  const profile = useLaundryStore((s) => s.profile);
  const isAr = i18n.language === 'ar';
  const isDark = themeMode === 'dark';
  const fmtCurrency = useFmtCurrency();

  const laundryName = profile?.nameAr || profile?.name || 'مغسلتي';

  const [activeTab, setActiveTab] = useState<TransactionFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<WalletTransaction | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useWallet();

  const {
    data: txData,
    isLoading: txLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchTransactions,
    isRefetching,
  } = useWalletTransactions(activeTab);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchWallet(), refetchTransactions()]);
    } finally {
      setRefreshing(false);
    }
  };

  const balance = Number(walletData?.balance || 0);
  const isNegative = balance < 0;

  const trialEndsAt = walletData?.trialCommissionEndsAt
    ? new Date(walletData.trialCommissionEndsAt)
    : null;
  const now = new Date();
  const isTrialActive = trialEndsAt ? trialEndsAt.getTime() > now.getTime() : false;
  const trialDaysLeft =
    isTrialActive && trialEndsAt
      ? Math.max(1, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const allTransactions: WalletTransaction[] =
    txData?.pages?.flatMap((page) => page.data) || [];

  // Client-side instant search filtering across invoices & receipts
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return allTransactions;
    const q = searchQuery.toLowerCase().trim();
    return allTransactions.filter((t) => {
      const invNum = (t.invoiceNumber || '').toLowerCase();
      const refNum = (t.referenceNumber || '').toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      const admin = (t.adminName || '').toLowerCase();
      const method = getPaymentMethodLabel(t.paymentMethod).toLowerCase();
      const amountStr = String(t.amount || t.commissionAmount || '');
      return (
        invNum.includes(q) ||
        refNum.includes(q) ||
        notes.includes(q) ||
        admin.includes(q) ||
        method.includes(q) ||
        amountStr.includes(q)
      );
    });
  }, [allTransactions, searchQuery]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleShareReceipt = async (item: WalletTransaction) => {
    const voucherNum = item.referenceNumber || item.id.substring(0, 8).toUpperCase();
    const amountVal = Math.abs(Number(item.amount || 0));
    const words = numberToArabicWords(amountVal);

    const shareContent = `🧾 *سند استلام وقبض رسمي*
--------------------------------
• رقم السند: #${voucherNum}
• التاريخ: ${formatDate(item.createdAt)}
• استلمنا من: ${laundryName}
• المبلغ: ${fmtCurrency(amountVal)}
• التفقيط: (${words})
• طريقة الدفع: ${getPaymentMethodLabel(item.paymentMethod)}
${item.referenceNumber ? `• رقم المرجع: #${item.referenceNumber}\n` : ''}${
      item.notes ? `• البيان: ${item.notes}\n` : ''
    }• الرصيد السابق: ${fmtCurrency(item.balanceBefore)}
• الرصيد بعد السند: ${fmtCurrency(item.balanceAfter)}
• المسؤول المعتمد: ${item.adminName || 'إدارة النظام'}
• الحالة: تم التحصيل والإيداع في المحفظة بنجاح
--------------------------------
تطبيق إدارة المغاسل MyLaundry`;

    try {
      await Share.share({
        message: shareContent,
        title: `سند استلام #${voucherNum}`,
      });
    } catch (err) {
      console.error('Error sharing receipt:', err);
    }
  };

  // ── Header Bar ─────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isAr ? 'chevron-forward' : 'chevron-back'}
          size={24}
          color={colors.text}
        />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>المحفظة والفواتير</Text>
      <TouchableOpacity
        onPress={handleRefresh}
        style={styles.backBtn}
        disabled={refreshing}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="refresh-outline"
          size={22}
          color={refreshing ? colors.primary : colors.text}
        />
      </TouchableOpacity>
    </View>
  );

  // ── Balance Card ───────────────────────────────────────────────────────────
  const renderTopCard = () => (
    <View
      style={[
        styles.topCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topCardHeader}>
        <View style={styles.topCardIconWrapper}>
          <Ionicons name="wallet" size={20} color={colors.primary || PRIMARY} />
        </View>
        <Text style={[styles.topCardLabel, { color: colors.textSecondary }]}>
          الرصيد الحالي بالمحفظة
        </Text>
      </View>

      {walletLoading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary || PRIMARY}
          style={{ marginVertical: 14 }}
        />
      ) : (
        <View style={styles.balanceRow}>
          <Text
            style={[
              styles.topCardBalance,
              isNegative ? styles.textRed : { color: colors.text },
            ]}
          >
            {fmtCurrency(balance)}
          </Text>
          {isNegative && (
            <View style={styles.debtAlertBadge}>
              <Ionicons name="alert-circle" size={14} color="#dc2626" />
              <Text style={styles.debtAlertText}>مديونية مستحقة للسداد</Text>
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.topCardFooter,
          { backgroundColor: colors.surface2 || (isDark ? '#27272a' : '#f4f5f8') },
        ]}
      >
        <View style={styles.footerInfoItem}>
          <Text style={[styles.billingTypeLabel, { color: colors.textSecondary }]}>
            نظام الحساب:
          </Text>
          <Text
            style={[
              styles.billingTypeValue,
              { color: colors.primary || PRIMARY },
            ]}
          >
            {walletData?.billingType === 'commission' ? 'نظام العمولة' : 'نظام الاشتراك'}
          </Text>
        </View>

        {walletData?.billingType === 'commission' && (
          <View style={styles.footerInfoItem}>
            <Text style={[styles.billingTypeLabel, { color: colors.textSecondary }]}>
              النسبة:
            </Text>
            <Text style={[styles.billingTypeValue, { color: colors.primary || PRIMARY }]}>
              {walletData.commissionRate ?? 1}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // ── Trial or Commission Banner ─────────────────────────────────────────────
  const renderTrialBanner = () => {
    if (walletLoading) return null;

    if (isTrialActive) {
      return (
        <View style={[styles.bannerContainer, styles.trialBannerActive]}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerBadgeActive}>
              <Ionicons name="gift-outline" size={16} color="#059669" />
              <Text style={styles.bannerBadgeTextActive}>
                فترة تجريبية مجانية (معفاة 100%)
              </Text>
            </View>
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>متبقي {trialDaysLeft} يوم</Text>
            </View>
          </View>
          <Text style={styles.bannerDescription}>
            جميع فواتيرك معفاة تماماً من اقتطاع أي عمولة خلال الفترة التجريبية، ورصيدك الافتتاحي
            الترحيبي محفوظ في محفظتك.
          </Text>
          {trialEndsAt && (
            <Text style={styles.bannerFooterDate}>
              تنتهي التجربة في: {formatShortDate(trialEndsAt.toISOString())}
            </Text>
          )}
        </View>
      );
    }

    return null;
  };

  // ── Navigation Tabs (مثل الصورة المرفقة بالضبط) ──────────────────────────
  const renderSearchAndTabs = () => {
    const tabs: {
      key: TransactionFilter;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
    }[] = [
      { key: 'all', label: 'عرض كامل', icon: 'layers-outline' },
      { key: 'invoices', label: 'عمليات الفواتير', icon: 'receipt-outline' },
      { key: 'receipts', label: 'السندات المستلمة', icon: 'document-text-outline' },
    ];

    return (
      <View style={styles.navSection}>
        {/* شريط البحث مثل الصورة المرفقة */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ابحث برقم الفاتورة، السند، أو البيان..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* شرائح التنقل الدائرية (Horizontal Filter Chips مثل الصورة) */}
        <View style={styles.filtersScrollContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
          >
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.7}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    isSelected && {
                      backgroundColor: isDark
                        ? 'rgba(74, 144, 226, 0.16)'
                        : 'rgba(26, 95, 168, 0.12)',
                      borderColor: colors.primary || PRIMARY,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={
                      isSelected ? colors.primary || PRIMARY : colors.textSecondary
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      { color: colors.textSecondary },
                      isSelected && {
                        color: colors.primary || PRIMARY,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  // ── Render Item: Receipt Voucher or Invoice Transaction ───────────────────
  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => {
    const isReceipt = item.kind === 'receipt' || item.type === 'recharge';

    if (isReceipt) {
      const amount = Math.abs(Number(item.amount || 0));
      const refNum = item.referenceNumber || item.id.substring(0, 8).toUpperCase();

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelectedReceipt(item)}
          style={[
            styles.txCard,
            styles.receiptCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? '#14532d' : '#bbf7d0',
            },
          ]}
        >
          {/* Card Top Row */}
          <View style={styles.txHeaderRow}>
            <View style={styles.receiptBadge}>
              <Ionicons name="arrow-down-circle" size={15} color="#15803d" />
              <Text style={styles.receiptBadgeText}>سند استلام (شحن رصيد)</Text>
            </View>
            <Text style={[styles.txAmount, styles.textGreen]}>
              +{fmtCurrency(amount)}
            </Text>
          </View>

          {/* Receipt Info Body */}
          <View
            style={[
              styles.receiptBody,
              {
                backgroundColor: colors.surface2 || (isDark ? '#27272a' : '#f9fafb'),
              },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                رقم السند:
              </Text>
              <Text style={[styles.infoValueBold, { color: colors.text }]}>
                #{refNum}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                طريقة الدفع:
              </Text>
              <View style={styles.methodChip}>
                <Ionicons
                  name={getPaymentMethodIcon(item.paymentMethod)}
                  size={12}
                  color="#047857"
                />
                <Text style={styles.methodChipText}>
                  {getPaymentMethodLabel(item.paymentMethod)}
                </Text>
              </View>
            </View>

            {item.notes ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  البيان:
                </Text>
                <Text
                  style={[styles.notesText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.notes}
                </Text>
              </View>
            ) : null}

            {item.adminName ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  بواسطة المسؤول:
                </Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
                  {item.adminName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Footer with Balance After & Tap to View Receipt */}
          <View style={[styles.txFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.txDate, { color: colors.textSecondary }]}>
              {formatDate(item.createdAt)}
            </Text>
            <Text style={[styles.txBalanceAfter, { color: colors.textSecondary }]}>
              الرصيد بعد السند:{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {fmtCurrency(item.balanceAfter)}
              </Text>
            </Text>
          </View>

          {/* Action Hint */}
          <View style={styles.actionHintRow}>
            <View style={styles.actionHintContent}>
              <Ionicons name="document-text-outline" size={13} color="#059669" />
              <Text style={styles.actionHintTextReceipt}>اضغط لعرض السند الرسمي</Text>
            </View>
            <Ionicons
              name={isAr ? 'chevron-back' : 'chevron-forward'}
              size={14}
              color="#059669"
            />
          </View>
        </TouchableOpacity>
      );
    }

    // ── Invoice Transaction ─────────────────────────────────────────────────
    const isRefund = item.type === 'refund' || Number(item.commissionAmount || 0) < 0;
    const absAmount = Math.abs(Number(item.commissionAmount || item.amount || 0));

    return (
      <TouchableOpacity
        activeOpacity={item.invoiceId ? 0.8 : 1}
        onPress={() => {
          if (item.invoiceId) {
            router.push(`/(app)/invoices/${item.invoiceId}`);
          }
        }}
        style={[
          styles.txCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.txMain}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={styles.invoiceHeaderBadgeRow}>
              <View style={isRefund ? styles.refundBadge : styles.commissionBadge}>
                <Ionicons
                  name={isRefund ? 'arrow-undo-outline' : 'receipt-outline'}
                  size={12}
                  color={isRefund ? '#059669' : '#d97706'}
                />
                <Text style={isRefund ? styles.refundBadgeText : styles.commissionBadgeText}>
                  {isRefund ? 'استرجاع عمولة' : 'عمولة فاتورة'}
                </Text>
              </View>
            </View>
            <Text style={[styles.txDescription, { color: colors.text }]}>
              فاتورة #{item.invoiceNumber || '—'}
            </Text>
            {isRefund && (
              <Text style={styles.refundSubtitle}>تعديل / إلغاء فاتورة مكتملة</Text>
            )}
          </View>
          <Text style={[styles.txAmount, isRefund ? styles.textGreen : styles.textRed]}>
            {isRefund ? '+' : '-'}
            {fmtCurrency(absAmount)}
          </Text>
        </View>

        <View style={[styles.txDetails, { borderTopColor: colors.border }]}>
          <Text style={[styles.txDetailText, { color: colors.textSecondary }]}>
            إجمالي الفاتورة: {fmtCurrency(item.invoiceTotal)} • نسبة العمولة:{' '}
            {item.commissionRate ?? 1}%
          </Text>
        </View>

        <View style={[styles.txFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.txDate, { color: colors.textSecondary }]}>
            {formatDate(item.createdAt)}
          </Text>
          <Text style={[styles.txBalanceAfter, { color: colors.textSecondary }]}>
            الرصيد بعد:{' '}
            <Text style={{ fontWeight: '700', color: colors.text }}>
              {fmtCurrency(item.balanceAfter)}
            </Text>
          </Text>
        </View>

        {item.invoiceId ? (
          <View style={styles.actionHintRow}>
            <View style={styles.actionHintContent}>
              <Ionicons
                name="open-outline"
                size={13}
                color={colors.primary || PRIMARY}
              />
              <Text
                style={[
                  styles.actionHintTextInvoice,
                  { color: colors.primary || PRIMARY },
                ]}
              >
                عرض تفاصيل الفاتورة
              </Text>
            </View>
            <Ionicons
              name={isAr ? 'chevron-back' : 'chevron-forward'}
              size={14}
              color={colors.primary || PRIMARY}
            />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  // ── Official Receipt Modal (سند الاستلام الرسمي) ──────────────────────────
  const renderReceiptModal = () => {
    if (!selectedReceipt) return null;

    const voucherNum =
      selectedReceipt.referenceNumber ||
      selectedReceipt.id.substring(0, 8).toUpperCase();
    const amountVal = Math.abs(Number(selectedReceipt.amount || 0));
    const arabicWords = numberToArabicWords(amountVal);

    return (
      <Modal
        visible={!!selectedReceipt}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <View style={styles.modalHeaderIconBadge}>
                  <Ionicons name="shield-checkmark" size={22} color="#059669" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    سند استلام رسمي
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    إشعار توريد وإيداع رصيد بالمحفظة
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedReceipt(null)}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: colors.surface2 || (isDark ? '#27272a' : '#f3f4f6') },
                ]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Voucher Top Paper Ribbon */}
              <View style={styles.voucherRibbon}>
                <View style={styles.voucherRibbonBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#15803d" />
                  <Text style={styles.voucherRibbonBadgeText}>معتمد ومودع في المحفظة</Text>
                </View>
                <Text style={styles.voucherSerialText}>سند رقم #{voucherNum}</Text>
              </View>

              {/* Amount Box Hero */}
              <View
                style={[
                  styles.voucherAmountHero,
                  {
                    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5',
                    borderColor: isDark ? '#065f46' : '#a7f3d0',
                  },
                ]}
              >
                <Text style={styles.voucherAmountLabel}>المبلغ المقبوض</Text>
                <Text style={styles.voucherAmountValue}>+{fmtCurrency(amountVal)}</Text>
                <Text style={styles.voucherAmountWords}>({arabicWords})</Text>
              </View>

              {/* Official Table Details */}
              <View
                style={[
                  styles.voucherTable,
                  {
                    backgroundColor: colors.surface2 || (isDark ? '#27272a' : '#f9fafb'),
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.voucherTableRow}>
                  <Text style={[styles.tableLabel, { color: colors.textSecondary }]}>
                    استلمنا من:
                  </Text>
                  <Text style={[styles.tableValueBold, { color: colors.text }]}>
                    {laundryName}
                  </Text>
                </View>

                <View style={[styles.tableDivider, { backgroundColor: colors.border }]} />

                <View style={styles.voucherTableRow}>
                  <Text style={[styles.tableLabel, { color: colors.textSecondary }]}>
                    طريقة السداد:
                  </Text>
                  <View style={styles.methodChipModal}>
                    <Ionicons
                      name={getPaymentMethodIcon(selectedReceipt.paymentMethod)}
                      size={14}
                      color="#047857"
                    />
                    <Text style={styles.methodChipModalText}>
                      {getPaymentMethodLabel(selectedReceipt.paymentMethod)}
                    </Text>
                  </View>
                </View>

                {selectedReceipt.referenceNumber ? (
                  <>
                    <View
                      style={[styles.tableDivider, { backgroundColor: colors.border }]}
                    />
                    <View style={styles.voucherTableRow}>
                      <Text style={[styles.tableLabel, { color: colors.textSecondary }]}>
                        رقم المرجع / الحوالة:
                      </Text>
                      <Text style={[styles.tableValueCode, { color: colors.text }]}>
                        #{selectedReceipt.referenceNumber}
                      </Text>
                    </View>
                  </>
                ) : null}

                <View style={[styles.tableDivider, { backgroundColor: colors.border }]} />

                <View style={styles.voucherTableRow}>
                  <Text style={[styles.tableLabel, { color: colors.textSecondary }]}>
                    البيان / الملاحظات:
                  </Text>
                  <Text style={[styles.tableValue, { color: colors.text }]}>
                    {selectedReceipt.notes || 'سداد وشحن رصيد المحفظة'}
                  </Text>
                </View>

                <View style={[styles.tableDivider, { backgroundColor: colors.border }]} />

                <View style={styles.voucherTableRow}>
                  <Text style={[styles.tableLabel, { color: colors.textSecondary }]}>
                    تاريخ وساعة الإيداع:
                  </Text>
                  <Text style={[styles.tableValue, { color: colors.textSecondary }]}>
                    {formatDate(selectedReceipt.createdAt)}
                  </Text>
                </View>

                <View style={[styles.tableDivider, { backgroundColor: colors.border }]} />

                <View style={styles.voucherTableRow}>
                  <Text style={[styles.tableLabel, { color: colors.textSecondary }]}>
                    الرصيد قبل السند:
                  </Text>
                  <Text style={[styles.tableValue, { color: colors.textSecondary }]}>
                    {fmtCurrency(selectedReceipt.balanceBefore)}
                  </Text>
                </View>

                <View style={[styles.tableDivider, { backgroundColor: colors.border }]} />

                <View style={styles.voucherTableRow}>
                  <Text style={[styles.tableLabel, { color: colors.textSecondary }]}>
                    الرصيد بعد السند:
                  </Text>
                  <Text
                    style={[
                      styles.tableValueBold,
                      { color: '#15803d', fontSize: 14 },
                    ]}
                  >
                    {fmtCurrency(selectedReceipt.balanceAfter)}
                  </Text>
                </View>

                {selectedReceipt.adminName ? (
                  <>
                    <View
                      style={[styles.tableDivider, { backgroundColor: colors.border }]}
                    />
                    <View style={styles.voucherTableRow}>
                      <Text style={[styles.tableLabel, { color: colors.textSecondary }]}>
                        المسؤول المعتمد:
                      </Text>
                      <Text style={[styles.tableValue, { color: colors.text }]}>
                        {selectedReceipt.adminName}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Official Seal / Signature Note */}
              <View style={styles.sealNoteContainer}>
                <Ionicons name="ribbon-outline" size={18} color="#059669" />
                <Text style={styles.sealNoteText}>
                  هذا السند مستند إلكتروني رسمي وموثق في سجل العمليات المالية لدى تطبيق
                  MyLaundry.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View
              style={[
                styles.modalFooterActions,
                { borderTopColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.btnShare,
                  { backgroundColor: colors.primary || PRIMARY },
                ]}
                onPress={() => handleShareReceipt(selectedReceipt)}
              >
                <Ionicons name="share-social-outline" size={18} color="#ffffff" />
                <Text style={styles.btnShareText}>مشاركة السند</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnClose,
                  {
                    backgroundColor: colors.surface2 || (isDark ? '#27272a' : '#f3f4f6'),
                  },
                ]}
                onPress={() => setSelectedReceipt(null)}
              >
                <Text style={[styles.btnCloseText, { color: colors.text }]}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return `لا توجد نتائج مطابقة لبحثك: "${searchQuery}"`;
    }
    switch (activeTab) {
      case 'invoices':
        return 'لا توجد عمليات فواتير مسجلة حتى الآن';
      case 'receipts':
        return 'لا توجد سندات استلام مسجلة حتى الآن';
      default:
        return 'لا توجد حركات مالية مسجلة حتى الآن';
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.background : '#f4f6fb',
        },
      ]}
      edges={['top', 'left', 'right']}
    >
      {renderHeader()}

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => item.id || `${activeTab}-${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <>
            {renderTopCard()}
            {renderTrialBanner()}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                سجل الحركات المالية
              </Text>
              {filteredTransactions.length > 0 && (
                <Text style={[styles.sectionCountBadge, { color: colors.textSecondary }]}>
                  {filteredTransactions.length} حركة
                </Text>
              )}
            </View>
            {renderSearchAndTabs()}
          </>
        )}
        renderItem={renderTransactionItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || (isRefetching && !isFetchingNextPage)}
            onRefresh={handleRefresh}
            colors={[colors.primary || PRIMARY]}
            tintColor={colors.primary || PRIMARY}
          />
        }
        ListEmptyComponent={
          txLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary || PRIMARY}
              style={{ marginTop: 40 }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={
                    activeTab === 'receipts'
                      ? 'document-text-outline'
                      : activeTab === 'invoices'
                      ? 'receipt-outline'
                      : 'wallet-outline'
                  }
                  size={42}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {getEmptyMessage()}
              </Text>
              {searchQuery.trim() ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={[styles.clearSearchBtn, { borderColor: colors.primary }]}
                >
                  <Text style={[styles.clearSearchText, { color: colors.primary }]}>
                    مسح البحث
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="small"
              color={colors.primary || PRIMARY}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <View style={{ height: 20 }} />
          )
        }
      />

      {renderReceiptModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Top Balance Card ───────────────────────────────────────────────────────
  topCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  topCardIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 95, 168, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCardLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  topCardBalance: {
    fontSize: 30,
    fontWeight: '800',
  },
  debtAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  debtAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  textRed: {
    color: '#dc2626',
  },
  textGreen: {
    color: '#15803d',
  },
  topCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  footerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billingTypeLabel: {
    fontSize: 12,
  },
  billingTypeValue: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Section Title ──────────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCountBadge: {
    fontSize: 12,
  },

  // ── Navigation Section (Search + Horizontal Chips مثل الصورة المرفقة) ────
  navSection: {
    marginBottom: 14,
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    paddingVertical: 0,
  },
  filtersScrollContainer: {
    marginHorizontal: -4,
  },
  chipsScrollContent: {
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Transaction Card ───────────────────────────────────────────────────────
  txCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  receiptCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  receiptBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  receiptBody: {
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValueBold: {
    fontSize: 12,
    fontWeight: '700',
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065f46',
  },
  notesText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
    marginLeft: 10,
  },
  invoiceHeaderBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  commissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  commissionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  refundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  refundBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  txMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  txDate: {
    fontSize: 11,
  },
  txBalanceAfter: {
    fontSize: 11,
  },
  txDetails: {
    paddingVertical: 6,
  },
  txDetailText: {
    fontSize: 11,
  },
  actionHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionHintTextReceipt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  actionHintTextInvoice: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Trial / Commission Banners ─────────────────────────────────────────────
  bannerContainer: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  trialBannerActive: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bannerBadgeTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  daysBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  daysBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  bannerDescription: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  bannerFooterDate: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  refundSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },

  // ── Empty State ────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  clearSearchBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Official Receipt Modal ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: 18,
    gap: 14,
  },
  voucherRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherRibbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  voucherRibbonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  voucherSerialText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  voucherAmountHero: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  voucherAmountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  voucherAmountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#15803d',
  },
  voucherAmountWords: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    textAlign: 'center',
    lineHeight: 18,
  },
  voucherTable: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  voucherTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  tableLabel: {
    fontSize: 12,
  },
  tableValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  tableValueBold: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableValueCode: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tableDivider: {
    height: StyleSheet.hairlineWidth,
  },
  methodChipModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodChipModalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  sealNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
    padding: 10,
    borderRadius: 10,
  },
  sealNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },
  modalFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btnShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnShareText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnClose: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCloseText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
