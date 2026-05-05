import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const COLORS = {
  primary: '#00ff88',
  bg: '#020c06',
  surface: '#0a1f10',
  border: '#0f3320',
  text: '#c8ffd8',
  textDim: '#5a8a6a',
  amber: '#ffaa00'
};

// Load YouTube player only on mobile
let YoutubePlayer: any = null;
if (Platform.OS !== 'web') {
  try {
    YoutubePlayer = require('react-native-youtube-iframe').default;
  } catch (e) {
    YoutubePlayer = null;
  }
}

export default function Lesson() {
  const { lessonId, title, videoId, tokenCost } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accessed, setAccessed] = useState(false);
  const [playing, setPlaying] = useState(false);

 // Check if already unlocked when screen loads
 useEffect(() => {
  checkIfUnlocked();
}, []);

 const checkIfUnlocked = async () => {
  try {
    const userData = await getUserData();
    if (!userData) return;
    const user = JSON.parse(userData);

    const res = await fetch(
      `https://scilearnbackend.onrender.com/api/courses/watch/${lessonId}/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': user.username,
        },
      }
    );
    const data = await res.json();
    if (res.ok && data.already_unlocked) {
      setAccessed(true);
      setPlaying(true);
    }
  } catch (e) {
    // Silent fail — user just sees lock screen
  }
};

  const getUserData = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('scibase_user');
    }
    return await AsyncStorage.getItem('scibase_user');
  };

  const saveUserData = async (data: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', data);
    } else {
      await AsyncStorage.setItem('scibase_user', data);
    }
  };

  const accessLesson = async () => {
    setLoading(true);
    try {
      const userData = await getUserData();

      if (!userData) {
        Alert.alert('Error', 'Please login first');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);

      const res = await fetch(
        `https://scilearnbackend.onrender.com/api/courses/watch/${lessonId}/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Username': user.username,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setAccessed(true);
        setPlaying(true);
        user.tokens = data.tokens_remaining;
        await saveUserData(JSON.stringify(user));
      } else {
        Alert.alert('Error', data.error || 'Cannot access lesson');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Cannot connect to server: ' + e.message);
    }
    setLoading(false);
  };

  const renderVideo = () => {
    if (!accessed) return null;

    // Mobile APK — use YouTube iframe player
    if (Platform.OS !== 'web' && YoutubePlayer) {
      return (
        <YoutubePlayer
          height={220}
          videoId={videoId as string}
          play={playing}
          onChangeState={(state: string) => {
            if (state === 'ended') setPlaying(false);
          }}
        />
      );
    }

    // Web browser — use YouTube iframe embed
    return (
      <View style={styles.webPlayer}>
        {/* @ts-ignore */}
        <iframe
          width="100%"
          height="220"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← BACK</Text>
      </TouchableOpacity>
      <Text style={styles.tag}>// LESSON</Text>
      <Text style={styles.title}>{title}</Text>

      {/* Video Box */}
      <View style={styles.videoBox}>
        {accessed ? (
          renderVideo()
        ) : (
          <View style={styles.locked}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>TAP BELOW TO UNLOCK</Text>
            <Text style={styles.cost}>{tokenCost} 🪙 TOKENS</Text>
          </View>
        )}
      </View>

      {/* Unlock Button */}
      {!accessed && (
        <View style={styles.accessSection}>
          <Text style={styles.costInfo}>
            This lesson costs{' '}
            <Text style={styles.costHighlight}>{tokenCost} tokens</Text>
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={accessLesson}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.btnText}>
                UNLOCK LESSON → {tokenCost} 🪙
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Success Message */}
      {accessed && (
        <View style={styles.successBox}>
          <Text style={styles.success}>✅ LESSON UNLOCKED!</Text>
        </View>
      )}

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 28,
    paddingTop: 56,
  },
  back: {
    color: COLORS.primary,
    fontFamily: 'monospace',
    marginBottom: 16,
    fontSize: 13,
    letterSpacing: 2,
  },
  tag: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  videoBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 24,
    overflow: 'hidden',
    minHeight: 220,
    justifyContent: 'center',
  },
  locked: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  lockText: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 13,
    letterSpacing: 2,
  },
  cost: {
    color: COLORS.amber,
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  webPlayer: {
    width: '100%',
    height: 220,
  },
  accessSection: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    backgroundColor: COLORS.surface,
  },
  costInfo: {
    color: COLORS.textDim,
    fontFamily: 'monospace',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  costHighlight: {
    color: COLORS.amber,
    fontWeight: '700',
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.bg,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  successBox: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  success: {
    color: COLORS.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: 32,
    fontFamily: 'monospace',
  },
});