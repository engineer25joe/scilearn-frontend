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

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^(\+254|0)[17]\d{8}$/.test(phone);
  };

  const saveUserData = async (data) => {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  const handleRegister = async () => {
    const { username, email, phone, password, confirmPassword } = form;

    if (!username || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number\nExample: 0712345678');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(endpoints.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          phone_number: phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await saveUserData(data);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Error', data.error || 'Registration failed');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.tag}>// CREATE ACCOUNT</Text>
      <Text style={styles.title}>
        JOIN<Text style={styles.accent}>.</Text>
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>USERNAME</Text>
        <TextInput
          style={styles.input}
          placeholder="engineer_joe"
          placeholderTextColor={COLORS.textDim}
          value={form.username}
          onChangeText={v => update('username', v)}
          autoCapitalize="none"
        />

        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.input}
          placeholder="joe@example.com"
          placeholderTextColor={COLORS.textDim}
          value={form.email}
          onChangeText={v => update('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>PHONE NUMBER</Text>
        <TextInput
          style={styles.input}
          placeholder="0712345678"
          placeholderTextColor={COLORS.textDim}
          value={form.phone}
          onChangeText={v => update('phone', v)}
          keyboardType="phone-pad"
        />
        <Text style={styles.hint}>
          Format: 0712345678 or +254712345678
        </Text>

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="min. 8 characters"
          placeholderTextColor={COLORS.textDim}
          value={form.password}
          onChangeText={v => update('password', v)}
          secureTextEntry
        />

        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="repeat password"
          placeholderTextColor={COLORS.textDim}
          value={form.confirmPassword}
          onChangeText={v => update('confirmPassword', v)}
          secureTextEntry
        />

        <AnimatedButton
          label="CREATE ACCOUNT →"
          onPress={handleRegister}
          loading={loading}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already registered?{' '}
            <Text style={styles.linkAccent}>LOGIN →</Text>
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
  },
  tag: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 16,
    marginTop: 40,
    fontFamily: 'monospace',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 32,
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
    marginBottom: 8,
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: COLORS.bg,
  },
  hint: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 16,
    letterSpacing: 1,
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  btnText: {
    color: COLORS.bg,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  link: {
    textAlign: 'center',
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