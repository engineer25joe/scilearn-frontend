import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  Animated, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

const NOTIF_ICONS = {
  new_course: '📚',
  token_topup: '🪙',
  qa_reply: '💬',
  system: '🔔',
  reward: '🏆',
  referral: '🎁',
};

const NOTIF_COLORS = {
  new_course: COLORS.green,
  token_topup: COLORS.amber,
  qa_reply: COLORS.blue,
  system: COLORS.textDim,
  reward: COLORS.amber,
  referral: COLORS.red,
};

function NotifCard({ item, onPress, index }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400,
        delay: index * 80, useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0, duration: 400,
        delay: index * 80, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const color = NOTIF_COLORS[item.type] || COLORS.textDim;
  const icon = NOTIF_ICONS[item.type] || '🔔';

  return (
    <Animated.View style={{
      opacity, transform: [{ translateX }, { scale }]
    }}>
      <TouchableOpacity
        style={[
          styles.notifCard,
          { borderLeftColor: color },
          !item.is_read && styles.unreadCard,
        ]}
        onPress={() => onPress(item)}
        onPressIn={() => Animated.spring(scale, {
          toValue: 0.98, useNativeDriver: true, speed: 50
        }).start()}
        onPressOut={() => Animated.spring(scale, {
          toValue: 1, useNativeDriver: true, speed: 50
        }).start()}
        activeOpacity={1}
      >
        <View style={styles.notifLeft}>
          <View style={[styles.notifIcon, { backgroundColor: color + '22' }]}>
            <Text style={styles.notifIconText}>{icon}</Text>
          </View>
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[
              styles.notifTitle,
              !item.is_read && { color: COLORS.white }
            ]}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notifTime}>
            {new Date(item.created_at).toLocaleDateString('en-KE', {
              day: 'numeric', month: 'short',
              hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const userData = await getUserData();
      if (!userData) return;
      const user = JSON.parse(userData);
      setUsername(user.username);

      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/notifications/',
        { headers: { 'X-Username': user.username } }
      );
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      console.log('Error loading notifications:', e);
    }
    setLoading(false);
  };

  const markAllRead = async () => {
    try {
      await fetch(
        'https://scilearnbackend.onrender.com/api/notifications/read-all/',
        {
          method: 'POST',
          headers: { 'X-Username': username },
        }
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.log('Error marking read:', e);
    }
  };

  const markOneRead = async (item) => {
    if (item.is_read) return;
    try {
      await fetch(
        'https://scilearnbackend.onrender.com/api/notifications/read/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Username': username
          },
          body: JSON.stringify({ notification_id: item.id }),
        }
      );
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.log('Error marking read:', e);
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
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.tag}>// NOTIFICATIONS</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>🔔 ALERTS</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={markAllRead}
            >
              <Text style={styles.markAllText}>✓ MARK ALL READ</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.green} size="large" />
          <Text style={styles.loadingText}>LOADING...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptyHint}>
            We'll notify you about new courses,{'\n'}
            token updates and more!
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item, index }) => (
            <NotifCard
              item={item}
              index={index}
              onPress={markOneRead}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {unreadCount > 0
                ? `// ${unreadCount} UNREAD NOTIFICATIONS`
                : '// ALL CAUGHT UP ✅'
              }
            </Text>
          }
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
    backgroundColor: COLORS.surfaceGreen,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 6, paddingHorizontal: 14,
    marginBottom: 16,
  },
  backText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 12, letterSpacing: 2,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tag: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  title: {
    color: COLORS.green, fontSize: 24,
    fontWeight: '900', fontFamily: 'monospace',
  },
  badge: {
    backgroundColor: COLORS.red,
    minWidth: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 12,
  },
  markAllBtn: {
    borderWidth: 1, borderColor: COLORS.green,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  markAllText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 11, letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    color: COLORS.green, fontFamily: 'monospace',
    marginTop: 16, letterSpacing: 3, fontSize: 11,
  },
  listHeader: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace',
    marginBottom: 12,
  },
  notifCard: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16, marginBottom: 10,
    flexDirection: 'row', gap: 12,
    borderLeftWidth: 4,
  },
  unreadCard: {
    backgroundColor: COLORS.surfaceGreen,
    borderColor: COLORS.border,
  },
  notifLeft: { alignItems: 'center', justifyContent: 'flex-start' },
  notifIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  notifIconText: { fontSize: 22 },
  notifContent: { flex: 1 },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  notifTitle: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontWeight: '700', fontSize: 13, flex: 1,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.green, marginLeft: 8,
  },
  notifMessage: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, lineHeight: 18, marginBottom: 8,
  },
  notifTime: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 10,
  },
  empty: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: {
    color: COLORS.white, fontSize: 18,
    fontFamily: 'monospace', marginBottom: 8,
  },
  emptyHint: {
    color: COLORS.textDim, fontSize: 13,
    fontFamily: 'monospace', textAlign: 'center',
    lineHeight: 22,
  },
});

