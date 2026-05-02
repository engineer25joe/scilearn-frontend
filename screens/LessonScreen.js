import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

export default function LessonScreen({ route, navigation }) {
  const { lessonId, title, videoId, tokenCost } = route.params;
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [accessed, setAccessed] = useState(false);

  const accessLesson = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('scibase_user');
      const user = JSON.parse(userData);

      const res = await fetch(`${endpoints.courses}watch/${lessonId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();

      if (res.ok) {
        setAccessed(true);
        setPlaying(true);
        // Update token balance
        user.tokens = data.tokens_remaining;
        await AsyncStorage.setItem('scibase_user', JSON.stringify(user));
      } else {
        Alert.alert('Error', data.error || 'Cannot access lesson');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.tag}>// LESSON</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {accessed ? (
          <YoutubePlayer
            height={220}
            videoId={videoId}
            play={playing}
            onChangeState={state => {
              if (state === 'ended') setPlaying(false);
            }}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>TAP BELOW TO UNLOCK</Text>
            <Text style={styles.costText}>{tokenCost} 🪙 TOKENS</Text>
          </View>
        )}
      </View>

      {/* Access Button */}
      {!accessed && (
        <View style={styles.accessSection}>
          <Text style={styles.costInfo}>
            This lesson costs <Text style={styles.costHighlight}>{tokenCost} tokens</Text>
          </Text>
          <TouchableOpacity
            style={styles.accessBtn}
            onPress={accessLesson}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.bg} />
              : <Text style={styles.accessBtnText}>UNLOCK LESSON → {tokenCost} 🪙</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {accessed && (
        <View style={styles.playing}>
          <Text style={styles.playingText}>✅ LESSON UNLOCKED</Text>
        </View>
      )}

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 28, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { color: COLORS.primary, fontFamily: 'monospace', fontSize: 13, marginBottom: 16 },
  tag: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '700', fontFamily: 'monospace' },
  videoContainer: { margin: 24, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  videoPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  lockIcon: { fontSize: 40, marginBottom: 12 },
  lockText: { color: COLORS.textDim, fontFamily: 'monospace', fontSize: 13, letterSpacing: 2 },
  costText: { color: COLORS.amber, fontFamily: 'monospace', fontSize: 18, fontWeight: '700', marginTop: 8 },
  accessSection: { marginHorizontal: 24, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
  costInfo: { color: COLORS.textDim, fontFamily: 'monospace', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  costHighlight: { color: COLORS.amber, fontWeight: '700' },
  accessBtn: { backgroundColor: COLORS.primary, padding: 16, alignItems: 'center' },
  accessBtnText: { color: COLORS.bg, fontWeight: '700', letterSpacing: 2, fontFamily: 'monospace' },
  playing: { margin: 24, padding: 16, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  playingText: { color: COLORS.primary, fontFamily: 'monospace', letterSpacing: 2 },
  footer: { textAlign: 'center', color: COLORS.textDim, fontSize: 11, margin: 32, fontFamily: 'monospace' },
});

