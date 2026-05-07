import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, Animated
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { endpoints } from '../../constants/api';

const COLORS = {
  green: '#006600', greenLight: '#008000',
  red: '#bb0000', black: '#0a0a0a',
  blue: '#0f268c', amber: '#ffd700',
  bg: '#0a0a0a', surface: '#1a1a1a',
  surfaceGreen: '#0a1a0a', surfaceBlue: '#0a0f1f',
  border: '#1f3f1f', text: '#f0f0f0',
  textDim: '#888888', white: '#ffffff',
};

function LessonCard({ item, index, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400,
        delay: index * 100, useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0, duration: 400,
        delay: index * 100, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { scale }] }}>
      <TouchableOpacity
        style={styles.lessonCard}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
        activeOpacity={1}
      >
        <View style={styles.lessonLeft}>
          <View style={styles.lessonNumber}>
            <Text style={styles.lessonNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.lessonInfo}>
            <Text style={styles.lessonTitle}>{item.title}</Text>
            <Text style={styles.lessonDuration}>
              ⏱ {item.duration_minutes} min
            </Text>
          </View>
        </View>
        <View style={styles.lessonRight}>
          <Text style={styles.lessonCost}>🪙 {item.duration_minutes}</Text>
          <Text style={styles.watchText}>WATCH →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CourseDetail() {
  const { courseId, title } = useLocalSearchParams();
  const router = useRouter();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    fetch(`${endpoints.courses}${courseId}/`)
      .then(r => r.json())
      .then(data => {
        const l = data.lessons || [];
        setLessons(l);
        setTotalTokens(l.reduce((sum, lesson) => sum + lesson.duration_minutes, 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.tag}>// COURSE LESSONS</Text>
        <Text style={styles.title}>{title}</Text>

        {/* Course Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{lessons.length}</Text>
            <Text style={styles.statLabel}>LESSONS</Text>
          </View>
          <View style={[styles.statItem, { borderColor: COLORS.amber }]}>
            <Text style={[styles.statNum, { color: COLORS.amber }]}>
              🪙 {totalTokens}
            </Text>
            <Text style={styles.statLabel}>TOTAL TOKENS</Text>
          </View>
          <View style={[styles.statItem, { borderColor: COLORS.blue }]}>
            <Text style={[styles.statNum, { color: COLORS.blue }]}>
              ⏱ {totalTokens}
            </Text>
            <Text style={styles.statLabel}>MINUTES</Text>
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.green} size="large" />
          <Text style={styles.loadingText}>LOADING LESSONS...</Text>
        </View>
      ) : lessons.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No lessons yet</Text>
          <Text style={styles.emptyHint}>Check back soon!</Text>
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              // {lessons.length} LESSONS AVAILABLE
            </Text>
          }
          renderItem={({ item, index }) => (
            <LessonCard
              item={item}
              index={index}
              onPress={() => router.push({
                pathname: '/lesson',
                params: {
                  lessonId: item.id,
                  title: item.title,
                  videoId: item.video_id,
                  tokenCost: item.duration_minutes,
                }
              })}
            />
          )}
        />
      )}
    </View>
  );
}

{/* Certificate Button */}
<TouchableOpacity
  style={{
    margin: 16, borderWidth: 1,
    borderColor: COLORS.amber, padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.05)',
  }}
  onPress={() => {
    const certUrl = `https://scilearnbackend.onrender.com/api/courses/certificate/${courseId}/`;
    if (Platform.OS === 'web') {
      window.open(certUrl, '_blank');
    } else {
      Alert.alert('🏆 Certificate', 'Your certificate will download shortly!');
    }
  }}
>
  <Text style={{
    color: COLORS.amber, fontFamily: 'monospace',
    fontWeight: '900', letterSpacing: 2, fontSize: 14,
  }}>🏆 DOWNLOAD CERTIFICATE</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  header: {
    padding: 24, paddingTop: 32,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surfaceGreen,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 6, paddingHorizontal: 14,
    marginBottom: 16,
  },
  backText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 12, letterSpacing: 2,
  },
  tag: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6,
  },
  title: {
    color: COLORS.white, fontSize: 22,
    fontWeight: '900', fontFamily: 'monospace',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row', gap: 8,
  },
  statItem: {
    flex: 1, borderWidth: 1,
    borderColor: COLORS.green,
    padding: 12, alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  statNum: {
    color: COLORS.green, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 16,
  },
  statLabel: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 9, letterSpacing: 1, marginTop: 4,
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    color: COLORS.green, fontFamily: 'monospace',
    marginTop: 16, letterSpacing: 3, fontSize: 11,
  },
  listHeader: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace',
    marginBottom: 12,
  },
  lessonCard: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
  },
  lessonLeft: {
    flexDirection: 'row', alignItems: 'center',
    flex: 1, gap: 12,
  },
  lessonNumber: {
    width: 36, height: 36,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  lessonNumberText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 14,
  },
  lessonInfo: { flex: 1 },
  lessonTitle: {
    color: COLORS.white, fontFamily: 'monospace',
    fontSize: 13, fontWeight: '700', marginBottom: 4,
  },
  lessonDuration: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 11,
  },
  lessonRight: { alignItems: 'flex-end' },
  lessonCost: {
    color: COLORS.amber, fontFamily: 'monospace',
    fontSize: 12, fontWeight: '700', marginBottom: 4,
  },
  watchText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 11, letterSpacing: 1,
  },
  empty: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    color: COLORS.white, fontSize: 16,
    fontFamily: 'monospace', marginBottom: 8,
  },
  emptyHint: {
    color: COLORS.textDim, fontSize: 13, fontFamily: 'monospace',
  },
});