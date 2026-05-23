import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Share, Animated,
  ActivityIndicator, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

const STREAK_MILESTONES = [
  { days: 3, tokens: 5, icon: '🔥', label: '3 Days' },
  { days: 7, tokens: 15, icon: '⚡', label: '7 Days' },
  { days: 14, tokens: 30, icon: '🏆', label: '14 Days' },
  { days: 30, tokens: 75, icon: '👑', label: '30 Days' },
  { days: 60, tokens: 150, icon: '🌟', label: '60 Days' },
  { days: 100, tokens: 300, icon: '💎', label: '100 Days' },
];

export default function StreakScreen({ navigation }) {
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [activeTab, setActiveTab] = useState('streak');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const streakScale = useRef(new Animated.Value(0.5)).current;

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.spring(streakScale, {
        toValue: 1, tension: 50, friction: 8, useNativeDriver: true,
      }),
    ]).start();
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const userData = await getUserData();
    if (!userData) { setLoading(false); return; }
    const user = JSON.parse(userData);
    setUsername(user.username);

    // Update streak
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/streak/update/',
        {
          method: 'POST',
          headers: { 'X-Username': user.username },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setStreak(data.streak);
        setLongest(data.longest);
        setTotalDays(data.total_days);

        // Show reward if earned
        if (data.reward) {
          Alert.alert(
            `🎉 ${data.reward.title}`,
            `You earned ${data.reward.tokens} bonus tokens for your ${data.reward.streak}-day streak!`,
            [{ text: 'AWESOME! 🚀' }]
          );
        }
      }
    } catch {}

    // Load referral data
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/users/referral/',
        { headers: { 'X-Username': user.username } }
      );
      const data = await res.json();
      if (res.ok) {
        setReferralCode(data.referral_code);
        setTotalReferrals(data.total_referrals);
        setTotalEarned(data.total_earned);
      }
    } catch {}

    setLoading(false);
  };

  const shareReferral = async () => {
    try {
      await Share.share({
        message: `🇰🇪 Join me on SCI LEARN — Kenya's #1 Tech Learning Platform!\n\nUse my referral code: ${referralCode}\n\nSign up and we BOTH get bonus tokens! 🪙\n\nhttps://scilearn.onrender.com/register?ref=${referralCode}`,
        title: 'Join SCI LEARN!',
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share');
    }
  };

  const getNextMilestone = () => {
    return STREAK_MILESTONES.find(m => m.days > streak);
  };

  const nextMilestone = getNextMilestone();
  const daysToNext = nextMilestone ? nextMilestone.days - streak : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.green} size="large" />
        <Text style={styles.loadingText}>LOADING...</Text>
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

      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.tag}>// REWARDS & REFERRALS</Text>
          <Text style={styles.title}>YOUR PROGRESS 🏆</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'streak' && styles.activeTab]}
            onPress={() => setActiveTab('streak')}
          >
            <Text style={[styles.tabText, activeTab === 'streak' && styles.activeTabText]}>
              🔥 STREAK
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'referral' && styles.activeTab]}
            onPress={() => setActiveTab('referral')}
          >
            <Text style={[styles.tabText, activeTab === 'referral' && styles.activeTabText]}>
              🎁 REFERRAL
            </Text>
          </TouchableOpacity>
        </View>

        {/* STREAK TAB */}
        {activeTab === 'streak' && (
          <View style={styles.tabContent}>

            {/* Current Streak */}
            <Animated.View style={[styles.streakCard, { transform: [{ scale: streakScale }] }]}>
              <Text style={styles.streakFireIcon}>🔥</Text>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>DAY STREAK</Text>
              <Text style={styles.streakSub}>
                {streak === 0
                  ? 'Start learning today!'
                  : streak === 1
                  ? 'Great start! Keep going!'
                  : `Amazing! ${streak} days in a row!`
                }
              </Text>
            </Animated.View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: COLORS.amber }]}>
                <Text style={[styles.statNum, { color: COLORS.amber }]}>{longest}</Text>
                <Text style={styles.statLabel}>BEST STREAK</Text>
              </View>
              <View style={[styles.statCard, { borderColor: COLORS.blue }]}>
                <Text style={[styles.statNum, { color: COLORS.blue }]}>{totalDays}</Text>
                <Text style={styles.statLabel}>TOTAL DAYS</Text>
              </View>
            </View>

            {/* Next Milestone */}
            {nextMilestone && (
              <View style={styles.nextMilestone}>
                <Text style={styles.nextMilestoneTitle}>// NEXT REWARD</Text>
                <View style={styles.nextMilestoneCard}>
                  <Text style={styles.nextMilestoneIcon}>{nextMilestone.icon}</Text>
                  <View style={styles.nextMilestoneInfo}>
                    <Text style={styles.nextMilestoneDays}>
                      {nextMilestone.label} Streak
                    </Text>
                    <Text style={styles.nextMilestoneReward}>
                      🪙 +{nextMilestone.tokens} bonus tokens
                    </Text>
                    <Text style={styles.nextMilestoneDaysLeft}>
                      {daysToNext} more day{daysToNext !== 1 ? 's' : ''} to go!
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.milestoneProgress}>
                  <View style={styles.milestoneProgressBar}>
                    <View style={[
                      styles.milestoneProgressFill,
                      {
                        width: `${Math.min(100, (streak / nextMilestone.days) * 100)}%`
                      }
                    ]} />
                  </View>
                  <Text style={styles.milestoneProgressText}>
                    {streak}/{nextMilestone.days}
                  </Text>
                </View>
              </View>
            )}

            {/* All Milestones */}
            <Text style={styles.sectionTitle}>// ALL MILESTONES</Text>
            <View style={styles.milestoneList}>
              {STREAK_MILESTONES.map((m, i) => {
                const achieved = streak >= m.days;
                return (
                  <View key={i} style={[
                    styles.milestone,
                    achieved && styles.milestoneAchieved,
                  ]}>
                    <Text style={styles.milestoneIcon}>{m.icon}</Text>
                    <View style={styles.milestoneInfo}>
                      <Text style={[
                        styles.milestoneDays,
                        achieved && { color: COLORS.green }
                      ]}>
                        {m.label} Streak
                      </Text>
                      <Text style={styles.milestoneReward}>
                        🪙 +{m.tokens} tokens
                      </Text>
                    </View>
                    <Text style={styles.milestoneStatus}>
                      {achieved ? '✅' : '🔒'}
                    </Text>
                  </View>
                );
              })}
            </View>

          </View>
        )}

        {/* REFERRAL TAB */}
        {activeTab === 'referral' && (
          <View style={styles.tabContent}>

            {/* Referral Stats */}
            <View style={styles.referralStatsRow}>
              <View style={[styles.refStatCard, { borderColor: COLORS.green }]}>
                <Text style={[styles.refStatNum, { color: COLORS.green }]}>
                  {totalReferrals}
                </Text>
                <Text style={styles.refStatLabel}>FRIENDS REFERRED</Text>
              </View>
              <View style={[styles.refStatCard, { borderColor: COLORS.amber }]}>
                <Text style={[styles.refStatNum, { color: COLORS.amber }]}>
                  🪙 {totalEarned}
                </Text>
                <Text style={styles.refStatLabel}>TOKENS EARNED</Text>
              </View>
            </View>

            {/* Referral Code */}
            <View style={styles.referralCard}>
              <Text style={styles.referralCardTitle}>// YOUR REFERRAL CODE</Text>
              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCode}>{referralCode}</Text>
              </View>
              <Text style={styles.referralCardDesc}>
                Share your code with friends. When they join:{'\n'}
                • They get <Text style={styles.highlight}>3 extra bonus tokens</Text>{'\n'}
                • You get <Text style={styles.highlight}>10 bonus tokens</Text>
              </Text>
            </View>

            {/* Share Button */}
            <TouchableOpacity style={styles.shareBtn} onPress={shareReferral}>
              <Text style={styles.shareBtnText}>📤 SHARE MY REFERRAL CODE</Text>
            </TouchableOpacity>

            {/* How it works */}
            <View style={styles.howItWorks}>
              <Text style={styles.howTitle}>// HOW IT WORKS</Text>
              {[
                { step: '1', text: 'Share your referral code with friends' },
                { step: '2', text: 'Friend registers using your code' },
                { step: '3', text: 'They get 3 bonus tokens' },
                { step: '4', text: 'You get 10 bonus tokens automatically!' },
              ].map((item, i) => (
                <View key={i} style={styles.howStep}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{item.step}</Text>
                  </View>
                  <Text style={styles.stepText}>{item.text}</Text>
                </View>
              ))}
            </View>

          </View>
        )}

      </Animated.View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>
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
    color: COLORS.green, fontSize: 24,
    fontWeight: '900', fontFamily: 'monospace',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tab: {
    flex: 1, padding: 16, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: COLORS.green },
  tabText: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, letterSpacing: 1,
  },
  activeTabText: { color: COLORS.green, fontWeight: '700' },
  tabContent: { padding: 16 },
  streakCard: {
    borderWidth: 2, borderColor: COLORS.amber,
    backgroundColor: COLORS.surfaceGreen,
    padding: 32, alignItems: 'center',
    marginBottom: 16,
  },
  streakFireIcon: { fontSize: 48, marginBottom: 8 },
  streakNumber: {
    color: COLORS.amber, fontSize: 72,
    fontWeight: '900', fontFamily: 'monospace',
  },
  streakLabel: {
    color: COLORS.amber, fontFamily: 'monospace',
    fontSize: 14, letterSpacing: 4, fontWeight: '700',
  },
  streakSub: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, marginTop: 8, textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  statCard: {
    flex: 1, borderWidth: 1,
    padding: 16, alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  statNum: {
    fontFamily: 'monospace', fontWeight: '900', fontSize: 28,
  },
  statLabel: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 9, letterSpacing: 2, marginTop: 4,
  },
  nextMilestone: { marginBottom: 16 },
  nextMilestoneTitle: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8,
  },
  nextMilestoneCard: {
    flexDirection: 'row', gap: 16,
    borderWidth: 1, borderColor: COLORS.green,
    backgroundColor: COLORS.surfaceGreen,
    padding: 16, alignItems: 'center', marginBottom: 12,
  },
  nextMilestoneIcon: { fontSize: 36 },
  nextMilestoneInfo: { flex: 1 },
  nextMilestoneDays: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 14,
  },
  nextMilestoneReward: {
    color: COLORS.amber, fontFamily: 'monospace',
    fontSize: 13, marginTop: 4,
  },
  nextMilestoneDaysLeft: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 11, marginTop: 4,
  },
  milestoneProgress: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  milestoneProgressBar: {
    flex: 1, height: 8,
    backgroundColor: COLORS.border, borderRadius: 4,
  },
  milestoneProgressFill: {
    height: '100%', backgroundColor: COLORS.green, borderRadius: 4,
  },
  milestoneProgressText: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 11,
  },
  sectionTitle: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8,
  },
  milestoneList: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  milestone: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  milestoneAchieved: { backgroundColor: COLORS.surfaceGreen },
  milestoneIcon: { fontSize: 24 },
  milestoneInfo: { flex: 1 },
  milestoneDays: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontWeight: '700', fontSize: 13,
  },
  milestoneReward: {
    color: COLORS.amber, fontFamily: 'monospace', fontSize: 11,
  },
  milestoneStatus: { fontSize: 20 },
  referralStatsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  refStatCard: {
    flex: 1, borderWidth: 1,
    padding: 16, alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  refStatNum: {
    fontFamily: 'monospace', fontWeight: '900', fontSize: 24,
  },
  refStatLabel: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 9, letterSpacing: 2, marginTop: 4,
  },
  referralCard: {
    borderWidth: 1, borderColor: COLORS.blue,
    borderLeftWidth: 4, borderLeftColor: COLORS.blue,
    backgroundColor: COLORS.surfaceBlue,
    padding: 16, marginBottom: 16,
  },
  referralCardTitle: {
    color: COLORS.blue, fontFamily: 'monospace',
    fontSize: 10, letterSpacing: 3, marginBottom: 12,
  },
  referralCodeBox: {
    backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.blue,
    padding: 16, alignItems: 'center', marginBottom: 12,
  },
  referralCode: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 24, letterSpacing: 4,
  },
  referralCardDesc: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, lineHeight: 22,
  },
  highlight: { color: COLORS.amber, fontWeight: '700' },
  shareBtn: {
    backgroundColor: COLORS.green,
    padding: 16, alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 4, borderBottomColor: COLORS.greenLight,
  },
  shareBtnText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', letterSpacing: 2, fontSize: 14,
  },
  howItWorks: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, padding: 16,
  },
  howTitle: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16,
  },
  howStep: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 12,
  },
  stepNum: {
    width: 28, height: 28,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14,
  },
  stepNumText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 13,
  },
  stepText: {
    flex: 1, color: COLORS.text,
    fontFamily: 'monospace', fontSize: 13,
  },
  footer: {
    textAlign: 'center', color: COLORS.textDim,
    fontSize: 11, margin: 32, fontFamily: 'monospace',
  },
});
