import DashboardScreen from '../screens/DashboardScreen';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();
  return (
    <DashboardScreen
      navigation={{
        replace: (screen: string, params?: any) =>
          router.replace({ pathname: '/' + screen.toLowerCase(), params }),
        navigate: (screen: string, params?: any) =>
          router.push({ pathname: '/' + screen.toLowerCase(), params }),
        goBack: () => router.back(),
      }}
    />
  );
}