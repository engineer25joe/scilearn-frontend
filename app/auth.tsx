import AuthScreen from '../screens/AuthScreen';
import { useRouter } from 'expo-router';

export default function Auth() {
  const router = useRouter();
  return (
    <AuthScreen
      navigation={{
        replace: (s: string) => router.replace('/' + s.toLowerCase()),
        navigate: (s: string, p?: any) => router.push({ pathname: '/' + s.toLowerCase(), params: p }),
      }}
    />
  );
}
