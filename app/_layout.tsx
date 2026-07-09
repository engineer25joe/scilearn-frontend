import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    try {
      if (Platform.OS === 'web') return;
      const { registerForPushNotifications, scheduleStudyReminder } = require('../utils/notifications');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem('scibase_user');
      let username = null;
      if (data) username = JSON.parse(data).username;
      await registerForPushNotifications(username);
      await scheduleStudyReminder();
    } catch (e) {
      console.log('Notification setup error:', e);
    }
  };

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="admindashboard" options={{ headerShown: false }} />
        <Stack.Screen name="courses" options={{ headerShown: false }} />
        <Stack.Screen name="tokens" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="qa" options={{ headerShown: false }} />
        <Stack.Screen name="streak" options={{ headerShown: false }} />
        <Stack.Screen name="lesson" options={{ headerShown: false }} />
        <Stack.Screen name="otp" options={{ headerShown: false }} />
        <Stack.Screen name="theme" options={{ headerShown: false }} />
        <Stack.Screen name="certificates" options={{ headerShown: false }} />
        <Stack.Screen name="coursedetail" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}