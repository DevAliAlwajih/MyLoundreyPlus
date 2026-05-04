import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_INVOICES = [
  { id: '1', number: 'LAU-2025-001', date: '2025-05-01', total: 45, status: 'washing', laundry: 'مغسلة النظافة السريعة' },
  { id: '2', number: 'LAU-2025-002', date: '2025-04-28', total: 120, status: 'completed', laundry: 'مغسلة الشروق' },
  { id: '3', number: 'LAU-2025-003', date: '2025-04-20', total: 35, status: 'completed', laundry: 'مغسلة البخار الممتاز' },
];

export default function InvoicesScreen() {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return COLORS.secondary;
      case 'washing': return COLORS.primary;
      default: return COLORS.textLight;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'washing': return 'قيد الغسيل';
      default: return status;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.info}>
          <Text style={styles.laundryName}>{item.laundry}</Text>
          <Text style={styles.invoiceNumber}>#{item.number}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.total} ريال</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>سجل الطلبات</Text>
      </View>
      <FlatList
        data={DUMMY_INVOICES}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  list: {
    padding: SIZES.padding,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SIZES.base,
  },
  status: {
    fontWeight: 'bold',
    fontSize: SIZES.font,
  },
  date: {
    color: COLORS.textLight,
    fontSize: SIZES.font,
  },
  cardBody: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    alignItems: 'flex-end',
  },
  laundryName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  priceContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  price: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
});
