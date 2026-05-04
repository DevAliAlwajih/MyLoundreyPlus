import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/useAuthStore';
import QRCode from 'react-native-qrcode-svg';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تأكيد', onPress: () => logout(), style: 'destructive' }
      ]
    );
  };

  const SettingRow = ({ icon, title, value, onPress, isDestructive }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <Ionicons name="chevron-back" size={20} color={COLORS.textLight} />
      <View style={styles.settingContent}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Text style={[styles.settingTitle, isDestructive && { color: COLORS.error }]}>{title}</Text>
        <Ionicons name={icon} size={24} color={isDestructive ? COLORS.error : COLORS.primary} style={styles.settingIcon} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حسابي</Text>
      </View>

      {/* QR Code Section */}
      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>هويتك الرقمية (المعرف)</Text>
          <Text style={styles.qrSubtitle}>أبرز هذا الرمز للمغسلة لإنشاء فاتورة سريعاً</Text>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={user?.unique_id || 'CUS0000000'}
              size={150}
              color={COLORS.text}
              backgroundColor={COLORS.surface}
            />
          </View>
          <Text style={styles.uniqueId}>{user?.unique_id || 'CUS-UNKNOWN'}</Text>
        </View>
      </View>

      {/* Settings List */}
      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>الإعدادات العامة</Text>
        <View style={styles.settingsBlock}>
          <SettingRow icon="person-outline" title="الاسم الشخصي" value={user?.full_name || 'ضيف'} />
          <View style={styles.divider} />
          <SettingRow icon="call-outline" title="رقم الجوال" value={user?.phone_number || '---'} />
          <View style={styles.divider} />
          <SettingRow icon="language-outline" title="اللغة" value="العربية" />
        </View>

        <Text style={styles.sectionTitle}>الأمان والأجهزة</Text>
        <View style={styles.settingsBlock}>
          <SettingRow icon="hardware-chip-outline" title="إدارة الأجهزة (Multi-Device)" />
          <View style={styles.divider} />
          <SettingRow icon="shield-checkmark-outline" title="سياسة الخصوصية" />
        </View>

        <View style={[styles.settingsBlock, { marginTop: SIZES.large }]}>
          <SettingRow 
            icon="log-out-outline" 
            title="تسجيل الخروج" 
            isDestructive 
            onPress={handleLogout} 
          />
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  qrContainer: {
    padding: SIZES.padding,
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  qrTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginBottom: SIZES.large,
    textAlign: 'center',
  },
  qrCodeWrapper: {
    padding: SIZES.medium,
    backgroundColor: '#fff',
    borderRadius: SIZES.radius,
    ...SHADOWS.light,
  },
  uniqueId: {
    marginTop: SIZES.medium,
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  settingsContainer: {
    paddingHorizontal: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: SIZES.base,
    textAlign: 'right',
  },
  settingsBlock: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: SIZES.large,
    ...SHADOWS.light,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.medium,
    backgroundColor: COLORS.surface,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '500',
    marginRight: SIZES.medium,
  },
  settingValue: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
    marginRight: SIZES.base,
  },
  settingIcon: {
    width: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 50, // Indent divider to align with text
  },
});
