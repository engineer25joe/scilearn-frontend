import React, { useState, useRef } from 'react';
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

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showReferral, setShowReferral] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) =>
    /^(\+254|0)[17]\d{8}$/.test(phone);

  const saveUserData = async (data) => {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  const handleRegister = async () => {
    const { username, email, phone, password, confirmPassword, referralCode } = form;

    if (!username || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid Kenyan phone number\nExample: 0712345678');
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${API_URL}/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          phone_number: phone.trim(),
          referral_code: referralCode.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (res.ok) {
        if (data.requires_verification) {
          // Navigate to OTP screen
          navigation.navigate('OTP', {
            username: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
          });
        } else {
          await saveUserData(data);
          navigation.replace('Dashboard');
        }
      } else {
        Alert.alert('Error', data.error || 'Registration failed');
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        Alert.alert(
          '⏱️ Server Timeout',
          'The server is waking up. Please wait 30 seconds and try again.',
          [{ text: 'RETRY', onPress: handleRegister }]
        );
      } else {
        Alert.alert('Connection Error', `Cannot connect to server.\n\n${e.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Header */}
      <View style={styles.headerSection}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backText}>← BACK TO LOGIN</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          JOIN <Text style={styles.titleAccent}>SCILEARN</Text>
        </Text>
        <Text style={styles.subtitle}>
          Kenya's #1 Tech Learning Platform 🇰🇪
        </Text>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>CREATE ACCOUNT</Text>
          <Text style={styles.formSub}>Fill in your details to get started</Text>
        </View>

        {/* Username */}
        <Text style={styles.label}>USERNAME</Text>
        <TextInput
          style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
          placeholder="engineer_joe"
          placeholderTextColor={COLORS.textDim}
          value={form.username}
          onChangeText={v => update('username', v)}
          onFocus={() => setFocusedInput('username')}
          onBlur={() => setFocusedInput(null)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Email */}
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput
          style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
          placeholder="joe@example.com"
          placeholderTextColor={COLORS.textDim}
          value={form.email}
          onChangeText={v => update('email', v)}
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Phone */}
        <Text style={styles.label}>PHONE NUMBER</Text>
        <TextInput
          style={[styles.input, focusedInput === 'phone' && styles.inputFocused]}
          placeholder="0712345678"
          placeholderTextColor={COLORS.textDim}
          value={form.phone}
          onChangeText={v => update('phone', v)}
          onFocus={() => setFocusedInput('phone')}
          onBlur={() => setFocusedInput(null)}
          keyboardType="phone-pad"
        />
        <Text style={styles.hint}>
          Format: 0712345678 or +254712345678
        </Text>

        {/* Password */}
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
          placeholder="min. 8 characters"
          placeholderTextColor={COLORS.textDim}
          value={form.password}
          onChangeText={v => update('password', v)}
          onFocus={() => setFocusedInput('password')}
          onBlur={() => setFocusedInput(null)}
          secureTextEntry
        />

        {/* Confirm Password */}
        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <TextInput
          style={[styles.input, focusedInput === 'confirm' && styles.inputFocused]}
          placeholder="repeat password"
          placeholderTextColor={COLORS.textDim}
          value={form.confirmPassword}
          onChangeText={v => update('confirmPassword', v)}
          onFocus={() => setFocusedInput('confirm')}
          onBlur={() => setFocusedInput(null)}
          secureTextEntry
        />

        {/* Referral Code Toggle */}
        <TouchableOpacity
          style={styles.referralToggle}
          onPress={() => setShowReferral(!showReferral)}
        >
          <Text style={styles.referralToggleText}>
            {showReferral ? '▼' : '▶'} Have a referral code?
          </Text>
        </TouchableOpacity>

        {showReferral && (
          <>
            <Text style={styles.label}>REFERRAL CODE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, focusedInput === 'referral' && styles.inputFocused]}
              placeholder="friend_username"
              placeholderTextColor={COLORS.textDim}
              value={form.referralCode}
              onChangeText={v => update('referralCode', v)}
              onFocus={() => setFocusedInput('referral')}
              onBlur={() => setFocusedInput(null)}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              🎁 You and your friend both earn bonus tokens!
            </Text>
          </>
        )}

        <AnimatedButton
          label="CREATE ACCOUNT →"
          onPress={handleRegister}
          loading={loading}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already have an account?{' '}
            <Text style={styles.linkAccent}>LOGIN →</Text>
          </Text>
        </TouchableOpacity>
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
  headerSection: {
    padding: 28,
    paddingTop: 32,
  },
  backBtn: { marginBottom: 20 },
  backText: {
    color: COLORS.blue,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  titleAccent: { color: COLORS.green },
  subtitle: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  formCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 24,
    borderTopWidth: 3,
    borderTopColor: COLORS.blue,
  },
  formHeader: { marginBottom: 28 },
  formTitle: {
    color: COLORS.white,
    fontSize: 18,
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
    marginBottom: 8,
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
  },
  inputFocused: {
    borderColor: COLORS.blue,
    borderWidth: 1.5,
  },
  hint: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 16,
    letterSpacing: 1,
  },
  referralToggle: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  referralToggleText: {
    color: COLORS.amber,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 1,
  },
  btn: {
    backgroundColor: COLORS.green,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
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
  link: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  linkAccent: { color: COLORS.green },
  footer: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 11,
    margin: 32,
    fontFamily: 'monospace',
  },
});