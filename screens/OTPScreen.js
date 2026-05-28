import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  Animated, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

export default function OTPScreen({ navigation, route }) {
  const { username, email, phone } = route?.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 50, friction: 8, useNativeDriver: true,
      }),
    ]).start();
    startCountdown();
    // Focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 500);
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit on last digit
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        verifyOTP(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const saveUserData = async (data) => {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  const verifyOTP = async (otpCode) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/verify-otp/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, otp_code: code }),
        }
      );
      const data = await res.json();

      if (res.ok) {
        await saveUserData(data);
        Alert.alert(
          '✅ Verified!',
          `Welcome to SCI LEARN ${username}! 🇰🇪\n\nYour account is verified and ready to go!`,
          [{
            text: 'START LEARNING →',
            onPress: () => navigation.replace('Dashboard')
          }]
        );
      } else {
        Alert.alert('❌ Error', data.error || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  const resendOTP = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/resend-otp/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Sent!', 'New OTP sent to your email!');
        startCountdown();
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', data.error || 'Failed to resend');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setResending(false);
  };

  return (
    <View style={styles.container}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>

        {/* Shield Icon */}
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔐</Text>
        </View>

        {/* Title */}
        <Text style={styles.tag}>// ACCOUNT VERIFICATION</Text>
        <Text style={styles.title}>
          VERIFY<Text style={styles.titleAccent}>.</Text>
        </Text>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            We sent a 6-digit OTP to your email:
          </Text>
          {email ? (
            <Text style={styles.infoEmail}>
              📧 {email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
            </Text>
          ) : (
            <Text style={styles.infoEmail}>📧 your registered email</Text>
          )}
          <Text style={styles.infoNote}>
            ⚠️ Check your spam folder if not received
          </Text>
        </View>

        {/* OTP Input Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
              ]}
              value={digit}
              onChangeText={val => handleOtpChange(val.slice(-1), index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyBtn, loading && { opacity: 0.7 }]}
          onPress={() => verifyOTP(null)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.verifyBtnText}>✅ VERIFY ACCOUNT</Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive OTP?  </Text>
          {canResend ? (
            <TouchableOpacity onPress={resendOTP} disabled={resending}>
              {resending ? (
                <ActivityIndicator color={COLORS.green} size="small" />
              ) : (
                <Text style={styles.resendBtn}>RESEND →</Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdown}>Resend in {countdown}s</Text>
          )}
        </View>

        {/* Back to login */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backText}>← BACK TO LOGIN</Text>
        </TouchableOpacity>

      </Animated.View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
  },
  flagBanner: {
    flexDirection: 'row',
    height: 6,
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  flagStripe: { flex: 1 },
  content: {
    padding: 28,
    alignItems: 'center',
  },
  iconBox: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceGreen,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 36 },
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
    color: COLORS.green,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  titleAccent: { color: COLORS.amber },
  infoBox: {
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
    backgroundColor: COLORS.surfaceBlue,
    padding: 16,
    width: '100%',
    marginBottom: 28,
    alignItems: 'center',
  },
  infoText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 8,
  },
  infoEmail: {
    color: COLORS.white,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoNote: {
    color: COLORS.amber,
    fontFamily: 'monospace',
    fontSize: 10,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  otpBox: {
    width: 46, height: 58,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: 'monospace',
    borderRadius: 4,
  },
  otpBoxFilled: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.surfaceGreen,
    color: COLORS.green,
  },
  verifyBtn: {
    backgroundColor: COLORS.green,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenLight,
    marginBottom: 20,
    borderRadius: 4,
  },
  verifyBtnText: {
    color: COLORS.white,
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
    color: COLORS.green,
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 12,
  },
  countdown: {
    color: COLORS.amber,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  backText: {
    color: COLORS.blue,
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
    left: 0, right: 0,
  },
});