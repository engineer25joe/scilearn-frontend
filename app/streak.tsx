import StreakScreen from '../screens/StreakScreen';
import { useRouter } from 'expo-router';

export default function Streak() {
  const router = useRouter();
  return (
    <StreakScreen navigation={{ goBack: () => router.back() }} />
  );
}
