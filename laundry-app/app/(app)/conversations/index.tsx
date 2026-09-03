import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../stores/themeStore';

const PRIMARY = '#1a5fa8';
const BG = '#f4f6fb';

export default function ConversationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useThemeStore();

  const options = [
    {
      id: 'support',
      titleAr: 'الدعم الفني',
      titleEn: 'Technical Support',
      subtitleAr: 'تواصل مع فريق دعم المنصة',
      subtitleEn: 'Contact the platform support team',
      icon: 'headset' as const,
      iconBg: colors.primary + '22',
      iconColor: colors.primary,
      route: '/conversation-modal/support',
    },
    {
      id: 'customers',
      titleAr: 'محادثات العملاء',
      titleEn: 'Customer Chats',
      subtitleAr: 'قائمة عملائك وسجل التواصل معهم',
      subtitleEn: 'Your customers list and communication history',
      icon: 'people' as const,
      iconBg: '#15803d22',
      iconColor: '#15803d',
      route: '/(app)/conversations/customers',
    },
  ];

  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('nav.conversations')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isAr
            ? 'اختر وجهة المحادثة'
            : 'Select a conversation destination'}
        </Text>

        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => router.push(opt.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, { backgroundColor: opt.iconBg }]}>
              <Ionicons name={opt.icon} size={28} color={opt.iconColor} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {isAr ? opt.titleAr : opt.titleEn}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {isAr ? opt.subtitleAr : opt.subtitleEn}
              </Text>
            </View>
            <Ionicons
              name={isAr ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: { fontSize: 13, lineHeight: 18 },
});
