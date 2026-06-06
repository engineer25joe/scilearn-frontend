import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://scilearnbackend.onrender.com/api';

const COLORS = {
  bg: '#1a2a3a',
  bg2: '#152030',
  surface: '#1e2e40',
  surface2: '#243548',
  border: '#2a3f55',
  gold: '#c9a84c',
  goldLight: '#e8c870',
  white: '#ffffff',
  text: '#e8e8e8',
  textDim: '#7a8a9a',
  green: '#006600',
  greenLight: '#008000',
  red: '#bb0000',
  blue: '#0f268c',
  amber: '#ffd700',
};

export default function OTPScreen({ navigation, route }) {
  const username = route && route.params ? route.params.username : '';
  const email = route && route.params ? route.params.email : '';
  const phone = route && route.params ? route.params.phone : '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(function() {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    startCountdown();

    var timer = setTimeout(function() {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 600);

    return function() { clearTimeout(timer); };
  }, []);

  var startCountdown = function() {
    setCountdown(60);
    setCanResend(false);
    var count = 60;
    var timer = setInterval(function() {
      count = count - 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setCanResend(true);
      }
    }, 1000);
  };

  var shakeInputs = function() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  var saveUserData = async function(data) {
    var json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  var handleOtpChange = function(value, index) {
    var newOtp = otp.slice();
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }

    if (index === 5 && value) {
      var fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        verifyOTP(fullOtp);
      }
    }
  };

  var handleKeyPress = function(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  var verifyOTP = async function(otpCode) {
    var code = otpCode || otp.join('');

    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    if (!username) {
      Alert.alert('Error', 'Session expired. Please register again.');
      navigation.replace('Auth');
      return;
    }

    setLoading(true);
    try {
      var res = await fetch(API_URL + '/users/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          otp_code: code,
        }),
      });

      var data = await res.json();

      if (res.ok) {
        await saveUserData(data);
        Alert.alert(
          '✅ Verified!',
          'Welcome to SCI LEARN ' + username + '! 🇰🇪\n\nYour account is verified and ready!',
          [{
            text: 'START LEARNING →',
            onPress: function() { navigation.replace('Dashboard'); }
          }]
        );
      } else {
        shakeInputs();
        Alert.alert('❌ Wrong OTP', data.error || 'Invalid OTP code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Cannot connect to server. Please try again.');
    }
    setLoading(false);
  };

  var resendOTP = async function() {
    if (!canResend) return;
    setResending(true);
    try {
      var res = await fetch(API_URL + '/users/resend-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username: username }),
      });

      var data = await res.json();

      if (res.ok) {
        Alert.alert('✅ Sent!', 'New OTP sent to your email!');
        startCountdown();
        setOtp(['', '', '', '', '', '']);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to resend OTP');
      }
    } catch (e) {
      Alert.alert('Error', 'Cannot connect to server.');
    }
    setResending(false);
  };

  var maskEmail = function(emailStr) {
    if (!emailStr) return 'your email';
    var parts = emailStr.split('@');
    if (parts.length < 2) return emailStr;
    var name = parts[0];
    var domain = parts[1];
    var masked = name.substring(0, 2) + '***';
    return masked + '@' + domain;
  };

  return (
    <View style={styles.container}>

      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        <Animated.View style={[styles.iconBox, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.iconText}>🔐</Text>
        </Animated.View>

        <Text style={styles.tag}>// ACCOUNT VERIFICATION</Text>
        <Text style={styles.title}>
          VERIFY<Text style={styles.titleAccent}>.</Text>
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>CHECK YOUR EMAIL</Text>
          <Text style={styles.infoText}>
            We sent a 6-digit code to:
          </Text>
          <Text style={styles.infoEmail}>
            📧 {maskEmail(email)}
          </Text>
          <Text style={styles.infoNote}>
            ⚠️ Check spam folder if not received
          </Text>
        </View>

        <Animated.View style={[
          styles.otpWrapper,
          { transform: [{ translateX: shakeAnim }] }
        ]}>
          <View style={styles.otpRow}>
            {otp.map(function(digit, index) {
              return (
                <TextInput
                  key={index}
                  ref={function(ref) { inputRefs.current[index] = ref; }}
                  style={digit ? [styles.otpBox, styles.otpBoxFilled] : styles.otpBox}
                  value={digit}
                  onChangeText={function(val) { handleOtpChange(val.slice(-1), index); }}
                  onKeyPress={function(e) { handleKeyPress(e, index); }}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus={true}
                  caretHidden={true}
                />
              );
            })}
          </View>
        </Animated.View>

        <TouchableOpacity
          style={loading ? [styles.verifyBtn, { opacity: 0.7 }] : styles.verifyBtn}
          onPress={function() { verifyOTP(null); }}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.bg2} />
            : <Text style={styles.verifyBtnText}>✅ VERIFY ACCOUNT</Text>
          }
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive OTP?  </Text>
          {canResend ? (
            <TouchableOpacity onPress={resendOTP} disabled={resending}>
              {resending
                ? <ActivityIndicator color={COLORS.gold} size="small" />
                : <Text style={styles.resendBtn}>RESEND →</Text>
              }
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdown}>Resend in {countdown}s</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={function() { navigation.replace('Auth'); }}
        >
          <Text style={styles.backText}>← BACK TO LOGIN</Text>
        </TouchableOpacity>

      </Animated.View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    justifyContent: 'center',
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: COLORS.bg,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  content: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 8,
  },
  iconText: { fontSize: 36 },
  tag: {
    color: COLORS.textDim,
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  titleAccent: { color: COLORS.gold },
  infoBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    backgroundColor: COLORS.surface,
    padding: 16,
    width: '100%',
    marginBottom: 28,
    alignItems: 'center',
    borderRadius: 8,
  },
  infoTitle: {
    color: COLORS.gold,
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 8,
  },
  infoText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 6,
  },
  infoEmail: {
    color: COLORS.white,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoNote: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 10,
    textAlign: 'center',
  },
  otpWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  otpBox: {
    width: 46,
    height: 58,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: 'monospace',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  otpBoxFilled: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.surface2,
    color: COLORS.gold,
  },
  verifyBtn: {
    backgroundColor: COLORS.gold,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 12,
    elevation: 6,
  },
  verifyBtnText: {
    color: COLORS.bg2,
    fontFamily: 'monospace',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 14,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendLabel: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  resendBtn: {
    color: COLORS.gold,
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 12,
  },
  countdown: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 2,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: 'monospace',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
});