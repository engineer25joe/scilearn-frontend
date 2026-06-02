import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Dimensions, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import { registerForPushNotifications, scheduleStudyReminder } from '../utils/notifications';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const flagAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const getSavedUser = async () => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('scibase_user');
      }
      return await AsyncStorage.getItem('scibase_user');
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Register push notifications
    registerForPushNotifications().then(token => {
     if (token) console.log('Push token:', token);
    });
    scheduleStudyReminder();
    Animated.sequence([
      // Flag stripes animate in
      Animated.timing(flagAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      // Logo appears
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1, tension: 50,
          friction: 8, useNativeDriver: true,
        }),
      ]),
      // Line draws
      Animated.timing(lineWidth, {
        toValue: width * 0.7, duration: 600, useNativeDriver: false,
      }),
      // Text appears
      Animated.timing(textOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      const userData = await getSavedUser();
      if (userData) {
        navigation.replace('Dashboard');
      } else {
        navigation.replace('Auth');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>

      {/* Background flag stripes */}
      <Animated.View style={[styles.bgStripes, { opacity: flagAnim }]}>
        <View style={[styles.bgStripe, { backgroundColor: COLORS.black, opacity: 0.5 }]} />
        <View style={[styles.bgStripe, { backgroundColor: COLORS.red, opacity: 0.15 }]} />
        <View style={[styles.bgStripe, { backgroundColor: COLORS.green, opacity: 0.15 }]} />
      </Animated.View>

      {/* Top flag bar */}
      <Animated.View style={[styles.flagBar, { opacity: flagAnim }]}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>

          {/* Shield icon */}
          <View style={styles.shield}>
            <Text style={styles.shieldText}>🛡️</Text>
          </View>

          {/* Logo */}
          <Text style={styles.logo}>
            SCI<Text style={styles.logoAccent}>LEARN</Text>
          </Text>

          {/* Animated line */}
          <Animated.View style={[styles.line, { width: lineWidth }]}>
            <View style={[styles.lineSegment, { backgroundColor: COLORS.black, flex: 1 }]} />
            <View style={[styles.lineSegment, { backgroundColor: COLORS.red, flex: 1 }]} />
            <View style={[styles.lineSegment, { backgroundColor: COLORS.green, flex: 1 }]} />
          </Animated.View>

          {/* Tagline */}
          <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
            <Text style={styles.tagline}>LEARN. BUILD. DOMINATE.</Text>
            <Text style={styles.country}>🇰🇪 KENYA & EAST AFRICA</Text>
          </Animated.View>

        </Animated.View>
      </View>

      {/* Bottom flag bar */}
      <Animated.View style={[styles.flagBar, { opacity: flagAnim }]}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bgStripes: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
  },
  bgStripe: { flex: 1 },
  flagBar: {
    width: '100%',
    height: 12,
    flexDirection: 'row',
  },
  flagStripe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shield: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  shieldText: { fontSize: 36 },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.green,
    letterSpacing: 6,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0,102,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoAccent: { color: COLORS.blue },
  line: {
    height: 4,
    flexDirection: 'row',
    marginVertical: 24,
    overflow: 'hidden',
  },
  lineSegment: { height: '100%' },
  tagline: {
    color: COLORS.textDim,
    fontSize: 13,
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  country: {
    color: COLORS.green,
    fontSize: 12,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  footer: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
});
