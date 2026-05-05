import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Dimensions, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

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
    // Animate splash
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineWidth, {
        toValue: width * 0.6,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();

    // Check for saved login after animation
    const timer = setTimeout(async () => {
      const userData = await getSavedUser();
      if (userData) {
        // User already logged in — go straight to Dashboard
        navigation.replace('Dashboard');
      } else {
        // No saved login — go to Login screen
        navigation.replace('Login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{
        opacity,
        transform: [{ scale }],
        alignItems: 'center'
      }}>
        <Text style={styles.tag}>// EAST AFRICA'S TECH PLATFORM</Text>
        <Text style={styles.logo}>
          SCI<Text style={styles.logoAccent}>LEARN</Text>
        </Text>
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
    color: