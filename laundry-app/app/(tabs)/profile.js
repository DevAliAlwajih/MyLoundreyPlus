import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import useLaundryStore from '../../src/store/useLaundryStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useLaundryStore();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/(auth)/login'); },
      },
    ]);
  };

  const menuItems = [
    { icon: 'business-outline',   label: 'بيانات المغسلة',       onPress: () => {} },
    { icon: 'time-outline',       label: 'ساعات العمل',           onPress: () => {} },
    { icon: 'pricetags-outline',  label: 'قائمة الأسعار',         onPress: () => {} },
    { icon: 'bar-chart-outline',  label: 'التقارير والإحصائيات',  onPress: () => {} },
    { icon: 'people-outline',     label: 'الموظفون',              onPress: () => {} },
    { icon: 'lock-closed-outline','label': 'تغيير كلمة المرور',   onPress: () => {} },
    { icon: 'help-circle-outline','label': 'الدعم الفني',         onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="business" size={40} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.full_name || 'المغسلة'}</Text>
          <Text style={styles.userEmail}>{user?.email || user?.phone_number}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>صاحب مغسلة</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'طلبات اليوم', value: '—', icon: 'receipt' },
            { label: 'الإيرادات', value: '—', icon: 'wallet' },
            { label: 'التقييم', value: '—', icon: 'star' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon} size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-back" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <Text style={styles.version}>الإصدار 1.0.0 • مغسلتي بلس</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 24, backgroundColor: COLORS.primary,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  roleText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 6, marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.textSub, fontWeight: '600', textAlign: 'center' },
  menu: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FFEBE6', borderRadius: 14,
    height: 52, borderWidth: 1, borderColor: '#FFBDAD', marginBottom: 20,
  },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: COLORS.textLight, fontSize: 12 },
});
