import LessonScreen from '../screens/LessonScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function Lesson() {
  const router = useRouter();
  const params = useLocalSearchParams();
  return (
    <LessonScreen
      route={{ params }}
      navigation={{ goBack: () => router.back() }}
    />
  );
}
