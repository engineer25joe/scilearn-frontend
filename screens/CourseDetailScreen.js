import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export default function CourseDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const courseId = route?.params?.courseId;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [unlockedIds, setUnlockedIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await getUserData();
      let username = null;
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        username = parsed.username;
      }

      const res = await fetch(
        `https://scilearnbackend.onrender.com/api/courses/${courseId}/`
      );
      const data = await res.json();
      if (res.ok) setCourse(data);
    } catch {}
    setLoading(false);
  };

  const openLesson = (lesson) => {
    navigation.navigate('Lesson', {
      lessonId: lesson.id,
      title: lesson.title,
      videoId: lesson.video_id,
      tokenCost: lesson.token_cost,
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={[styles.loadingText, { color: colors.green }]}>
          LOADING COURSE...
        </Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.red }]}>
          Course not found
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.green, fontFamily: 'monospace' }}>← BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.iconBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={styles.iconBtnText}>🔖</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={styles.iconBtnText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: colors.surfaceGreen, borderColor: colors.green }]}>
        <View style={[styles.officialBadge, { backgroundColor: colors.green }]}>
          <Text style={styles.officialText}>OFFICIAL</Text>
        </View>
        <View style={[styles.bannerIconRing, { borderColor: colors.green }]}>
          <Text style={styles.bannerIcon}>{course.category_icon || '📘'}</Text>
        </View>
        <View style={[styles.bannerPlayBtn, { borderColor: colors.white }]}>
          <Text style={styles.bannerPlayIcon}>▶</Text>
        </View>
      </View>

      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text style={[styles.tag, { color: colors.green }]}>// COURSE</Text>
        <Text style={[styles.title, { color: colors.white }]}>{course.title}</Text>
        <Text style={[styles.desc, { color: colors.textDim }]}>
          {course.description}
        </Text>
        <View style={[styles.levelPill, { borderColor: colors.green, backgroundColor: colors.surfaceGreen }]}>
          <Text style={styles.levelIcon}>📶</Text>
          <Text style={[styles.levelText, { color: colors.green }]}>Beginner</Text>
        </View>
      </View>

      {/* Stat cards row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: colors.blue, backgroundColor: colors.surfaceBlue }]}>
          <Text style={styles.statIcon}>🕐</Text>
          <Text style={[styles.statValue, { color: colors.white }]}>{course.total_minutes}</Text>
          <Text style={[styles.statLabel, { color: colors.blue }]}>MINUTES</Text>
          <Text style={[styles.statSub, { color: colors.textDim }]}>Total Duration</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.amber, backgroundColor: 'rgba(255,215,0,0.06)' }]}>
          <Text style={styles.statIcon}>🪙</Text>
          <Text style={[styles.statValue, { color: colors.white }]}>{course.total_tokens}</Text>
          <Text style={[styles.statLabel, { color: colors.amber }]}>TOTAL TOKENS</Text>
          <Text style={[styles.statSub, { color: colors.textDim }]}>Required to watch all</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.green, backgroundColor: colors.surfaceGreen }]}>
          <Text style={styles.statIcon}>▶️</Text>
          <Text style={[styles.statValue, { color: colors.white }]}>{course.lessons_count}</Text>
          <Text style={[styles.statLabel, { color: colors.green }]}>LESSONS</Text>
          <Text style={[styles.statSub, { color: colors.textDim }]}>In this course</Text>
        </View>
      </View>

      {/* Info grid */}
      <View style={[styles.infoGrid, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🎓</Text>
          <Text style={[styles.infoLabel, { color: colors.textDim }]}>Certificate</Text>
          <Text style={[styles.infoValue, { color: colors.green }]}>Available</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>⏳</Text>
          <Text style={[styles.infoLabel, { color: colors.textDim }]}>Access</Text>
          <Text style={[styles.infoValue, { color: colors.green }]}>Lifetime</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🌐</Text>
          <Text style={[styles.infoLabel, { color: colors.textDim }]}>Language</Text>
          <Text style={[styles.infoValue, { color: colors.green }]}>English</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📶</Text>
          <Text style={[styles.infoLabel, { color: colors.textDim }]}>Level</Text>
          <Text style={[styles.infoValue, { color: colors.green }]}>Beginner</Text>
        </View>
      </View>

      {/* Lessons list */}
      <View style={styles.lessonsHeaderRow}>
        <Text style={[styles.lessonsHeaderTitle, { color: colors.white }]}>
          ☰ COURSE LESSONS
        </Text>
        <Text style={[styles.lessonsHeaderCount, { color: colors.green }]}>
          {course.lessons_count} Lessons Available
        </Text>
      </View>

      {course.lessons.map((lesson, i) => (
        <TouchableOpacity
          key={lesson.id}
          style={[styles.lessonRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => openLesson(lesson)}
        >
          <View style={styles.lessonLeft}>
            <Text style={styles.lessonTokenIcon}>🪙</Text>
            <Text style={[styles.lessonWatch, { color: colors.green }]}>WATCH →</Text>
          </View>
          <View style={styles.lessonInfo}>
            <Text style={[styles.lessonTitle, { color: colors.white }]}>{lesson.title}</Text>
            <Text style={[styles.lessonMeta, { color: colors.textDim }]}>
              🕐 {lesson.duration_minutes} min
            </Text>
          </View>
          <View style={[styles.lessonOrderBadge, { backgroundColor: colors.green }]}>
            <Text style={styles.lessonOrderText}>{i + 1}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {course.lessons.length === 0 && (
        <View style={[styles.comingSoonBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={styles.comingSoonIcon}>📁</Text>
          <Text style={[styles.comingSoonTitle, { color: colors.white }]}>
            More lessons coming soon!
          </Text>
          <Text style={[styles.comingSoonText, { color: colors.textDim }]}>
            New videos and lessons will be available here. Stay tuned and keep learning!
          </Text>
        </View>
      )}

      {/* Bottom action bar */}
      {course.lessons.length > 0 && (
        <View style={[styles.bottomBar, {
          backgroundColor: colors.surfaceGreen,
          borderColor: colors.green,
        }]}>
          <View>
            <Text style={[styles.bottomLabel, { color: colors.textDim }]}>Your Balance</Text>
            <Text style={[styles.bottomValue, { color: colors.amber }]}>
              🪙 {user?.tokens || 0} Tokens
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.watchNowBtn, { backgroundColor: colors.green }]}
            onPress={() => openLesson(course.lessons[0])}
          >
            <Text style={styles.watchNowText}>Watch Now ▶</Text>
          </TouchableOpacity>
        </View>
      )}

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
    fontFamily: 'monospace', marginTop: 16, letterSpacing: 2,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, marginBottom: 12,
  },
  topBarRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18, color: '#fff' },
  banner: {
    marginHorizontal: 16, height: 170, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginBottom: 16,
  },
  officialBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  officialText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  bannerIconRing: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerIcon: { fontSize: 36 },
  bannerPlayBtn: {
    position: 'absolute', bottom: 14, left: 14,
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerPlayIcon: { color: '#fff', fontSize: 14 },
  titleBlock: { paddingHorizontal: 16, marginBottom: 16 },
  tag: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  desc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  levelIcon: { fontSize: 12 },
  levelText: { fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16,
  },
  statCard: {
    flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: 'center',
  },
  statIcon: { fontSize: 16, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  statSub: { fontSize: 9, marginTop: 2, textAlign: 'center' },
  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: 16, borderWidth: 1, borderRadius: 14,
    padding: 14, marginBottom: 22, justifyContent: 'space-between',
  },
  infoItem: { width: '23%', alignItems: 'center' },
  infoIcon: { fontSize: 18, marginBottom: 6 },
  infoLabel: { fontSize: 10, marginBottom: 2 },
  infoValue: { fontSize: 11, fontWeight: '700' },
  lessonsHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  lessonsHeaderTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  lessonsHeaderCount: { fontSize: 12, fontWeight: '700' },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  lessonLeft: { width: 70 },
  lessonTokenIcon: { fontSize: 16, marginBottom: 4 },
  lessonWatch: { fontSize: 11, fontWeight: '700' },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '700' },
  lessonMeta: { fontSize: 11, marginTop: 4 },
  lessonOrderBadge: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  lessonOrderText: { color: '#000', fontWeight: '900', fontSize: 13 },
  comingSoonBox: {
    marginHorizontal: 16, borderWidth: 1, borderRadius: 16,
    padding: 30, alignItems: 'center', marginBottom: 20,
  },
  comingSoonIcon: { fontSize: 40, marginBottom: 14 },
  comingSoonTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  comingSoonText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 20,
  },
  bottomLabel: { fontSize: 11 },
  bottomValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  watchNowBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  watchNowText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  footer: { textAlign: 'center', fontSize: 11, marginTop: 8, fontFamily: 'monospace' },
});
