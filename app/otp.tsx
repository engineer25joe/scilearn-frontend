import OTPScreen from '../screens/OTPScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OTP() {
  const router = useRouter();
  const params = useLocalSearchParams();
  return (
    <OTPScreen
      navigation={{
        replace: (screen: string) => router.replace('/' + screen.toLowerCase()),
        navigate: (screen: string) => router.push('/' + screen.toLowerCase()),
      }}
      route={{ params }}
    />
  );
}
