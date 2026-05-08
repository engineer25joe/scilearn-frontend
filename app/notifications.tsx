import NotificationsScreen from '../screens/NotificationsScreen';
import { useRouter } from 'expo-router';

export default function Notifications() {
  const router = useRouter();
  return (
    <NotificationsScreen
      navigation={{ goBack: () => router.back() }}
    />
  );
}
