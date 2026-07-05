import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import AppScreenContainer from '../components/AppScreenContainer';

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
      if (res.ok && data.has_last_watched) setLastWatched(data);
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
        <Text style={[styles.loadingText, { color: colors.green }]}>LOADING...</Text>
      </View>
    );
  }

  return (
    <AppScreenContainer
      navigation={navigation}
      user={user}
      style={{ backgroundColor: colors.bg }}
    >
      {({ openDrawer }) => (
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
                  style={[styles.iconBtn, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                  onPress={openDrawer}
                >
                  <Text style={styles.iconBtnText}>☰</Text>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                  <Text style={[styles.welcomeText, { color: colors.text }]}>
                    Welcome to{' '}
                    <Text style={{ color: colors.green, fontWeight: '900' }}>
                      SCI LEARN
                    </Text>{' '}👋
                  </Text>
                  <Text style={[styles.helloText, { color: colors.white }]}>
                    Hello, {user?.first_name || user?.username || 'Engineer'}
                  </Text>
                </View>

                <View style={styles.headerRight}>
                  <TouchableOpacity
                    style={[styles.iconBtn, {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }]}
                    onPress={() => navigation.navigate('Courses')}
                  >
                    <Text style={styles.iconBtnText}>🔍</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconBtn, {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }]}
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
                      You're on a{' '}
                      <Text style={{ color: colors.green, fontWeight: '700' }}>
                        {streakDays} day
                      </Text>
                      {' '}learning streak
                    </Text>
                  </View>
                  <View style={styles.streakCountBox}>
                    <Text style={[styles.streakCount, { color: colors.green }]}>
                      {streakDays}
                    </Text>
                    <Text style={[styles.streakCountLabel, { color: colors.textDim }]}>
                      Day Streak
                    </Text>
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
                          {isFilled && (
                            <Text style={styles.streakDotCheck}>✓</Text>
                          )}
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
                    <View style={[styles.playCircle, {
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderColor: colors.green,
                    }]}>
                      <Text style={styles.playIcon}>▶️</Text>
                    </View>
                  </View>
                  <View style={styles.resumeInfo}>
                    <Text style={[styles.resumeLabel, { color: colors.green }]}>
                      Resume Learning
                    </Text>
                    <Text
                      style={[styles.resumeCourseTitle, { color: colors.white }]}
                      numberOfLines={1}
                    >
                      {lastWatched.course_title}
                    </Text>
                    <Text
                      style={[styles.resumeLessonTitle, { color: colors.textDim }]}
                      numberOfLines={1}
                    >
                      {lastWatched.lesson_title}
                    </Text>
                    <View style={styles.progressBarTrack}>
                      <View style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: colors.green,
                          width: (lastWatched.progress_percent || 0) + '%',
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
                <Text style={[styles.sectionTitle, { color: colors.white }]}>
                  Courses
                </Text>
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
                  categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryCard, {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }]}
                      onPress={() => navigation.navigate('Courses', { categoryId: cat.id })}
                    >
                      <View style={[styles.categoryIconBox, {
                        backgroundColor: cat.color + '22',
                        borderColor: cat.color,
                      }]}>
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      </View>
                      <Text style={[styles.categoryName, { color: colors.white }]}>
                        {cat.name}
                      </Text>
                      <Text
                        style={[styles.categoryDesc, { color: colors.textDim }]}
                        numberOfLines={1}
                      >
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
                <Text style={[styles.sectionTitle, { color: colors.white }]}>
                  Trending Courses 🔥
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
                  <Text style={[styles.viewAll, { color: colors.green }]}>View all</Text>
                </TouchableOpacity>
              </View>

              {trendingCourses.length > 0 ? (
                trendingCourses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[styles.trendingRow, {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }]}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                  >
                    <View style={[styles.trendingThumb, {
                      backgroundColor: colors.bg2,
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
                      <Text
                        style={[styles.trendingTitle, { color: colors.white }]}
                        numberOfLines={1}
                      >
                        {course.title}
                      </Text>
                      <Text
                        style={[styles.trendingDesc, { color: colors.textDim }]}
                        numberOfLines={1}
                      >
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
        </View>
      )}
    </AppScreenContainer>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, gap: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  iconBtnText: { fontSize: 18, color: '#fff' },
  headerCenter: { flex: 1 },
  welcomeText: { fontSize: 13 },
  helloText: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  bellBadge