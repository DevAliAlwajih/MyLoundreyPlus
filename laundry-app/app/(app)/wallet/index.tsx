import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useWallet, useWalletTransactions, WalletTransaction } from '../../../hooks/useWallet';
import { useThemeStore } from '../../../stores/themeStore';

const PRIMARY = '#1a5fa8';
const BG = '#f4f6fb';

function fmtCurrency(n: number | string | undefined | null): string {
  if (n == null) return '—';
  const num = Number(n);
  return `${num.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WalletScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { colors } = useThemeStore();
  const isAr = i18n.language === 'ar';

  const { data: walletData, isLoading: walletLoading } = useWallet();
  
  const {
    data: txData,
    isLoading: txLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useWalletTransactions();

  const balance = Number(walletData?.balance || 0);
  const isNegative = balance < 0;

  const transactions: WalletTransaction[] = txData?.pages?.flatMap(page => page.data) || [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>المحفظة والفواتير</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderTopCard = () => (
    <View style={[styles.topCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.topCardLabel, { color: colors.textSecondary }]}>الرصيد الحالي</Text>
      {walletLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
      ) : (
        <Text style={[styles.topCardBalance, isNegative && styles.textRed]}>
          {fmtCurrency(balance)}
        </Text>
      )}
      <View style={[styles.topCardFooter, { backgroundColor: colors.background }]}>
        <Text style={[styles.billingTypeLabel, { color: colors.textSecondary }]}>نظام الفوترة:</Text>
        <Text style={[styles.billingTypeValue, { color: colors.primary }]}>
          {walletData?.billingType === 'commission' ? 'عمولة' : 'اشتراك'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      <FlatList
        data={transactions}
        keyExtractor={(item, index) => item.id || String(index)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <>
            {renderTopCard()}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>سجل الحركات</Text>
          </>
        )}
        renderItem={({ item }) => {
          const amount = Number(item.commissionAmount);
          return (
            <View style={[styles.txCard, { backgroundColor: colors.surface }]}>
              <View style={styles.txMain}>
                <Text style={[styles.txDescription, { color: colors.text }]}>
                  عمولة فاتورة #{item.invoiceNumber || '—'}
                </Text>
                <Text style={[styles.txAmount, styles.textRed]}>
                  -{fmtCurrency(amount)}
                </Text>
              </View>
              <View style={styles.txMeta}>
                <Text style={[styles.txDate, { color: colors.textSecondary }]}>{formatDate(item.createdAt)}</Text>
                <Text style={[styles.txBalanceAfter, { color: colors.textSecondary }]}>
                  الرصيد بعد: {fmtCurrency(item.balanceAfter)}
                </Text>
              </View>
              <View style={[styles.txDetails, { borderTopColor: colors.border }]}>
                <Text style={[styles.txDetailText, { color: colors.textSecondary }]}>
                  إجمالي الفاتورة: {fmtCurrency(item.invoiceTotal)} • العمولة: {item.commissionRate}%
                </Text>
              </View>
            </View>
          );
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          txLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>لا توجد حركات مالية مسجلة</Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  topCardLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  topCardBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 16,
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
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  billingTypeLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
  billingTypeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  txCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  txDescription: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  txMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  txBalanceAfter: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  txDetails: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  txDetailText: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
