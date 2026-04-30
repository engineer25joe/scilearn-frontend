import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

export default function TokensScreen() {
  const [packages, setPackages] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = AsyncStorage.getItem('scibase_user').then(d => {
      if (d) setBalance(JSON.parse(d).tokens || 0);
    });
    fetch(endpoints.tokens)
      .then(r => r.json())
      .then(data => { setPackages(data.packages || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const buyTokens = (pkg, method) => {
    Alert.alert(
      'CONFIRM PURCHASE',
      `Buy ${pkg.amount} tokens for KES ${pkg.price_kes} via ${method.toUpperCase()}?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'CONFIRM', onPress: () => Alert.alert('Coming Soon', `${method.toUpperCase()} integration coming soon! 🚀`) }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tag}>// TOKEN STORE</Text>
        <Text style={styles.title}>BUY TOKENS</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
        <Text style={styles.balanceNum}>{balance} <Text style={styles.balanceIcon}>🪙</Text></Text>
        <Text style={styles.balanceHint}>1 token = 1 KES = 1 minute of content</Text>
      </View>

      <Text style={styles.sectionTitle}>// SELECT PACKAGE</Text>

      {loading ? <ActivityIndicator color={COLORS.primary} /> : (
        packages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No packages yet.</Text>
            <Text style={styles.emptyHint}>Add token packages from Django admin.</Text>
          </View>
        ) : (
          packages.map(pkg => (
            <View key={pkg.id} style={styles.packageCard}>
              <View style={styles.packageInfo}>
                <Text style={styles.packageAmount}>{pkg.amount}</Text>
                <Text style={styles.packageUnit}>TOKENS</Text>
                <Text style={styles.packagePrice}>KES {pkg.price_kes}</Text>
              </View>
              <View style={styles.packageBtns}>
                <TouchableOpacity style={styles.mpesaBtn} onPress={() => buyTokens(pkg, 'mpesa')}>
                  <Text style={styles.mpesaText}>M-PESA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.paypalBtn} onPress={() => buyTokens(pkg, 'paypal')}>
                  <Text style={styles.paypalText}>PAYPAL</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )
      )}
      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 28, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tag: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 },
  title: { color: COLORS.primary, fontSize: 28, fontWeight: '900', fontFamily: 'monospace' },
  balanceCard: { margin: 24, borderWidth: 1, borderColor: COLORS.primary, padding: 24, backgroundColor: COLORS.surface },
  balanceLabel: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 },
  balanceNum: { color: COLORS.primary, fontSize: 48, fontWeight: '900', fontFamily: 'monospace' },
  balanceIcon: { fontSize: 32 },
  balanceHint: { color: COLORS.textDim, fontSize: 12, fontFamily: 'monospace', marginTop: 8 },
  sectionTitle: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', paddingHorizontal: 24, marginBottom: 16 },
  packageCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 24, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, padding: 20, backgroundColor: COLORS.surface },
  packageInfo: { flex: 1 },
  packageAmount: { color: COLORS.primary, fontSize: 28, fontWeight: '900', fontFamily: 'monospace' },
  packageUnit: { color: COLORS.textDim, fontSize: 11, letterSpacing: 2, fontFamily: 'monospace' },
  packagePrice: { color: COLORS.amber, fontSize: 16, fontFamily: 'monospace', marginTop: 4 },
  packageBtns: { gap: 8 },
  mpesaBtn: { borderWidth: 1, borderColor: COLORS.primary, padding: 10, paddingHorizontal: 16, alignItems: 'center' },
  mpesaText: { color: COLORS.primary, fontSize: 11, letterSpacing: 2, fontFamily: 'monospace' },
  paypalBtn: { borderWidth: 1, borderColor: COLORS.amber, padding: 10, paddingHorizontal: 16, alignItems: 'center' },
  paypalText: { color: COLORS.amber, fontSize: 11, letterSpacing: 2, fontFamily: 'monospace' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.primary, fontSize: 16, fontFamily: 'monospace', marginBottom: 8 },
  emptyHint: { color: COLORS.textDim, fontSize: 13, fontFamily: 'monospace', textAlign: 'center' },
  footer: { textAlign: 'center', color: COLORS.textDim, fontSize: 11, margin: 32, fontFamily: 'monospace' },
});
