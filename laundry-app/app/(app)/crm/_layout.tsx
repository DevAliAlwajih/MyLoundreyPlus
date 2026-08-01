import { Stack } from 'expo-router';

export default function CRMLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[phone]" />
    </Stack>
  );
}
