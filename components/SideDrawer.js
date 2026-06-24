import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

export default function SideDrawer({ visible, onClose, navigation, user }) {
  const { colors, themeMode, setTheme, isDark } = useTheme();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0, duration: 300, useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0, duration: 250, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const goTo = (screen, params) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(screen, params);
    }, 200);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'LOGOUT',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS === 'web') {
              localStorage.removeItem('scibase_user');
            } else {
              await AsyncStorage.removeItem('scibase_user');
            }
            onClose();
            setTimeout(() => {
              navigation.replace('Auth');
            }, 200);
          }
        }
      ]
    );
  };

  if (!visible && translateX.__getValue && translateX.__getValue() <= -DRAWER_WIDTH) {
    // still render so animation can play, but block touches when fully hidden and not visible
  }

  return (
    <View
      style={[
        styles.root,
        { display: visible ? 'flex' : 'flex' },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayOpacity },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.surface,
            borderRightColor: colors.border,
            transform: [{ translateX }],
            width: DRAWER_WIDTH,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Top row: avatar/name (button) + theme toggle */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => goTo('Profile')}
              activeOpacity={0.8}
            >
              <View style={styles.avatarWrapper}>
                <Avatar
                  uri={user?.avatar_url}
                  username={user?.username}
                  size={56}
                  fontSize={22}
                />
                <View style={[styles.onlineDot, { backgroundColor: colors.green, borderColor: colors.surface }]} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.white }]} numberOfLines={1}>
                  {user?.first_name || user?.username || 'Engineer'} 👋
                </Text>
                <View style={[styles.learnerBadge, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
                  <Text style={styles.learnerStar}>🌟</Text>
                  <Text style={[styles.learnerText, { color: colors.text }]}>Learner</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeBtn, { borderColor: colors.border }]}
              onPress={toggleTheme}
            >
              <Text style={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Token Balance Card (button) */}
          <TouchableOpacity
            style={[styles.tokenCard, {
              backgroundColor: colors.surfaceGreen,
              borderColor: colors.green,
            }]}
            onPress={() => goTo('Tokens')}
            activeOpacity={0.85}
          >
            <View style={styles.tokenLeft}>
              <Text style={[styles.tokenLabel, { color: colors.textDim }]}>
                Token Balance
              </Text>
              <View style={styles.tokenValueRow}>
                <Text style={styles.tokenIcon}>🪙</Text>
                <Text style={[styles.tokenValue, { color: colors.green }]}>
                  {user?.tokens || 0}
                </Text>
                <Text style={[styles.tokenUnit, { color: colors.textDim }]}>
                  tokens
                </Text>
              </View>
            </View>
            <View style={[styles.topUpBtn, { borderColor: colors.green }]}>
              <Text style={[styles.topUpText, { color: colors.green }]}>Top Up</Text>
              <Text style={[styles.topUpPlus, { color: colors.green }]}>➕</Text>
            </View>
          </TouchableOpacity>

          {/* Menu items */}
          <View style={styles.menuList}>
            <DrawerItem
              icon="▶️"
              label="My Learning"
              colors={colors}
              onPress={() => goTo('Courses')}
            />
            <DrawerItem
              icon="🎁"
              label="Referral"
              colors={colors}
              onPress={() => goTo('Streak')}
            />
            <DrawerItem
              icon="⚙️"
              label="Settings"
              colors={colors}
              onPress={() => goTo('Theme')}
            />
            <DrawerItem
              icon="❓"
              label="Help & Support"
              colors={colors}
              onPress={() => goTo('QA')}
            />
            <DrawerItem
              icon="↪️"
              label="Log Out"
              colors={colors}
              onPress={handleLogout}
              danger
            />
          </View>

          {/* Go Pro Card */}
          <TouchableOpacity
            style={[styles.proCard, {
              backgroundColor: colors.bg2,
              borderColor: colors.border,
            }]}
            onPress={() => goTo('Tokens')}
            activeOpacity={0.85}
          >
            <View style={[styles.proIconBox, { backgroundColor: colors.surfaceGreen, borderColor: colors.green }]}>
              <Text style={styles.proIcon}>👑</Text>
            </View>
            <View style={styles.proInfo}>
              <Text style={[styles.proTitle, { color: colors.white }]}>Go Pro</Text>
              <Text style={[styles.proDesc, { color: colors.textDim }]}>
                Unlock premium courses and exclusive content.
              </Text>
            </View>
            <View style={[styles.proArrowBox, { backgroundColor: colors.surfaceGreen, borderColor: colors.green }]}>
              <Text style={[styles.proArrow, { color: colors.green }]}>›</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.footer, { color: colors.textDim }]}>
            Developed by: 💞🙏 Engineer Joe 🇰🇪
          </Text>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

function DrawerItem({ icon, label, onPress, colors, danger }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconBox, { borderColor: colors.border }]}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <Text style={[
        styles.menuLabel,
        { color: danger ? colors.red : colors.white }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrapper: { position: 'relative' },
  onlineDot: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 16, fontWeight: '800',
  },
  learnerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    marginTop: 6, alignSelf: 'flex-start',
  },
  learnerStar: { fontSize: 10 },
  learnerText: { fontSize: 11, fontWeight: '600' },
  themeBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  themeIcon: { fontSize: 16 },
  tokenCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 16,
    padding: 16, marginBottom: 24,
  },
  tokenLeft: { flex: 1 },
  tokenLabel: { fontSize: 12, marginBottom: 6 },
  tokenValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tokenIcon: { fontSize: 18 },
  tokenValue: { fontSize: 24, fontWeight: '900' },
  tokenUnit: { fontSize: 12 },
  topUpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  topUpText: { fontSize: 12, fontWeight: '700' },
  topUpPlus: { fontSize: 12 },
  menuList: { marginBottom: 20 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, paddingVertical: 14,
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  menuIcon: { fontSize: 16 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  proCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 16, padding: 14,
    marginBottom: 24,
  },
  proIconBox: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  proIcon: { fontSize: 20 },
  proInfo: { flex: 1 },
  proTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  proDesc: { fontSize: 11, lineHeight: 16 },
  proArrowBox: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  proArrow: { fontSize: 18, fontWeight: '900' },
  footer: {
    textAlign: 'center', fontSize: 10,
    fontFamily: 'monospace', marginTop: 8,
  },
});
