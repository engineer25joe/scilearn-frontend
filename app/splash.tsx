import SplashScreen from '../screens/SplashScreen';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();
  return (
    <SplashScreen
      navigation={{
        replace: (s) => router.replace('/' + s.toLowerCase())
      }}
    />
  );
}
