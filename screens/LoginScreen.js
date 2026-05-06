import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Platform, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

function AnimatedButton({ onPress, label, loading }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.btn}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={loading}
        activeOpacity={1}
      >
        {loading
          ? <ActivityIndicator color={COLORS.bg} />
          : <Text style={styles.btnText}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const saveUserData = async (data) => {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoints.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        await saveUserData(data);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.tag}>// AUTHENTICATION</Text>
      <Text style={styles.title}>
        WELCOME{'\n'}BACK<Text style={styles.accent}>.</Text>
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>USERNAME</Text>
        <TextInput
          style={styles.input}
          placeholder="your_username"
          placeholderTextColor={COLORS.textDim}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <AnimatedButton
          label="LOGIN →"
          onPress={handleLogin}
          loading={loading}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            No account?{' '}
            <Text style={styles.linkAccent}>REGISTER FREE →</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: 28,
    justifyContent: 'center',
  },
  tag: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 48,
    marginBottom: 40,
    fontFamily: 'monospace',
  },
  accent: { color: COLORS.amber },
  form: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    backgroundColor: COLORS.surface,
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
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: COLORS.bg,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  link: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  linkAccent: { color: COLORS.primary },
  footer: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: 40,
    fontFamily: 'monospace',
  },
});