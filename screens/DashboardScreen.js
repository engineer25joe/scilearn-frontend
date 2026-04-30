import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('scibase_user').then(data => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('scibase_user');
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.tag}>// DASHBOARD</Text>
          <Text style={styles.welcome}>HELLO,{'\n'}<Text style={styles.username}>{user?.username?.toUpperCase() || 'ENGINEER'}</Text></Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      {/* Token Balance */}
      <View style={styles.tokenCard}>
        <Text style={styles.tokenLabel}>// TOKEN BALANCE</Text>
        <Text style={styles.tokenBalance}>{user?.tokens || 0}<Text style={styles.tokenUnit}> 🪙</Text></Text>
        <TouchableOpacity style={styles.topupBtn} onPress={() => navigation.navigate('Tokens')}>
          <Text style={styles.topupText}>TOP UP VIA M-PESA →</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>// QUICK ACCESS</Text>
      <View style={styles.grid}>
        {[
          { icon: '📚', label: 'COURSES', screen: 'Courses' },
          { icon: '🪙', label: 'TOKENS', screen: 'Tokens' },
          { icon: '👤', label: 'PROFILE', screen: 'Login' },
          { icon: '🏆', label: 'PROGRESS', screen: 'Courses' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles.gridItem} onPress={() => navigation.navigate(item.screen)}>
            <Text style={styles.gridIcon}>{item.icon}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent */}
      <Text style={styles.sectionTitle}>// CONTINUE LEARNING</Text>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No courses started yet.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
          <Text style={styles.emptyLink}>BROWSE COURSES →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 28, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tag: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 },
  welcome: { color: COLORS.textDim, fontSize: 16, fontFamily: 'monospace' },
  username: { color: COLORS.primary, fontSize: 28, fontWeight: '900' },
  logoutBtn: { borderWidth: 1, borderColor: COLORS.border, padding: 8, paddingHorizontal: 14 },
  logoutText: { color: COLORS.textDim, fontSize: 11, letterSpacing: 2, fontFamily: 'monospace' },
  tokenCard: { margin: 24, borderWidth: 1, borderColor: COLORS.primary, padding: 24, backgroundColor: COLORS.surface },
  tokenLabel: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 },
  tokenBalance: { color: COLORS.primary, fontSize: 52, fontWeight: '900', fontFamily: 'monospace' },
  tokenUnit: { fontSize: 28 },
  topupBtn: { marginTop: 16, borderWidth: 1, borderColor: COLORS.amber, padding: 12, alignItems: 'center' },
  topupText: { color: COLORS.amber, fontSize: 12, letterSpacing: 2, fontFamily: 'monospace' },
  sectionTitle: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', paddingHorizontal: 24, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 32 },
  gridItem: { width: '47%', borderWidth: 1, borderColor: COLORS.border, padding: 24, alignItems: 'center', backgroundColor: COLORS.surface },
  gridIcon: { fontSize: 28, marginBottom: 12 },
  gridLabel: { color: COLORS.text, fontSize: 12, letterSpacing: 2, fontFamily: 'monospace' },
  emptyCard: { marginHorizontal: 24, borderWidth: 1, borderColor: COLORS.border, padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textDim, fontFamily: 'monospace', fontSize: 13, marginBottom: 12 },
  emptyLink: { color: COLORS.primary, fontFamily: 'monospace', fontSize: 13, letterSpacing: 2 },
  footer: { textAlign: 'center', color: COLORS.textDim, fontSize: 11, margin: 32, fontFamily: 'monospace' },
});
