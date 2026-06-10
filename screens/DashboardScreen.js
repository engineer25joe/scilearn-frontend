import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator,
  Animated, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
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

function GridButton({ icon, label, onPress, color, colors }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }], width: '47%' }}>
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          padding: 20,
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderTopWidth: 3,
          borderTopColor: color || colors.green,
        }}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, {
          toValue: 0.95, useNativeDriver: true, speed: 50
        }).start()}
        onPressOut={() => Animated.spring(scale, {
          toValue: 1, useNativeDriver: true, speed: 50
        }).start()}
        activeOpacity={1}
      >
        <Text style={{ fontSize: 28, marginBottom: 10 }}>{icon}</Text>
        <Text style={{
          color: colors.text, fontSize: 11,
          letterSpacing: 2, fontFamily: 'monospace',
        }}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [trendingCourses, setTrendingCourses] = useState([]);
  const [lastWatched, setLastWatched] = useState(null);

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

  const fetchLastWatched = async (username) => {
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/courses/last-watched/',
        { headers: { 'X-Username': username } }
      );
      const data = await res.json();
      if (res.ok && data.has_last_watched) {
        setLastWatched(data);
      }
    } catch {}
  };

  const loadUser = async () => {
    setLoading(true);
    const userData = await getUserData();
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);

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
      fetchLastWatched(parsed.username);
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
    navigation.replace('Auth');
  };

  const resumeLesson = () => {
    if (!lastWatched) return;
    navigation.navigate('Lesson', {
      lessonId: lastWatched.lesson_id,
      title: lastWatched.lesson_title,
      videoId: lastWatched.video_id,
      tokenCost: lastWatched.token_cost,
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={[styles.loadingText, { color: colors.green }]}>
          LOADING...
        </Text>
      </View>
    );
  }

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
      <AnimatedCard>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.tag, { color: colors.textDim }]}>
              // DASHBOARD
            </Text>
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
                <Text style={[styles.welcome, { color: colors.textDim }]}>
                  HABARI,
                </Text>
                <Text style={[styles.username, { color: colors.green }]}>
                  {user?.username?.toUpperCase() || 'ENGINEER'} 👋
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.bellBtn, {
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={[styles.bellBadge, { backgroundColor: colors.red }]}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={logout}
              style={[styles.logoutBtn, { borderColor: colors.red }]}
            >
              <Text style={[styles.logoutText, { color: colors.red }]}>
                ↪ OUT
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedCard>

      {/* Search Bar */}
      <AnimatedCard delay={100}>
        <View style={[styles.searchContainer, {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search courses..."
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => navigation.navigate('Courses')}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={[styles.clearSearch, { color: colors.textDim }]}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </AnimatedCard>

      {/* Token Balance Card */}
      <AnimatedCard delay={200}>
        <View style={[styles.tokenCard, {
          borderColor: colors.green,
          borderLeftColor: colors.green,
          backgroundColor: colors.surfaceGreen,
        }]}>
          <View style={styles.tokenLeft}>
            <Text style={[styles.tokenLabel, { color: colors.textDim }]}>
              // TOKEN BALANCE
            </Text>
            <Text style={[styles.tokenBalance, { color: colors.green }]}>
              {user?.tokens || 0}
              <Text style={styles.tokenUnit}> 🪙</Text>
            </Text>
            <Text style={[styles.tokenHint, { color: colors.textDim }]}>
              1 token = 1 KES = 1 minute
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.topupBtn, { backgroundColor: colors.green }]}
            onPress={() => navigation.navigate('Tokens')}
          >
            <Text style={[styles.topupText, { color: colors.white }]}>
              TOP UP
            </Text>
            <Text style={styles.topupIcon}>💳</Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>

      {/* Resume Learning Card */}
      <AnimatedCard delay={250}>
        {lastWatched ? (
          <View style={styles.resumeSection}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
              // RESUME LEARNING
            </Text>
            <TouchableOpacity
              style={[styles.resumeCard, {
                borderColor: colors.green,
                borderLeftColor: colors.green,
                backgroundColor: colors.surfaceGreen,
              }]}
              onPress={resumeLesson}
            >
              <View style={styles.resumeLeft}>
                <Text style={styles.resumePlayIcon}>▶️</Text>
              </View>
              <View style={styles.resumeInfo}>
                <Text style={[styles.resumeCourse, { color: colors.textDim }]}
                  numberOfLines={1}>
                  📚 {lastWatched.course_title}
                </Text>
                <Text style={[styles.resumeLesson, { color: colors.white }]}
                  numberOfLines={1}>
                  {lastWatched.lesson_title}
                </Text>
                <Text style={[styles.resumeAction, { color: colors.green }]}>
                  Tap to continue →
                </Text>
              </View>
              <View style={[styles.resumeBtn, { backgroundColor: colors.green }]}>
                <Text style={[styles.resumeBtnText, { color: colors.white }]}>
                  RESUME
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resumeSection}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
              // START LEARNING
            </Text>
            <TouchableOpacity
              style={[styles.resumeCard, {
                borderColor: colors.blue,
                borderLeftColor: colors.blue,
                backgroundColor: colors.surfaceBlue,
              }]}
              onPress={() => navigation.navigate('Courses')}
            >
              <Text style={styles.resumePlayIcon}>📚</Text>
              <View style={styles.resumeInfo}>
                <Text style={[styles.resumeLesson, { color: colors.white }]}>
                  You haven't started yet!
                </Text>
                <Text style={[styles.resumeAction, { color: colors.blue }]}>
                  Browse courses and start learning →
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </AnimatedCard>

      {/* Quick Actions */}
      <AnimatedCard delay={300}>
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          // QUICK ACCESS
        </Text>
        <View style={styles.grid}>
          <GridButton icon="📚" label="COURSES"
            onPress={() => navigation.navigate('Courses')}
            color={colors.green} colors={colors} />
          <GridButton icon="🪙" label="TOKENS"
            onPress={() => navigation.navigate('Tokens')}
            color={colors.amber} colors={colors} />
          <GridButton icon="👤" label="PROFILE"
            onPress={() => navigation.navigate('Profile')}
            color={colors.blue} colors={colors} />
          <GridButton icon="🤖" label="Q&A AI"
            onPress={() => navigation.navigate('QA')}
            color={colors.blue} colors={colors} />
          <GridButton icon="🔥" label="STREAK"
            onPress={() => navigation.navigate('Streak')}
            color={colors.red} colors={colors} />
          <GridButton icon="🎁" label="REFERRAL"
            onPress={() => navigation.navigate('Streak')}
            color={colors.amber} colors={colors} />
          <GridButton icon="🔔" label="ALERTS"
            onPress={() => navigation.navigate('Notifications')}
            color={colors.green} colors={colors} />
          <GridButton icon="🎨" label="THEME"
            onPress={() => navigation.navigate('Theme')}
            color={colors.blue} colors={colors} />
        </View>
      </AnimatedCard>

      {/* Trending Courses */}
      <AnimatedCard delay={400}>
        <View style={styles.trendingHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
            // TRENDING COURSES 🔥
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
            <Text style={[styles.seeAll, { color: colors.green }]}>
              SEE ALL →
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.trendingScroll}
        >
          {trendingCourses.length > 0 ? (
            trendingCourses.map((course, i) => {
              const cardColors = [colors.green, colors.blue, colors.red, colors.amber];
              const cardColor = cardColors[i % cardColors.length];
              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.trendingCard, {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderTopColor: cardColor,
                  }]}
                  onPress={() => navigation.navigate('Courses')}
                >
                  <Text style={styles.trendingEmoji}>📘</Text>
                  <Text style={[styles.trendingTitle, { color: colors.text }]}
                    numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={[styles.trendingAction, { color: cardColor }]}>
                    START →
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            [
              { title: 'Python Basics', emoji: '🐍', color: colors.green },
              { title: 'Django Backend', emoji: '⚡', color: colors.blue },
              { title: 'React Native', emoji: '📱', color: colors.red },
              { title: 'Data Science', emoji: '📊', color: colors.amber },
            ].map((course, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.trendingCard, {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  borderTopColor: course.color,
                }]}
                onPress={() => navigation.navigate('Courses')}
              >
                <Text style={styles.trendingEmoji}>{course.emoji}</Text>
                <Text style={[styles.trendingTitle, { color: colors.text }]}>
                  {course.title}
                </Text>
                <Text style={[styles.trendingAction, { color: course.color }]}>
                  START →
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </AnimatedCard>

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
    fontFamily: 'monospace', marginTop: 16, letterSpacing: 3,
  },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 24, paddingTop: 32,
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1 },
  headerRight: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  tag: {
    fontSize: 10, letterSpacing: 3,
    fontFamily: 'monospace', marginBottom: 8,
  },
  welcomeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  welcome: { fontSize: 12, fontFamily: 'monospace' },
  username: {
    fontSize: 22, fontWeight: '900', fontFamily: 'monospace',
  },
  bellBtn: {
    position: 'relative', borderWidth: 1, padding: 10,
  },
  bellIcon: { fontSize: 20 },
  bellBadge: {
    position: 'absolute', top: -6, right: -6,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#fff', fontSize: 9,
    fontFamily: 'monospace', fontWeight: '900',
  },
  logoutBtn: {
    borderWidth: 1, padding: 10, paddingHorizontal: 14,
  },
  logoutText: {
    fontSize: 11, letterSpacing: 2, fontFamily: 'monospace',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 16, marginBottom: 8,
    borderWidth: 1, paddingHorizontal: 16,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1, fontFamily: 'monospace',
    fontSize: 13, paddingVertical: 12,
  },
  clearSearch: { fontSize: 16, padding: 4 },
  tokenCard: {
    marginHorizontal: 20, marginVertical: 16,
    borderWidth: 1, borderLeftWidth: 4,
    padding: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  tokenLeft: { flex: 1 },
  tokenLabel: {
    fontSize: 10, letterSpacing: 3,
    fontFamily: 'monospace', marginBottom: 8,
  },
  tokenBalance: {
    fontSize: 44, fontWeight: '900', fontFamily: 'monospace',
  },
  tokenUnit: { fontSize: 24 },
  tokenHint: {
    fontSize: 10, fontFamily: 'monospace', marginTop: 4,
  },
  topupBtn: {
    padding: 16, alignItems: 'center', minWidth: 80,
  },
  topupText: {
    fontWeight: '900', fontFamily: 'monospace',
    fontSize: 11, letterSpacing: 1,
  },
  topupIcon: { fontSize: 20, marginTop: 4 },
  resumeSection: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 10, letterSpacing: 3,
    fontFamily: 'monospace', paddingHorizontal: 20, marginBottom: 12,
  },
  resumeCard: {
    marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderLeftWidth: 4,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12,
  },
  resumeLeft: { alignItems: 'center' },
  resumePlayIcon: { fontSize: 32 },
  resumeInfo: { flex: 1 },
  resumeCourse: {
    fontFamily: 'monospace', fontSize: 10,
    letterSpacing: 1, marginBottom: 4,
  },
  resumeLesson: {
    fontFamily: 'monospace', fontWeight: '900',
    fontSize: 14, marginBottom: 4,
  },
  resumeAction: {
    fontFamily: 'monospace', fontSize: 11,
  },
  resumeBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
  },
  resumeBtnText: {
    fontFamily: 'monospace', fontWeight: '900',
    fontSize: 11, letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 8, marginBottom: 24,
  },
  trendingHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingRight: 20, marginBottom: 4,
  },
  seeAll: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  trendingScroll: { paddingLeft: 20, marginBottom: 24 },
  trendingCard: {
    borderWidth: 1, padding: 16, marginRight: 12,
    width: 150, borderTopWidth: 3,
  },
  trendingEmoji: { fontSize: 28, marginBottom: 8 },
  trendingTitle: {
    fontFamily: 'monospace', fontSize: 12,
    fontWeight: '700', marginBottom: 8,
  },
  trendingAction: {
    fontFamily: 'monospace', fontSize: 11,
    fontWeight: '700', letterSpacing: 1,
  },
  footer: {
    textAlign: 'center', fontSize: 11,
    margin: 32, fontFamily: 'monospace',
  },
});