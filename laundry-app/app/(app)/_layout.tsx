import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { useThemeStore } from '../../stores/themeStore';

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
  const { colors, themeMode } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: themeMode === 'dark' ? 'transparent' : '#000',
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
        name="invoices"
        options={{
          title: t('nav.invoices'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes.find((r) => r.key === e.target);
            if (currentRoute && currentRoute.state && (currentRoute.state as any).index > 0) {
              navigation.dispatch(StackActions.popToTop());
            }
          },
        })}
      />

      {/* ── المحادثات ── */}
      <Tabs.Screen
        name="conversations"
        options={{
          title: t('nav.conversations'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chatbubble-ellipses" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes.find((r) => r.key === e.target);
            if (currentRoute && currentRoute.state && (currentRoute.state as any).index > 0) {
              navigation.dispatch(StackActions.popToTop());
            }
          },
        })}
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes.find((r) => r.key === e.target);
            if (currentRoute && currentRoute.state && (currentRoute.state as any).index > 0) {
              navigation.dispatch(StackActions.popToTop());
            }
          },
        })}
      />

      {/* ── شاشات فرعية — مخفية من الـ Tab Bar ── */}
      <Tabs.Screen name="bookings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="crm" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="promotions" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="reports" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="wallet" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />


    </Tabs>
  );
}
