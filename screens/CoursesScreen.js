import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  Animated, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

function CourseCard({ item, onPress, index }) {
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

  const colors = [COLORS.green, COLORS.blue, COLORS.red, COLORS.amber];
  const cardColor = colors[index % colors.length];

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: cardColor }]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
        activeOpacity={1}
      >
        <View style={styles.cardTop}>
          <View style={[styles.cardBadge, { backgroundColor: cardColor }]}>
            <Text style={styles.cardBadgeText}>COURSE</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardAction, { color: cardColor }]}>VIEW LESSONS →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch(endpoints.courses)
      .then(r => r.json())
      .then(data => {
        setCourses(data.courses || []);
        setFiltered(data.courses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (text === '') {
      setFiltered(courses);
    } else {
      setFiltered(courses.filter(c =>
        c.title.toLowerCase().includes(text.toLowerCase()) ||
        c.description.toLowerCase().includes(text.toLowerCase())
      ));
    }
  };

  return (
    <View style={styles.container}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tag}>// COURSE LIBRARY</Text>
        <Text style={styles.title}>ALL COURSES</Text>
        <Text style={styles.subtitle}>
          {courses.length} courses available
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          placeholderTextColor={COLORS.textDim}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.green} size="large" />
          <Text style={styles.loadingText}>LOADING COURSES...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>
            {search ? 'No courses found' : 'No courses yet'}
          </Text>
          <Text style={styles.emptyHint}>
            {search ? 'Try a different search' : 'Check back soon!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <CourseCard
              item={item}
              index={index}
              onPress={() => router.push({
                pathname: '/courses/detail',
                params: { courseId: item.id, title: item.title }
              })}
            />
          )}
        />
      )}
    </View>
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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, borderWidth: 1, borderColor: COLORS.border,
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
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    color: COLORS.green, fontFamily: 'monospace',
    marginTop: 16, letterSpacing: 3, fontSize: 11,
  },
  card: {
    borderWidth: 1, borderColor: COLORS.border,
    padding: 20, marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
  },
  cardTop: { flexDirection: 'row', marginBottom: 12 },
  cardBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
  },
  cardBadgeText: {
    color: COLORS.white, fontSize: 9,
    letterSpacing: 2, fontFamily: 'monospace', fontWeight: '700',
  },
  cardTitle: {
    color: COLORS.white, fontSize: 16,
    fontWeight: '700', fontFamily: 'monospace', marginBottom: 8,
  },
  cardDesc: {
    color: COLORS.textDim, fontSize: 12,
    fontFamily: 'monospace', lineHeight: 20, marginBottom: 12,
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  cardAction: {
    fontSize: 12, letterSpacing: 2, fontFamily: 'monospace',
    fontWeight: '700',
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
    color: COLORS.textDim, fontSize: 13,
    fontFamily: 'monospace', textAlign: 'center',
  },
});