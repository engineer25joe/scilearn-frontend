import CoursesScreen from '../screens/CoursesScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function Courses() {
  const router = useRouter();
  const params = useLocalSearchParams();
  return (
    <CoursesScreen
      navigation={{
        replace: (screen: string, p?: any) =>
          router.replace({ pathname: '/' + screen.toLowerCase(), params: p }),
        navigate: (screen: string, p?: any) =>
          router.push({ pathname: '/' + screen.toLowerCase(), params: p }),
        goBack: () => router.back(),
      }}
      route={{ params }}
    />
  );
}