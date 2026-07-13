import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated
    ? <Redirect href="/(app)/" />
    : <Redirect href="/(auth)/welcome" />;
}
