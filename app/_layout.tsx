import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { useEffect, useRef } from 'react';
import { Platform, AsyncStorage } from 'react-native';
import {
  registerForPushNotifications,
  addNotificationListener,
  addNotificationResponseListener,
  scheduleStudyReminder,
} from '../utils/notifications';

export default function RootLayout() {
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    setupNotifications();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Get saved user
      let username = null;
      if (Platform.OS === 'web') {
        const data = localStorage.getItem('scibase_user');
        if (data) username = JSON.parse(data).username;
      } else {
        const AsyncStorageModule = require('@react-native-async-storage/async-storage').default;
        const data = await AsyncStorageModule.getItem('scibase_user');
        if (data) username = JSON.parse(data).username;
      }

      // Register for push notifications
      await registerForPushNotifications(username);

      // Schedule daily study reminder
      await scheduleStudyReminder();

      // Handle notification received while app is open
      notificationListener.current = addNotificationListener(notification => {
        console.log('Notification received:', notification);
      });

      // Handle notification tapped
      responseListener.current = addNotificationResponseListener(response => {
        console.log('Notification tapped:', response);
      });

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
        <Stack.Screen name="courses" options={{ headerShown: false }} />
        <Stack.Screen name="tokens" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="qa" options={{ headerShown: false }} />
        <Stack.Screen name="streak" options={{ headerShown: false }} />
        <Stack.Screen name="lesson" options={{ headerShown: false }} />
        <Stack.Screen name="otp" options={{ headerShown: false }} />
        <Stack.Screen name="theme" options={{ headerShown: false }} />
        <Stack.Screen name="courses/detail" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}