import CertificateScreen from '../screens/CertificateScreen';
import { useRouter } from 'expo-router';

export default function Certificates() {
  const router = useRouter();
  return (
    <CertificateScreen
      navigation={{
        goBack: () => router.back(),
        navigate: (screen: string, p?: any) =>
          router.push({ pathname: '/' + screen.toLowerCase(), params: p }),
        replace: (screen: string) =>
          router.replace('/' + screen.toLowerCase()),
      }}
    />
  );
}
