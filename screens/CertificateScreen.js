import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
  Linking, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreenContainer from '../components/AppScreenContainer';

const COLORS = {
  bg: '#0b0e10',
  card: '#12171e',
  border: '#1c2530',
  green: '#22c55e',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  gold: '#eab308',
  red: '#ef4444',
  muted: '#9ca3af',
  text: '#e5e7eb',
  white: '#ffffff',
};

const CERT_COLORS = [
  { bg: '#0d2215', border: '#1a4028', accent: '#22c55e', label: 'green' },
  { bg: '#1a0d33', border: '#3a1f6b', accent: '#8b5cf6', label: 'purple' },
  { bg: '#0d1730', border: '#1e3560', accent: '#3b82f6', label: 'blue' },
  { bg: '#1f1606', border: '#4a3008', accent: '#eab308', label: 'gold' },
];

function CertCard({ cert, index, onDownload }) {
  const theme = CERT_COLORS[index % CERT_COLORS.length];
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const dateStr = cert.completed_at
    ? new Date(cert.completed_at).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : 'Completed';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.certCard, { backgroundColor: theme.bg, borderColor: theme.border }]}
        onPressIn={() => Animated.spring(scaleAnim, {
          toValue: 0.97, useNativeDriver: true, speed: 50,
        }).start()}
        onPressOut={() => Animated.spring(scaleAnim, {
          toValue: 1, useNativeDriver: true, speed: 50,
        }).start()}
        onPress={() => onDownload(cert)}
        activeOpacity={1}
      >
        {/* Top Row */}
        <View style={styles.certTop}>
          <View style={[styles.certIconBox, {
            backgroundColor: theme.accent + '22',
            borderColor: theme.accent,
          }]}>
            <Text style={styles.certCategoryIcon}>{cert.category_icon}</Text>
          </View>
          <View style={styles.certTopRight}>
            <View style={[styles.completedBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}>
              <Text style={styles.completedDot}>✓</Text>
              <Text style={[styles.completedText, { color: theme.accent }]}>Completed</Text>
            </View>
            <Text style={[styles.certCategory, { color: theme.accent }]}>
              {cert.category}
            </Text>
          </View>
        </View>

        {/* Certificate visual */}
        <View style={[styles.certVisual, { borderColor: theme.accent + '44' }]}>
          <View style={styles.certVisualInner}>
            <Text style={styles.certVisualIcon}>🏆</Text>
            <Text style={[styles.certVisualLabel, { color: theme.accent }]}>
              CERTIFICATE OF COMPLETION
            </Text>
            <View style={[styles.certVisualLine, { backgroundColor: theme.accent + '44' }]} />
            <Text style={[styles.certVisualName, { color: COLORS.white }]}>
              {cert.course_title}
            </Text>
            <Text style={[styles.certVisualDate, { color: COLORS.muted }]}>
              {dateStr}
            </Text>
            <View style={styles.certVisualStars}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Text key={i} style={styles.starIcon}>⭐</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.certStats}>
          <View style={styles.certStatItem}>
            <Text style={[styles.certStatValue, { color: theme.accent }]}>
              {cert.total_lessons}
            </Text>
            <Text style={styles.certStatLabel}>Lessons</Text>
          </View>
          <View style={[styles.certStatDivider, { backgroundColor: theme.border }]} />
          <View style={styles.certStatItem}>
            <Text style={[styles.certStatValue, { color: theme.accent }]}>
              100%
            </Text>
            <Text style={styles.certStatLabel}>Complete</Text>
          </View>
          <View style={[styles.certStatDivider, { backgroundColor: theme.border }]} />
          <View style={styles.certStatItem}>
            <Text style={[styles.certStatValue, { color: theme.accent }]}>
              {dateStr.split(' ')[2] || 'N/A'}
            </Text>
            <Text style={styles.certStatLabel}>Year</Text>
          </View>
        </View>

        {/* Download Button */}
        <TouchableOpacity
          style={[styles.downloadBtn, { backgroundColor: theme.accent }]}
          onPress={() => onDownload(cert)}
        >
          <Text style={styles.downloadBtnIcon}>⬇️</Text>
          <Text style={styles.downloadBtnText}>Download Certificate</Text>
        </TouchableOpacity>

      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CertificateScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const userData = await getUserData();
      if (!userData) { setLoading(false); return; }
      const parsed = JSON.parse(userData);
      setUser(parsed);

      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/courses/certificates/mine/',
        { headers: { 'X-Username': parsed.username } }
      );
      const data = await res.json();
      if (res.ok) setCertificates(data.certificates || []);
    } catch {}
    setLoading(false);
  };

  const handleDownload = (cert) => {
    Alert.alert(
      '🏆 Download Certificate',
      `Download certificate for "${cert.course_title}"?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DOWNLOAD',
          onPress: async () => {
            try {
              const userData = await getUserData();
              const u = userData ? JSON.parse(userData) : null;
              const url = `${cert.download_url}?username=${encodeURIComponent(u?.username || '')}`;

              if (Platform.OS === 'web') {
                window.open(url, '_blank');
              } else {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                  await Linking.openURL(url);
                } else {
                  Alert.alert('Error', 'Cannot open download link');
                }
              }
            } catch (e) {
              Alert.alert('Error', 'Download failed: ' + e.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator color={COLORS.green} size="large" />
        <Text style={styles.loadingText}>LOADING CERTIFICATES...</Text>
      </View>
    );
  }

  return (
    <AppScreenContainer
      navigation={navigation}
      user={user}
      style={{ backgroundColor: COLORS.bg }}
    >
      {({ openDrawer }) => (
        <View style={styles.root}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.iconBtnText}>‹</Text>
              </TouchableOpacity>
              <View style={styles.headerMid}>
                <Text style={styles.headerTitle}>My Certificates</Text>
                <Text style={styles.headerSub}>
                  {certificates.length > 0
                    ? `${certificates.length} certificate${certificates.length > 1 ? 's' : ''} earned`
                    : 'Complete courses to earn certificates'}
                </Text>
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={openDrawer}>
                <Text style={styles.iconBtnText}>☰</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Banner */}
            <View style={styles.statsBanner}>
              <View style={styles.statsBannerItem}>
                <Text style={styles.statsBannerValue}>{certificates.length}</Text>
                <Text style={styles.statsBannerLabel}>Earned</Text>
              </View>
              <View style={styles.statsBannerDivider} />
              <View style={styles.statsBannerItem}>
                <Text style={styles.statsBannerValue}>🏆</Text>
                <Text style={styles.statsBannerLabel}>Achievements</Text>
              </View>
              <View style={styles.statsBannerDivider} />
              <View style={styles.statsBannerItem}>
                <Text style={styles.statsBannerValue}>100%</Text>
                <Text style={styles.statsBannerLabel}>Completion</Text>
              </View>
            </View>

            {certificates.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🎓</Text>
                <Text style={styles.emptyTitle}>No certificates yet</Text>
                <Text style={styles.emptySub}>
                  Complete all lessons in a course to earn your certificate of completion.
                </Text>
                <TouchableOpacity
                  style={styles.browsBtn}
                  onPress={() => navigation.navigate('Courses')}
                >
                  <Text style={styles.browsBtnText}>Browse Courses →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.certList}>
                {certificates.map((cert, i) => (
                  <CertCard
                    key={cert.course_id}
                    cert={cert}
                    index={i}
                    onDownload={handleDownload}
                  />
                ))}
              </View>
            )}

          </ScrollView>
        </View>
      )}
    </AppScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    color: COLORS.green, marginTop: 16, letterSpacing: 2, fontWeight: '700',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 50, paddingBottom: 16,
  },
  iconBtn: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: '#0e141b',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { color: COLORS.white, fontSize: 20 },
  headerMid: { flex: 1, paddingHorizontal: 14 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  statsBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 18, marginBottom: 24,
    backgroundColor: '#0d2215', borderWidth: 1, borderColor: '#1a4028',
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
  },
  statsBannerItem: { flex: 1, alignItems: 'center' },
  statsBannerValue: {
    fontSize: 22, fontWeight: '900', color: COLORS.green,
  },
  statsBannerLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  statsBannerDivider: { width: 1, height: 36, backgroundColor: '#1a4028' },
  emptyBox: {
    paddingTop: 60, paddingHorizontal: 32, alignItems: 'center',
  },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 10 },
  emptySub: {
    fontSize: 14, color: COLORS.muted, textAlign: 'center',
    lineHeight: 20, marginBottom: 24,
  },
  browsBtn: {
    backgroundColor: COLORS.green, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  browsBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  certList: { paddingHorizontal: 18, gap: 20 },
  certCard: {
    borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 4,
  },
  certTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  certIconBox: {
    width: 52, height: 52, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  certCategoryIcon: { fontSize: 24 },
  certTopRight: { flex: 1, gap: 4 },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  completedDot: { fontSize: 10, fontWeight: '900', color: '#fff' },
  completedText: { fontSize: 10, fontWeight: '700' },
  certCategory: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  certVisual: {
    borderWidth: 1, borderRadius: 14, padding: 20, marginBottom: 16,
    alignItems: 'center', borderStyle: 'dashed',
  },
  certVisualInner: { alignItems: 'center', width: '100%' },
  certVisualIcon: { fontSize: 36, marginBottom: 8 },
  certVisualLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 10,
  },
  certVisualLine: { width: '80%', height: 1, marginBottom: 10 },
  certVisualName: { fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  certVisualDate: { fontSize: 11, marginBottom: 10 },
  certVisualStars: { flexDirection: 'row', gap: 2 },
  starIcon: { fontSize: 12 },
  certStats: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, paddingVertical: 12,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  certStatItem: { flex: 1, alignItems: 'center' },
  certStatValue: { fontSize: 18, fontWeight: '900' },
  certStatLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  certStatDivider: { width: 1, height: 28 },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14,
  },
  downloadBtnIcon: { fontSize: 16 },
  downloadBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
});
