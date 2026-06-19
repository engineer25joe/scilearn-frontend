import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();
  return (
    <AdminDashboardScreen
      navigation={{
        replace: (s: string) => router.replace('/' + s.toLowerCase()),
        navigate: (s: string, p?: any) => router.push({ pathname: '/' + s.toLowerCase(), params: p }),
      }}
    />
  );
}
