import DashboardScreen from '../screens/DashboardScreen';
import { useRouter } from 'expo-router';
export default function Dashboard() {
  const router = useRouter();
  return <DashboardScreen navigation={{ replace: (s) => router.replace('/' + s.toLowerCase()), navigate: (s) => router.push('/' + s.toLowerCase()) }} />;
}
