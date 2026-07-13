import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBookings, useAcceptBooking, useRejectBooking } from '../../../hooks/useBookings';
import { useBookingStore, Booking, BookingStatus } from '../../../stores/bookingStore';
import { useInvoiceStore } from '../../../stores/invoiceStore';
import { BookingCard } from '../../../components/bookings/BookingCard';
import { AcceptDialog } from '../../../components/bookings/AcceptDialog';
import { RejectBottomSheet } from '../../../components/bookings/RejectBottomSheet';

type TabKey = 'pending' | 'confirmed' | 'completed' | 'rejected';

const TABS: { key: TabKey; labelKey: string; emptyKey: string }[] = [
  { key: 'pending',   labelKey: 'bookings.pending',   emptyKey: 'bookings.noPending' },
  { key: 'confirmed', labelKey: 'bookings.accepted',  emptyKey: 'bookings.noAccepted' },
  { key: 'completed', labelKey: 'bookings.completed', emptyKey: 'bookings.noCompleted' },
  { key: 'rejected',  labelKey: 'bookings.rejected',  emptyKey: 'bookings.noRejected' },
];

export default function BookingsScreen() {
  const { t } = useTranslation();
  const { selectedDate, setSelectedDate } = useBookingStore();

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<Booking | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);

  const invoiceStore = useInvoiceStore();
  const acceptMutation = useAcceptBooking();
  const rejectMutation = useRejectBooking();

  // For the "rejected" tab, also fetch "cancelled"
  const statusParam: BookingStatus | BookingStatus[] =
    activeTab === 'rejected' ? ['rejected', 'cancelled'] : activeTab;

  const { data: bookings, isLoading, isRefetching, refetch } = useBookings(
    statusParam,
    selectedDate || undefined,
  );

  // Pending count for badge
  const { data: pendingBookings } = useBookings('pending');
  const pendingCount = pendingBookings?.length ?? 0;

  // Accept handler
  const handleAcceptConfirm = useCallback((notes?: string) => {
    if (!acceptTarget) return;
    acceptMutation.mutate(
      { id: acceptTarget.id, notes },
      {
        onSuccess: () => {
          Alert.alert('', t('bookings.acceptSuccess'));
          setAcceptTarget(null);
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to accept');
        },
      }
    );
  }, [acceptTarget, acceptMutation, t]);

  // Reject handler
  const handleRejectConfirm = useCallback((reason: string) => {
    if (!rejectTarget) return;
    rejectMutation.mutate(
      { id: rejectTarget.id, reason },
      {
        onSuccess: () => {
          Alert.alert('', t('bookings.rejectSuccess'));
          setRejectTarget(null);
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to reject');
        },
      }
    );
  }, [rejectTarget, rejectMutation, t]);

  // Date picker
  const handleDateChange = (_: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      const iso = date.toISOString().split('T')[0];
      setSelectedDate(iso);
    }
  };

  const clearDate = () => setSelectedDate(null);

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {t(tab.labelKey)}
            </Text>
            {tab.key === 'pending' && pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderDateFilter = () => (
    <View style={styles.dateFilterRow}>
      <TouchableOpacity
        style={styles.dateFilterBtn}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={16} color="#1a5fa8" />
        <Text style={styles.dateFilterText}>
          {selectedDate
            ? new Date(selectedDate).toLocaleDateString('ar-SA')
            : t('bookings.filterByDate')}
        </Text>
      </TouchableOpacity>
      {selectedDate && (
        <TouchableOpacity style={styles.clearDateBtn} onPress={clearDate}>
          <Ionicons name="close-circle" size={18} color="#e74c3c" />
        </TouchableOpacity>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate ? new Date(selectedDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );

  const activeTab_ = TABS.find(t => t.key === activeTab)!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('bookings.title')}</Text>
      </View>

      {/* Top Tab Bar */}
      {renderTabBar()}

      {/* Date Filter */}
      {renderDateFilter()}

      {/* List */}
      {isLoading && !isRefetching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onAccept={(b) => setAcceptTarget(b)}
              onReject={(b) => setRejectTarget(b)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>{t(activeTab_.emptyKey)}</Text>
            </View>
          }
        />
      )}

      {/* Accept Dialog */}
      <AcceptDialog
        visible={!!acceptTarget}
        booking={acceptTarget}
        onClose={() => setAcceptTarget(null)}
        onConfirm={handleAcceptConfirm}
        isSubmitting={acceptMutation.isPending}
      />

      {/* Reject Bottom Sheet */}
      <RejectBottomSheet
        visible={!!rejectTarget}
        booking={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        isSubmitting={rejectMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a5fa8',
  },
  tabText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1a5fa8',
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  dateFilterText: {
    fontSize: 13,
    color: '#1a5fa8',
    marginLeft: 6,
  },
  clearDateBtn: {
    marginLeft: 8,
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});
