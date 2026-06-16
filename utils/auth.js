import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = 'https://scilearnbackend.onrender.com/api';

export async function getStoredData(key) {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setStoredData(key, value) {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch {}
}

export async function removeStoredData(key) {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch {}
}

export async function getAccessToken() {
  const userData = await getStoredData('scibase_user');
  if (!userData) return null;
  const user = JSON.parse(userData);
  return user.access_token || null;
}

export async function getRefreshToken() {
  const userData = await getStoredData('scibase_user');
  if (!userData) return null;
  const user = JSON.parse(userData);
  return user.refresh_token || null;
}

export async function refreshAccessToken() {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const res = await fetch(`${API_URL}/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await res.json();

    if (res.ok && data.access_token) {
      // Update stored access token
      const userData = await getStoredData('scibase_user');
      if (userData) {
        const user = JSON.parse(userData);
        user.access_token = data.access_token;
        await setStoredData('scibase_user', JSON.stringify(user));
      }
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiRequest(endpoint, options = {}) {
  try {
    let accessToken = await getAccessToken();
    const userData = await getStoredData('scibase_user');
    const user = userData ? JSON.parse(userData) : null;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (user?.username) {
      headers['X-Username'] = user.username;
    }

    let res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // If 401 try refreshing token
    if (res.status === 401 && accessToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

    return res;
  } catch (e) {
    throw e;
  }
}

export async function logout() {
  await removeStoredData('scibase_user');
}

export async function isLoggedIn() {
  const userData = await getStoredData('scibase_user');
  if (!userData) return false;
  const user = JSON.parse(userData);
  return !!(user.username && user.access_token);
}

export async function isAdmin() {
  const userData = await getStoredData('scibase_user');
  if (!userData) return false;
  const user = JSON.parse(userData);
  return user.is_admin === true;
}
