import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator,
  Animated, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import Avatar from '../components/Avatar';

function AnimatedCard({ children, style, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400, delay, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 400, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function GridButton({ icon, label, onPress, color }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }], width: '47%' }}>
      <TouchableOpacity
        style={[styles.gridItem, { borderTopColor: color || COLORS.green }]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, {
          toValue: 0.95, useNativeDriver: true, speed: 50
        }).start()}
        onPressOut={() => Animated.spring(scale, {
          toValue: 1, useNativeDriver: true, speed: 50
        }).start()}
        activeOpacity={1}
      >
        <Text style={styles.gridIcon}>{icon}</Text>
        <Text style={styles.gridLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [trendingCourses, setTrendingCourses] = useState([]);

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

  const fetchFreshBalance = async (username) => {
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/tokens/balance/',
        { headers: { 'X-Username': username } }
      );
      const data = await res.json();
      if (res.ok) return data.tokens;
    } catch {}
    return null;
  };

  const fetchUnreadCount = async (username) => {
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/notifications/',
        { headers: { 'X-Username': username } }
      );
      const data = await res.json();
      if (res.ok) return data.unread_count || 0;
    } catch {}
    return 0;
  };

  const fetchTrendingCourses = async () => {
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/courses/'
      );
      const data = await res.json();
      if (res.ok) setTrendingCourses((data.courses || []).slice(0, 4));
    } catch {}
  };

  const loadUser = async () => {
    setLoading(true);
    const userData = await getUserData();
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);

      // Fetch fresh data in parallel
      const [freshBalance, unread] = await Promise.all([
        fetchFreshBalance(parsed.username),
        fetchUnreadCount(parsed.username),
      ]);

      if (freshBalance !== null) {
        parsed.tokens = freshBalance;
        setUser({ ...parsed });
        await saveUserData(parsed);
      }

      setUnreadCount(unread);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
    fetchTrendingCourses();
  }, []);

  const logout = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('scibase_user');
    } else {
      await AsyncStorage.removeItem('scibase_user');
    }
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.green} size="large" />
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Top Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Header */}
      <AnimatedCard>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.tag}>// DASHBOARD</Text>
            <View style={styles.welcomeRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Avatar
                  uri={user?.avatar_url}
                  username={user?.username}
                  size={48}
                  fontSize={20}
                />
              </TouchableOpacity>
              <View>
                <Text style={styles.welcome}>HABARI,</Text>
                <Text style={styles.username}>
                  {user?.username?.toUpperCase() || 'ENGINEER'} 👋
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Notifications Bell */}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>↪ OUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedCard>

      {/* Search Bar */}
      <AnimatedCard delay={100}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor={COLORS.textDim}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => navigation.navigate('Courses')}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </AnimatedCard>

      {/* Token Balance Card */}
      <AnimatedCard delay={200}>
        <View style={styles.tokenCard}>
          <View style={styles.tokenLeft}>
            <Text style={styles.tokenLabel}>// TOKEN BALANCE</Text>
            <Text style={styles.tokenBalance}>
              {user?.tokens || 0}
              <Text style={styles.tokenUnit}> 🪙</Text>
            </Text>
            <Text style={styles.tokenHint}>1 token = 1 KES = 1 minute</Text>
          </View>
          <TouchableOpacity
            style={styles.topupBtn}
            onPress={() => navigation.navigate('Tokens')}
          >
            <Text style={styles.topupText}>TOP UP</Text>
            <Text style={styles.topupIcon}>💳</Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>

      {/* Quick Actions */}
      <AnimatedCard delay={300}>
        <Text style={styles.sectionTitle}>// QUICK ACCESS</Text>
        <View style={styles.grid}>
          <GridButton
            icon="📚" label="COURSES"
            onPress={() => navigation.navigate('Courses')}
            color={COLORS.green}
          />
          <GridButton
            icon="🪙" label="TOKENS"
            onPress={() => navigation.navigate('Tokens')}
            color={COLORS.amber}
          />
          <GridButton
            icon="👤" label="PROFILE"
            onPress={() => navigation.navigate('Profile')}
            color={COLORS.blue}
          />
          <GridButton
            icon="🤖" label="Q&A AI"
            onPress={() => navigation.navigate('QA')}
            color={COLORS.blue}
          />
          <GridButton
            icon="🔥" label="STREAK"
            onPress={() => navigation.navigate('Streak')}
            color={COLORS.red}
          />
          <GridButton
            icon="🎁" label="REFERRAL"
            onPress={() => navigation.navigate('Streak')}
            color={COLORS.amber}
          />
        </View>
      </AnimatedCard>

      {/* Trending Courses */}
      <AnimatedCard delay={400}>
        <View style={styles.trendingHeader}>
          <Text style={styles.sectionTitle}>// TRENDING COURSES 🔥</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
            <Text style={styles.seeAll}>SEE ALL →</Text>
          </TouchableOpacity>
        </View>

        {trendingCourses.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trendingScroll}
          >
            {trendingCourses.map((course, i) => {
              const colors = [COLORS.green, COLORS.blue, COLORS.red, COLORS.amber];
              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.trendingCard, { borderTopColor: colors[i % colors.length] }]}
                  onPress={() => navigation.navigate('Courses')}
                >
                  <Text style={styles.trendingEmoji}>📘</Text>
                  <Text style={styles.trendingTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={styles.trendingDesc} numberOfLines={1}>
                    {course.description}
                  </Text>
                  <Text style={[styles.trendingAction, { color: colors[i % colors.length] }]}>
                    START →
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trendingScroll}
          >
            {[
              { title: 'Python Basics', emoji: '🐍', color: COLORS.green },
              { title: 'Django Backend', emoji: '⚡', color: COLORS.blue },
              { title: 'React Native', emoji: '📱', color: COLORS.red },
              { title: 'Data Science', emoji: '📊', color: COLORS.amber },
            ].map((course, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.trendingCard, { borderTopColor: course.color }]}
                onPress={() => navigation.navigate('Courses')}
              >
                <Text style={styles.trendingEmoji}>{course.emoji}</Text>
                <Text style={styles.trendingTitle}>{course.title}</Text>
                <Text style={[styles.trendingAction, { color: course.color }]}>
                  START →
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </AnimatedCard>

      {/* Continue Learning */}
      <AnimatedCard delay={500}>
        <Text style={styles.sectionTitle}>// CONTINUE LEARNING</Text>
        <TouchableOpacity
          style={styles.continueCard}
          onPress={() => navigation.navigate('Courses')}
        >
          <Text style={styles.continueIcon}>▶️</Text>
          <View style={styles.continueText}>
            <Text style={styles.continueTitleText}>START LEARNING TODAY!</Text>
            <Text style={styles.continueSub}>Browse our course library →</Text>
          </View>
        </TouchableOpacity>
      </AnimatedCard>

      {/* Verified Badge */}
      {!user?.is_verified && (
        <AnimatedCard delay={600}>
          <View style={styles.unverifiedBanner}>
            <Text style={styles.unverifiedIcon}>⚠️</Text>
            <View style={styles.unverifiedText}>
              <Text style={styles.unverifiedTitle}>ACCOUNT NOT VERIFIED</Text>
              <Text style={styles.unverifiedSub}>
                Check your email for OTP verification
              </Text>
            </View>
          </View>
        </AnimatedCard>
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
    marginTop: 16, letterSpacing: 3,
  },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 24, paddingTop: 32,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft: { flex: 1 },
  headerRight: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  tag: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8,
  },
  welcomeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  welcome: {
    color: COLORS.textDim, fontSize: 12,
    fontFamily: 'monospace',
  },
  username: {
    color: COLORS.green, fontSize: 22,
    fontWeight: '900', fontFamily: 'monospace',
  },
  bellBtn: {
    position: 'relative',
    borderWidth: 1, borderColor: COLORS.border,
    padding: 10, backgroundColor: COLORS.surface,
  },
  bellIcon: { fontSize: 20 },
  bellBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: COLORS.red,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: COLORS.white, fontSize: 9,
    fontFamily: 'monospace', fontWeight: '900',
  },
  logoutBtn: {
    borderWidth: 1, borderColor: COLORS.red,
    padding: 10, paddingHorizontal: 14,
  },
  logoutText: {
    color: COLORS.red, fontSize: 11,
    letterSpacing: 2, fontFamily: 'monospace',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 16, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, paddingHorizontal: 16,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1, color: COLORS.text,
    fontFamily: 'monospace', fontSize: 13,
    paddingVertical: 12,
  },
  clearSearch: {
    color: COLORS.textDim, fontSize: 16, padding: 4,
  },
  tokenCard: {
    marginHorizontal: 20, marginVertical: 16,
    borderWidth: 1, borderColor: COLORS.green,
    backgroundColor: COLORS.surfaceGreen,
    padding: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: COLORS.green,
  },
  tokenLeft: { flex: 1 },
  tokenLabel: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8,
  },
  tokenBalance: {
    color: COLORS.green, fontSize: 44,
    fontWeight: '900', fontFamily: 'monospace',
  },
  tokenUnit: { fontSize: 24 },
  tokenHint: {
    color: COLORS.textDim, fontSize: 10,
    fontFamily: 'monospace', marginTop: 4,
  },
  topupBtn: {
    backgroundColor: COLORS.green,
    padding: 16, alignItems: 'center', minWidth: 80,
  },
  topupText: {
    color: COLORS.white, fontWeight: '900',
    fontFamily: 'monospace', fontSize: 11, letterSpacing: 1,
  },
  topupIcon: { fontSize: 20, marginTop: 4 },
  sectionTitle: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace',
    paddingHorizontal: 20, marginBottom: 12,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 8, marginBottom: 24,
  },
  gridItem: {
    borderWidth: 1, borderColor: COLORS.border,
    padding: 20, alignItems: 'center',
    backgroundColor: COLORS.surface, borderTopWidth: 3,
  },
  gridIcon: { fontSize: 28, marginBottom: 10 },
  gridLabel: {
    color: COLORS.text, fontSize: 11,
    letterSpacing: 2, fontFamily: 'monospace',
  },
  trendingHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingRight: 20, marginBottom: 4,
  },
  seeAll: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 11, letterSpacing: 1,
  },
  trendingScroll: { paddingLeft: 20, marginBottom: 24 },
  trendingCard: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16, marginRight: 12,
    width: 150, borderTopWidth: 3,
  },
  trendingEmoji: { fontSize: 28, marginBottom: 8 },
  trendingTitle: {
    color: COLORS.text, fontFamily: 'monospace',
    fontSize: 12, fontWeight: '700', marginBottom: 4,
  },
  trendingDesc: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 10, marginBottom: 8,
  },
  trendingAction: {
    fontFamily: 'monospace', fontSize: 11,
    fontWeight: '700', letterSpacing: 1,
  },
  continueCard: {
    marginHorizontal: 20, marginBottom: 24,
    borderWidth: 1, borderColor: COLORS.blue,
    backgroundColor: COLORS.surfaceBlue,
    padding: 20, flexDirection: 'row',
    alignItems: 'center', borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
  },
  continueIcon: { fontSize: 32, marginRight: 16 },
  continueText: { flex: 1 },
  continueTitleText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 13, marginBottom: 4,
  },
  continueSub: {
    color: COLORS.blue, fontFamily: 'monospace', fontSize: 12,
  },
  unverifiedBanner: {
    marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.amber,
    borderLeftWidth: 4, borderLeftColor: COLORS.amber,
    backgroundColor: 'rgba(255,215,0,0.05)',
    padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12,
  },
  unverifiedIcon: { fontSize: 24 },
  unverifiedText: { flex: 1 },
  unverifiedTitle: {
    color: COLORS.amber, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 12, letterSpacing: 1,
  },
  unverifiedSub: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 11, marginTop: 4,
  },
  footer: {
    textAlign: 'center', color: COLORS.textDim,
    fontSize: 11, margin: 32, fontFamily: 'monospace',
  },
});