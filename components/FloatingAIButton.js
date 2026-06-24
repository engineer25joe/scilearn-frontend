import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  PanResponder,
  Dimensions,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const BTN_SIZE = 64;
const MARGIN = 16;
const STORAGE_KEY = 'scilearn_ai_btn_side';

export default function FloatingAIButton({ onPress }) {
  const { colors } = useTheme();
  const [side, setSide] = useState('right');
  const pan = useRef(new Animated.ValueXY({
    x: width - BTN_SIZE - MARGIN,
    y: height - BTN_SIZE - 160,
  })).current;
  const dragging = useRef(false);

  useEffect(() => {
    loadSide();
  }, []);

  const loadSide = async () => {
    try {
      const saved = Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'left') {
        setSide('left');
        pan.setValue({ x: MARGIN, y: height - BTN_SIZE - 160 });
      }
    } catch {}
  };

  const saveSide = async (value) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, value);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, value);
      }
    } catch {}
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragging.current = false;
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
          dragging.current = true;
        }
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        )(e, gesture);
      },
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();

        if (!dragging.current) {
          if (onPress) onPress();
          return;
        }

        const currentX = pan.x._value;
        const midpoint = width / 2;
        const snapLeft = currentX < midpoint;

        let finalY = pan.y._value;
        if (finalY < MARGIN) finalY = MARGIN;
        if (finalY > height - BTN_SIZE - MARGIN) {
          finalY = height - BTN_SIZE - MARGIN;
        }

        Animated.spring(pan, {
          toValue: {
            x: snapLeft ? MARGIN : width - BTN_SIZE - MARGIN,
            y: finalY,
          },
          useNativeDriver: false,
          friction: 6,
        }).start();

        const newSide = snapLeft ? 'left' : 'right';
        setSide(newSide);
        saveSide(newSide);
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
          backgroundColor: colors.surface,
          borderColor: colors.green,
        },
      ]}
    >
      <Text style={styles.icon}>🤖</Text>
      <Text style={[styles.label, { color: colors.green }]}>Ask Q&A AI</Text>
      <Animated.View style={[styles.sparkle, { backgroundColor: colors.greenLight }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: BTN_SIZE,
    height: BTN_SIZE + 22,
    borderRadius: BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 999,
    elevation: 12,
    shadowColor: '#00cc44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  icon: { fontSize: 28 },
  label: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
    position: 'absolute',
    bottom: -18,
    width: 100,
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
