import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator,
  Animated, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import FloatingAIButton from '../components/FloatingAIButton';

const CATEGORY_FALLBACK_COLORS = ['#00cc44', '#7b3fe4', '#bb0000', '#ffb800'];

function AnimatedCard({ children, style, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

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

export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [streak, setStreak] = useState(null);
  const [lastWatched, setLastWatched] = useState(null);
  const [categories, setCategories] = useState([]);
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

  const fetchStreak = async (username) => {
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/streak/',
        { headers: { 'X-Username': username } }
      );
      const data = await res.json();
      if (res.ok) setStreak(data);
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

  const fetchCategories = async () => {
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/courses/categories/'
      );
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch {}
  };

  const fetchTrendingCourses = async () => {
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/courses/'
      );
      const data = await res.json();
      if (res.ok) setTrendingCourses((data.courses || []).slice(0, 6));
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
      fetchStreak(parsed.username);
      fetchLastWatched(parsed.username);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
    fetchCategories();
    fetchTrendingCourses();
  }, []);

  const resumeLesson = () => {
    if (!lastWatched) return;
    navigation.navigate('Lesson', {
      lessonId: lastWatched.lesson_id,
      title: lastWatched.lesson_title,
      videoId: lastWatched.video_id,
      tokenCost: lastWatched.token_cost,
    });
  };

  const streakDays = streak ? streak.current_streak : 0;
  const streakDotsCount = 7;
  const filledDots = Math.min(streakDays, streakDotsCount);

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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* Header */}
        <AnimatedCard>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.openDrawer && navigation.openDrawer()}
            >
              <Text style={styles.iconBtnText}>☰</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={[styles.welcomeText, { color: colors.text }]}>
                Welcome to <Text style={{ color: colors.green, fontWeight: '900' }}>SCI LEARN</Text> 👋
              </Text>
              <Text style={[styles.helloText, { color: colors.white }]}>
                Hello, {user?.first_name || user?.username || 'Engineer'}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Courses')}
              >
                <Text style={styles.iconBtnText}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Text style={styles.iconBtnText}>🔔</Text>
                {unreadCount > 0 && (
                  <View style={[styles.bellBadge, { backgroundColor: colors.green }]}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedCard>

        {/* Streak Card */}
        <AnimatedCard delay={100}>
          <View style={[styles.streakCard, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }]}>
            <View style={styles.streakTop}>
              <View style={[styles.streakIconRing, { borderColor: colors.green }]}>
                <Text style={styles.streakFireIcon}>🔥</Text>
              </View>
              <View style={styles.streakInfo}>
                <Text style={[styles.streakTitle, { color: colors.white }]}>
                  Keep it up! 🔥
                </Text>
                <Text style={[styles.streakSubtitle, { color: colors.textDim }]}>
                  You're on a <Text style={{ color: colors.green, fontWeight: '700' }}>{streakDays} day</Text> learning streak
                </Text>
              </View>
              <View style={styles.streakCountBox}>
                <Text style={[styles.streakCount, { color: colors.green }]}>{streakDays}</Text>
                <Text style={[styles.streakCountLabel, { color: colors.textDim }]}>Day Streak</Text>
              </View>
            </View>

            <View style={styles.streakDotsRow}>
              {Array.from({ length: streakDotsCount }).map((_, i) => {
                const isFilled = i < filledDots;
                return (
                  <React.Fragment key={i}>
                    <View style={[
                      styles.streakDot,
                      {
                        backgroundColor: isFilled ? colors.green : colors.bg2,
                        borderColor: isFilled ? colors.green : colors.border,
                      }
                    ]}>
                      {isFilled && <Text style={styles.streakDotCheck}>✓</Text>}
                    </View>
                    {i < streakDotsCount - 1 && (
                      <View style={[
                        styles.streakLine,
                        { backgroundColor: isFilled ? colors.green : colors.border }
                      ]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        </AnimatedCard>

        {/* Resume Learning */}
        {lastWatched && (
          <AnimatedCard delay={200}>
            <TouchableOpacity
              style={[styles.resumeCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}
              onPress={resumeLesson}
              activeOpacity={0.85}
            >
              <View style={[styles.resumeThumb, { backgroundColor: colors.bg2 }]}>
                <View style={[styles.playCircle, { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: colors.green }]}>
                  <Text style={styles.playIcon}>▶️</Text>
                </View>
              </View>
              <View style={styles.resumeInfo}>
                <Text style={[styles.resumeLabel, { color: colors.green }]}>
                  Resume Learning
                </Text>
                <Text style={[styles.resumeCourseTitle, { color: colors.white }]} numberOfLines={1}>
                  {lastWatched.course_title}
                </Text>
                <Text style={[styles.resumeLessonTitle, { color: colors.textDim }]} numberOfLines={1}>
                  {lastWatched.lesson_title}
                </Text>
                <View style={styles.progressBarTrack}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.green,
                      width: `${lastWatched.progress_percent || 0}%`,
                    }
                  ]} />
                </View>
                <Text style={[styles.progressLabel, { color: colors.green }]}>
                  {lastWatched.progress_percent || 0}% Completed
                </Text>
              </View>
              <View style={[styles.continueBtn, { borderColor: colors.green }]}>
                <Text style={[styles.continueBtnText, { color: colors.green }]}>
                  ▷ Continue
                </Text>
              </View>
            </TouchableOpacity>
          </AnimatedCard>
        )}

        {/* Courses (Categories) */}
        <AnimatedCard delay={300}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.white }]}>Courses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
              <Text style={[styles.viewAll, { color: colors.green }]}>View all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.length > 0 ? (
              categories.map((cat, i) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                  onPress={() => navigation.navigate('Courses', { categoryId: cat.id })}
                >
                  <View style={[styles.categoryIconBox, { backgroundColor: cat.color + '22', borderColor: cat.color }]}>
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  </View>
                  <Text style={[styles.categoryName, { color: colors.white }]}>{cat.name}</Text>
                  <Text style={[styles.categoryDesc, { color: colors.textDim }]} numberOfLines={1}>
                    {cat.description}
                  </Text>
                  <Text style={[styles.categoryCount, { color: cat.color }]}>
                    {cat.course_count} Courses
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.categoryCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                width: 280,
              }]}>
                <Text style={[styles.categoryDesc, { color: colors.textDim }]}>
                  No categories yet — add some in the admin panel
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.viewAllCoursesBtn, { borderColor: colors.green }]}
            onPress={() => navigation.navigate('Courses')}
          >
            <Text style={[styles.viewAllCoursesText, { color: colors.green }]}>
              View all courses →
            </Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* Trending Courses */}
        <AnimatedCard delay={400}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.white }]}>Trending Courses 🔥</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
              <Text style={[styles.viewAll, { color: colors.green }]}>View all</Text>
            </TouchableOpacity>
          </View>

          {trendingCourses.length > 0 ? (
            trendingCourses.map((course, i) => (
              <TouchableOpacity
                key={course.id}
                style={[styles.trendingRow, {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
                onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
              >
                <View style={[styles.trendingThumb, {
                  backgroundColor: (CATEGORY_FALLBACK_COLORS[i % 4]) + '22',
                }]}>
                  <Text style={styles.trendingThumbIcon}>
                    {course.category_icon || '📘'}
                  </Text>
                </View>
                <View style={styles.trendingInfo}>
                  {course.is_bestseller && (
                    <View style={[styles.bestsellerBadge, { borderColor: colors.green }]}>
                      <Text style={[styles.bestsellerText, { color: colors.green }]}>
                        Bestseller
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.trendingTitle, { color: colors.white }]} numberOfLines={1}>
                    {course.title}
                  </Text>
                  <Text style={[styles.trendingDesc, { color: colors.textDim }]} numberOfLines={1}>
                    {course.description}
                  </Text>
                  <Text style={[styles.trendingRating, { color: colors.amber }]}>
                    ⭐ {course.rating} ({course.learners_count} learners)
                  </Text>
                </View>
                <View style={[styles.tokenBadge, { borderColor: colors.green }]}>
                  <Text style={[styles.tokenBadgeText, { color: colors.green }]}>
                    {course.token_cost} Tokens
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.noResults, { color: colors.textDim }]}>
              No courses yet
            </Text>
          )}
        </AnimatedCard>

        <Text style={[styles.footer, { color: colors.textDim }]}>
          Developed by: 💞🙏 Engineer Joe 🇰🇪
        </Text>
      </ScrollView>

      <FloatingAIButton onPress={() => navigation.navigate('QA')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'monospace', marginTop: 16, letterSpacing: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    gap: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  iconBtnText: { fontSize: 18 },
  headerCenter: { flex: 1 },
  welcomeText: {
    fontSize: 13, fontFamily: 'System',
  },
  helloText: {
    fontSize: 20, fontWeight: '800', marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row', gap: 8,
  },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#000', fontSize: 9, fontWeight: '900',
  },
  streakCard: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderRadius: 16, padding: 18,
  },
  streakTop: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  streakIconRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  streakFireIcon: { fontSize: 26 },
  streakInfo: { flex: 1 },
  streakTitle: { fontSize: 15, fontWeight: '700' },
  streakSubtitle: { fontSize: 12, marginTop: 4 },
  streakCountBox: { alignItems: 'center' },
  streakCount: { fontSize: 28, fontWeight: '900' },
  streakCountLabel: { fontSize: 9, marginTop: -2 },
  streakDotsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 18,
  },
  streakDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  streakDotCheck: { color: '#000', fontSize: 11, fontWeight: '900' },
  streakLine: { flex: 1, height: 2, marginHorizontal: 2 },
  resumeCard: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 20,
    borderWidth: 1, borderRadius: 16, padding: 12, gap: 12,
    alignItems: 'center',
  },
  resumeThumb: {
    width: 88, height: 72, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  playCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 14 },
  resumeInfo: { flex: 1 },
  resumeLabel: { fontSize: 11, fontWeight: '700' },
  resumeCourseTitle: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  resumeLessonTitle: { fontSize: 12, marginTop: 2, marginBottom: 6 },
  progressBarTrack: {
    height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBarFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 10, marginTop: 4, fontWeight: '700' },
  continueBtn: {
    borderWidth: 1, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  continueBtnText: { fontSize: 12, fontWeight: '700' },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  viewAll: { fontSize: 13, fontWeight: '700' },
  categoryScroll: { paddingLeft: 16, marginBottom: 14 },
  categoryCard: {
    width: 160, borderWidth: 1, borderRadius: 16,
    padding: 14, marginRight: 12,
  },
  categoryIconBox: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  categoryIcon: { fontSize: 18 },
  categoryName: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  categoryDesc: { fontSize: 11, marginBottom: 10 },
  categoryCount: { fontSize: 12, fontWeight: '700' },
  viewAllCoursesBtn: {
    marginHorizontal: 16, borderWidth: 1, borderRadius: 12,
    padding: 14, alignItems: 'center', marginBottom: 24,
  },
  viewAllCoursesText: { fontSize: 13, fontWeight: '700' },
  trendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderRadius: 14, padding: 12,
  },
  trendingThumb: {
    width: 52, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  trendingThumbIcon: { fontSize: 22 },
  trendingInfo: { flex: 1 },
  bestsellerBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4,
  },
  bestsellerText: { fontSize: 9, fontWeight: '700' },
  trendingTitle: { fontSize: 13, fontWeight: '700' },
  trendingDesc: { fontSize: 11, marginTop: 2 },
  trendingRating: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  tokenBadge: {
    borderWidth: 1, borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  tokenBadgeText: { fontSize: 11, fontWeight: '700' },
  noResults: {
    textAlign: 'center', fontSize: 13, marginTop: 20,
  },
  footer: {
    textAlign: 'center', fontSize: 11,
    marginVertical: 24, fontFamily: 'monospace',
  },
});