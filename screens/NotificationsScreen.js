import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

const TABS = ['All', 'System', 'Updates', 'Promotions'];

const TYPE_CONFIG = {
  system: {
    icon: '🔔',
    iconBg: '#0d1730',
    iconBorder: '#1e3560',
    dotColor: COLORS.blue,
  },
  reward: {
    icon: '🔥',
    iconBg: '#0d2215',
    iconBorder: '#1a4028',
    dotColor: COLORS.green,
  },
  token_topup: {
    icon: '🪙',
    iconBg: '#1a0d33',
    iconBorder: '#3a1f6b',
    dotColor: COLORS.purple,
  },
  referral: {
    icon: '🎁',
    iconBg: '#0d2215',
    iconBorder: '#1a4028',
    dotColor: COLORS.green,
  },
  certificate: {
    icon: '🏆',
    iconBg: '#1f1606',
    iconBorder: '#4a3008',
    dotColor: COLORS.gold,
  },
  course_unlock: {
    icon: '🔓',
    iconBg: '#1a0d33',
    iconBorder: '#3a1f6b',
    dotColor: COLORS.purple,
  },
  welcome: {
    icon: '👋',
    iconBg: '#0d1730',
    iconBorder: '#1e3560',
    dotColor: COLORS.blue,
  },
};

function getTypeConfig(type, title) {
  if (TYPE_CONFIG[type]) return TYPE_CONFIG[type];
  const t = (title || '').toLowerCase();
  if (t.includes('certificate')) return TYPE_CONFIG.certificate;
  if (t.includes('token') || t.includes('unlock')) return TYPE_CONFIG.token_topup;
  if (t.includes('welcome')) return TYPE_CONFIG.welcome;
  if (t.includes('referral')) return TYPE_CONFIG.referral;
  return TYPE_CONFIG.system;
}

function NotifItem({ item, onPress }) {
  const cfg = getTypeConfig(item.type, item.title);
  return (
    <TouchableOpacity
      style={[styles.notifItem, item.is_read && { opacity: 0.7 }]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.nIcon, { backgroundColor: cfg.iconBg, borderColor: cfg.iconBorder }]}>
        <Text style={styles.nIconText}>{cfg.icon}</Text>
      </View>
      <View style={styles.nBody}>
        <Text style={styles.nTitle}>{item.title}</Text>
        <Text style={styles.nDesc} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.nTime}>{item.time_display}</Text>
      </View>
      {!item.is_read && (
        <View style={[styles.nDot, { backgroundColor: cfg.dotColor }]} />
      )}
    </TouchableOpacity>
  );
}

function NotifGroup({ label, items, onPressItem }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.groupCard}>
        {items.map((item, i) => (
          <View key={item.id}>
            <NotifItem item={item} onPress={onPressItem} />
            {i < items.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [today, setToday] = useState([]);
  const [yesterday, setYesterday] = useState([]);
  const [earlier, setEarlier] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [username, setUsername] = useState('');

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  const fetchNotifications = useCallback(async (tab) => {
    setLoading(true);
    try {
      const userData = await getUserData();
      if (!userData) { setLoading(false); return; }
      const parsed = JSON.parse(userData);
      setUsername(parsed.username);

      const tabParam = tab.toLowerCase();
      const res = await fetch(
        `https://scilearnbackend.onrender.com/api/notifications/?tab=${tabParam}`,
        { headers: { 'X-Username': parsed.username } }
      );
      const data = await res.json();
      if (res.ok) {
        setToday(data.today || []);
        setYesterday(data.yesterday || []);
        setEarlier(data.earlier || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab]);

  const handlePressItem = async (item) => {
    if (!item.is_read) {
      try {
        await fetch(
          'https://scilearnbackend.onrender.com/api/notifications/mark-read/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Username': username,
            },
            body: JSON.stringify({ notification_id: item.id }),
          }
        );
        setToday(p => p.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        setYesterday(p => p.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        setEarlier(p => p.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch {}
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(
        'https://scilearnbackend.onrender.com/api/notifications/mark-all-read/',
        {
          method: 'POST',
          headers: { 'X-Username': username },
        }
      );
      const markAll = arr => arr.map(n => ({ ...n, is_read: true }));
      setToday(markAll);
      setYesterday(markAll);
      setEarlier(markAll);
      setUnreadCount(0);
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
  };

  const clearAll = () => {
    Alert.alert(
      '🗑️ Clear All',
      'Delete all notifications? This cannot be undone.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'CLEAR',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(
                'https://scilearnbackend.onrender.com/api/notifications/clear-all/',
                {
                  method: 'POST',
                  headers: { 'X-Username': username },
                }
              );
              setToday([]);
              setYesterday([]);
              setEarlier([]);
              setUnreadCount(0);
            } catch {
              Alert.alert('Error', 'Cannot connect to server');
            }
          }
        }
      ]
    );
  };

  const isEmpty = today.length === 0 && yesterday.length === 0 && earlier.length === 0;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.iconBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSub}>Stay updated with your learning journey</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Theme')}>
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabDot} />}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.green} size="large" />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>
              You're all caught up! Notifications about your learning progress will appear here.
            </Text>
          </View>
        ) : (
          <>
            <NotifGroup label="Today" items={today} onPressItem={handlePressItem} />
            <NotifGroup label="Yesterday" items={yesterday} onPressItem={handlePressItem} />
            <NotifGroup label="Earlier" items={earlier} onPressItem={handlePressItem} />
          </>
        )}

      </ScrollView>

      {/* Bottom bar */}
      {!isEmpty && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead}>
            <Text style={styles.markReadIcon}>☰</Text>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearAllBtn} onPress={clearAll}>
            <Text style={styles.clearAllText}>Clear all</Text>
            <Text style={styles.clearAllIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 50, paddingBottom: 16,
  },
  iconBtn: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1,
    borderColor: '#1e2a36', backgroundColor: '#0e141b',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { color: '#fff', fontSize: 20 },
  headerMid: { flex: 1, paddingHorizontal: 14 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  unreadBadge: {
    backgroundColor: COLORS.green, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  unreadBadgeText: { color: '#000', fontSize: 11, fontWeight: '900' },
  headerSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  tabs: {
    flexDirection: 'row', marginHorizontal: 18, marginBottom: 20,
    backgroundColor: '#0e141b', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 5, gap: 2,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#13201a', borderWidth: 1, borderColor: '#1e3d28',
  },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.muted },
  tabTextActive: { color: COLORS.green },
  tabDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: COLORS.green, marginTop: 4,
  },
  loadingBox: { paddingTop: 60, alignItems: 'center' },
  emptyBox: {
    paddingTop: 60, paddingHorizontal: 32, alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  group: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: COLORS.muted,
    paddingHorizontal: 18, marginBottom: 10,
  },
  groupCard: {
    marginHorizontal: 14, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 18, overflow: 'hidden',
  },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, backgroundColor: '#111820',
  },
  divider: { height: 1, backgroundColor: '#171f2a', marginLeft: 80 },
  nIcon: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nIconText: { fontSize: 22 },
  nBody: { flex: 1 },
  nTitle: { fontSize: 14.5, fontWeight: '700', color: '#fff', marginBottom: 3 },
  nDesc: { fontSize: 12.5, color: '#9ca3af', lineHeight: 18, marginBottom: 5 },
  nTime: { fontSize: 11, color: '#6b7280' },
  nDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0, marginLeft: 4 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: '#151d25',
  },
  markReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markReadIcon: { color: COLORS.green, fontSize: 14 },
  markReadText: { color: COLORS.green, fontSize: 13, fontWeight: '700' },
  clearAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clearAllText: { color: COLORS.red, fontSize: 13, fontWeight: '600' },
  clearAllIcon: { fontSize: 14 },
});