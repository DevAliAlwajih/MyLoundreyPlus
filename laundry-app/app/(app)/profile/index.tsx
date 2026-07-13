import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../../../hooks/useLaundryProfile';
import { ProfileSkeleton } from '../../../components/profile/ProfileSkeleton';
import { SubscriptionBadge } from '../../../components/profile/SubscriptionBadge';
import { LogoUploader } from '../../../components/profile/LogoUploader';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
  text: '#333',
  border: '#eee',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { data: profile, isLoading, isError, refetch, isRefetching } = useProfile();

  if (isLoading && !profile) {
    return <ProfileSkeleton />;
  }

  if (isError || !profile) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('auth.errors.default')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>{t('profile.retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isArabic = i18n.language === 'ar';
  const displayName = isArabic ? profile.nameAr : profile.name;
  const displayAddress = isArabic ? profile.addressAr : profile.address;

  // Render a quick summary of working hours today
  const getTodayHours = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayStr = days[new Date().getDay()];
    const todaySchedule = profile.workingHours?.find(h => h.day === todayStr);
    
    if (!todaySchedule || !todaySchedule.isOpen) return t('profile.closed');
    return `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        <LogoUploader currentLogoUrl={profile.logoUrl} />

        <View style={styles.infoCenter}>
          <Text style={styles.laundryName}>{displayName || t('profile.unnamedLaundry')}</Text>
          <SubscriptionBadge status={profile.subscriptionStatus || 'trial'} />
          {profile.subscriptionExpiresAt && (
            <Text style={styles.expiryDate}>
              {new Date(profile.subscriptionExpiresAt).toLocaleDateString(i18n.language)}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardText}>{profile.phone || '--'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardText}>{profile.email || '--'}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/(app)/profile/edit')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionTexts}>
              <Text style={styles.actionTitle}>{t('profile.edit')}</Text>
              <Text style={styles.actionSubtitle} numberOfLines={1}>{displayAddress || '--'}</Text>
            </View>
            <Ionicons name={isArabic ? "chevron-back" : "chevron-forward"} size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/(app)/profile/location')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionTexts}>
              <Text style={styles.actionTitle}>{t('profile.location')}</Text>
              <Text style={styles.actionSubtitle}>
                {profile.latitude && profile.longitude ? `${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}` : '--'}
              </Text>
            </View>
            <Ionicons name={isArabic ? "chevron-back" : "chevron-forward"} size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/(app)/profile/working-hours')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionTexts}>
              <Text style={styles.actionTitle}>{t('profile.workingHours')}</Text>
              <Text style={styles.actionSubtitle}>{getTodayHours()}</Text>
            </View>
            <Ionicons name={isArabic ? "chevron-back" : "chevron-forward"} size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoCenter: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  laundryName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  expiryDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  cardText: {
    marginLeft: 12,
    marginRight: 12,
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
    textAlign: 'left',
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 12, // For RTL
  },
  actionTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'left',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'left',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
