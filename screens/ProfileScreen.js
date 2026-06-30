import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
  Modal, TextInput, KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Avatar from '../components/Avatar';

const COLORS = {
  bg: '#0a0d0c',
  card: '#10141a',
  cardAlt: '#0d1117',
  border: '#1f2630',
  green: '#22c55e',
  muted: '#9ca3af',
  text: '#ffffff',
  red: '#ef4444',
  blue: '#3b82f6',
};

function MenuItem({ icon, iconBg, title, sub, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.itemIconText}>{icon}</Text>
      </View>
      <View style={styles.itemText}>
        <Text style={[styles.itemTitle, danger && { color: COLORS.red }]}>{title}</Text>
        <Text style={styles.itemSub}>{sub}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit Personal Info modal
  const [editVisible, setEditVisible] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Security modal
  const [securityVisible, setSecurityVisible] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

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

  const loadProfile = async () => {
    setLoading(true);
    const userData = await getUserData();
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFirstName(parsed.first_name || '');
      setLastName(parsed.last_name || '');
      setUsername(parsed.username || '');
      setEmail(parsed.email || '');
      setPhone(parsed.phone || '');

      try {
        const res = await fetch(
          'https://scilearnbackend.onrender.com/api/users/avatar/',
          { headers: { 'X-Username': parsed.username } }
        );
        const data = await res.json();
        if (res.ok && data.avatar_url) {
          parsed.avatar_url = data.avatar_url;
          setUser({ ...parsed });
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
        { text: 'CANCEL', style: 'cancel' },
      ]
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
        u.avatar_url = data.avatar_url;
        await saveUserData(u);
        setUser({ ...u });
        Alert.alert('✅ Success', 'Avatar updated!');
      } else {
        Alert.alert('Error', data.error || 'Upload failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not upload: ' + e.message);
    }
    setUploadingAvatar(false);
  };

  const openEditModal = () => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setUsername(user?.username || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setEditVisible(true);
  };

  const saveEditProfile = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert('Error', 'Username and email are required');
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/update/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_username: user.username,
            new_username: username.trim(),
            email: email.trim(),
            phone_number: phone.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        const updated = {
          ...user,
          username: username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        };
        await saveUserData(updated);
        setUser(updated);
        setEditVisible(false);
        Alert.alert('✅ Success', 'Profile updated!');
      } else {
        Alert.alert('Error', data.error || 'Update failed');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setEditSaving(false);
  };

  const openSecurityModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityVisible(true);
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
    setSecuritySaving(true);
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
        setSecurityVisible(false);
      } else {
        Alert.alert('Error', data.error || 'Failed');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setSecuritySaving(false);
  };

  const deleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This cannot be undone! All your data, tokens, progress and certificates will be lost.',
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
                setSecurityVisible(false);
                navigation.replace('Auth');
              }
            } catch {
              Alert.alert('Error', 'Cannot connect to server');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'LOGOUT',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS === 'web') {
              localStorage.removeItem('scibase_user');
            } else {
              await AsyncStorage.removeItem('scibase_user');
            }
            navigation.replace('Auth');
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

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Engineer';

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Top row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your account and preferences</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Theme')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={[styles.card, styles.profileCard]}>
          <View style={styles.profileLeft}>
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
              <View style={styles.avatarWrapper}>
                {uploadingAvatar ? (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator color={COLORS.green} />
                  </View>
                ) : (
                  <Avatar
                    uri={user?.avatar_url}
                    username={user?.username}
                    size={96}
                    fontSize={36}
                  />
                )}
                <View style={styles.camBadge}>
                  <Text style={styles.camBadgeIcon}>📷</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.nameBlock}>
              <Text style={styles.nameText} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.roleText}>Learner</Text>
              <View style={styles.contactRow}>
                <Text style={styles.contactIcon}>✉️</Text>
                <Text style={styles.contactText} numberOfLines={1}>{user?.email}</Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>{user?.phone || 'No phone'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ACCOUNT */}
        <View style={[styles.card, styles.listCard]}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>

          <MenuItem
            icon="👤" iconBg="#0f2a18"
            title="Personal Information"
            sub="Update your name, email and phone number"
            onPress={openEditModal}
          />
          <MenuItem
            icon="🛡️" iconBg="#0e1c33"
            title="Security"
            sub="Change password and security settings"
            onPress={openSecurityModal}
          />
          <MenuItem
            icon="🔔" iconBg="#211233"
            title="Notifications"
            sub="Manage your notification preferences"
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuItem
            icon="💳" iconBg="#2b2410"
            title="Payment Methods"
            sub="Manage your payment methods"
            onPress={() => navigation.navigate('Tokens')}
          />
          <MenuItem
            icon="🪙" iconBg="#0f2a18"
            title="Token Balance"
            sub="View your token balance and transactions"
            onPress={() => navigation.navigate('Tokens')}
          />
          <MenuItem
            icon="🧾" iconBg="#211233"
            title="Purchase History"
            sub="View your token purchase history"
            onPress={() => navigation.navigate('Tokens')}
          />
          <MenuItem
            icon="⬇️" iconBg="#0e1c33"
            title="Downloads"
            sub="View your downloaded resources"
            onPress={() => navigation.navigate('Courses')}
          />
          <MenuItem
            icon="🎨" iconBg="#2b2410"
            title="Appearance"
            sub="Choose your app theme"
            onPress={() => navigation.navigate('Theme')}
          />
          <MenuItem
            icon="🌐" iconBg="#0e1c33"
            title="Language"
            sub="Choose your preferred language"
            onPress={() => Alert.alert('Coming Soon', 'Language selection is coming soon!')}
          />
        </View>

        {/* SUPPORT */}
        <View style={[styles.card, styles.listCard]}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>

          <MenuItem
            icon="❓" iconBg="#0e1c33"
            title="Help & Support"
            sub="Get help and contact support"
            onPress={() => navigation.navigate('QA')}
          />
          <MenuItem
            icon="📄" iconBg="#0f2a18"
            title="Terms & Conditions"
            sub="Read our terms and conditions"
            onPress={() => Alert.alert('Terms & Conditions', 'Coming soon!')}
          />
          <MenuItem
            icon="🛡️" iconBg="#211233"
            title="Privacy Policy"
            sub="Read our privacy policy"
            onPress={() => Alert.alert('Privacy Policy', 'Coming soon!')}
          />
          <MenuItem
            icon="↪️" iconBg="#341212"
            title="Log Out"
            sub="Sign out from your account"
            onPress={handleLogout}
            danger
          />
        </View>

        <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>

      </ScrollView>

      {/* EDIT PERSONAL INFO MODAL */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Personal Information</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>FIRST NAME</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
              />

              <Text style={styles.fieldLabel}>LAST NAME</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
              />

              <Text style={styles.fieldLabel}>USERNAME</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={COLORS.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.saveBtn, editSaving && { opacity: 0.7 }]}
                onPress={saveEditProfile}
                disabled={editSaving}
              >
                {editSaving ? (
                  <ActivityIndicator color="#06150c" />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SECURITY MODAL */}
      <Modal
        visible={securityVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSecurityVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Security</Text>
              <TouchableOpacity onPress={() => setSecurityVisible(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                secureTextEntry
              />

              <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="min. 8 characters"
                placeholderTextColor={COLORS.muted}
                secureTextEntry
              />

              <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: COLORS.blue }, securitySaving && { opacity: 0.7 }]}
                onPress={changePassword}
                disabled={securitySaving}
              >
                {securitySaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.saveBtnText, { color: '#fff' }]}>CHANGE PASSWORD</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dangerBox}>
                <Text style={styles.dangerIcon}>⚠️</Text>
                <Text style={styles.dangerText}>
                  Deleting your account permanently removes all your data, tokens, progress and certificates.
                </Text>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={deleteAccount}>
                <Text style={styles.deleteBtnText}>🗑️ DELETE MY ACCOUNT</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: COLORS.green, marginTop: 16, letterSpacing: 2, fontWeight: '700' },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 50, marginBottom: 18,
  },
  title: { fontSize: 30, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  settingsBtn: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: COLORS.green,
    backgroundColor: '#0c1410', alignItems: 'center', justifyContent: 'center',
  },
  settingsIcon: { fontSize: 18 },
  card: {
    marginHorizontal: 18, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 18, backgroundColor: COLORS.cardAlt, padding: 20, marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap',
  },
  profileLeft: { flexDirection: 'row', gap: 16, flex: 1, minWidth: 200 },
  avatarWrapper: { position: 'relative' },
  avatarLoading: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  camBadge: {
    position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
  },
  camBadgeIcon: { fontSize: 12 },
  nameBlock: { flex: 1 },
  nameText: { fontSize: 19, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  roleText: { color: COLORS.green, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  contactIcon: { fontSize: 12 },
  contactText: { color: '#cbd5e1', fontSize: 12.5, flexShrink: 1 },
  editBtn: {
    borderWidth: 1, borderColor: COLORS.green, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 6,
  },
  editBtnText: { color: COLORS.green, fontSize: 13, fontWeight: '700' },
  listCard: { paddingVertical: 6, paddingHorizontal: 18 },
  sectionLabel: {
    color: COLORS.green, fontSize: 11, fontWeight: '800',
    letterSpacing: 1, marginTop: 8, marginBottom: 6,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#182027',
  },
  itemIcon: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  itemIconText: { fontSize: 17 },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.text },
  itemSub: { fontSize: 11.5, color: COLORS.muted, marginTop: 2 },
  chevron: { color: '#6b7280', fontSize: 20 },
  footer: {
    textAlign: 'center', color: COLORS.muted, fontSize: 11,
    fontFamily: 'monospace', marginVertical: 24,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.cardAlt, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: COLORS.border, borderBottomWidth: 0,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, maxHeight: '88%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  modalCloseX: { color: COLORS.muted, fontSize: 20 },
  fieldLabel: {
    color: COLORS.muted, fontSize: 11, letterSpacing: 1.5,
    marginBottom: 8, marginTop: 4, fontWeight: '700',
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 14, color: COLORS.text, fontSize: 14, marginBottom: 14,
    backgroundColor: COLORS.bg,
  },
  saveBtn: {
    backgroundColor: COLORS.green, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 8,
  },
  saveBtnText: { color: '#06150c', fontWeight: '900', letterSpacing: 1, fontSize: 13 },
  dangerBox: {
    flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: COLORS.red,
    backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: 14, marginTop: 18, marginBottom: 14,
  },
  dangerIcon: { fontSize: 16 },
  dangerText: { flex: 1, color: '#cbd5e1', fontSize: 11.5, lineHeight: 17 },
  deleteBtn: {
    borderWidth: 1.5, borderColor: COLORS.red, borderRadius: 12,
    padding: 14, alignItems: 'center', marginBottom: 10,
  },
  deleteBtnText: { color: COLORS.red, fontWeight: '900', letterSpacing: 1, fontSize: 12.5 },
});