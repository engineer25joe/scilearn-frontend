import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator,
  Animated, Dimensions
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppScreenContainer from '../components/AppScreenContainer';

const { width } = Dimensions.get('window');

const CATEGORY_FALLBACK_ICONS = {
  'Cyber Security': '🛡️',
  'Programming': '</>',
  'Data Analysis': '📊',
  'Networking': '📡',
  'Linux': '🐧',
  'AI & ML': '🤖',
};

function AnimatedCard({ children, style, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function CoursesScreen({ navigation, route }) {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [allCourses, setAllCourses] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadAll();
  }, []);

  const getUserData = async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const { Platform } = require('react-native');
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

      const catRes = await fetch('https://scilearnbackend.onrender.com/api/courses/categories/');
      const catData = await catRes.json();
      if (catRes.ok) setCategories(catData.categories || []);

      const courseRes = await fetch('https://scilearnbackend.onrender.com/api/courses/');
      const courseData = await courseRes.json();
      if (courseRes.ok) setAllCourses(courseData.courses || []);

      if (username) {
        try {
          const notifRes = await fetch(
            'https://scilearnbackend.onrender.com/api/notifications/',
            { headers: { 'X-Username': username } }
          );
          const notifData = await notifRes.json();
          if (notifRes.ok) setUnreadCount(notifData.unread_count || 0);
        } catch {}
      }
    } catch {}
    setLoading(false);
  };

  const filteredCourses = allCourses.filter((c) => {
    const matchesSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' ||
      (c.category && c.category === activeCategory);
    return matchesSearch && matchesCategory;
  });

  const featured = allCourses.slice(0, 4);
  const popular = allCourses.slice(0, 4);
  const trending = allCourses;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={[styles.loadingText, { color: colors.green }]}>LOADING COURSES...</Text>
      </View>
    );
  }

  return (
    <AppScreenContainer navigation={navigation} user={user} style={{ backgroundColor: colors.bg }}>
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
                  style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={openDrawer}
                >
                  <Text style={styles.iconBtnText}>☰</Text>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                  <Text style={[styles.headerTitle, { color: colors.white }]}>
                    ALL <Text style={{ color: colors.green }}>COURSES</Text>
                  </Text>
                  <Text style={[styles.headerSub, { color: colors.textDim }]}>
                    Explore. Learn. Level Up.
                  </Text>
                </View>

                <View style={styles.headerRight}>
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {}}
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

              <Text style={[styles.countLabel, { color: colors.textDim }]}>
                {filteredCourses.length} courses available
              </Text>
            </AnimatedCard>

            {/* Search */}
            <AnimatedCard delay={50}>
              <View style={styles.searchRow}>
                <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search courses, topics or skills..."
                    placeholderTextColor={colors.textDim}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
                <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={styles.filterIcon}>⚙️</Text>
                </TouchableOpacity>
              </View>
            </AnimatedCard>

            {/* Category Pills */}
            <AnimatedCard delay={100}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    activeCategory === 'all' && { borderColor: colors.green, backgroundColor: colors.surfaceGreen }
                  ]}
                  onPress={() => setActiveCategory('all')}
                >
                  <Text style={[
                    styles.pillText,
                    { color: activeCategory === 'all' ? colors.green : colors.text }
                  ]}>All</Text>
                </TouchableOpacity>

                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      activeCategory === cat.name && { borderColor: colors.green, backgroundColor: colors.surfaceGreen }
                    ]}
                    onPress={() => setActiveCategory(cat.name)}
                  >
                    <Text style={styles.pillIcon}>{cat.icon}</Text>
                    <Text style={[
                      styles.pillText,
                      { color: activeCategory === cat.name ? colors.green : colors.text }
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Text style={styles.pillIcon}>▦</Text>
                  <Text style={[styles.pillText, { color: colors.text }]}>Others</Text>
                </TouchableOpacity>
              </ScrollView>
            </AnimatedCard>

            {/* Featured Course Banner */}
            {featured.length > 0 && (
              <AnimatedCard delay={150}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                    setFeaturedIndex(idx);
                  }}
                  style={styles.featuredScroll}
                >
                  {featured.map((course) => (
                    <View
                      key={course.id}
                      style={[styles.featuredCard, {
                        backgroundColor: colors.surface,
                        borderColor: colors.green,
                        width: width - 32,
                      }]}
                    >
                      <View style={[styles.featuredBadge, { borderColor: colors.green }]}>
                        <Text style={[styles.featuredBadgeText, { color: colors.green }]}>
                          🛡️ FEATURED COURSE
                        </Text>
                      </View>
                      <Text style={[styles.featuredTitle, { color: colors.white }]} numberOfLines={1}>
                        {course.title}
                      </Text>
                      <Text style={[styles.featuredDesc, { color: colors.textDim }]} numberOfLines={2}>
                        {course.description}
                      </Text>
                      <View style={styles.featuredMetaRow}>
                        <Text style={[styles.featuredMeta, { color: colors.textDim }]}>
                          📖 {course.lessons_count || 25} Lessons
                        </Text>
                        <Text style={[styles.featuredMeta, { color: colors.textDim }]}>
                          🕐 4 Hours
                        </Text>
                        <Text style={[styles.featuredMeta, { color: colors.amber }]}>
                          ⭐ {course.rating} ({course.learners_count})
                        </Text>
                      </View>
                      <View style={styles.featuredBottomRow}>
                        <View style={[styles.tokenPill, { borderColor: colors.green }]}>
                          <Text style={[styles.tokenPillText, { color: colors.green }]}>
                            🪙 {course.token_cost} Tokens
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.startBtn, { backgroundColor: colors.green }]}
                          onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                        >
                          <Text style={styles.startBtnText}>Start Learning ▷</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.dotsRow}>
                  {featured.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        { backgroundColor: i === featuredIndex ? colors.green : colors.border }
                      ]}
                    />
                  ))}
                </View>
              </AnimatedCard>
            )}

            {/* Popular Courses */}
            <AnimatedCard delay={200}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.white }]}>
                  🔥 Popular Courses
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.viewAll, { color: colors.green }]}>View all →</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
                {popular.map((course, i) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[styles.popularCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                  >
                    <View style={[styles.popularThumb, { backgroundColor: colors.bg2 }]}>
                      <Text style={styles.popularThumbIcon}>{course.category_icon || '📘'}</Text>
                      <TouchableOpacity style={[styles.bookmarkBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                        <Text style={styles.bookmarkIcon}>🔖</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.popularTitle, { color: colors.white }]} numberOfLines={2}>
                      {course.title}
                    </Text>
                    <Text style={[styles.popularDesc, { color: colors.textDim }]} numberOfLines={1}>
                      {course.description}
                    </Text>
                    <View style={styles.popularBottomRow}>
                      <Text style={[styles.popularLessons, { color: colors.textDim }]}>
                        {course.lessons_count || 18} Lessons
                      </Text>
                      <View style={[styles.smallTokenPill, { borderColor: colors.green }]}>
                        <Text style={[styles.smallTokenText, { color: colors.green }]}>
                          {course.token_cost} Tokens
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </AnimatedCard>

            {/* Learning Paths */}
            <AnimatedCard delay={250}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.white }]}>
                  🗺️ Learning Paths
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.viewAll, { color: colors.green }]}>View all →</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.pathCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.pathStepCol}>
                  <View style={[styles.pathStepDot, { backgroundColor: colors.green }]}>
                    <Text style={styles.pathStepCheck}>✓</Text>
                  </View>
                  <View style={[styles.pathStepDotLocked, { borderColor: colors.border }]}>
                    <Text style={styles.pathStepLock}>🔒</Text>
                  </View>
                  <View style={[styles.pathStepDotLocked, { borderColor: colors.border }]}>
                    <Text style={styles.pathStepLock}>🔒</Text>
                  </View>
                </View>
                <View style={[styles.pathThumb, { backgroundColor: colors.surfaceGreen, borderColor: colors.green }]}>
                  <Text style={styles.pathThumbIcon}>🛡️</Text>
                  <Text style={styles.pathThumbCheck}>✓</Text>
                </View>
                <View style={styles.pathInfo}>
                  <View style={styles.pathTitleRow}>
                    <Text style={[styles.pathTitle, { color: colors.white }]}>Cyber Security Roadmap</Text>
                    <View style={[styles.beginnerBadge, { backgroundColor: colors.green }]}>
                      <Text style={styles.beginnerText}>Beginner</Text>
                    </View>
                  </View>
                  <Text style={[styles.pathDesc, { color: colors.textDim }]} numberOfLines={2}>
                    Step-by-step path to becoming a cyber security professional.
                  </Text>
                  <View style={styles.pathProgressRow}>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { backgroundColor: colors.green, width: '25%' }]} />
                    </View>
                  </View>
                  <View style={styles.pathBottomRow}>
                    <Text style={[styles.pathPercent, { color: colors.green }]}>25% Completed</Text>
                    <Text style={[styles.pathCount, { color: colors.textDim }]}>4/16 Courses</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={[styles.continuePathBtn, { borderColor: colors.green }]}>
                <Text style={[styles.continuePathText, { color: colors.green }]}>Continue Path →</Text>
              </TouchableOpacity>
            </AnimatedCard>

            {/* Trending Courses */}
            <AnimatedCard delay={300}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.white }]}>
                  📈 Trending Courses 🔥
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.viewAll, { color: colors.green }]}>View all →</Text>
                </TouchableOpacity>
              </View>

              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[styles.trendingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                  >
                    <View style={[styles.trendingThumb, { backgroundColor: colors.bg2 }]}>
                      <Text style={styles.trendingThumbIcon}>{course.category_icon || '📘'}</Text>
                    </View>
                    <View style={styles.trendingInfo}>
                      <Text style={[styles.trendingTitle, { color: colors.white }]} numberOfLines={1}>
                        {course.title}
                      </Text>
                      <Text style={[styles.trendingDesc, { color: colors.textDim }]} numberOfLines={1}>
                        {course.description}
                      </Text>
                      <Text style={[styles.trendingMeta, { color: colors.textDim }]}>
                        ⭐ {course.rating} ({course.learners_count} learners)  ·  🕐 {course.duration_hours || 5} Hours  ·  {course.lessons_count || 20} Lessons
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
                  No courses match your search
                </Text>
              )}
            </AnimatedCard>

            <Text style={[styles.footer, { color: colors.textDim }]}>
              🛡️ Learn more. Pay less. Achieve more.  —  SCI LEARN
            </Text>

          </ScrollView>
        </View>

    </AppScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'monospace', marginTop: 16, letterSpacing: 3 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8, gap: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  iconBtnText: { fontSize: 18 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  headerSub: { fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  countLabel: { fontSize: 12, paddingHorizontal: 16, marginTop: 4, marginBottom: 12 },
  searchRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, marginBottom: 14,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 12 },
  filterBtn: {
    width: 46, borderWidth: 1, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  filterIcon: { fontSize: 16 },
  pillScroll: { paddingLeft: 16, marginBottom: 18 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginRight: 8,
  },
  pillIcon: { fontSize: 12 },
  pillText: { fontSize: 12, fontWeight: '700' },
  featuredScroll: { marginBottom: 8 },
  featuredCard: {
    marginHorizontal: 16, borderWidth: 1, borderRadius: 18, padding: 18,
  },
  featuredBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10,
  },
  featuredBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  featuredTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  featuredDesc: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  featuredMetaRow: { flexDirection: 'row', gap: 14, marginBottom: 14, flexWrap: 'wrap' },
  featuredMeta: { fontSize: 11 },
  featuredBottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  tokenPill: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  tokenPillText: { fontSize: 12, fontWeight: '700' },
  startBtn: {
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
  },
  startBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 16,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  viewAll: { fontSize: 12, fontWeight: '700' },
  popularScroll: { paddingLeft: 16, marginBottom: 24 },
  popularCard: {
    width: 160, borderWidth: 1, borderRadius: 14, marginRight: 12, overflow: 'hidden', paddingBottom: 10,
  },
  popularThumb: {
    height: 100, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  popularThumbIcon: { fontSize: 30 },
  bookmarkBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  bookmarkIcon: { fontSize: 12 },
  popularTitle: {
    fontSize: 13, fontWeight: '700', paddingHorizontal: 10, marginTop: 8, lineHeight: 17,
  },
  popularDesc: { fontSize: 10, paddingHorizontal: 10, marginTop: 2 },
  popularBottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, marginTop: 8,
  },
  popularLessons: { fontSize: 10 },
  smallTokenPill: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  smallTokenText: { fontSize: 10, fontWeight: '700' },
  pathCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12,
  },
  pathStepCol: { gap: 10, alignItems: 'center' },
  pathStepDot: {
    width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  pathStepCheck: { color: '#000', fontSize: 10, fontWeight: '900' },
  pathStepDotLocked: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  pathStepLock: { fontSize: 8 },
  pathThumb: {
    width: 60, height: 60, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  pathThumbIcon: { fontSize: 26 },
  pathThumbCheck: {
    position: 'absolute', bottom: -4, right: -4, fontSize: 14,
  },
  pathInfo: { flex: 1 },
  pathTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pathTitle: { fontSize: 14, fontWeight: '800' },
  beginnerBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  beginnerText: { color: '#000', fontSize: 9, fontWeight: '800' },
  pathDesc: { fontSize: 11, lineHeight: 16, marginBottom: 8 },
  pathProgressRow: { marginBottom: 6 },
  progressBarTrack: {
    height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  progressBarFill: { height: 5, borderRadius: 3 },
  pathBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pathPercent: { fontSize: 11, fontWeight: '700' },
  pathCount: { fontSize: 11 },
  continuePathBtn: {
    marginHorizontal: 16, borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginBottom: 24,
  },
  continuePathText: { fontSize: 13, fontWeight: '700' },
  trendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 14, padding: 12,
  },
  trendingThumb: {
    width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  trendingThumbIcon: { fontSize: 22 },
  trendingInfo: { flex: 1 },
  trendingTitle: { fontSize: 13, fontWeight: '700' },
  trendingDesc: { fontSize: 11, marginTop: 2 },
  trendingMeta: { fontSize: 10, marginTop: 4 },
  tokenBadge: { borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  tokenBadgeText: { fontSize: 11, fontWeight: '700' },
  noResults: { textAlign: 'center', fontSize: 13, marginTop: 20 },
  footer: { textAlign: 'center', fontSize: 11, marginVertical: 24, fontFamily: 'monospace' },
});