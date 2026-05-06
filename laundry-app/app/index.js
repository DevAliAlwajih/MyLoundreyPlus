import { Redirect } from 'expo-router';
import useLaundryStore from '../src/store/useLaundryStore';

export default function Index() {
  const { token } = useLaundryStore();
  return token
    ? <Redirect href="/(tabs)/dashboard" />
    : <Redirect href="/(auth)/login" />;
}
