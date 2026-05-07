import QAScreen from '../screens/QAScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function QA() {
  const router = useRouter();
  const params = useLocalSearchParams();
  return (
    <QAScreen
      navigation={{ goBack: () => router.back() }}
      route={{ params }}
    />
  );
}
