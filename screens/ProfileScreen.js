import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Platform, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

function AnimatedButton({ onPress, label, loading, style, textStyle }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.btn, style]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
        disabled={loading}
        activeOpacity={1}
      >
        {loading
          ? <ActivityIndicator color={COLORS.white} />
          : <Text style={[styles.btnText, textStyle]}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  const saveUserData = async (data) => {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const userData = await getUserData();
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setUsername(parsed.username || '');
      setEmail(parsed.email || '');
      setPhone(parsed.phone || '');
    }
    setLoading(false);
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/update/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_username: user.username,
            new_username: username,
            email,
            phone_number: phone,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        const updated = { ...user, username, email, phone };
        await saveUserData(updated);
        setUser(updated);
        Alert.alert('✅ Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', data.error || 'Update failed');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/change-password/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('✅ Success', 'Password changed successfully!');
      } else {
        Alert.alert('Error', data.error || 'Password change failed');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setSaving(false);
  };

  const deleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'Are you sure? This cannot be undone!',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(
                'https://scilearnbackend.onrender.com/api/users/delete/',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username: user.username }),
                }
              );
              if (res.ok) {
                if (Platform.OS === 'web') {
                  localStorage.removeItem('scibase_user');
                } else {
                  await AsyncStorage.removeItem('scibase_user');
                }
                navigation.replace('Login');
              }
            } catch {
              Alert.alert('Error', 'Cannot connect to server');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.green} size="large" />
        <Text style={styles.loadingText}>LOADING PROFILE...</Text>
      </View>
    );
  }

  const tabs = [
    { key: 'info', label: '👤 INFO', color: COLORS.green },
    { key: 'password', label: '🔒 PASSWORD', color: COLORS.blue },
    { key: 'danger', label: '⚠️ DANGER', color: COLORS.red },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.tag}>// MY ACCOUNT</Text>

        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>
              {user?.username?.toUpperCase()}
            </Text>
            <Text style={styles.avatarEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { borderColor: COLORS.green }]}>
            <Text style={[styles.statNum, { color: COLORS.green }]}>
              🪙 {user?.tokens || 0}
            </Text>
            <Text style={styles.statLabel}>TOKENS</Text>
          </View>
          <View style={[styles.statItem, { borderColor: COLORS.blue }]}>
            <Text style={[styles.statNum, { color: COLORS.blue }]}>
              📚 0
            </Text>
            <Text style={styles.statLabel}>COURSES</Text>
          </View>
          <View style={[styles.statItem, { borderColor: COLORS.amber }]}>
            <Text style={[styles.statNum, { color: COLORS.amber }]}>
              🏆 0
            </Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
          </View>
        </View>
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: tab.color, borderBottomWidth: 3 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* INFO TAB */}
      {activeTab === 'info' && (
        <View style={styles.form}>
          <Text style={styles.formSectionTitle}>// UPDATE YOUR INFO</Text>

          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={COLORS.textDim}
            autoCapitalize="none"
            onFocus={() => setFocusedInput('username')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={COLORS.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.label}>PHONE NUMBER</Text>
          <TextInput
            style={[styles.input, focusedInput === 'phone' && styles.inputFocused]}
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor={COLORS.textDim}
            keyboardType="phone-pad"
            onFocus={() => setFocusedInput('phone')}
            onBlur={() => setFocusedInput(null)}
          />

          <AnimatedButton
            label="💾 SAVE CHANGES"
            onPress={updateProfile}
            loading={saving}
          />
        </View>
      )}

      {/* PASSWORD TAB */}
      {activeTab === 'password' && (
        <View style={styles.form}>
          <Text style={styles.formSectionTitle}>// CHANGE PASSWORD</Text>

          <Text style={styles.label}>CURRENT PASSWORD</Text>
          <TextInput
            style={[styles.input, focusedInput === 'current' && styles.inputFocusedBlue]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholderTextColor={COLORS.textDim}
            placeholder="••••••••"
            onFocus={() => setFocusedInput('current')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.label}>NEW PASSWORD</Text>
          <TextInput
            style={[styles.input, focusedInput === 'new' && styles.inputFocusedBlue]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholderTextColor={COLORS.textDim}
            placeholder="min. 8 characters"
            onFocus={() => setFocusedInput('new')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
          <TextInput
            style={[styles.input, focusedInput === 'confirm' && styles.inputFocusedBlue]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor={COLORS.textDim}
            placeholder="••••••••"
            onFocus={() => setFocusedInput('confirm')}
            onBlur={() => setFocusedInput(null)}
          />

          <AnimatedButton
            label="🔒 CHANGE PASSWORD"
            onPress={changePassword}
            loading={saving}
            style={{ backgroundColor: COLORS.blue }}
          />
        </View>
      )}

      {/* DANGER TAB */}
      {activeTab === 'danger' && (
        <View style={styles.form}>
          <Text style={styles.formSectionTitle}>// DANGER ZONE</Text>

          <View style={styles.dangerWarning}>
            <Text style={styles.dangerIcon}>⚠️</Text>
            <Text style={styles.dangerText}>
              Deleting your account will permanently remove all your data,
              tokens, progress and certificates. This action cannot be undone!
            </Text>
          </View>

          <AnimatedButton
            label="🗑️ DELETE MY ACCOUNT"
            onPress={deleteAccount}
            style={styles.deleteBtn}
            textStyle={styles.deleteBtnText}
          />
        </View>
      )}

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    color: COLORS.green, fontFamily: 'monospace',
    marginTop: 16, letterSpacing: 3, fontSize: 11,
  },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  header: {
    padding: 24, paddingTop: 32,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surfaceGreen,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 6, paddingHorizontal: 14,
    marginBottom: 16,
  },
  backText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 12, letterSpacing: 2,
  },
  tag: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, marginBottom: 20,
  },
  avatar: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.greenLight,
  },
  avatarText: {
    color: COLORS.white, fontSize: 28,
    fontWeight: '900', fontFamily: 'monospace',
  },
  avatarInfo: { flex: 1 },
  avatarName: {
    color: COLORS.white, fontSize: 18,
    fontWeight: '900', fontFamily: 'monospace',
  },
  avatarEmail: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row', gap: 8,
  },
  statItem: {
    flex: 1, borderWidth: 1,
    padding: 10, alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  statNum: {
    fontFamily: 'monospace', fontWeight: '900', fontSize: 14,
  },
  statLabel: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 9, letterSpacing: 1, marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tab: {
    flex: 1, padding: 16,
    alignItems: 'center', borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 11, letterSpacing: 1,
  },
  form: { padding: 24 },
  formSectionTitle: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 24,
  },
  label: {
    color: COLORS.textDim, fontSize: 11,
    letterSpacing: 3, marginBottom: 8, fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text, padding: 14,
    marginBottom: 20, fontFamily: 'monospace',
    fontSize: 14, backgroundColor: COLORS.bg,
    borderRadius: 4,
  },
  inputFocused: {
    borderColor: COLORS.green, borderWidth: 1.5,
  },
  inputFocusedBlue: {
    borderColor: COLORS.blue, borderWidth: 1.5,
  },
  btn: {
    backgroundColor: COLORS.green,
    padding: 16, alignItems: 'center',
    marginTop: 8, borderRadius: 4,
    borderBottomWidth: 3, borderBottomColor: COLORS.greenLight,
  },
  btnText: {
    color: COLORS.white, fontWeight: '900',
    letterSpacing: 2, fontFamily: 'monospace', fontSize: 14,
  },
  dangerWarning: {
    flexDirection: 'row', gap: 12,
    borderWidth: 1, borderColor: COLORS.red,
    padding: 16, marginBottom: 24,
    backgroundColor: 'rgba(187,0,0,0.05)',
  },
  dangerIcon: { fontSize: 20 },
  dangerText: {
    flex: 1, color: COLORS.textDim,
    fontFamily: 'monospace', fontSize: 12, lineHeight: 20,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2, borderColor: COLORS.red,
    padding: 16, alignItems: 'center',
    borderRadius: 4,
  },
  deleteBtnText: {
    color: COLORS.red, fontWeight: '900',
    letterSpacing: 2, fontFamily: 'monospace', fontSize: 14,
  },
  footer: {
    textAlign: 'center', color: COLORS.textDim,
    fontSize: 11, margin: 32, fontFamily: 'monospace',
  },
});