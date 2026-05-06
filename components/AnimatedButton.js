import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet,
  Animated, ActivityIndicator
} from 'react-native';
import COLORS from '../constants/colors';

export default function AnimatedButton({
  onPress, label, loading, style, textStyle, variant = 'primary'
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.timing(opacity, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <TouchableOpacity
        style={[
          styles.btn,
          variant === 'outline' && styles.btnOutline,
          variant === 'danger' && styles.btnDanger,
          style
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={loading}
        activeOpacity={1}
      >
        {loading
          ? <ActivityIndicator color={variant === 'primary' ? COLORS.bg : COLORS.primary} />
          : <Text style={[
              styles.btnText,
              variant === 'outline' && styles.btnOutlineText,
              variant === 'danger' && styles.btnDangerText,
              textStyle
            ]}>
              {label}
            </Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  btnDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff3355',
  },
  btnText: {
    color: COLORS.bg,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  btnOutlineText: {
    color: COLORS.primary,
  },
  btnDangerText: {
    color: '#ff3355',
  },
});
