import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Dimensions
} from 'react-native';
import { isLoggedIn, isAdmin, getStoredData } from '../utils/auth';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const flagAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(flagAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1, tension: 50,
          friction: 8, useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineWidth, {
        toValue: width * 0.7, duration: 600, useNativeDriver: false,
      }),
      Animated.timing(textOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          const admin = await isAdmin();
          if (admin) {
            navigation.replace('AdminDashboard');
          } else {
            navigation.replace('Dashboard');
          }
        } else {
          navigation.replace('Auth');
        }
      } catch {
        navigation.replace('Auth');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bgStripes, { opacity: flagAnim }]}>
        <View style={[styles.bgStripe, { backgroundColor: '#000', opacity: 0.5 }]} />
        <View style={[styles.bgStripe, { backgroundColor: '#bb0000', opacity: 0.15 }]} />
        <View style={[styles.bgStripe, { backgroundColor: '#006600', opacity: 0.15 }]} />
      </Animated.View>

      <Animated.View style={[styles.flagBar, { opacity: flagAnim }]}>
        <View style={[styles.flagStripe, { backgroundColor: '#000' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#bb0000' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#006600' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#bb0000' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#000' }]} />
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={{
          opacity, transform: [{ scale }], alignItems: 'center'
        }}>
          <View style={styles.shield}>
            <Text style={styles.shieldText}>🛡️</Text>
          </View>
          <Text style={styles.logo}>
            SCI<Text style={styles.logoAccent}>LEARN</Text>
          </Text>
          <Animated.View style={[styles.line, { width: lineWidth }]}>
            <View style={[styles.lineSegment, { backgroundColor: '#000', flex: 1 }]} />
            <View style={[styles.lineSegment, { backgroundColor: '#bb0000', flex: 1 }]} />
            <View style={[styles.lineSegment, { backgroundColor: '#006600', flex: 1 }]} />
          </Animated.View>
          <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
            <Text style={styles.tagline}>LEARN. BUILD. DOMINATE.</Text>
            <Text style={styles.country}>🇰🇪 KENYA & EAST AFRICA</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.flagBar, { opacity: flagAnim }]}>
        <View style={[styles.flagStripe, { backgroundColor: '#000' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#bb0000' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#006600' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#bb0000' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#000' }]} />
      </Animated.View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    width: '100%', height: 12, flexDirection: 'row',
  },
  flagStripe: { flex: 1 },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  shield: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1a1a1a',
    borderWidth: 2, borderColor: '#006600',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  shieldText: { fontSize: 36 },
  logo: {
    fontSize: 56, fontWeight: '900',
    color: '#006600', letterSpacing: 6,
    fontFamily: 'monospace',
  },
  logoAccent: { color: '#0f268c' },
  line: {
    height: 4, flexDirection: 'row',
    marginVertical: 24, overflow: 'hidden',
  },
  lineSegment: { height: '100%' },
  tagline: {
    color: '#888888', fontSize: 13,
    letterSpacing: 4, fontFamily: 'monospace', marginBottom: 12,
  },
  country: {
    color: '#006600', fontSize: 12,
    letterSpacing: 3, fontFamily: 'monospace',
  },
  footer: {
    color: '#888888', fontSize: 10,
    fontFamily: 'monospace', marginBottom: 20,
  },
});