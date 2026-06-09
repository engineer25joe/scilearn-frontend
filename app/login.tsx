import LoginScreen from '../screens/AuthScreen';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();
  return (
    <LoginScreen
      navigation={{
        replace: (s) => router.replace(('/' + s.toLowerCase()) as any),
        navigate: (s) => router.push(('/' + s.toLowerCase()) as any),
      }}
    />
  );
}
