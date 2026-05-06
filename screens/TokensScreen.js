import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Alert, Animated, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

function TokenCard({ pkg, index, onBuy }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400,
        delay: index * 100, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 400,
        delay: index * 100, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isPopular = index === 1;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>🔥 MOST POPULAR</Text>
        </View>
      )}
      <View style={[styles.tokenCard, isPopular && styles.tokenCardPopular]}>
        <View style={styles.tokenCardLeft}>
          <Text style={styles.tokenAmount}>{pkg.amount}</Text>
          <Text style={styles.tokenUnit}>TOKENS</Text>
          <Text style={styles.tokenPrice}>KES {pkg.price_kes}</Text>
          <Text style={styles.tokenValue}>
            = {pkg.amount} mins of content
          </Text>
        </View>
        <View style={styles.tokenCardRight}>
          <TouchableOpacity
            style={[styles.buyBtn, { borderColor: COLORS.green }]}
            onPress={() => onBuy(pkg, 'mpesa')}
            onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()}
            onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
          >
            <Text style={styles.buyBtnText}>MOBILE</Text>
            <Text style={styles.buyBtnSub}>PAY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyBtn, { borderColor: COLORS.blue, marginTop: 8 }]}
            onPress={() => onBuy(pkg, 'paypal')}
          >
            <Text style={[styles.buyBtnText, { color: COLORS.blue }]}>PAYPAL</Text>
            <Text style={[styles.buyBtnSub, { color: COLORS.blue }]}>PAY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function TokensScreen() {
  const [packages, setPackages] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactions] = useState([
    { type: 'earn', desc: 'Signup bonus', amount: 7, date: 'Today' },
  ]);

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  useEffect(() => {
    getUserData().then(d => {
      if (d) setBalance(JSON.parse(d).tokens || 0);
    });
    fetch(endpoints.tokens)
      .then(r => r.json())
      .then(data => { setPackages(data.packages || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const buyTokens = (pkg, method) => {
    Alert.alert(
      '💳 CONFIRM PURCHASE',
      `Buy ${pkg.amount} tokens for KES ${pkg.price_kes} via ${method === 'mpesa' ? 'Mobile Pay' : 'PayPal'}?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'CONFIRM',
          onPress: () => Alert.alert(
            '🚀 Coming Soon!',
            `${method === 'mpesa' ? 'Mobile Pay' : 'PayPal'} integration coming soon!`
          )
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tag}>// TOKEN STORE</Text>
        <Text style={styles.title}>BUY TOKENS</Text>
        <Text style={styles.subtitle}>Power your learning journey 🚀</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceLeft}>
          <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
          <Text style={styles.balanceNum}>
            {balance} <Text style={styles.balanceIcon}>🪙</Text>
          </Text>
          <Text style={styles.balanceHint}>
            Enough for {balance} minutes of content
          </Text>
        </View>
        <View style={styles.balanceRight}>
          <Text style={styles.balanceKes}>= KES {balance}</Text>
        </View>
      </View>

      {/* Packages */}
      <Text style={styles.sectionTitle}>// SELECT PACKAGE</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.green} style={{ marginTop: 40 }} />
      ) : packages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🪙</Text>
          <Text style={styles.emptyText}>No packages available yet</Text>
          <Text style={styles.emptyHint}>Check back soon!</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          {packages.map((pkg, i) => (
            <TokenCard key={pkg.id} pkg={pkg} index={i} onBuy={buyTokens} />
          ))}
        </View>
      )}

      {/* Transaction History */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        // TRANSACTION HISTORY
      </Text>
      <View style={styles.transactionList}>
        {transactions.map((t, i) => (
          <View key={i} style={styles.transaction}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionIcon}>
                {t.type === 'earn' ? '✅' : '📤'}
              </Text>
              <View>
                <Text style={styles.transactionDesc}>{t.desc}</Text>
                <Text style={styles.transactionDate}>{t.date}</Text>
              </View>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: t.type === 'earn' ? COLORS.green : COLORS.red }
            ]}>
              {t.type === 'earn' ? '+' : '-'}{t.amount} 🪙
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  header: {
    padding: 24, paddingTop: 32,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tag: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6,
  },
  title: {
    color: COLORS.green, fontSize: 28,
    fontWeight: '900', fontFamily: 'monospace',
  },
  subtitle: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, marginTop: 4,
  },
  balanceCard: {
    margin: 16, borderWidth: 1,
    borderColor: COLORS.green, borderLeftWidth: 4,
    borderLeftColor: COLORS.green,
    backgroundColor: COLORS.surfaceGreen,
    padding: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  balanceLeft: { flex: 1 },
  balanceLabel: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8,
  },
  balanceNum: {
    color: COLORS.green, fontSize: 44,
    fontWeight: '900', fontFamily: 'monospace',
  },
  balanceIcon: { fontSize: 28 },
  balanceHint: {
    color: COLORS.textDim, fontSize: 10,
    fontFamily: 'monospace', marginTop: 4,
  },
  balanceRight: { alignItems: 'flex-end' },
  balanceKes: {
    color: COLORS.amber, fontFamily: 'monospace',
    fontSize: 14, fontWeight: '700',
  },
  sectionTitle: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace',
    paddingHorizontal: 16, marginBottom: 12,
  },
  popularBadge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: 'flex-start', marginLeft: 16,
  },
  popularText: {
    color: COLORS.white, fontSize: 10,
    fontFamily: 'monospace', fontWeight: '700',
    letterSpacing: 1,
  },
  tokenCard: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 20, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenCardPopular: {
    borderColor: COLORS.red, borderWidth: 2,
  },
  tokenCardLeft: { flex: 1 },
  tokenAmount: {
    color: COLORS.green, fontSize: 36,
    fontWeight: '900', fontFamily: 'monospace',
  },
  tokenUnit: {
    color: COLORS.textDim, fontSize: 11,
    letterSpacing: 2, fontFamily: 'monospace',
  },
  tokenPrice: {
    color: COLORS.amber, fontSize: 18,
    fontFamily: 'monospace', fontWeight: '700',
    marginTop: 8,
  },
  tokenValue: {
    color: COLORS.textDim, fontSize: 10,
    fontFamily: 'monospace', marginTop: 4,
  },
  tokenCardRight: { alignItems: 'center' },
  buyBtn: {
    borderWidth: 1, padding: 12,
    paddingHorizontal: 16, alignItems: 'center',
    minWidth: 80,
  },
  buyBtnText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
  },
  buyBtnSub: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 10, letterSpacing: 1,
  },
  transactionList: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  transaction: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionIcon: { fontSize: 20 },
  transactionDesc: {
    color: COLORS.text, fontFamily: 'monospace', fontSize: 13,
  },
  transactionDate: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 11,
  },
  transactionAmount: {
    fontFamily: 'monospace', fontWeight: '700', fontSize: 14,
  },
  empty: {
    alignItems: 'center', padding: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    color: COLORS.white, fontSize: 16,
    fontFamily: 'monospace', marginBottom: 8,
  },
  emptyHint: {
    color: COLORS.textDim, fontSize: 13, fontFamily: 'monospace',
  },
  footer: {
    textAlign: 'center', color: COLORS.textDim,
    fontSize: 11, margin: 32, fontFamily: 'monospace',
  },
});