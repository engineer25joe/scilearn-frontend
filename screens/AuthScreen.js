import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Dimensions
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
  const [showReferral, setShowReferral] = useState(false);

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const tabAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    wakeUpServer();
  }, []);

  const wakeUpServer = async () => {
    try {
      await fetch(API_URL + '/users/login/', { method: 'GET' });
    } catch (e) {}
    setServerReady(true);
  };

  const switchTab = function(tab) {
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === 'login' ? 0 : 1,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  };

  const saveUserData = async function(data) {
    var json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  const validateEmail = function(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = function(phone) {
    return /^(\+254|0)[17]\d{8}$/.test(phone);
  };

  const handleLogin = async function() {
    var username = loginForm.username;
    var password = loginForm.password;
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      var res = await fetch(API_URL + '/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });
      var data = await res.json();
      
      if (res.ok) {
        await saveUserData(data);
        if (data.is_admin) {
          navigation.replace('AdminDashboard');
        } else {
          navigation.replace('Dashboard');
        }
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch (e) {
      Alert.alert('Connection Error', 'Cannot connect to server. Please check your internet connection.');
    }
    setLoading(false);
  };

  const handleRegister = async function() {
    var firstName = registerForm.firstName;
    var lastName = registerForm.lastName;
    var phone = registerForm.phone;
    var username = registerForm.username;
    var email = registerForm.email;
    var password = registerForm.password;
    var confirmPassword = registerForm.confirmPassword;
    var referralCode = registerForm.referralCode;

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
      var res = await fetch(API_URL + '/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password,
          phone_number: phone.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          referral_code: referralCode.trim(),
        }),
      });
      var data = await res.json();

      if (res.ok) {
        await saveUserData(data);
        if (data.is_admin) {
           navigation.replace('AdminDashboard');
         } else {
           navigation.replace('Dashboard');
         }
      }

      } else {
        Alert.alert('Error', data.error || 'Registration failed');
      }
    } catch (e) {
      Alert.alert('Connection Error', 'Cannot connect to server. Please check your internet connection.');
    }
    setLoading(false);
  };

  var tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '51%'],
  });

  var getInputStyle = function(key) {
    if (focusedInput === key) {
      return [styles.input, styles.inputFocused];
    }
    return styles.input;
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

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
          {!serverReady && (
            <View style={styles.serverStatus}>
              <ActivityIndicator color={COLORS.gold} size="small" />
              <Text style={styles.serverStatusText}>Connecting...</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.authCard}>

          <View style={styles.tabContainer}>
            <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
            <TouchableOpacity
              style={styles.tab}
              onPress={function() { switchTab('login'); }}
              activeOpacity={0.8}
            >
              <Text style={activeTab === 'login' ? [styles.tabText, styles.tabTextActive] : styles.tabText}>
                LOG IN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={function() { switchTab('register'); }}
              activeOpacity={0.8}
            >
              <Text style={activeTab === 'register' ? [styles.tabText, styles.tabTextActive] : styles.tabText}>
                SIGN UP
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'login' && (
            <View style={styles.form}>

              <TextInput
                style={getInputStyle('loginUsername')}
                placeholder="Email or username"
                placeholderTextColor={COLORS.textDim}
                value={loginForm.username}
                onChangeText={function(v) { setLoginForm(function(f) { return Object.assign({}, f, { username: v }); }); }}
                onFocus={function() { setFocusedInput('loginUsername'); }}
                onBlur={function() { setFocusedInput(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={focusedInput === 'loginPassword' ? [styles.passwordRow, styles.passwordRowFocused] : styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textDim}
                  value={loginForm.password}
                  onChangeText={function(v) { setLoginForm(function(f) { return Object.assign({}, f, { password: v }); }); }}
                  onFocus={function() { setFocusedInput('loginPassword'); }}
                  onBlur={function() { setFocusedInput(null); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={function() { setShowPassword(!showPassword); }}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.showPasswordRow}
                onPress={function() { setShowPassword(!showPassword); }}
              >
                <View style={showPassword ? [styles.checkbox, styles.checkboxChecked] : styles.checkbox}>
                  {showPassword ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.showPasswordText}>Show password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={loading ? [styles.submitBtn, { opacity: 0.8 }] : styles.submitBtn}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.bg2} />
                  : <Text style={styles.submitBtnText}>LOG IN</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={function() { switchTab('register'); }}>
                <Text style={styles.switchText}>
                  Don't have an account?{' '}
                  <Text style={styles.switchLink}>&lt;click on create&gt;</Text>
                </Text>
              </TouchableOpacity>

            </View>
          )}

          {activeTab === 'register' && (
            <View style={styles.form}>

              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <TextInput
                    style={getInputStyle('firstName')}
                    placeholder="First name"
                    placeholderTextColor={COLORS.textDim}
                    value={registerForm.firstName}
                    onChangeText={function(v) { setRegisterForm(function(f) { return Object.assign({}, f, { firstName: v }); }); }}
                    onFocus={function() { setFocusedInput('firstName'); }}
                    onBlur={function() { setFocusedInput(null); }}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.halfCol}>
                  <TextInput
                    style={getInputStyle('lastName')}
                    placeholder="Last name"
                    placeholderTextColor={COLORS.textDim}
                    value={registerForm.lastName}
                    onChangeText={function(v) { setRegisterForm(function(f) { return Object.assign({}, f, { lastName: v }); }); }}
                    onFocus={function() { setFocusedInput('lastName'); }}
                    onBlur={function() { setFocusedInput(null); }}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <TextInput
                    style={getInputStyle('phone')}
                    placeholder="Phone no."
                    placeholderTextColor={COLORS.textDim}
                    value={registerForm.phone}
                    onChangeText={function(v) { setRegisterForm(function(f) { return Object.assign({}, f, { phone: v }); }); }}
                    onFocus={function() { setFocusedInput('phone'); }}
                    onBlur={function() { setFocusedInput(null); }}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.halfCol}>
                  <TextInput
                    style={getInputStyle('regUsername')}
                    placeholder="Username"
                    placeholderTextColor={COLORS.textDim}
                    value={registerForm.username}
                    onChangeText={function(v) { setRegisterForm(function(f) { return Object.assign({}, f, { username: v }); }); }}
                    onFocus={function() { setFocusedInput('regUsername'); }}
                    onBlur={function() { setFocusedInput(null); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TextInput
                style={getInputStyle('email')}
                placeholder="Email"
                placeholderTextColor={COLORS.textDim}
                value={registerForm.email}
                onChangeText={function(v) { setRegisterForm(function(f) { return Object.assign({}, f, { email: v }); }); }}
                onFocus={function() { setFocusedInput('email'); }}
                onBlur={function() { setFocusedInput(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={focusedInput === 'regPassword' ? [styles.passwordRow, styles.passwordRowFocused] : styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.password}
                  onChangeText={function(v) { setRegisterForm(function(f) { return Object.assign({}, f, { password: v }); }); }}
                  onFocus={function() { setFocusedInput('regPassword'); }}
                  onBlur={function() { setFocusedInput(null); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={function() { setShowPassword(!showPassword); }}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <View style={focusedInput === 'confirmPassword' ? [styles.passwordRow, styles.passwordRowFocused] : styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm password"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.confirmPassword}
                  onChangeText={function(v) { setRegisterForm(function(f) { return Object.assign({}, f, { confirmPassword: v }); }); }}
                  onFocus={function() { setFocusedInput('confirmPassword'); }}
                  onBlur={function() { setFocusedInput(null); }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={function() { setShowConfirmPassword(!showConfirmPassword); }}
                >
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.showPasswordRow}
                onPress={function() { setShowPassword(!showPassword); }}
              >
                <View style={showPassword ? [styles.checkbox, styles.checkboxChecked] : styles.checkbox}>
                  {showPassword ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.showPasswordText}>Show password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.referralToggle}
                onPress={function() { setShowReferral(!showReferral); }}
              >
                <Text style={styles.referralToggleText}>
                  {showReferral ? '▼' : '▶'} Have a referral code?
                </Text>
              </TouchableOpacity>

              {showReferral && (
                <TextInput
                  style={getInputStyle('referral')}
                  placeholder="Referral code (optional)"
                  placeholderTextColor={COLORS.textDim}
                  value={registerForm.referralCode}
                  onChangeText={function(v) { setRegisterForm(function(f) { return Object.assign({}, f, { referralCode: v }); }); }}
                  onFocus={function() { setFocusedInput('referral'); }}
                  onBlur={function() { setFocusedInput(null); }}
                  autoCapitalize="none"
                />
              )}

              <TouchableOpacity
                style={loading ? [styles.submitBtn, { opacity: 0.8 }] : styles.submitBtn}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.bg2} />
                  : <Text style={styles.submitBtnText}>CREATE ACC</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={function() { switchTab('login'); }}>
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

var styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg2,
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: COLORS.bg,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  appNameAccent: {
    color: COLORS.gold,
  },
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
    marginTop: 8,
  },
  serverStatusText: {
    color: COLORS.gold,
    fontFamily: 'monospace',
    fontSize: 11,
    marginLeft: 8,
  },
  authCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 8,
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
    top: 4,
    bottom: 4,
    width: '47%',
    backgroundColor: COLORS.surface2,
    borderRadius: 14,
    elevation: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.gold,
  },
  form: {
    padding: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  halfCol: {
    flex: 1,
    paddingRight: 5,
  },
  input: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: 13,
    marginBottom: 12,
  },
  inputFocused: {
    borderColor: COLORS.gold,
    borderWidth: 1.5,
    backgroundColor: COLORS.surface2,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
  },
  passwordRowFocused: {
    borderColor: COLORS.gold,
    borderWidth: 1.5,
    backgroundColor: COLORS.surface2,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  eyeBtn: {
    padding: 14,
  },
  eyeIcon: {
    fontSize: 16,
  },
  showPasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg2,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  checkmark: {
    color: COLORS.bg2,
    fontSize: 12,
    fontWeight: '900',
  },
  showPasswordText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  referralToggle: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  referralToggleText: {
    color: COLORS.gold,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 1,
  },
  submitBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 6,
  },
  submitBtnText: {
    color: COLORS.bg2,
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 3,
  },
  switchText: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  switchLink: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: 32,
    fontFamily: 'monospace',
  },
});