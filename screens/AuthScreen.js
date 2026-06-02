import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Platform, Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_URL = 'https://scilearnbackend.onrender.com/api';

const COLORS = {
  bg: '#1a2a3a',
  bg2: '#152030',
  surface: '#1e2e40',
  surface2: '#243548',
  border: '#2a3f55',
  gold: '#c9a84c',
  goldLight: '#e8c870',
  goldDark: '#a07830',
  white: '#ffffff',
  text: '#e8e8e8',
  textDim: '#7a8a9a',
  green: '#006600',
  red: '#bb0000',
  blue: '#0f268c',
};

export default function AuthScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Login form
  const [loginForm, setLoginForm] = useState({
    username: '', password: '',
  });

  // Register form
  const [registerForm, setRegisterForm] = useState({
    firstName: '', lastName: '',
    phone: '', username: '',
    email: '', password: '',
    confirmPassword: '', referralCode: '',
  });

  const [showReferral, setShowReferral] = useState(false);

  // Animations
  const tabAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1, tension: 50, friction: 8, useNativeDriver: true,
      }),
    ]).start();

    // Wake up server
    wakeUpServer();
  }, []);

  const wakeUpServer = async () => {
    try {
      await fetch(`${API_URL}/users/login/`, { method: 'GET' });
    } catch {}
    setServerReady(true);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === 'login' ? 0 : 1,
      useNativeDriver: false,
      tension: 60, friction: 10,
    }).start();
  };

  const saveUserData = async (data) => {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) =>
    /^(\+254|0)[17]\d{8}$/.test(phone);

  const handleLogin = async () => {
    const { username, password } = loginForm;
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await saveUserData(data);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch (e) {
      Alert.alert('Connection Error', 'Cannot connect to server. Please check your internet connection.');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    const {
      firstName, lastName, phone, username,
      email, password, confirmPassword, referralCode
    } = registerForm;

    if (!firstName || !lastName || !phone || !username || !email || !password || !confirmPassword) {
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
      const res = await fetch(`${API_URL}/users/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          phone_number: phone.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          referral_code: referralCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requires_verification) {
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
      Alert.alert('Connection Error', 'Cannot connect to server. Please check your internet connection.');
    }
    setLoading(false);
  };

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '51%'],
  });

  const inputStyle = (key) => [
    styles.input,
    focusedInput === key && styles.inputFocused,
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Background gradient effect */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Logo Section */}
        <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🎓</Text>
          </View>
          <Text style={styles.appName}>
            SCI<Text style={styles.appNameAccent}>LEARN</Text>
          </Text>
          <Text style={styles.appTagline}>
            KENYA'S #1 TECH LEARNING PLATFORM
          </Text>

          {/* Server status */}
          {!serverReady && (
            <View style={styles.serverStatus}>
              <ActivityIndicator color={COLORS.gold} size="small" />
              <Text style={styles.serverStatusText}>Connecting...</Text>
            </View>
          )}
        </Animated.View>

        {/* Auth Card */}
        <View style={styles.authCard}>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
            <TouchableOpacity
              style={styles.tab}
              onPress={() => switchTab('login')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'login' && styles.tabTextActive
              ]}>
                LOG IN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => switchTab('register')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'register' && styles.tabTextActive
              ]}>
                SIGN UP
              </Text>
            </TouchableOpacity>
          </View>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <View style={styles.form}>
              <TextInput
                style={inputStyle('username')}
                placeholder="Email or username"
                placeholderTextColor={COLORS.textDim}
                value={loginForm.username}
                onChangeText={v => setLoginForm(f => ({ ...f, username: v }))}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[inputStyle('password'), { marginBottom: 0, flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textDim}
                  value={loginForm.password}
                  onChangeText={v => setLoginForm(f => ({ ...f, password: v }))}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                />
              </View>

              {/* Show password */}
              <TouchableOpacity
                style={styles.showPasswordRow}
                onPress={() => setShowPassword(!showPassword)}
              >
                <View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
                  {showPassword && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.showPasswordText}>Show password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, (!serverReady || loading) && { opacity: 0.8 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.bg2} />
                  : <Text style={styles.submitBtnText}>LOG IN</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={() => switchTab('register')}>
                <Text style={styles.switchText}>
                  Don't have an account?{' '}
                  <Text style={styles.switchLink}>&lt;click on create&gt;</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <View style={styles.form}>

              {/* First name & Last name row */}
              <View style={styles.row}>
                <TextInput
                  style={[inputStyle('firstName'), styles.halfInput]}
                  placeholder="First name"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.firstName}
                  onChangeText={v => setRegisterForm(f => ({ ...f, firstName: v }))}
                  onFocus={() => setFocusedInput('firstName')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[inputStyle('lastName'), styles.halfInput]}
                  placeholder="Last name"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.lastName}
                  onChangeText={v => setRegisterForm(f => ({ ...f, lastName: v }))}
                  onFocus={() => setFocusedInput('lastName')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="words"
                />
              </View>

              {/* Phone & Username row */}
              <View style={styles.row}>
                <TextInput
                  style={[inputStyle('phone'), styles.halfInput]}
                  placeholder="Phone no."
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.phone}
                  onChangeText={v => setRegisterForm(f => ({ ...f, phone: v }))}
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[inputStyle('regUsername'), styles.halfInput]}
                  placeholder="Username"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.username}
                  onChangeText={v => setRegisterForm(f => ({ ...f, username: v }))}
                  onFocus={() => setFocusedInput('regUsername')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Email */}
              <TextInput
                style={inputStyle('email')}
                placeholder="Email"
                placeholderTextColor={COLORS.textDim}
                value={registerForm.email}
                onChangeText={v => setRegisterForm(f => ({ ...f, email: v }))}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[inputStyle('regPassword'), { marginBottom: 0, flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.password}
                  onChangeText={v => setRegisterForm(f => ({ ...f, password: v }))}
                  onFocus={() => setFocusedInput('regPassword')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                />
              </View>

              {/* Confirm Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[inputStyle('confirmPassword'), { marginBottom: 0, flex: 1 }]}
                  placeholder="Confirm password"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.confirmPassword}
                  onChangeText={v => setRegisterForm(f => ({ ...f, confirmPassword: v }))}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Show password */}
              <TouchableOpacity
                style={styles.showPasswordRow}
                onPress={() => setShowPassword(!showPassword)}
              >
                <View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
                  {showPassword && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.showPasswordText}>Show password</Text>
              </TouchableOpacity>

              {/* Referral Code */}
              <TouchableOpacity
                style={styles.referralToggle}
                onPress={() => setShowReferral(!showReferral)}
              >
                <Text style={styles.referralToggleText}>
                  {showReferral ? '▼' : '▶'} Have a referral code?
                </Text>
              </TouchableOpacity>

              {showReferral && (
                <TextInput
                  style={inputStyle('referral')}
                  placeholder="Referral code (optional)"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.referralCode}
                  onChangeText={v => setRegisterForm(f => ({ ...f, referralCode: v }))}
                  onFocus={() => setFocusedInput('referral')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                />
              )}

              <TouchableOpacity
                style={[styles.submitBtn, (!serverReady || loading) && { opacity: 0.8 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.bg2} />
                  : <Text style={styles.submitBtnText}>CREATE ACC</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={() => switchTab('login')}>
                <Text style={styles.switchText}>
                  Already have an account?{' '}
                  <Text style={styles.switchLink}>&lt;click on login&gt;</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

        <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg2,
  },
  bgTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 300,
    backgroundColor: COLORS.bg,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 200,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 80, height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: { fontSize: 40 },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  appNameAccent: { color: COLORS.gold },
  appTagline: {
    color: COLORS.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginTop: 6,
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  serverStatusText: {
    color: COLORS.gold,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  authCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg2,
    borderRadius: 18,
    margin: 8,
    padding: 4,
    position: 'relative',
    height: 48,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4, bottom: 4,
    width: '47%',
    backgroundColor: COLORS.surface2,
    borderRadius: 14,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tab: {
    flex: 1,
    alig
