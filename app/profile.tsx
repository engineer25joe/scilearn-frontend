import ProfileScreen from '../screens/ProfileScreen';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();
  return (
    <ProfileScreen
      navigation={{
        goBack: () => router.back(),
        replace: (s: string) => router.replace('/' + s.toLowerCase()),
      }}
    />
  );
}
