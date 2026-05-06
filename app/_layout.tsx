import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

function BackBtn() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ marginLeft: 16, padding: 8 }}
    >
      <Text style={{
        color: '#00ff88',
        fontFamily: 'monospace',
        fontSize: 13,
        letterSpacing: 2
      }}>← BACK</Text>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="courses" options={{ headerShown: false }} />
      <Stack.Screen name="tokens" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="lesson" options={{ headerShown: false }} />
      <Stack.Screen
        name="courses/detail"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#020c06' },
          headerTintColor: '#00ff88',
          headerTitleStyle: { fontFamily: 'monospace', color: '#c8ffd8' },
          headerLeft: () => <BackBtn />,
          title: 'LESSONS',
        }}
      />
    </Stack>
  );
}