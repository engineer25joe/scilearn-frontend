import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { apiRequest, logout as authLogout, isAdmin } from '../utils/auth';

function StatCard({ icon, label, value, color, colors }) {
  return (
    <View style={[styles.statCard, {
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderTopColor: color,
    }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textDim }]}>{label}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tokenAmount, setTokenAmount] = useState('');

  useEffect(function() {
    checkAdminAndLoad();
  }, []);

  var checkAdminAndLoad = async function() {
    var admin = await isAdmin();
    if (!admin) {
      Alert.alert('Access Denied', 'Admin privileges required');
      navigation.replace('Dashboard');
      return;
    }
    loadData();
  };

  var loadData = async function() {
    setLoading(true);
    try {
      var statsRes = await apiRequest('/users/admin/stats/');
      var statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

      var usersRes = await apiRequest('/users/admin/users/');
      var usersData = await usersRes.json();
      if (usersRes.ok) setUsers(usersData.users || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load admin data');
    }
    setLoading(false);
  };

  var onRefresh = async function() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  var toggleUserStatus = async function(targetUsername, currentStatus) {
    var action = currentStatus ? 'deactivate' : 'activate';
    setActionLoading(targetUsername);
    try {
      var res = await apiRequest('/users/admin/toggle-user/', {
        method: 'POST',
        body: JSON.stringify({
          target_username: targetUsername,
          action: action,
        }),
      });
      var data = await res.json();
      if (res.ok) {
        setUsers(function(prev) {
          return prev.map(function(u) {
            if (u.username === targetUsername) {
              return Object.assign({}, u, { is_active: !currentStatus });
            }
            return u;
          });
        });
      } else {
        Alert.alert('Error', data.error || 'Action failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setActionLoading('');
  };

  var openTokenModal = function(user) {
    setSelectedUser(user);
    setTokenAmount('');
    setTokenModalVisible(true);
  };

  var submitAddTokens = async function() {
    var amount = parseInt(tokenAmount, 10);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Enter a valid token amount');
      return;
    }
    try {
      var res = await apiRequest('/users/admin/toggle-user/', {
        method: 'POST',
        body: JSON.stringify({
          target_username: selectedUser.username,
          action: 'add_tokens',
          tokens: amount,
        }),
      });
      var data = await res.json();
      if (res.ok) {
        setUsers(function(prev) {
          return prev.map(function(u) {
            if (u.username === selectedUser.username) {
              return Object.assign({}, u, { token_balance: data.new_balance });
            }
            return u;
          });
        });
        setTokenModalVisible(false);
        Alert.alert('✅ Success', data.message);
      } else {
        Alert.alert('Error', data.error || 'Failed to add tokens');
      }
    } catch (e) {
      Alert.alert('Error', 'Cannot connect to server');
    }
  };

  var handleLogout = async function() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'LOGOUT',
          style: 'destructive',
          onPress: async function() {
            await authLogout();
            navigation.replace('Auth');
          }
        }
      ]
    );
  };

  var filteredUsers = users.filter(function(u) {
    if (!search) return true;
    var q = search.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={[styles.loadingText, { color: colors.green }]}>
          LOADING ADMIN PANEL...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: colors.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: colors.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: colors.green }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.tag, { color: colors.textDim }]}>
            // ADMIN PANEL
          </Text>
          <Text style={[styles.title, { color: colors.green }]}>
            🛡️ CONTROL CENTER
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.red }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.red }]}>
            ↪ LOGOUT
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, {
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overview' && { borderBottomColor: colors.green, borderBottomWidth: 3 }
          ]}
          onPress={function() { setActiveTab('overview'); }}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textDim },
            activeTab === 'overview' && { color: colors.green }
          ]}>
            📊 OVERVIEW
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'users' && { borderBottomColor: colors.blue, borderBottomWidth: 3 }
          ]}
          onPress={function() { setActiveTab('users'); }}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textDim },
            activeTab === 'users' && { color: colors.blue }
          ]}>
            👥 USERS ({users.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <View style={styles.overviewContent}>

            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
              // PLATFORM STATISTICS
            </Text>

            <View style={styles.statsGrid}>
              <StatCard icon="👥" label="TOTAL USERS"
                value={stats.total_users} color={colors.green} colors={colors} />
              <StatCard icon="📚" label="COURSES"
                value={stats.total_courses} color={colors.blue} colors={colors} />
              <StatCard icon="🎬" label="LESSONS"
                value={stats.total_lessons} color={colors.amber} colors={colors} />
              <StatCard icon="🔓" label="UNLOCKS"
                value={stats.total_unlocks} color={colors.red} colors={colors} />
              <StatCard icon="🔔" label="NOTIFICATIONS"
                value={stats.total_notifications} color={colors.green} colors={colors} />
              <StatCard icon="📬" label="UNREAD"
                value={stats.unread_notifications} color={colors.blue} colors={colors} />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textDim, marginTop: 24 }]}>
              // RECENT SIGNUPS
            </Text>

            {stats.recent_users && stats.recent_users.map(function(u, i) {
              return (
                <View key={i} style={[styles.recentUserRow, {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }]}>
                  <View style={[styles.recentUserAvatar, { backgroundColor: colors.green }]}>
                    <Text style={styles.recentUserAvatarText}>
                      {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={styles.recentUserInfo}>
                    <Text style={[styles.recentUserName, { color: colors.text }]}>
                      {u.username}
                    </Text>
                    <Text style={[styles.recentUserEmail, { color: colors.textDim }]}>
                      {u.email}
                    </Text>
                  </View>
                  <View style={styles.recentUserMeta}>
                    <Text style={[styles.recentUserTokens, { color: colors.amber }]}>
                      🪙 {u.token_balance}
                    </Text>
                    <Text style={[
                      styles.recentUserVerified,
                      { color: u.is_verified ? colors.green : colors.red }
                    ]}>
                      {u.is_verified ? '✅ verified' : '❌ unverified'}
                    </Text>
                  </View>
                </View>
              );
            })}

          </View>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <View style={styles.usersContent}>

            <View style={[styles.searchBox, {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by username or email..."
                placeholderTextColor={colors.textDim}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {filteredUsers.map(function(u, i) {
              return (
                <View key={i} style={[styles.userCard, {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }]}>
                  <View style={styles.userCardHeader}>
                    <View style={[styles.userAvatar, {
                      backgroundColor: u.is_staff ? colors.amber : colors.blue,
                    }]}>
                      <Text style={styles.userAvatarText}>
                        {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={styles.userCardInfo}>
                      <Text style={[styles.userCardName, { color: colors.text }]}>
                        {u.username} {u.is_staff ? '👑' : ''}
                      </Text>
                      <Text style={[styles.userCardEmail, { color: colors.textDim }]}>
                        {u.email}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: u.is_active ? colors.green : colors.red }
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {u.is_active ? 'ACTIVE' : 'BANNED'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.userCardStats}>
                    <Text style={[styles.userCardStat, { color: colors.textDim }]}>
                      📱 {u.phone_number || 'No phone'}
                    </Text>
                    <Text style={[styles.userCardStat, { color: colors.amber }]}>
                      🪙 {u.token_balance} tokens
                    </Text>
                  </View>

                  <View style={styles.userCardActions}>
                    <TouchableOpacity
                      style={[styles.userActionBtn, {
                        borderColor: u.is_active ? colors.red : colors.green,
                      }]}
                      onPress={function() { toggleUserStatus(u.username, u.is_active); }}
                      disabled={actionLoading === u.username}
                    >
                      {actionLoading === u.username ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <Text style={[
                          styles.userActionText,
                          { color: u.is_active ? colors.red : colors.green }
                        ]}>
                          {u.is_active ? '🚫 DEACTIVATE' : '✅ ACTIVATE'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.userActionBtn, { borderColor: colors.amber }]}
                      onPress={function() { openTokenModal(u); }}
                    >
                      <Text style={[styles.userActionText, { color: colors.amber }]}>
                        🪙 ADD TOKENS
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {filteredUsers.length === 0 && (
              <Text style={[styles.noResults, { color: colors.textDim }]}>
                No users found
              </Text>
            )}

          </View>
        )}

        <Text style={[styles.footer, { color: colors.textDim }]}>
          Developed by: 💞🙏 Engineer Joe 🇰🇪
        </Text>

      </ScrollView>

      {/* Add Tokens Modal */}
      <Modal
        visible={tokenModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={function() { setTokenModalVisible(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {
            backgroundColor: colors.surface,
            borderColor: colors.amber,
          }]}>
            <Text style={[styles.modalTitle, { color: colors.amber }]}>
              🪙 ADD TOKENS
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textDim }]}>
              {selectedUser ? selectedUser.username : ''}
            </Text>

            <TextInput
              style={[styles.modalInput, {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.bg,
              }]}
              placeholder="Enter token amount"
              placeholderTextColor={colors.textDim}
              value={tokenAmount}
              onChangeText={setTokenAmount}
              keyboardType="number-pad"
              autoFocus={true}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={function() { setTokenModalVisible(false); }}
              >
                <Text style={[styles.modalBtnText, { color: colors.textDim }]}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.amber }]}
                onPress={submitAddTokens}
              >
                <Text style={[styles.modalBtnText, { color: colors.bg }]}>
                  CONFIRM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'monospace', marginTop: 16, letterSpacing: 3, fontSize: 11,
  },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 32,
    borderBottomWidth: 1,
  },
  tag: {
    fontSize: 10, letterSpacing: 3,
    fontFamily: 'monospace', marginBottom: 6,
  },
  title: {
    fontSize: 20, fontWeight: '900', fontFamily: 'monospace',
  },
  logoutBtn: {
    borderWidth: 1, padding: 10, paddingHorizontal: 14,
  },
  logoutText: {
    fontSize: 11, letterSpacing: 2, fontFamily: 'monospace',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, padding: 16, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: 'monospace', fontSize: 12, letterSpacing: 1,
    fontWeight: '700',
  },
  scrollArea: { flex: 1 },
  overviewContent: { padding: 20 },
  sectionTitle: {
    fontSize: 10, letterSpacing: 3,
    fontFamily: 'monospace', marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  statCard: {
    width: '31%', borderWidth: 1, borderTopWidth: 3,
    padding: 14, alignItems: 'center',
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: {
    fontSize: 22, fontWeight: '900', fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 8, letterSpacing: 1, fontFamily: 'monospace',
    marginTop: 4, textAlign: 'center',
  },
  recentUserRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, padding: 12, marginBottom: 8, gap: 12,
  },
  recentUserAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  recentUserAvatarText: {
    color: '#fff', fontFamily: 'monospace', fontWeight: '900',
  },
  recentUserInfo: { flex: 1 },
  recentUserName: {
    fontFamily: 'monospace', fontWeight: '700', fontSize: 13,
  },
  recentUserEmail: {
    fontFamily: 'monospace', fontSize: 10, marginTop: 2,
  },
  recentUserMeta: { alignItems: 'flex-end' },
  recentUserTokens: {
    fontFamily: 'monospace', fontSize: 11, fontWeight: '700',
  },
  recentUserVerified: {
    fontFamily: 'monospace', fontSize: 9, marginTop: 4,
  },
  usersContent: { padding: 20 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, paddingHorizontal: 14, marginBottom: 16,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1, fontFamily: 'monospace', fontSize: 13, paddingVertical: 12,
  },
  userCard: {
    borderWidth: 1, padding: 14, marginBottom: 12,
  },
  userCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: {

