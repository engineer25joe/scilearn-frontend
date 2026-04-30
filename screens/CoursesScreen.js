import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

export default function CoursesScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(endpoints.courses)
      .then(r => r.json())
      .then(data => { setCourses(data.courses || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tag}>// COURSE LIBRARY</Text>
        <Text style={styles.title}>ALL COURSES</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : courses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No courses yet.</Text>
          <Text style={styles.emptyHint}>Add courses from the Django admin panel.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Lesson', { courseId: item.id, title: item.title })}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.cardAction}>VIEW LESSONS →</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 28, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tag: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 },
  title: { color: COLORS.primary, fontSize: 28, fontWeight: '900', fontFamily: 'monospace' },
  card: { borderWidth: 1, borderColor: COLORS.border, padding: 20, marginBottom: 12, backgroundColor: COLORS.surface },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', fontFamily: 'monospace', marginBottom: 8 },
  cardDesc: { color: COLORS.textDim, fontSize: 13, fontFamily: 'monospace', lineHeight: 20, marginBottom: 12 },
  cardAction: { color: COLORS.primary, fontSize: 12, letterSpacing: 2, fontFamily: 'monospace' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: COLORS.primary, fontSize: 16, fontFamily: 'monospace', marginBottom: 8 },
  emptyHint: { color: COLORS.textDim, fontSize: 13, fontFamily: 'monospace', textAlign: 'center' },
});
