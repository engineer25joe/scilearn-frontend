import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import COLORS from '../constants/colors';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(lineWidth, { toValue: width * 0.6, duration: 600, useNativeDriver: false }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <Text style={styles.tag}>// EAST AFRICA'S TECH PLATFORM</Text>
        <Text style={styles.logo}>SCI<Text style={styles.logoAccent}>BASE</Text></Text>
        <Animated.View style={[styles.line, { width: lineWidth }]} />
        <Text style={styles.sub}>LEARN. BUILD. DOMINATE.</Text>
        <Text style={styles.cursor}>█</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  logo: {
    fontSize: 52,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 6,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0,255,136,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoAccent: { color: COLORS.amber },
  line: {
    height: 2,
    backgroundColor: COLORS.primary,
    marginVertical: 20,
  },
  sub: {
    color: COLORS.textDim,
    fontSize: 13,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  cursor: {
    color: COLORS.primary,
    fontSize: 20,
    marginTop: 32,
    opacity: 0.8,
  },
});
