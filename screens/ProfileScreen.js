import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Platform, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';

function AnimatedButton({ onPress, label, loading, style, textStyle, colors }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[{
          backgroundColor: colors.green,
          padding: 16, alignItems: 'center',
          marginTop: 8, borderRadius: 4,
          borderBottomWidth: 3,
          borderBottomColor: colors.greenLight,
        }, style]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, {
          toValue: 0.96, useNativeDriver: true, speed: 50
        }).start()}
        onPressOut={() => Animated.spring(scale, {
          toValue: 1, useNativeDriver: true, speed: 50
        }).start()}
        disabled={loading}
        activeOpacity={1}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={[{
            color: colors.white, fontWeight: '900',
            letterSpacing: 2, fontFamily: 'monospace', fontSize: 14,
          }, textStyle]}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
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
      setAvatarUrl(parsed.avatar_url || null);

      try {
        const res = await fetch(
          'https://scilearnbackend.onrender.com/api/users/avatar/',
          { headers: { 'X-Username': parsed.username } }
        );
        const data = await res.json();
        if (res.ok && data.avatar_url) {
          setAvatarUrl(data.avatar_url);
          parsed.avatar_url = data.avatar_url;
          await saveUserData(parsed);
        }
      } catch {}
    }
    setLoading(false);
  };

  const pickAvatar = async () => {
    Alert.alert(
      '📸 Change Avatar',
      'Choose an option',
      [
        {
          text: '📷 Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera permission is required');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) await uploadAvatar(result.assets[0].uri);
          }
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Gallery permission is required');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) await uploadAvatar(result.assets[0].uri);
          }
        },
        avatarUrl && {
          text: '🗑️ Remove Avatar',
          style: 'destructive',
          onPress: async () => {
            setAvatarUrl(null);
            const userData = await getUserData();
            if (userData) {
              const u = JSON.parse(userData);
              u.avatar_url = null;
              await saveUserData(u);
            }
          },
        },
        { text: 'CANCEL', style: 'cancel' },
      ].filter(Boolean)
    );
  };

  const uploadAvatar = async (uri) => {
    setUploadingAvatar(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const userData = await getUserData();
      const u = JSON.parse(userData);

      const formData = new FormData();
      formData.append('avatar', {
        uri: manipulated.uri,
        type: 'image/jpeg',
        name: `avatar_${u.username}.jpg`,
      });

      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/avatar/upload/',
        {
          method: 'POST',
          headers: { 'X-Username': u.username },
          body: formData,
        }
      );

      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatar_url);
        u.avatar_url = data.avatar_url;
        await saveUserData(u);
        Alert.alert('✅ Success', 'Avatar updated!');
      } else {
        Alert.alert('Error', data.error || 'Upload failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not upload: ' + e.message);
    }
    setUploadingAvatar(false);
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
        Alert.alert('✅ Success', 'Profile updated!');
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
      Alert.alert('Error', 'Fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
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
        Alert.alert('✅ Success', 'Password changed!');
      } else {
        Alert.alert('Error', data.error || 'Failed');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setSaving(false);
  };

  const deleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This cannot be undone! All your data will be lost.',
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={[styles.loadingText, { color: colors.green }]}>
          LOADING PROFILE...
        </Text>
      </View>
    );
  }

  const tabs = [
    { key: 'info', label: '👤 INFO', color: colors.green },
    { key: 'password', label: '🔒 PASSWORD', color: colors.blue },
    { key: 'danger', label: '⚠️ DANGER', color: colors.red },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      showsVerticalScrollIndicator={false}
    >

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: colors.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: colors.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: colors.green }]} />
      </View>

      {/* Header */}
      <Animated.View style={[{
        padding: 24, paddingTop: 32,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surfaceGreen,
        opacity: headerOpacity,
      }]}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: colors.green }]}>← BACK</Text>
        </TouchableOpacity>

        <Text style={[styles.tag, { color: colors.textDim }]}>
          // MY ACCOUNT
        </Text>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
            <View style={styles.avatarWrapper}>
              {uploadingAvatar ? (
                <View style={[styles.avatarLoading, {
                  backgroundColor: colors.surface,
                  borderColor: colors.green,
                }]}>
                  <ActivityIndicator color={colors.white} />
                </View>
              ) : (
                <Avatar
                  uri={avatarUrl}
                  username={user?.username}
                  size={80}
                  fontSize={32}
                />
              )}
              <View style={[styles.avatarEditBadge, {
                backgroundColor: colors.blue,
                borderColor: colors.bg,
              }]}>
                <Text style={styles.avatarEditIcon}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.avatarInfo}>
            <Text style={[styles.avatarName, { color: colors.white }]}>
              {user?.username?.toUpperCase()}
            </Text>
            <Text style={[styles.avatarEmail, { color: colors.textDim }]}>
              {user?.email}
            </Text>
            <TouchableOpacity
              onPress={pickAvatar}
              style={[styles.changeAvatarBtn, { borderColor: colors.blue }]}
            >
              <Text style={[styles.changeAvatarText, { color: colors.blue }]}>
                {uploadingAvatar ? 'UPLOADING...' : '📸 CHANGE PHOTO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, {
            borderColor: colors.green,
            backgroundColor: colors.bg,
          }]}>
            <Text style={[styles.statNum, { color: colors.green }]}>
              🪙 {user?.tokens || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>
              TOKENS
            </Text>
          </View>
          <View style={[styles.statItem, {
            borderColor: colors.amber,
            backgroundColor: colors.bg,
          }]}>
            <Text style={[styles.statNum, { color: colors.amber }]}>
              {user?.is_verified ? '✅' : '❌'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>
              VERIFIED
            </Text>
          </View>
          <View style={[styles.statItem, {
            borderColor: colors.blue,
            backgroundColor: colors.bg,
          }]}>
            <Text style={[styles.statNum, { color: colors.blue }]}>🏆 0</Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>
              COURSES
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Tabs */}
      <View style={[styles.tabs, {
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && {
                borderBottomColor: tab.color,
                borderBottomWidth: 3,
              }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              { color: colors.textDim },
              activeTab === tab.key && { color: tab.color }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* INFO TAB */}
      {activeTab === 'info' && (
        <View style={styles.form}>
          <Text style={[styles.formSectionTitle, { color: colors.textDim }]}>
            // UPDATE YOUR INFO
          </Text>

          <Text style={[styles.label, { color: colors.textDim }]}>USERNAME</Text>
          <TextInput
            style={[styles.input, {
              borderColor: focusedInput === 'username' ? colors.green : colors.border,
              color: colors.text,
              backgroundColor: colors.bg,
            }]}
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            onFocus={() => setFocusedInput('username')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={[styles.label, { color: colors.textDim }]}>
            EMAIL ADDRESS
          </Text>
          <TextInput
            style={[styles.input, {
              borderColor: focusedInput === 'email' ? colors.green : colors.border,
              color: colors.text,
              backgroundColor: colors.bg,
            }]}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={colors.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={[styles.label, { color: colors.textDim }]}>
            PHONE NUMBER
          </Text>
          <TextInput
            style={[styles.input, {
              borderColor: focusedInput === 'phone' ? colors.green : colors.border,
              color: colors.text,
              backgroundColor: colors.bg,
            }]}
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor={colors.textDim}
            keyboardType="phone-pad"
            onFocus={() => setFocusedInput('phone')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Theme Button */}
          <TouchableOpacity
            style={[styles.themeBtn, {
              borderColor: colors.blue,
              backgroundColor: colors.surfaceBlue,
            }]}
            onPress={() => navigation.navigate('Theme')}
          >
            <Text style={[styles.themeBtnText, { color: colors.blue }]}>
              🎨 CHANGE APP THEME
            </Text>
          </TouchableOpacity>

          <AnimatedButton
            label="💾 SAVE CHANGES"
            onPress={updateProfile}
            loading={saving}
            colors={colors}
          />
        </View>
      )}

      {/* PASSWORD TAB */}
      {activeTab === 'password' && (
        <View style={styles.form}>
          <Text style={[styles.formSectionTitle, { color: colors.textDim }]}>
            // CHANGE PASSWORD
          </Text>

          <Text style={[styles.label, { color: colors.textDim }]}>
            CURRENT PASSWORD
          </Text>
          <TextInput
            style={[styles.input, {
              borderColor: focusedInput === 'current' ? colors.blue : colors.border,
              color: colors.text,
              backgroundColor: colors.bg,
            }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textDim}
            onFocus={() => setFocusedInput('current')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={[styles.label, { color: colors.textDim }]}>
            NEW PASSWORD
          </Text>
          <TextInput
            style={[styles.input, {
              borderColor: focusedInput === 'new' ? colors.blue : colors.border,
              color: colors.text,
              backgroundColor: colors.bg,
            }]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="min. 8 characters"
            placeholderTextColor={colors.textDim}
            onFocus={() => setFocusedInput('new')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={[styles.label, { color: colors.textDim }]}>
            CONFIRM NEW PASSWORD
          </Text>
          <TextInput
            style={[styles.input, {
              borderColor: focusedInput === 'confirm' ? colors.blue : colors.border,
              color: colors.text,
              backgroundColor: colors.bg,
            }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textDim}
            onFocus={() => setFocusedInput('confirm')}
            onBlur={() => setFocusedInput(null)}
          />

          <AnimatedButton
            label="🔒 CHANGE PASSWORD"
            onPress={changePassword}
            loading={saving}
            colors={colors}
            style={{ backgroundColor: colors.blue }}
          />
        </View>
      )}

      {/* DANGER TAB */}
      {activeTab === 'danger' && (
        <View style={styles.form}>
          <Text style={[styles.formSectionTitle, { color: colors.textDim }]}>
            // DANGER ZONE
          </Text>

          <View style={[styles.dangerWarning, {
            borderColor: colors.red,
            backgroundColor: 'rgba(187,0,0,0.05)',
          }]}>
            <Text style={styles.dangerIcon}>⚠️</Text>
            <Text style={[styles.dangerText, { color: colors.textDim }]}>
              Deleting your account will permanently remove all your data,
              tokens, progress and certificates. This cannot be undone!
            </Text>
          </View>

          <AnimatedButton
            label="🗑️ DELETE MY ACCOUNT"
            onPress={deleteAccount}
            colors={colors}
            style={{
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: colors.red,
              borderBottomColor: colors.red,
            }}
            textStyle={{ color: colors.red }}
          />
        </View>
      )}

      <Text style={[styles.footer, { color: colors.textDim }]}>
        Developed by: 💞🙏 Engineer Joe 🇰🇪
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'monospace', marginTop: 16, letterSpacing: 3, fontSize: 11,
  },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  backBtn: {
    alignSelf: 'flex-start', borderWidth: 1,
    paddingVertical: 6, paddingHorizontal: 14, marginBottom: 16,
  },
  backText: { fontFamily: 'monospace', fontSize: 12, letterSpacing: 2 },
  tag: { fontSize: 10, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16 },
  avatarSection: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, marginBottom: 20,
  },
  avatarWrapper: { position: 'relative' },
  avatarLoading: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarEditBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarEditIcon: { fontSize: 12 },
  avatarInfo: { flex: 1 },
  avatarName: {
    fontSize: 18, fontWeight: '900', fontFamily: 'monospace',
  },
  avatarEmail: { fontFamily: 'monospace', fontSize: 11, marginTop: 4 },
  changeAvatarBtn: {
    marginTop: 8, alignSelf: 'flex-start',
    borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10,
  },
  changeAvatarText: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: {
    flex: 1, borderWidth: 1,
    padding: 10, alignItems: 'center',
  },
  statNum: { fontFamily: 'monospace', fontWeight: '900', fontSize: 14 },
  statLabel: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 1, marginTop: 4 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, padding: 16, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabText: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  form: { padding: 24 },
  formSectionTitle: {
    fontSize: 10, letterSpacing: 3,
    fontFamily: 'monospace', marginBottom: 24,
  },
  label: {
    fontSize: 11, letterSpacing: 3,
    marginBottom: 8, fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1, padding: 14,
    marginBottom: 20, fontFamily: 'monospace',
    fontSize: 14, borderRadius: 4,
  },
  themeBtn: {
    borderWidth: 1, padding: 14,
    alignItems: 'center', marginBottom: 12,
  },
  themeBtnText: {
    fontFamily: 'monospace', fontWeight: '700',
    letterSpacing: 2, fontSize: 13,
  },
  dangerWarning: {
    flexDirection: 'row', gap: 12,
    borderWidth: 1, padding: 16, marginBottom: 24,
  },
  dangerIcon: { fontSize: 20 },
  dangerText: { flex: 1, fontFamily: 'monospace', fontSize: 12, lineHeight: 20 },
  footer: {
    textAlign: 'center', fontSize: 11,
    margin: 32, fontFamily: 'monospace',
  },
});