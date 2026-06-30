import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  bg: '#0b0e0c',
  panel: '#11151a',
  green: '#22c55e',
  greenDark: '#16331f',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  gold: '#eab308',
  text: '#ffffff',
  muted: '#9ca3af',
  border: '#1f2937',
};

const PAY_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', color: '#1bbf4c', initial: 'M' },
  { id: 'airtel', label: 'Airtel Money', color: '#e2231a', initial: 'A' },
  { id: 'card', label: 'VISA / MC', color: '#1a1f71', initial: 'V' },
  { id: 'bank', label: 'Bank Transfer', color: '#374151', initial: '🏦' },
];

function PackageCard({ pkg, onBuy, tierStyle }) {
  return (
    <View style={[styles.pkgCard, tierStyle.card]}>
      <View style={styles.pkgLeft}>
        <View style={[styles.pkgIcon, tierStyle.iconBg]}>
          {tierStyle.badge ? (
            <View style={[styles.pkgBadge, { backgroundColor: tierStyle.badgeColor }]}>
              <Text style={styles.pkgBadgeText}>{tierStyle.badge}</Text>
            </View>
          ) : null}
          <Text style={styles.pkgIconText}>🪙</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pkgName}>{pkg.tokens} Tokens</Text>
          <Text style={styles.pkgSub}>{pkg.label}</Text>
          <View style={[styles.bonusTag, { backgroundColor: tierStyle.bonusBg, borderColor: tierStyle.bonusBorder }]}>
            <Text style={[styles.bonusTagText, { color: tierStyle.color }]}>+{pkg.bonus} Bonus</Text>
          </View>
        </View>
      </View>
      <View style={styles.pkgRight}>
        <Text style={[styles.pkgPrice, { color: tierStyle.color }]}>
          KES {pkg.price_kes.toFixed(2)}
        </Text>
        <Text style={styles.pkgUsd}>≈ ${pkg.price_usd.toFixed(2)}</Text>
        <TouchableOpacity
          style={[styles.buyBtn, { backgroundColor: tierStyle.color }]}
          onPress={() => onBuy(pkg)}
        >
          <Text style={styles.buyBtnText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const TIER_STYLES = {
  featured: {
    card: { borderColor: '#2a5c39', backgroundColor: '#0c1610' },
    iconBg: { backgroundColor: '#1c7a3c' },
    badge: '⭐', badgeColor: COLORS.gold,
    bonusBg: '#143620', bonusBorder: '#1f5c33',
    color: COLORS.green,
  },
  purple: {
    card: { borderColor: COLORS.border, backgroundColor: '#0e1217' },
    iconBg: { backgroundColor: '#5b2fa3' },
    badge: null, badgeColor: '',
    bonusBg: '#2c1750', bonusBorder: '#5b2fa3',
    color: COLORS.purple,
  },
  blue: {
    card: { borderColor: COLORS.border, backgroundColor: '#0e1217' },
    iconBg: { backgroundColor: '#1d4ed8' },
    badge: null, badgeColor: '',
    bonusBg: '#0c1f4a', bonusBorder: '#1d4ed8',
    color: COLORS.blue,
  },
  crown: {
    card: { borderColor: '#7a5a10', backgroundColor: '#16130a' },
    iconBg: { backgroundColor: '#a16207' },
    badge: '👑', badgeColor: '#fbbf24',
    bonusBg: '#3f2e06', bonusBorder: '#a16207',
    color: COLORS.gold,
  },
};

export default function TokensScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('mpesa');

  useEffect(() => {
    loadAll();
  }, []);

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const userData = await getUserData();
      let username = null;
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        username = parsed.username;
      }

      if (username) {
        const statsRes = await fetch(
          'https://scilearnbackend.onrender.com/api/tokens/stats/',
          { headers: { 'X-Username': username } }
        );
        const statsData = await statsRes.json();
        if (statsRes.ok) setStats(statsData);
      }

      const pkgRes = await fetch(
        'https://scilearnbackend.onrender.com/api/tokens/packages/'
      );
      const pkgData = await pkgRes.json();
      if (pkgRes.ok) setPackages(pkgData.packages || []);
    } catch {}
    setLoading(false);
  };

  const handleBuy = async (pkg) => {
    Alert.alert(
      `Buy ${pkg.tokens} Tokens`,
      `KES ${pkg.price_kes.toFixed(2)} via ${PAY_METHODS.find(m => m.id === selectedMethod)?.label}`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'CONFIRM',
          onPress: async () => {
            try {
              const userData = await getUserData();
              const u = userData ? JSON.parse(userData) : null;
              const res = await fetch(
                'https://scilearnbackend.onrender.com/api/tokens/purchase/',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Username': u?.username || '',
                  },
                  body: JSON.stringify({
                    package_id: pkg.id,
                    payment_method: selectedMethod,
                  }),
                }
              );
              const data = await res.json();
              Alert.alert(
                res.status === 202 ? '⏳ Coming Soon' : (res.ok ? '✅ Success' : 'Error'),
                data.message || data.error || 'Something happened'
              );
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
        <Text style={styles.loadingText}>LOADING WALLET...</Text>
      </View>
    );
  }

  const balance = stats?.balance ?? (user?.tokens || 0);
  const kesEq = stats?.kes_equivalent ?? balance * 10;

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Token Wallet</Text>
            <Text style={styles.subtitle}>Manage your tokens and learning power</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.historyBtn}>
          <Text style={styles.historyBtnText}>🕐 History</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceAmount}>
              {balance}
              <Text style={styles.balanceUnit}> Tokens</Text>
            </Text>
            <View style={styles.balancePill}>
              <Text style={styles.balancePillText}>
                🪙 ≈ KES {kesEq.toFixed(2)} ⓘ
              </Text>
            </View>
          </View>
          <View style={styles.balanceGraphic}>
            <Text style={styles.balanceGraphicIcon}>🛡️</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: '#13335c' }]}>
              <Text style={styles.statIconText}>💳</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>{stats?.total_spent ?? 0} Tokens</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: '#3b235c' }]}>
              <Text style={styles.statIconText}>📚</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Courses Enrolled</Text>
              <Text style={styles.statValue}>{stats?.courses_enrolled ?? 0} Courses</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: '#10381f' }]}>
              <Text style={styles.statIconText}>📊</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Lessons Completed</Text>
              <Text style={styles.statValue}>{stats?.lessons_completed ?? 0} Lessons</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Section heading */}
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Choose a Token Package</Text>
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>⭐ Best Value</Text>
        </View>
      </View>

      {/* Packages */}
      <View style={styles.packages}>
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            tierStyle={TIER_STYLES[pkg.tier] || TIER_STYLES.purple}
            onBuy={handleBuy}
          />
        ))}
      </View>

      {/* Pay with */}
      <View style={styles.payCard}>
        <Text style={styles.payCardTitle}>Pay with</Text>
        <View style={styles.payMethods}>
          {PAY_METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.payMethod,
                selectedMethod === m.id && styles.payMethodSelected,
              ]}
              onPress={() => setSelectedMethod(m.id)}
            >
              <View style={[styles.payMethodPic, { backgroundColor: m.color }]}>
                <Text style={styles.payMethodPicText}>{m.initial}</Text>
              </View>
              <Text style={styles.payMethodLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Why tokens */}
      <View style={styles.whyCard}>
        <Text style={styles.whyTitle}>Why tokens?</Text>
        <Text style={styles.whyDesc}>
          Tokens give you access to premium courses, lessons and AI learning tools on SCI LEARN.
        </Text>
        <View style={styles.whyList}>
          <View style={styles.whyItem}>
            <View style={[styles.whyIcon, { borderColor: COLORS.green }]}>
              <Text style={styles.whyIconText}>🔒</Text>
            </View>
            <Text style={styles.whyItemTitle}>Secure</Text>
            <Text style={styles.whyItemDesc}>100% safe payments</Text>
          </View>
          <View style={styles.whyItem}>
            <View style={[styles.whyIcon, { borderColor: COLORS.blue }]}>
              <Text style={styles.whyIconText}>⚡</Text>
            </View>
            <Text style={styles.whyItemTitle}>Instant</Text>
            <Text style={styles.whyItemDesc}>Get tokens instantly</Text>
          </View>
          <View style={styles.whyItem}>
            <View style={[styles.whyIcon, { borderColor: COLORS.purple }]}>
              <Text style={styles.whyIconText}>🎓</Text>
            </View>
            <Text style={styles.whyItemTitle}>Learn More</Text>
            <Text style={styles.whyItemDesc}>Unlock premium content</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>🛡 All payments are secure and encrypted</Text>
        <Text style={styles.footerText}>Need help? <Text style={{ color: COLORS.green }}>Contact Support</Text></Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: COLORS.green, marginTop: 16, letterSpacing: 2, fontWeight: '700' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 18,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  backBtn: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: '#0f1318', alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 22 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#0f1318',
  },
  historyBtnText: { fontSize: 12, color: '#e5e7eb' },
  balanceCard: {
    marginHorizontal: 18, marginBottom: 22, borderWidth: 1, borderColor: '#1f3d27',
    borderRadius: 22, backgroundColor: '#0d1f14', paddingHorizontal: 20, paddingTop: 22,
    overflow: 'hidden',
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { color: COLORS.muted, fontSize: 13, marginBottom: 6 },
  balanceAmount: { fontSize: 44, fontWeight: '900', color: '#fff' },
  balanceUnit: { fontSize: 18, color: COLORS.green, fontWeight: '700' },
  balancePill: {
    alignSelf: 'flex-start', backgroundColor: '#143620', borderWidth: 1, borderColor: '#1f5c33',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 14,
  },
  balancePillText: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  balanceGraphic: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#0f2f1a',
    borderWidth: 1, borderColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
  },
  balanceGraphicIcon: { fontSize: 36 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1,
    borderTopColor: '#15291b', marginTop: 18, paddingVertical: 16, gap: 8,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  statIconBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statIconText: { fontSize: 13 },
  statLabel: { fontSize: 9, color: COLORS.muted },
  statValue: { fontSize: 11.5, fontWeight: '700', color: '#fff', marginTop: 1 },
  sectionHeading: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#fff', paddingLeft: 10,
    borderLeftWidth: 3, borderLeftColor: COLORS.green,
  },
  bestValueBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#143620',
    borderWidth: 1, borderColor: '#1f5c33', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 5,
  },
  bestValueText: { color: COLORS.green, fontSize: 11, fontWeight: '700' },
  packages: { paddingHorizontal: 18, gap: 14, marginBottom: 8 },
  pkgCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 18, padding: 16, borderWidth: 1,
  },
  pkgLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  pkgIcon: {
    width: 62, height: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  pkgIconText: { fontSize: 28 },
  pkgBadge: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  pkgBadgeText: { fontSize: 11 },
  pkgName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  pkgSub: { fontSize: 11, color: COLORS.muted, marginVertical: 4 },
  bonusTag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  bonusTagText: { fontSize: 10.5, fontWeight: '700' },
  pkgRight: { alignItems: 'flex-end' },
  pkgPrice: { fontSize: 15.5, fontWeight: '800' },
  pkgUsd: { fontSize: 10.5, color: COLORS.muted, marginVertical: 4 },
  buyBtn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9, marginTop: 4 },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  payCard: {
    marginHorizontal: 18, marginTop: 22, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 18, padding: 18, backgroundColor: '#0e1217',
  },
  payCardTitle: { fontSize: 14, fontWeight: '700', color: '#e5e7eb', marginBottom: 14 },
  payMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  payMethod: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 11,
  },
  payMethodSelected: { borderColor: COLORS.green, backgroundColor: '#0d1a10' },
  payMethodPic: {
    width: 24, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center',
  },
  payMethodPicText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  payMethodLabel: { fontSize: 12, color: '#fff', fontWeight: '600' },
  whyCard: {
    marginHorizontal: 18, marginTop: 18, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 18, padding: 18, backgroundColor: '#0e1217', marginBottom: 16,
  },
  whyTitle: { color: COLORS.green, fontSize: 14.5, fontWeight: '700', marginBottom: 10 },
  whyDesc: { fontSize: 13, color: '#cbd5e1', lineHeight: 19, marginBottom: 18 },
  whyList: { flexDirection: 'row', justifyContent: 'space-between' },
  whyItem: { alignItems: 'center', width: '30%', gap: 8 },
  whyIcon: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  whyIconText: { fontSize: 16 },
  whyItemTitle: { fontSize: 12.5, fontWeight: '700', color: '#fff', textAlign: 'center' },
  whyItemDesc: { fontSize: 10, color: COLORS.muted, textAlign: 'center' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap',
    marginTop: 8, marginBottom: 30, paddingHorizontal: 20, gap: 6,
  },
  footerText: { fontSize: 11, color: COLORS.muted },
});