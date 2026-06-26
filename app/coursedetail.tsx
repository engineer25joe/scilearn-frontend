import CourseDetailScreen from '../screens/CourseDetailScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CourseDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  return (
    <CourseDetailScreen
      navigation={{
        goBack: () => router.back(),
        navigate: (screen: string, p?: any) =>
          router.push({ pathname: '/' + screen.toLowerCase(), params: p }),
      }}
      route={{ params }}
    />
  );
}