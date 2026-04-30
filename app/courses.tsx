import CoursesScreen from '../screens/CoursesScreen';
import { useRouter } from 'expo-router';
export default function Courses() {
  const router = useRouter();
  return <CoursesScreen navigation={{ navigate: (s) => router.push('/' + s.toLowerCase()) }} />;
}
