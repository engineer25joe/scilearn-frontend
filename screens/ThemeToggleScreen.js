import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, ScrollView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleScreen({ navigation }) {
  const { colors, themeMode, setTheme, isDark } = useTheme();

  const options = [
    {
      key: 'dark',
      icon: '🌙',
      label: 'DARK MODE',
      desc: 'Easy on the eyes at night',
      color: '#1a1a1a',
      textColor: '#f0f0f0',
      border: colors.green,
    },
    {
      key: 'light',
      icon: '☀️',
      label: 'LIGHT MODE',
      desc: 'Clean and bright look',
      color: '#f5f5f0',
      textColor: '#1a1a1a',
      border: colors.amber,
    },
    {
      key: 'system',
      icon: '📱',
      label: 'SYSTEM DEFAULT',
      desc: 'Follows your phone settings',
      color: colors.surface,
      textColor: colors.text,
      border: colors.blue,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: '#000' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#bb0000' }]} />
        <View style={[styles.flagStripe, { backgroundColor: '#006600' }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, {
        borderBottomColor: colors.border,
        backgroundColor: colors.surfaceGreen,
      }]}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: colors.green }]}>← BACK</Text>
        </TouchableOpacity>
        <Text style={[styles.tag, { color: colors.textDim }]}>// APPEARANCE</Text>
        <Text style={[styles.title, { color: colors.green }]}>
          THEME SETTINGS 🎨
        </Text>
        <Text style={[styles.subtitle, { color: colors.textDim }]}>
          Choose how SCI LEARN looks
        </Text>
      </View>

      {/* Preview */}
      <View style={styles.previewSection}>
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          // CURRENT THEME
        </Text>

        <View style={[styles.previewCard, {
          backgroundColor: colors.surface,
          borderColor: colors.green,
        }]}>
          <View style={styles.previewHeader}>
            <View style={[styles.previewDot, { backgroundColor: colors.red }]} />
            <View style={[styles.previewDot, { backgroundColor: colors.amber }]} />
            <View style={[styles.previewDot, { backgroundColor: colors.green }]} />
          </View>
          <View style={[styles.previewBody, { backgroundColor: colors.bg }]}>
            <View style={[styles.previewBar, { backgroundColor: colors.green, width: '70%' }]} />
            <View style={[styles.previewBar, { backgroundColor: colors.border, width: '90%' }]} />
            <View style={[styles.previewBar, { backgroundColor: colors.border, width: '60%' }]} />
            <View style={[styles.previewRow]}>
              <View style={[styles.previewBox, { backgroundColor: colors.surfaceGreen, borderColor: colors.green }]} />
              <View style={[styles.previewBox, { backgroundColor: colors.surfaceBlue, borderColor: colors.blue }]} />
            </View>
          </View>
          <Text style={[styles.previewLabel, { color: colors.textDim }]}>
            {themeMode.toUpperCase()} MODE PREVIEW
          </Text>
        </View>
      </View>

      {/* Theme Options */}
      <View style={styles.optionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          // SELECT THEME
        </Text>

        {options.map((option) => {
          const isSelected = themeMode === option.key;
          const scale = useRef(new Animated.Value(1)).current;

          return (
            <Animated.View key={option.key} style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: option.color,
                    borderColor: isSelected ? option.border : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    borderLeftWidth: isSelected ? 4 : 1,
                    borderLeftColor: isSelected ? option.border : colors.border,
                  }
                ]}
                onPress={() => setTheme(option.key)}
                onPressIn={() => Animated.spring(scale, {
                  toValue: 0.97, useNativeDriver: true, speed: 50
                }).start()}
                onPressOut={() => Animated.spring(scale, {
                  toValue: 1, useNativeDriver: true, speed: 50
                }).start()}
                activeOpacity={1}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: option.textColor }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDesc, {
                    color: option.key === 'light' ? '#666' : colors.textDim
                  }]}>
                    {option.desc}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: option.border }]}>
                    <Text style={styles.selectedText}>✓ ON</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, {
        borderColor: colors.blue,
        borderLeftColor: colors.blue,
        backgroundColor: colors.surfaceBlue,
      }]}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={[styles.infoText, { color: colors.textDim }]}>
          Your theme preference is saved automatically and will be remembered next time you open the app.
        </Text>
      </View>

      <Text style={[styles.footer, { color: colors.textDim }]}>
        Developed by: 💞🙏 Engineer Joe 🇰🇪
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  header: {
    padding: 24, paddingTop: 32,
    borderBottomWidth: 1,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1, paddingVertical: 6,
    paddingHorizontal: 14, marginBottom: 16,
  },
  backText: { fontFamily: 'monospace', fontSize: 12, letterSpacing: 2 },
  tag: { fontSize: 10, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '900', fontFamily: 'monospace' },
  subtitle: { fontFamily: 'monospace', fontSize: 12, marginTop: 4 },
  previewSection: { padding: 20 },
  sectionTitle: {
    fontSize: 10, letterSpacing: 3,
    fontFamily: 'monospace', marginBottom: 12,
  },
  previewCard: {
    borderWidth: 2, overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row', gap: 6, padding: 10,
  },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  previewBody: { padding: 16, gap: 8 },
  previewBar: { height: 8, borderRadius: 4, marginBottom: 6 },
  previewRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  previewBox: {
    flex: 1, height: 40, borderWidth: 1, borderRadius: 2,
  },
  previewLabel: {
    fontFamily: 'monospace', fontSize: 10,
    letterSpacing: 2, textAlign: 'center', padding: 8,
  },
  optionsSection: { paddingHorizontal: 20, gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 16, marginBottom: 10,
  },
  optionIcon: { fontSize: 32 },
  optionInfo: { flex: 1 },
  optionLabel: {
    fontFamily: 'monospace', fontWeight: '900',
    fontSize: 14, letterSpacing: 1,
  },
  optionDesc: { fontFamily: 'monospace', fontSize: 11, marginTop: 4 },
  selectedBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
  },
  selectedText: {
    color: '#fff', fontFamily: 'monospace',
    fontWeight: '900', fontSize: 11,
  },
  infoCard: {
    margin: 20, borderWidth: 1, borderLeftWidth: 4,
    padding: 16, flexDirection: 'row', gap: 12,
  },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontFamily: 'monospace', fontSize: 12, lineHeight: 20 },
  footer: {
    textAlign: 'center', fontSize: 11,
    margin: 32, fontFamily: 'monospace',
  },
});
