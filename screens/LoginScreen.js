import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Platform, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

const API_URL = 'https://scilearnbackend.onrender.com/api';

function AnimatedButton({ onPress, label, loading, style, textStyle }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.btn, style]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={loading}
        activeOpacity={1}
      >
        {loading
          ? <ActivityIndicator color={COLORS.white} />
          : <Text style={[styles.btnText, textStyle]}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  const saveUserData = async (data) => {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  useEffect(() => {
    wakeUpServer();
  }, []);

  const wakeUpServer = async () => {
    setServerStatus('checking');
    try {
      await fetch(`${API_URL}/users/login/`, { method: 'GET' });
    } catch {}
    setServerStatus('awake');
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${API_URL}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (res.ok) {
        await saveUserData(data);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        Alert.alert(
          '⏱️ Server Timeout',
          'The server is waking up. Please wait 30 seconds and try again.',
          [{ text: 'RETRY', onPress: handleLogin }]
        );
      } else {
        Alert.alert('Connection Error', `Cannot connect to server.\n\n${e.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: COLORS.bg }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Server Waking Up Banner */}
      {serverStatus === 'checking' && (
        <View style={styles.serverBanner}>
          <ActivityIndicator color={COLORS.amber} size="small" />
          <Text style={styles.serverText}>
            Connecting to server...
          </Text>
        </View>
      )}

      {/* Logo */}
      <View style={styles.logoSection}>
        <Text style={styles.logo}>
          SCI<Text style={styles.logoAccent}>LEARN</Text>
        </Text>
        <Text style={styles.logoSub}>
          KENYA'S #1 TECH LEARNING PLATFORM
        </Text>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>WELCOME BACK</Text>
          <Text style={styles.formSub}>Sign in to continue learning</Text>
        </View>

        <Text style={styles.label}>USERNAME</Text>
        <TextInput
          style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
          placeholder="your_username"
          placeholderTextColor={COLORS.textDim}
          value={username}
          onChangeText={setUsername}
          onFocus={() => setFocusedInput('username')}
          onBlur={() => setFocusedInput(null)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textDim}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedInput('password')}
          onBlur={() => setFocusedInput(null)}
          secureTextEntry
        />

        <AnimatedButton
          label="LOGIN →"
          onPress={handleLogin}
          loading={loading}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <AnimatedButton
          label="CREATE FREE ACCOUNT →"
          onPress={() => navigation.navigate('Register')}
          style={styles.outlineBtn}
          textStyle={styles.outlineBtnText}
        />
      </View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
  },
  flagBanner: { flexDirection: 'row', height: 8 },
  flagStripe: { flex: 1 },
  serverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.amber,
    padding: 10,
    paddingHorizontal: 16,
  },
  serverText: {
    color: COLORS.amber,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 28,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.green,
    letterSpacing: 6,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0,102,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoAccent: { color: COLORS.blue },
  logoSub: {
    color: COLORS.textDim,
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  formCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 24,
    borderTopWidth: 3,
    borderTopColor: COLORS.green,
  },
  formHeader: { marginBottom: 28 },
  formTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  formSub: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  label: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    padding: 14,
    marginBottom: 20,
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
  },
  inputFocused: {
    borderColor: COLORS.green,
    borderWidth: 1.5,
  },
  btn: {
    backgroundColor: COLORS.green,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 4,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.greenLight,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 11,
    marginHorizontal: 12,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderBottomWidth: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 4,
  },
  outlineBtnText: {
    color: COLORS.blue,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 11,
    margin: 32,
    fontFamily: 'monospace',
  },
});