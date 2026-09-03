import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../stores/themeStore';
import { useNotifications, NotificationItem } from '../../hooks/useNotifications';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getNotificationConfig(type: string) {
  switch (type) {
    case 'invoice_delivery_soon':
      return { icon: 'time-outline' as const, color: '#f59e0b', bg: '#fef3c7' }; // Orange
    case 'invoice_completed':
      return { icon: 'checkmark-circle-outline' as const, color: '#10b981', bg: '#d1fae5' }; // Green
    case 'invoice_cancelled':
      return { icon: 'close-circle-outline' as const, color: '#ef4444', bg: '#fee2e2' }; // Red
    case 'invoice_status':
    case 'invoice_updated':
      return { icon: 'create-outline' as const, color: '#3b82f6', bg: '#dbeafe' }; // Blue
    case 'profile_updated':
    case 'working_hours_updated':
      return { icon: 'person-circle-outline' as const, color: '#6b7280', bg: '#f3f4f6' }; // Gray
    case 'support_message':
      return { icon: 'headset-outline' as const, color: '#8b5cf6', bg: '#ede9fe' }; // Purple
    case 'customer_message':
      return { icon: 'chatbubble-ellipses-outline' as const, color: '#0ea5e9', bg: '#e0f2fe' }; // Sky
    case 'ad_expired':
      return { icon: 'hourglass-outline' as const, color: '#d97706', bg: '#fef3c7' }; // Amber
    case 'app_update':
      return { icon: 'star-outline' as const, color: '#eab308', bg: '#fef08a' }; // Yellow
    default:
      return { icon: 'notifications-outline' as const, color: '#6b7280', bg: '#f3f4f6' };
  }
}

function timeAgo(dateString: string, isAr: boolean) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return isAr ? 'الآن' : 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return isAr ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return isAr ? `منذ ${diffInHours} ساعة` : `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return isAr ? 'أمس' : 'Yesterday';
  if (diffInDays < 7) return isAr ? `منذ ${diffInDays} أيام` : `${diffInDays}d ago`;

  return date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
}

// ── Screen Component ─────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, themeMode } = useThemeStore();
  const styles = getStyles(colors, themeMode);
  const isDark = themeMode === 'dark';

  const [page, setPage] = useState(1);
  const {
    notifications,
    isLoading,
    isRefetching,
    refetch,
    markAsRead,
    markAllAsRead,
    unreadCount
  } = useNotifications(page, 20);

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }

    // Navigation logic based on notification type
    if (item.type.startsWith('invoice_') && item.referenceId) {
      router.push(`/(app)/invoices/${item.referenceId}` as any);
    } else if (item.type === 'customer_message' && item.referenceId) {
      router.push(`/(app)/conversations/chat/${item.referenceId}` as any);
    } else if (item.type === 'support_message') {
      router.push('/(app)/settings/support' as any);
    } else if (item.type === 'ad_expired') {
      router.push('/(app)/promotions' as any);
    }
    // other types like profile update don't necessarily need navigation
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const config = getNotificationConfig(item.type);
    
    // Adjust colors for dark mode
    const iconBg = isDark ? config.color + '25' : config.bg;

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadCard
        ]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <Ionicons name={config.icon} size={24} color={config.color} />
            {!item.isRead && <View style={styles.unreadDotBadge} />}
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.timeText}>{timeAgo(item.sentAt, isAr)}</Text>
            </View>
            <Text style={styles.bodyText} numberOfLines={2}>
              {item.body}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isAr ? 'chevron-forward' : 'chevron-back'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isAr ? 'الإشعارات' : 'Notifications'}</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => markAllAsRead()}>
            <Text style={styles.readAllText}>{isAr ? 'تحديد كـ مقروء' : 'Mark all read'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} /> // Placeholder for balance
        )}
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>
                {isAr ? 'لا توجد إشعارات' : 'No notifications'}
              </Text>
              <Text style={styles.emptyDesc}>
                {isAr ? 'عندما تتلقى إشعارات جديدة ستظهر هنا' : 'When you receive new notifications, they will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, themeMode: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  readAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: themeMode === 'dark' ? 0.3 : 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: themeMode === 'dark' ? colors.surfaceVariant : '#f0f9ff',
    borderColor: themeMode === 'dark' ? '#0284c750' : '#bae6fd',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 4,
    position: 'relative',
  },
  unreadDotBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 8,
    textAlign: 'left'
  },
  titleUnread: {
    color: colors.text,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bodyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'left'
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
});
