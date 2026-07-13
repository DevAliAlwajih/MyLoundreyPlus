import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="bookings/index" />
      <Stack.Screen name="crm/index" />
      <Stack.Screen name="crm/[phone]" />
      <Stack.Screen name="invoices/index" />
      <Stack.Screen name="invoices/[id]" />
      <Stack.Screen name="invoices/items" />
      <Stack.Screen name="invoices/new" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/location" />
      <Stack.Screen name="profile/working-hours" />
      <Stack.Screen name="promotions/index" />
      <Stack.Screen name="reports/index" />
      <Stack.Screen name="settings/index" />
    </Stack>
  );
}
