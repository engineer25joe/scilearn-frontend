import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

export default function Avatar({ uri, username, size = 48, fontSize = 20 }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          }
        ]}
      />
    );
  }

  // Fallback — show first letter of username
  return (
    <View style={[
      styles.avatarFallback,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
      }
    ]}>
      <Text style={[styles.avatarText, { fontSize }]}>
        {username?.charAt(0)?.toUpperCase() || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  avatarFallback: {
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.greenLight,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
});
