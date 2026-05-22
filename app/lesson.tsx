import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform,
  Animated, ScrollView
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isVideoRefSaved,
  downloadVideo,
  deleteVideo,
} from '../utils/videoCache';

const COLORS = {
  green: '#006600', greenLight: '#008000',
  red: '#bb0000', black: '#0a0a0a',
  blue: '#0f268c', amber: '#ffd700',
  bg: '#0a0a0a', surface: '#1a1a1a',
  surfaceGreen: '#0a1a0a', surfaceBlue: '#0a0f1f',
  border: '#1f3f1f', text: '#f0f0f0',
  textDim: '#888888', white: '#ffffff',
};

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
  const [checking, setChecking] = useState(true);
  const [accessed, setAccessed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
    checkIfUnlocked();
    checkIfDownloaded();
  }, []);

  const getUserData = async () => {
    try {
      if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
      return await AsyncStorage.getItem('scibase_user');
    } catch { return null; }
  };

  const saveUserData = async (data: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', data);
    } else {
      await AsyncStorage.setItem('scibase_user', data);
    }
  };

  const checkIfDownloaded = async () => {
    if (Platform.OS === 'web') return;
    const saved = await isVideoRefSaved(videoId as string);
    setIsDownloaded(saved);
  };

  const checkIfUnlocked = async () => {
    setChecking(true);
    try {
      const userData = await getUserData();
      if (!userData) { setChecking(false); return; }
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
    } catch {}
    setChecking(false);
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
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (isDownloaded) {
      // Already downloaded — offer to delete
      Alert.alert(
        '🗑️ Remove Download',
        'This lesson is already saved offline. Remove it?',
        [
          { text: 'KEEP', style: 'cancel' },
          {
            text: 'REMOVE',
            style: 'destructive',
            onPress: async () => {
              await deleteVideo(videoId as string);
              setIsDownloaded(false);
              Alert.alert('✅ Removed', 'Offline video removed');
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      '📥 Save for Offline',
      `Save "${title}" for offline viewing?\n\nThe video reference will be saved to your SCI LEARN Videos folder.`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'SAVE OFFLINE',
          onPress: async () => {
            setDownloading(true);
            setDownloadProgress(0);

            Animated.timing(progressAnim, {
              toValue: 1, duration: 2000, useNativeDriver: false,
            }).start();

            const result = await downloadVideo(
              videoId as string,
              title as string,
              (progress) => setDownloadProgress(progress)
            );

            setDownloading(false);

            if (result.success) {
              setIsDownloaded(true);
              Alert.alert(
                '✅ Saved!',
                `"${title}" saved for offline viewing!\n\nFind it in: SCI LEARN Videos folder\n\nYou can also play it with any video app on your phone.`
              );
            } else {
              Alert.alert('❌ Error', result.error || 'Download failed');
            }
          }
        }
      ]
    );
  };

  const renderVideo = () => {
    if (!accessed) return null;

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

    return (
      <View style={styles.webPlayer}>
        {/* @ts-ignore */}
        <iframe
          width="100%"
          height="220"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          style={{ border: 'none', width: '100%', height: '220px' }}
        />
      </View>
    );
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.green} size="large" />
        <Text style={styles.loadingText}>CHECKING ACCESS...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      <Animated.View style={{ opacity: contentOpacity }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.tag}>// LESSON</Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.costBadge}>
            <Text style={styles.costBadgeText}>🪙 {tokenCost} TOKEN LESSON</Text>
          </View>
        </View>

        {/* Video Box */}
        <View style={styles.videoBox}>
          {accessed ? renderVideo() : (
            <View style={styles.locked}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockTitle}>LESSON LOCKED</Text>
              <Text style={styles.lockText}>Unlock to start watching</Text>
              <View style={styles.lockCostBox}>
                <Text style={styles.lockCost}>{tokenCost} 🪙 TOKENS</Text>
              </View>
            </View>
          )}
        </View>

        {/* Download Button — only show on mobile when unlocked */}
        {accessed && Platform.OS !== 'web' && (
          <View style={styles.downloadSection}>

            {/* Download Status */}
            {isDownloaded && (
              <View style={styles.downloadedBadge}>
                <Text style={styles.downloadedIcon}>✅</Text>
                <Text style={styles.downloadedText}>
                  SAVED FOR OFFLINE VIEWING
                </Text>
              </View>
            )}

            {/* Download Progress */}
            {downloading && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>SAVING...</Text>
                <View style={styles.progressBar}>
                  <Animated.View style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    }
                  ]} />
                </View>
              </View>
            )}

            {/* Download Button */}
            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                style={[
                  styles.downloadBtn,
                  isDownloaded && styles.downloadBtnActive,
                  downloading && styles.downloadBtnLoading,
                ]}
                onPress={handleDownload}
                onPressIn={() => Animated.spring(scale, {
                  toValue: 0.96, useNativeDriver: true, speed: 50
                }).start()}
                onPressOut={() => Animated.spring(scale, {
                  toValue: 1, useNativeDriver: true, speed: 50
                }).start()}
                disabled={downloading}
                activeOpacity={1}
              >
                {downloading ? (
                  <View style={styles.downloadBtnInner}>
                    <ActivityIndicator color={COLORS.white} size="small" />
                    <Text style={styles.downloadBtnText}>  SAVING...</Text>
                  </View>
                ) : (
                  <View style={styles.downloadBtnInner}>
                    <Text style={styles.downloadBtnIcon}>
                      {isDownloaded ? '🗑️' : '📥'}
                    </Text>
                    <Text style={styles.downloadBtnText}>
                      {isDownloaded ? 'REMOVE OFFLINE COPY' : 'SAVE FOR OFFLINE'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Storage Info */}
            {!isDownloaded && !downloading && (
              <Text style={styles.storageInfo}>
                📁 Saved to: Internal Storage → SCI LEARN Videos
              </Text>
            )}
          </View>
        )}

        {/* Unlock Section */}
        {!accessed && (
          <View style={styles.unlockSection}>
            <View style={styles.unlockInfo}>
              <Text style={styles.unlockInfoIcon}>ℹ️</Text>
              <Text style={styles.unlockInfoText}>
                This lesson costs{' '}
                <Text style={styles.unlockCostText}>{tokenCost} tokens</Text>.
                Tokens are deducted once — rewatch for free anytime!
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                style={styles.unlockBtn}
                onPress={accessLesson}
                onPressIn={() => Animated.spring(scale, {
                  toValue: 0.96, useNativeDriver: true, speed: 50
                }).start()}
                onPressOut={() => Animated.spring(scale, {
                  toValue: 1, useNativeDriver: true, speed: 50
                }).start()}
                disabled={loading}
                activeOpacity={1}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <View style={styles.unlockBtnInner}>
                    <Text style={styles.unlockBtnText}>🔓 UNLOCK LESSON</Text>
                    <Text style={styles.unlockBtnCost}>{tokenCost} 🪙 tokens</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Success Box */}
        {accessed && (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✅</Text>
            <View>
              <Text style={styles.successText}>LESSON UNLOCKED!</Text>
              <Text style={styles.successSub}>
                Rewatch anytime for free
              </Text>
            </View>
          </View>
        )}

        {/* Downloaded Videos Info */}
        {isDownloaded && Platform.OS !== 'web' && (
          <View style={styles.offlineInfoCard}>
            <Text style={styles.offlineInfoTitle}>📱 OFFLINE PLAYBACK</Text>
            <Text style={styles.offlineInfoText}>
              This video is saved offline. You can watch it:{'\n'}
              • Inside SCI LEARN app (plays automatically){'\n'}
              • From your Files app in "SCI LEARN Videos" folder{'\n'}
              • Using any video player on your phone
            </Text>
          </View>
        )}

        <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    color: COLORS.green, fontFamily: 'monospace',
    marginTop: 16, letterSpacing: 3, fontSize: 11,
  },
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
    paddingVertical: 6, paddingHorizontal: 14, marginBottom: 16,
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
    color: COLORS.white, fontSize: 20,
    fontWeight: '900', fontFamily: 'monospace', marginBottom: 12,
  },
  costBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.amber,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  costBadgeText: {
    color: COLORS.black, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 11, letterSpacing: 1,
  },
  videoBox: {
    margin: 16, borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    minHeight: 220, justifyContent: 'center',
    overflow: 'hidden',
  },
  locked: {
    height: 220, alignItems: 'center',
    justifyContent: 'center', padding: 20,
  },
  lockIcon: { fontSize: 48, marginBottom: 12 },
  lockTitle: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 16, marginBottom: 8,
  },
  lockText: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, marginBottom: 16,
  },
  lockCostBox: {
    borderWidth: 1, borderColor: COLORS.amber,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  lockCost: {
    color: COLORS.amber, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 18,
  },
  webPlayer: { width: '100%', height: 220 },
  downloadSection: {
    marginHorizontal: 16, marginBottom: 16,
  },
  downloadedBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, backgroundColor: COLORS.surfaceGreen,
    borderWidth: 1, borderColor: COLORS.green,
    padding: 10, marginBottom: 8,
  },
  downloadedIcon: { fontSize: 16 },
  downloadedText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
  },
  progressContainer: { marginBottom: 8 },
  progressText: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 10, letterSpacing: 2, marginBottom: 6,
  },
  progressBar: {
    height: 4, backgroundColor: COLORS.border,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.green,
  },
  downloadBtn: {
    borderWidth: 1, borderColor: COLORS.blue,
    padding: 14, alignItems: 'center',
    backgroundColor: COLORS.surfaceBlue,
  },
  downloadBtnActive: {
    borderColor: COLORS.red,
    backgroundColor: 'rgba(187,0,0,0.05)',
  },
  downloadBtnLoading: {
    borderColor: COLORS.textDim, opacity: 0.7,
  },
  downloadBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  downloadBtnIcon: { fontSize: 18 },
  downloadBtnText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '700', letterSpacing: 2, fontSize: 13,
  },
  storageInfo: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 10, marginTop: 8, letterSpacing: 1,
  },
  unlockSection: { marginHorizontal: 16, marginBottom: 16 },
  unlockInfo: {
    flexDirection: 'row', gap: 12,
    borderWidth: 1, borderColor: COLORS.blue,
    backgroundColor: COLORS.surfaceBlue,
    padding: 14, marginBottom: 16,
  },
  unlockInfoIcon: { fontSize: 16 },
  unlockInfoText: {
    flex: 1, color: COLORS.textDim,
    fontFamily: 'monospace', fontSize: 12, lineHeight: 20,
  },
  unlockCostText: { color: COLORS.amber, fontWeight: '700' },
  unlockBtn: {
    backgroundColor: COLORS.green,
    padding: 18, alignItems: 'center',
    borderBottomWidth: 4, borderBottomColor: COLORS.greenLight,
  },
  unlockBtnInner: { alignItems: 'center' },
  unlockBtnText: {
    color: COLORS.white, fontWeight: '900',
    letterSpacing: 2, fontFamily: 'monospace', fontSize: 16,
  },
  unlockBtnCost: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace', fontSize: 11, marginTop: 4,
  },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.green,
    backgroundColor: COLORS.surfaceGreen,
    padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.green,
  },
  successIcon: { fontSize: 28 },
  successText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 14, letterSpacing: 1,
  },
  successSub: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 11, marginTop: 4,
  },
  offlineInfoCard: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.blue,
    backgroundColor: COLORS.surfaceBlue, padding: 16,
  },
  offlineInfoTitle: {
    color: COLORS.blue, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 12, letterSpacing: 2, marginBottom: 8,
  },
  offlineInfoText: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, lineHeight: 22,
  },
  footer: {
    textAlign: 'center', color: COLORS.textDim,
    fontSize: 11, margin: 32, fontFamily: 'monospace',
  },
});