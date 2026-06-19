import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { apiRequest, logout as authLogout, isAdmin } from '../utils/auth';

function StatCard(props) {
  var colors = props.colors;
  return (
    <View style={[styles.statCard, {
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderTopColor: props.color,
    }]}>
      <Text style={styles.statIcon}>{props.icon}</Text>
      <Text style={[styles.statValue, { color: props.color }]}>{props.value}</Text>
      <Text style={[styles.statLabel, { color: colors.textDim }]}>{props.label}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  var theme = useTheme();
  var colors = theme.colors;
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [activeTab, setActiveTab] = useState('overview');
  var [stats, setStats] = useState(null);
  var [users, setUsers] = useState([]);
  var [search, setSearch] = useState('');
  var [actionLoading, setActionLoading] = useState('');

  var [tokenModalVisible, setTokenModalVisible] = useState(false);
  var [selectedUser, setSelectedUser] = useState(null);
  var [tokenAmount, setTokenAmount] = useState('');

  useEffect(function() {
    checkAdminAndLoad();
  }, []);

  function checkAdminAndLoad() {
    isAdmin().then(function(admin) {
      if (!admin) {
        Alert.alert('Access Denied', 'Admin privileges required');
        navigation.replace('Dashboard');
        return;
      }
      loadData();
    });
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      apiRequest('/users/admin/stats/').then(function(r) { return r.json(); }),
      apiRequest('/users/admin/users/').then(function(r) { return r.json(); }),
    ]).then(function(results) {
      var statsData = results[0];
      var usersData = results[1];
      if (statsData && !statsData.error) setStats(statsData);
      if (usersData && usersData.users) setUsers(usersData.users);
      setLoading(false);
    }).catch(function() {
      Alert.alert('Error', 'Failed to load admin data');
      setLoading(false);
    });
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  function toggleUserStatus(targetUsername, currentStatus) {
    var action = currentStatus ? 'deactivate' : 'activate';
    setActionLoading(targetUsername);
    apiRequest('/users/admin/toggle-user/', {
      method: 'POST',
      body: JSON.stringify({
        target_username: targetUsername,
        action: action,
      }),
    }).then(function(res) {
      return res.json().then(function(data) {
        if (res.ok) {
          setUsers(function(prev) {
            return prev.map(function(u) {
              if (u.username === targetUsername) {
                var updated = Object.assign({}, u);
                updated.is_active = !currentStatus;
                return updated;
              }
              return u;
            });
          });
        } else {
          Alert.alert('Error', data.error || 'Action failed');
        }
      });
    }).catch(function() {
      Alert.alert('Error', 'Cannot connect to server');
    }).finally(function() {
      setActionLoading('');
    });
  }

  function openTokenModal(user) {
    setSelectedUser(user);
    setTokenAmount('');
    setTokenModalVisible(true);
  }

  function submitAddTokens() {
    var amount = parseInt(tokenAmount, 10);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Enter a valid token amount');
      return;
    }
    apiRequest('/users/admin/toggle-user/', {
      method: 'POST',
      body: JSON.stringify({
        target_username: selectedUser.username,
        action: 'add_tokens',
        tokens: amount,
      }),
    }).then(function(res) {
      return res.json().then(function(data) {
        if (res.ok) {
          setUsers(function(prev) {
            return prev.map(function(u) {
              if (u.username === selectedUser.username) {
                var updated = Object.assign({}, u);
                updated.token_balance = data.new_balance;
                return updated;
              }
              return u;
            });
          });
          setTokenModalVisible(false);
          Alert.alert('✅ Success', data.message);
        } else {
          Alert.alert('Error', data.error || 'Failed to add tokens');
        }
      });
    }).catch(function() {
      Alert.alert('Error', 'Cannot connect to server');
    });
  }

  function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'LOGOUT',
          style: 'destructive',
          onPress: function() {
            authLogout().then(function() {
              navigation.replace('Auth');
            });
          }
        }
      ]
    );
  }

  var filteredUsers = users.filter(function(u) {
    if (!search) return true;
    var q = search.toLowerCase();
    var unameMatch = u.username && u.username.toLowerCase().indexOf(q) !== -1;
    var emailMatch = u.email && u.email.toLowerCase().indexOf(q) !== -1;
    return unameMatch || emailMatch;
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

      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: colors.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: colors.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: colors.green }]} />
      </View>

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

      <View style={[styles.tabs, {
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }]}>
        <TouchableOpacity
          style={activeTab === 'overview' ? [styles.tab, { borderBottomColor: colors.green, borderBottomWidth: 3 }] : styles.tab}
          onPress={function() { setActiveTab('overview'); }}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'overview' ? colors.green : colors.textDim }
          ]}>
            📊 OVERVIEW
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={activeTab === 'users' ? [styles.tab, { borderBottomColor: colors.blue, borderBottomWidth: 3 }] : styles.tab}
          onPress={function() { setActiveTab('users'); }}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'users' ? colors.blue : colors.textDim }
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'monospace',
    marginTop: 16,
    letterSpacing: 3,
    fontSize: 11,
  },
  flagBanner: {
    flexDirection: 'row',
    height: 6,
  },
  flagStripe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 32,
    borderBottomWidth: 1,
  },
  tag: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  logoutBtn: {
    borderWidth: 1,
    padding: 10,
    paddingHorizontal: 14,
  },
  logoutText: {
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  overviewContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '31%',
    borderWidth: 1,
    borderTopWidth: 3,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontFamily: 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  recentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  recentUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentUserAvatarText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '900',
  },
  recentUserInfo: {
    flex: 1,
  },
  recentUserName: {
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 13,
  },
  recentUserEmail: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 2,
  },
  recentUserMeta: {
    alignItems: 'flex-end',
  },
  recentUserTokens: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  recentUserVerified: {
    fontFamily: 'monospace',
    fontSize: 9,
    marginTop: 4,
  },
  usersContent: {
    padding: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
    paddingVertical: 12,
  },
  userCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '900',
  },
  userCardInfo: {
    flex: 1,
  },
  userCardName: {
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 13,
  },
  userCardEmail: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '900',
  },
  userCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userCardStat: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  userCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  userActionBtn: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  userActionText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  noResults: {
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 13,
    marginTop: 40,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    margin: 32,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    borderWidth: 2,
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    padding: 14,
    fontFamily: 'monospace',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});