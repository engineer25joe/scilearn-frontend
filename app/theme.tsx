import ThemeToggleScreen from '../screens/ThemeToggleScreen';
import { useRouter } from 'expo-router';

export default function Theme() {
  const router = useRouter();
  return (
    <ThemeToggleScreen navigation={{ goBack: () => router.back() }} />
  );
}
