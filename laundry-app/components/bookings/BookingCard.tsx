import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Booking } from '../../stores/bookingStore';
import { CountdownTimer, useIsExpired } from './CountdownTimer';
import { useThemeStore } from '../../stores/themeStore';

interface BookingCardProps {
  booking: Booking;
  onAccept: (booking: Booking) => void;
  onReject: (booking: Booking) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onAccept, onReject }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isExpired = useIsExpired(booking.createdAt);
  const { colors, themeMode } = useThemeStore();

  const scheduledDate = new Date(booking.scheduledAt).toLocaleString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleConvertToInvoice = () => {
    // Navigate to new invoice with query params to pre-fill customer
    router.push({
      pathname: '/(app)/invoices/new',
      params: {
        prefillName: booking.customerName,
        prefillPhone: booking.customerPhone,
        prefillNotes: booking.notes || '',
      },
    });
  };

  const renderPending = () => (
    <>
      <CountdownTimer createdAt={booking.createdAt} />
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn, isExpired && styles.disabledBtn]}
          onPress={() => !isExpired && onReject(booking)}
          disabled={isExpired}
        >
          <Ionicons name="close" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>{t('bookings.reject')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn, isExpired && styles.disabledBtn]}
          onPress={() => !isExpired && onAccept(booking)}
          disabled={isExpired}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>{t('bookings.accept')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderAccepted = () => (
    <View style={styles.actionRow}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.cancelOutlinedBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => onReject(booking)}
      >
        <Ionicons name="ban-outline" size={18} color={colors.textSecondary} />
        <Text style={[styles.cancelOutlinedText, { color: colors.textSecondary }]}>{t('bookings.cancelBooking')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, styles.convertBtn]}
        onPress={handleConvertToInvoice}
      >
        <Ionicons name="document-text-outline" size={18} color="#fff" />
        <Text style={styles.actionBtnText}>{t('bookings.convertToInvoice')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompleted = () => (
    booking.invoiceId ? (
      <TouchableOpacity
        style={[styles.linkedInvoiceRow, { backgroundColor: colors.primary + '15' }]}
        onPress={() => router.push(`/(app)/invoices/${booking.invoiceId}`)}
      >
        <Ionicons name="receipt-outline" size={16} color={colors.primary} />
        <Text style={[styles.linkedInvoiceText, { color: colors.primary }]}>
          {t('bookings.linkedInvoice')}: {booking.invoiceNumber}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
    ) : null
  );

  const renderRejected = () => (
    <View style={[styles.rejectedNotice, { backgroundColor: colors.background }]}>
      <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
      <Text style={[styles.rejectedText, { color: colors.textSecondary }]}>{booking.notes || t('bookings.rejected')}</Text>
    </View>
  );

  const getStatusColor = () => {
    switch (booking.status) {
      case 'pending': return '#f57c00';
      case 'confirmed': return '#2ecc71';
      case 'completed': return colors.primary;
      case 'rejected':
      case 'cancelled': return '#e74c3c';
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: getStatusColor(), borderLeftWidth: 4 }]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.namePhoneCol}>
          <Text style={[styles.customerName, { color: colors.text }]}>{booking.customerName}</Text>
          <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>{booking.customerPhone}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      </View>

      {/* Scheduled Date */}
      <View style={styles.scheduleRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.scheduleText, { color: colors.textSecondary }]}>{scheduledDate}</Text>
      </View>

      {/* Customer Notes */}
      {booking.notes ? (
        <View style={[styles.notesRow, { borderBottomColor: colors.border }]}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.notesText, { color: colors.textSecondary }]} numberOfLines={2}>{booking.notes}</Text>
        </View>
      ) : null}

      {/* Status-specific content */}
      <View style={styles.statusContent}>
        {booking.status === 'pending' && renderPending()}
        {booking.status === 'confirmed' && renderAccepted()}
        {booking.status === 'completed' && renderCompleted()}
        {(booking.status === 'rejected' || booking.status === 'cancelled') && renderRejected()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  namePhoneCol: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  notesText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
  statusContent: {
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  acceptBtn: {
    backgroundColor: '#2ecc71',
  },
  rejectBtn: {
    backgroundColor: '#e74c3c',
  },
  convertBtn: {
    backgroundColor: '#1a5fa8',
  },
  cancelOutlinedBtn: {
    borderWidth: 1,
  },
  cancelOutlinedText: {
    fontSize: 14,
    marginLeft: 6,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  linkedInvoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  linkedInvoiceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  rejectedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
  },
  rejectedText: {
    fontSize: 13,
    flex: 1,
    marginLeft: 6,
  },
});
