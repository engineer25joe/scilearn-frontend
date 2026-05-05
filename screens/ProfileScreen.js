import React, { useState, useEffect, Platform } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.tag}>// MY ACCOUNT</Text>
        <Text style={styles.title}>
          {user?.username?.toUpperCase()}
        </Text>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenText}>
            🪙 {user?.tokens || 0} TOKENS
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
            INFO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'password' && styles.activeTab]}
          onPress={() => setActiveTab('password')}
        >
          <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
            PASSWORD
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'danger' && styles.activeTab]}
          onPress={() => setActiveTab('danger')}
        >
          <Text style={[styles.tabText, activeTab === 'danger' && styles.activeTabText]}>
            DANGER
          </Text>
        </TouchableOpacity>
      </View>

      {/* INFO TAB */}
      {activeTab === 'info' && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>// UPDATE PROFILE</Text>

          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={COLORS.textDim}
            autoCapitalize="none"
          />

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={COLORS.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PHONE (M-PESA)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor={COLORS.textDim}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={styles.btn}
            onPress={updateProfile}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.bg} />
              : <Text style={styles.btnText}>SAVE CHANGES →</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* PASSWORD TAB */}
      {activeTab === 'password' && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>// CHANGE PASSWORD</Text>

          <Text style={styles.label}>CURRENT PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholderTextColor={COLORS.textDim}
            placeholder="••••••••"
          />

          <Text style={styles.label}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholderTextColor={COLORS.textDim}
            placeholder="min. 8 characters"
          />

          <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor={COLORS.textDim}
            placeholder="••••••••"
          />

          <TouchableOpacity
            style={styles.btn}
            onPress={changePassword}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.bg} />
              : <Text style={styles.btnText}>CHANGE PASSWORD →</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* DANGER TAB */}
      {activeTab === 'danger' && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>// DANGER ZONE</Text>
          <Text style={styles.dangerText}>
            Deleting your account will permanently remove all your data,
            tokens and progress. This cannot be undone!
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={deleteAccount}
          >
            <Text style={styles.deleteBtnText}>⚠️ DELETE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    padding: 28,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: {
    color: COLORS.primary,
    fontFamily: 'monospace',
    marginBottom: 16,
    fontSize: 13,
  },
  tag: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  title: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  tokenBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.amber,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tokenText: {
    color: COLORS.amber,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 2,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 2,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  form: {
    padding: 24,
  },
  formTitle: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  label: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    padding: 14,
    marginBottom: 20,
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: COLORS.bg,
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: COLORS.bg,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  dangerText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.red,
    padding: 16,
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#ff3355',
    padding: 16,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#ff3355',
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 11,
    margin: 32,
    fontFamily: 'monospace',
  },
});
