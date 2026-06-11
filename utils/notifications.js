import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(username) {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'SCI LEARN',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#006600',
        sound: true,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : {}
    );

    console.log('Push token:', token.data);

    if (username && token.data) {
      await savePushTokenToBackend(username, token.data);
    }

    return token.data;
  } catch (e) {
    console.log('Push notification error:', e);
    return null;
  }
}

export async function savePushTokenToBackend(username, token) {
  try {
    await fetch(
      'https://scilearnbackend.onrender.com/api/users/push-token/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
        },
        body: JSON.stringify({ token }),
      }
    );
    console.log('Push token saved to backend');
  } catch (e) {
    console.log('Failed to save push token:', e);
  }
}

export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });
}

export async function scheduleStudyReminder() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Time to Study!',
        body: 'Keep your learning streak alive on SCI LEARN! 🇰🇪',
        sound: true,
      },
      trigger: {
        hour: 18,
        minute: 0,
        repeats: true,
      },
    });
    console.log('Study reminder scheduled for 6PM daily');
  } catch (e) {
    console.log('Failed to schedule reminder:', e);
  }
}

export function addNotificationListener(handler) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}