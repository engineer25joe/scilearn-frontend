import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform,
  Animated, ScrollView, Modal
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  isVideoRefSaved,
  downloadVideo,
  deleteVideo,
} from '../utils/videoCache';

const COLORS = {
  green: '#006600',
  greenLight: '#008000',
  red: '#bb0000',
  black: '#0a0a0a',
  blue: '#0f268c',
  amber: '#ffd700',
  bg: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceGreen: '#0a1a0a',
  surfaceBlue: '#0a0f1f',
  border: '#1f3f1f',
  text: '#f0f0f0',
  textDim: '#888888',
  white: '#ffffff',
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
  const params = useLocalSearchParams();
  const { lessonId, title, videoId, tokenCost } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accessed, setAccessed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [hasPdf, setHasPdf] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [isLastLesson, setIsLastLesson] = useState(false);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [learningPoints, setLearningPoints] = useState<string[]>([]);
  const [level, setLevel] = useState('Beginner');
  const [lessonsCount, setLessonsCount] = useState(1);
  const [tokens, setTokens] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

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

  const getNotesUrl = async () => {
    const userData = await getUserData();
    const user = userData ? JSON.parse(userData) : null;
    const username = user ? user.username : '';
    return `https://scilearnbackend.onrender.com/api/courses/notes/${lessonId}/?username=${encodeURIComponent(username)}`;
  };

  const checkIfDownloaded = async () => {
    if (Platform.OS === 'web') return;
    const saved = await isVideoRefSaved(videoId as string);
    setIsDownloaded(saved);
  };

  const applyAccessData = (data: any) => {
    setNotesText(data.notes_text || '');
    setHasPdf(data.has_pdf || false);
    setCourseId(data.course_id || null);
    setIsLastLesson(!!data.is_last_lesson);
    setNextLesson(data.next_lesson || null);
    setDescription(data.description || '');
    setLearningPoints(data.learning_points || []);
    setLevel(data.level || 'Beginner');
    setLessonsCount(data.lessons_count || 1);
  };

  const checkIfUnlocked = async () => {
    setChecking(true);
    try {
      const userData = await getUserData();
      if (!userData) { setChecking(false); return; }
      const user = JSON.parse(userData);
      setTokens(user.tokens || 0);
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
        setPlaying(false);
        applyAccessData(data);
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
        applyAccessData(data);
        user.tokens = data.tokens_remaining;
        setTokens(data.tokens_remaining);
        await saveUserData(JSON.stringify(user));
      } else {
        Alert.alert('Error', data.error || 'Cannot access lesson');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  const goToNextLesson = () => {
    if (!nextLesson) return;
    router.replace({
      pathname: '/lesson',
      params: {
        lessonId: nextLesson.id,
        title: nextLesson.title,
        videoId: nextLesson.video_id,
        tokenCost: nextLesson.token_cost,
      },
    });
  };

  const handleDownload = async () => {
    if (isDownloaded) {
      Alert.alert(
        '🗑️ Remove Download',
        'Remove offline copy?',
        [
          { text: 'KEEP', style: 'cancel' },
          {
            text: 'REMOVE',
            style: 'destructive',
            onPress: async () => {
              await deleteVideo(videoId as string);
              setIsDownloaded(false);
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      '📥 Save for Offline',
      `Save "${title}" for offline viewing?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'SAVE',
          onPress: async () => {
            setDownloading(true);
            const result = await downloadVideo(
              videoId as string,
              title as string,
              (progress: number) => {}
            );
            setDownloading(false);
            if (result.success) {
              setIsDownloaded(true);
              Alert.alert('✅ Saved!', 'Video saved for offline viewing!');
            } else {
              Alert.alert('❌ Error', 'Download failed');
            }
          }
        }
      ]
    );
  };

  const viewPdfNotes = async () => {
    const url = await getNotesUrl();
    if (Platform.OS === 'web') {
      (window as any).open(url, '_blank');
    } else {
      setPdfUrl(url);
      setPdfVisible(true);
    }
  };

  const downloadPdfToDevice = async () => {
    const url = await getNotesUrl();

    if (Platform.OS === 'web') {
      (window as any).open(url, '_blank');
      return;
    }

    setPdfDownloading(true);
    try {
      const fileName = `${(title as string).replace(/[^a-z0-9]/gi, '_')}_notes.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save or Share PDF Notes',
          });
        } else {
          Alert.alert('✅ Downloaded!', `Saved to: ${downloadResult.uri}`);
        }
      } else {
        Alert.alert('❌ Error', 'Could not download PDF. The file may be missing on the server.');
      }
    } catch (e: any) {
      Alert.alert('❌ Error', 'Download failed: ' + e.message);
    }
    setPdfDownloading(false);
  };

  const openCertificate = () => {
    if (!courseId) return;
    const certUrl = `https://scilearnbackend.onrender.com/api/courses/certificate/${courseId}/`;
    if (Platform.OS === 'web') {
      (window as any).open(certUrl, '_blank');
    } else {
      const Linking = require('react-native').Linking;
      Linking.openURL(certUrl);
    }
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
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: accessed ? 100 : 30 }}
      >

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Text style={styles.iconBtnText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <Text style={styles.lessonTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.courseSubtitle}>Course Lesson</Text>
            <View style={styles.tokenChip}>
              <Text style={styles.tokenChipText}>🪙 {tokenCost} TOKEN LESSON</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setBookmarked(!bookmarked)}
          >
            <Text style={styles.iconBtnText}>{bookmarked ? '🔖' : '🏷️'}</Text>
          </TouchableOpacity>
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

        {accessed && (
          <Animated.View style={{ opacity: contentOpacity }}>

            {/* Success Box */}
            <View style={styles.successBox}>
              <View style={styles.successCheckBox}>
                <Text style={styles.successCheckIcon}>✓</Text>
              </View>
              <View>
                <Text style={styles.successText}>LESSON UNLOCKED!</Text>
                <Text style={styles.successSub}>Rewatch anytime for free</Text>
              </View>
            </View>

            {/* View Notes / Download PDF row */}
            <View style={styles.notesRow}>
              {(notesText || hasPdf) ? (
                <TouchableOpacity
                  style={styles.notesToggleBtn}
                  onPress={() => {
                    if (hasPdf) {
                      viewPdfNotes();
                    } else {
                      setShowNotes(!showNotes);
                    }
                  }}
                >
                  <Text style={styles.notesToggleBtnText}>📖 VIEW NOTES →</Text>
                </TouchableOpacity>
              ) : <View style={{ flex: 1 }} />}

              {hasPdf ? (
                <TouchableOpacity
                  style={styles.pdfBtn}
                  onPress={downloadPdfToDevice}
                  disabled={pdfDownloading}
                >
                  {pdfDownloading ? (
                    <ActivityIndicator color={COLORS.amber} size="small" />
                  ) : (
                    <Text style={styles.pdfBtnText}>📄 DOWNLOAD PDF →</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Stats grid: Duration / Token / Lesson count / Level */}
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { borderColor: COLORS.blue }]}>
                <Text style={[styles.statIcon, { color: COLORS.blue }]}>🕐</Text>
                <Text style={styles.statValue}>{tokenCost}</Text>
                <Text style={[styles.statLabel, { color: COLORS.blue }]}>MINUTE{Number(tokenCost) === 1 ? '' : 'S'}</Text>
                <Text style={styles.statSub}>Duration</Text>
              </View>
              <View style={[styles.statBox, { borderColor: COLORS.amber }]}>
                <Text style={[styles.statIcon, { color: COLORS.amber }]}>🪙</Text>
                <Text style={styles.statValue}>{tokenCost}</Text>
                <Text style={[styles.statLabel, { color: COLORS.amber }]}>TOKEN{Number(tokenCost) === 1 ? '' : 'S'}</Text>
                <Text style={styles.statSub}>Required</Text>
              </View>
              <View style={[styles.statBox, { borderColor: COLORS.green }]}>
                <Text style={[styles.statIcon, { color: COLORS.green }]}>▶️</Text>
                <Text style={styles.statValue}>{lessonsCount}</Text>
                <Text style={[styles.statLabel, { color: COLORS.green }]}>LESSON{lessonsCount === 1 ? '' : 'S'}</Text>
                <Text style={styles.statSub}>In this course</Text>
              </View>
              <View style={[styles.statBox, { borderColor: '#7b3fe4' }]}>
                <Text style={[styles.statIcon, { color: '#7b3fe4' }]}>📊</Text>
                <Text style={[styles.statValueSmall, { color: '#7b3fe4' }]}>{level.toUpperCase()}</Text>
                <Text style={styles.statSub}>Level</Text>
              </View>
            </View>

            {/* About this lesson */}
            {description ? (
              <View style={styles.aboutBox}>
                <Text style={styles.aboutTitle}>About this lesson</Text>
                <Text style={styles.aboutText}>{description}</Text>
              </View>
            ) : null}

            {/* What you'll learn */}
            {learningPoints.length > 0 ? (
              <View style={styles.learnBox}>
                <Text style={styles.learnTitle}>What you will learn</Text>
                {learningPoints.map((point, i) => (
                  <View key={i} style={styles.learnRow}>
                    <Text style={styles.learnCheck}>✓</Text>
                    <Text style={styles.learnText}>{point}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Download Video Button — mobile only */}
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[
                  styles.downloadBtn,
                  isDownloaded && styles.downloadBtnActive,
                ]}
                onPress={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.downloadBtnText}>
                    {isDownloaded ? '🗑️ REMOVE OFFLINE COPY' : '📥 SAVE FOR OFFLINE'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Certificate Button — ONLY on last lesson */}
            {isLastLesson ? (
              <TouchableOpacity style={styles.certBtn} onPress={openCertificate}>
                <Text style={styles.certBtnIcon}>🏆</Text>
                <Text style={styles.certBtnText}>GET CERTIFICATE</Text>
                <Text style={styles.certBtnArrow}>→</Text>
              </TouchableOpacity>
            ) : null}

            {/* Notes Text Section — plain text notes only (no PDF) */}
            {showNotes && notesText && !hasPdf ? (
              <View style={styles.notesSection}>
                <Text style={styles.notesSectionTitle}>// LESSON NOTES</Text>
                <Text style={styles.notesContent}>{notesText}</Text>
              </View>
            ) : null}

          </Animated.View>
        )}

        <Text style={styles.footer}>
          Developed by: 💞🙏 Engineer Joe 🇰🇪
        </Text>
      </ScrollView>

      {/* Bottom Balance Bar */}
      {accessed && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>Your Balance</Text>
            <Text style={styles.bottomValue}>🪙 {tokens} Tokens</Text>
          </View>
          {isLastLesson ? (
            <TouchableOpacity style={styles.bottomBtn} onPress={openCertificate}>
              <Text style={styles.bottomBtnText}>Get Certificate 🏆</Text>
            </TouchableOpacity>
          ) : nextLesson ? (
            <TouchableOpacity style={styles.bottomBtn} onPress={goToNextLesson}>
              <Text style={styles.bottomBtnText}>Next Lesson →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.bottomBtn, { opacity: 0.6 }]} disabled>
              <Text style={styles.bottomBtnText}>You're all caught up!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* PDF Viewer Modal */}
      <Modal
        visible={pdfVisible}
        animationType="slide"
        onRequestClose={() => setPdfVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.pdfModalHeader}>
            <Text style={styles.pdfModalTitle}>📄 LESSON NOTES</Text>
            <TouchableOpacity onPress={() => setPdfVisible(false)}>
              <Text style={styles.pdfModalClose}>✕ CLOSE</Text>
            </TouchableOpacity>
          </View>
          {pdfUrl ? (
            <WebView
              source={{ uri: pdfUrl }}
              style={{ flex: 1, backgroundColor: '#fff' }}
              startInLoadingState
              renderLoading={() => (
                <ActivityIndicator color={COLORS.green} size="large" style={{ marginTop: 40 }} />
              )}
            />
          ) : null}
        </View>
      </Modal>
    </>
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
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, gap: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { color: COLORS.white, fontSize: 18 },
  topBarCenter: { flex: 1 },
  lessonTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  courseSubtitle: { color: COLORS.textDim, fontSize: 12, marginTop: 2, marginBottom: 8 },
  tokenChip: {
    alignSelf: 'flex-start', backgroundColor: COLORS.amber,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  tokenChipText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  videoBox: {
    marginHorizontal: 16, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, minHeight: 200,
    justifyContent: 'center', overflow: 'hidden', borderRadius: 14, marginBottom: 16,
  },
  locked: { height: 200, alignItems: 'center', justifyContent: 'center', padding: 20 },
  lockIcon: { fontSize: 44, marginBottom: 12 },
  lockTitle: { color: COLORS.white, fontFamily: 'monospace', fontWeight: '900', fontSize: 15, marginBottom: 8 },
  lockText: { color: COLORS.textDim, fontFamily: 'monospace', fontSize: 12, marginBottom: 14 },
  lockCostBox: { borderWidth: 1, borderColor: COLORS.amber, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
  lockCost: { color: COLORS.amber, fontFamily: 'monospace', fontWeight: '900', fontSize: 16 },
  webPlayer: { width: '100%', height: 200 },
  unlockSection: { marginHorizontal: 16, marginBottom: 16 },
  unlockInfo: {
    flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: COLORS.blue,
    backgroundColor: COLORS.surfaceBlue, padding: 14, marginBottom: 16, borderRadius: 10,
  },
  unlockInfoIcon: { fontSize: 16 },
  unlockInfoText: { flex: 1, color: COLORS.textDim, fontFamily: 'monospace', fontSize: 12, lineHeight: 20 },
  unlockCostText: { color: COLORS.amber, fontWeight: '700' },
  unlockBtn: {
    backgroundColor: COLORS.green, padding: 18, alignItems: 'center',
    borderRadius: 10, borderBottomWidth: 4, borderBottomColor: COLORS.greenLight,
  },
  unlockBtnInner: { alignItems: 'center' },
  unlockBtnText: { color: COLORS.white, fontWeight: '900', letterSpacing: 2, fontFamily: 'monospace', fontSize: 15 },
  unlockBtnCost: { color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: 11, marginTop: 4 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.green,
    backgroundColor: COLORS.surfaceGreen, padding: 14, borderRadius: 10,
  },
  successCheckBox: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  successCheckIcon: { color: '#fff', fontSize: 16, fontWeight: '900' },
  successText: { color: COLORS.green, fontFamily: 'monospace', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  successSub: { color: COLORS.textDim, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  notesRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  notesToggleBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.blue, borderRadius: 10,
    padding: 12, alignItems: 'center', backgroundColor: COLORS.surfaceBlue,
  },
  notesToggleBtnText: { color: COLORS.blue, fontFamily: 'monospace', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  pdfBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.amber, borderRadius: 10,
    padding: 12, alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.06)',
  },
  pdfBtnText: { color: COLORS.amber, fontFamily: 'monospace', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginHorizontal: 16, marginBottom: 16,
  },
  statBox: {
    width: '23%', borderWidth: 1, borderRadius: 12, padding: 8, alignItems: 'center',
  },
  statIcon: { fontSize: 14, marginBottom: 4 },
  statValue: { color: COLORS.white, fontSize: 18, fontWeight: '900' },
  statValueSmall: { fontSize: 9, fontWeight: '900', marginTop: 6, marginBottom: 6, textAlign: 'center' },
  statLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, marginTop: 2 },
  statSub: { color: COLORS.textDim, fontSize: 8, marginTop: 2, textAlign: 'center' },
  aboutBox: {
    marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
  },
  aboutTitle: { color: COLORS.white, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  aboutText: { color: COLORS.textDim, fontSize: 13, lineHeight: 20 },
  learnBox: {
    marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
  },
  learnTitle: { color: COLORS.white, fontSize: 15, fontWeight: '800', marginBottom: 10 },
  learnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  learnCheck: { color: COLORS.green, fontSize: 13, fontWeight: '900', marginTop: 1 },
  learnText: { flex: 1, color: COLORS.text, fontSize: 13, lineHeight: 19 },
  downloadBtn: {
    marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.blue,
    padding: 14, alignItems: 'center', backgroundColor: COLORS.surfaceBlue, borderRadius: 10,
  },
  downloadBtnActive: { borderColor: COLORS.red, backgroundColor: 'rgba(187,0,0,0.05)' },
  downloadBtnText: { color: COLORS.white, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1, fontSize: 12 },
  certBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.amber,
    padding: 14, backgroundColor: 'rgba(255,215,0,0.06)', borderRadius: 10,
  },
  certBtnIcon: { fontSize: 16 },
  certBtnText: { color: COLORS.amber, fontFamily: 'monospace', fontWeight: '800', letterSpacing: 1, fontSize: 13 },
  certBtnArrow: { color: COLORS.amber, fontSize: 14 },
  notesSection: {
    marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, padding: 16, borderRadius: 12,
  },
  notesSectionTitle: { color: COLORS.textDim, fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, marginBottom: 12 },
  notesContent: { color: COLORS.text, fontFamily: 'monospace', fontSize: 13, lineHeight: 24 },
  footer: { textAlign: 'center', color: COLORS.textDim, fontSize: 11, margin: 24, fontFamily: 'monospace' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surfaceGreen, borderTopWidth: 1, borderColor: COLORS.green,
    paddingHorizontal: 18, paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 28 : 14,
  },
  bottomLabel: { color: COLORS.textDim, fontSize: 11 },
  bottomValue: { color: COLORS.amber, fontSize: 14, fontWeight: '800', marginTop: 2 },
  bottomBtn: { backgroundColor: COLORS.green, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18 },
  bottomBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  pdfModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 40, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pdfModalTitle: { color: COLORS.amber, fontFamily: 'monospace', fontWeight: '900', fontSize: 14 },
  pdfModalClose: { color: COLORS.red, fontFamily: 'monospace', fontWeight: '900', fontSize: 13 },
});