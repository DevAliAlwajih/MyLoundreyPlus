import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import useAuthStore from '../../src/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'م'}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>مرحباً بك،</Text>
            <Text style={styles.userName}>{user?.full_name || 'ضيف'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Order Card */}
        <Text style={styles.sectionTitle}>طلبك الحالي</Text>
        <TouchableOpacity style={styles.activeOrderCard} activeOpacity={0.9}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>#LAU-2025-001</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>قيد الغسيل</Text>
            </View>
          </View>
          <Text style={styles.laundryName}>مغسلة النظافة السريعة</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressStep}>استلام</Text>
              <Text style={styles.progressStepActive}>غسيل</Text>
              <Text style={styles.progressStep}>جاهز</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Ads Carousel (Placeholder) */}
        <Text style={styles.sectionTitle}>عروض وخصومات</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adsScroll}>
          {[1, 2].map((item) => (
            <View key={item} style={styles.adCard}>
              <View style={styles.adImagePlaceholder}>
                <Ionicons name="pricetag" size={40} color={COLORS.surface} />
                <Text style={styles.adText}>خصم 20% على غسيل البطانيات</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Nearest Laundries */}
        <Text style={styles.sectionTitle}>مغاسل قريبة منك</Text>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.laundryCard}>
            <View style={styles.laundryIcon}>
              <Ionicons name="water" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.laundryInfo}>
              <Text style={styles.laundryCardTitle}>مغسلة الشروق</Text>
              <Text style={styles.laundryCardDist}>يبعد 1.2 كم</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={COLORS.accent} />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: SIZES.padding,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.light,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.surface,
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: SIZES.medium,
    alignItems: 'flex-end',
  },
  greeting: {
    color: COLORS.textLight,
    fontSize: SIZES.font,
  },
  userName: {
    color: COLORS.text,
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  scrollContent: {
    flex: 1,
    padding: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.medium,
    textAlign: 'right',
  },
  activeOrderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.xxl,
    ...SHADOWS.medium,
  },
  orderHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  orderNumber: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  laundryName: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: SIZES.large,
  },
  progressContainer: {
    marginTop: SIZES.base,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SIZES.base,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  progressStep: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  progressStepActive: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  adsScroll: {
    marginBottom: SIZES.xxl,
    flexDirection: 'row-reverse',
  },
  adCard: {
    width: 280,
    height: 140,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    marginRight: 15,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  adImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.medium,
  },
  adText: {
    color: COLORS.surface,
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginTop: SIZES.base,
    textAlign: 'center',
  },
  laundryCard: {
    flexDirection: 'row-reverse',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  laundryIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.medium,
  },
  laundryInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  laundryCardTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  laundryCardDist: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  ratingContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
});
