import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

const PRIMARY = '#1a5fa8';
const INACTIVE = '#9ca3af';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  color,
  size,
}: {
  name: IoniconsName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* ── الرئيسية ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />

      {/* ── الفواتير ── */}
      <Tabs.Screen
        name="invoices/index"
        options={{
          title: t('nav.invoices'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt" color={color} size={size} />
          ),
        }}
      />

      {/* ── المحادثات ── */}
      <Tabs.Screen
        name="conversations/index"
        options={{
          title: t('nav.conversations'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chatbubble-ellipses" color={color} size={size} />
          ),
        }}
      />

      {/* ── الإعدادات ── */}
      <Tabs.Screen
        name="settings/index"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings" color={color} size={size} />
          ),
        }}
      />

      {/* ── شاشات فرعية — مخفية من الـ Tab Bar ── */}
      <Tabs.Screen name="bookings/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="crm/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="crm/[phone]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile/edit" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile/location" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile/working-hours" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="promotions/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="reports/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="chat/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="invoices/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="invoices/items" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="invoices/new" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
