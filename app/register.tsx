import RegisterScreen from '../screens/RegisterScreen';
import { useRouter } from 'expo-router';
export default function Register() {
  const router = useRouter();
  return <RegisterScreen navigation={{ replace: (s) => router.replace('/' + s.toLowerCase()), navigate: (s) => router.push('/' + s.toLowerCase()) }} />;
}
