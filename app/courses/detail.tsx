import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { endpoints } from '../../constants/api';

const COLORS = {
  primary: '#00ff88', bg: '#020c06', surface: '#0a1f10',
  border: '#0f3320', text: '#c8ffd8', textDim: '#5a8a6a', amber: '#ffaa00'
};

export default function CourseDetail() {
  const { courseId, title } = useLocalSearchParams();
  const router = useRouter();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://scilearnbackend.onrender.com/api/courses/${courseId}/`)
      .then(r => r.json())
      .then(data => { setLessons(data.lessons || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 28, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, fontFamily: 'monospace', marginBottom: 16 }}>← BACK</Text>
        </TouchableOpacity>
        <Text style={{ color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace' }}>// LESSONS</Text>
        <Text style={{ color: COLORS.primary, fontSize: 22, fontWeight: '900', fontFamily: 'monospace' }}>{title}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : lessons.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.textDim, fontFamily: 'monospace' }}>No lessons yet.</Text>
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: COLORS.border, padding: 20, marginBottom: 12, backgroundColor: COLORS.surface }}
              onPress={() => router.push({
                pathname: '/lesson',
                params: {
                  lessonId: item.id,
                  title: item.title,
                  videoId: item.video_id,
                  tokenCost: item.duration_minutes
                }
              })}
            >
              <Text style={{ color: COLORS.text, fontSize: 15, fontFamily: 'monospace', marginBottom: 8 }}>{item.title}</Text>
              <Text style={{ color: COLORS.amber, fontFamily: 'monospace', fontSize: 12 }}>🪙 {item.duration_minutes} tokens</Text>
              <Text style={{ color: COLORS.primary, fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}>WATCH LESSON →</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
