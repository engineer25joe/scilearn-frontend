import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Alert, Animated, Platform, TextInput, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

function TokenCard({ pkg, index, onBuyMpesa, onBuyPaypal }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400,
        delay: index * 100, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 400,
        delay: index * 100, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isPopular = index === 1;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>🔥 MOST POPULAR</Text>
        </View>
      )}
      <View style={[styles.tokenCard, isPopular && styles.tokenCardPopular]}>
        <View style={styles.tokenCardTop}>
          <Text style={styles.tokenAmount}>{pkg.amount}</Text>
          <Text style={styles.tokenUnit}>TOKENS</Text>
          <Text style={styles.tokenPrice}>KES {pkg.price_kes}</Text>
          <Text style={styles.tokenValue}>= {pkg.amount} mins of content</Text>
        </View>
        <View style={styles.tokenCardButtons}>
          <TouchableOpacity
            style={[styles.buyBtn, { borderColor: COLORS.green }]}
            onPress={() => onBuyMpesa(pkg)}
            onPressIn={() => Animated.spring(scale, {
              toValue: 0.96, useNativeDriver: true, speed: 50
            }).start()}
            onPressOut={() => Animated.spring(scale, {
              toValue: 1, useNativeDriver: true, speed: 50
            }).start()}
          >
            <Text style={[styles.buyBtnIcon]}>📱</Text>
            <Text style={[styles.buyBtnText, { color: COLORS.green }]}>M-PESA</Text>
            <Text style={[styles.buyBtnSub, { color: COLORS.green }]}>STK PUSH</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyBtn, { borderColor: COLORS.blue }]}
            onPress={() => onBuyPaypal(pkg)}
          >
            <Text style={styles.buyBtnIcon}>💳</Text>
            <Text style={[styles.buyBtnText, { color: COLORS.blue }]}>PAYPAL</Text>
            <Text style={[styles.buyBtnSub, { color: COLORS.blue }]}>COMING SOON</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function TokensScreen({ navigation }) {
  const [packages, setPackages] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [transactions, setTransactions] = useState([]);

  // Payment state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  const saveUserData = async (data) => {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('scibase_user', json);
    } else {
      await AsyncStorage.setItem('scibase_user', json);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const userData = await getUserData();
    if (userData) {
      const user = JSON.parse(userData);
      setBalance(user.tokens || 0);
      setUsername(user.username || '');
      setUserPhone(user.phone || '');
      setPhoneInput(user.phone || '');
    }

    // Load packages
    try {
      const res = await fetch(endpoints.tokens);
      const data = await res.json();
      setPackages(data.packages || []);
    } catch {}

    // Load transaction history
    try {
      const userData2 = await getUserData();
      if (userData2) {
        const user = JSON.parse(userData2);
        const res = await fetch(
          'https://scilearnbackend.onrender.com/api/mpesa/history/',
          { headers: { 'X-Username': user.username } }
        );
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch {}

    setLoading(false);
  };

  const handleBuyMpesa = (pkg) => {
    setSelectedPackage(pkg);
    setShowPhoneModal(true);
    setPaymentStatus(null);
  };

  const handleBuyPaypal = (pkg) => {
    Alert.alert(
      '💳 PayPal',
      'PayPal integration coming soon! Stay tuned 🚀',
      [{ text: 'OK' }]
    );
  };

  const initiatePayment = async () => {
    if (!phoneInput || phoneInput.length < 9) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setPaymentLoading(true);
    setPaymentStatus('initiating');

    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/mpesa/stk-push/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Username': username,
          },
          body: JSON.stringify({
            phone_number: phoneInput,
            amount: selectedPackage.price_kes,
            tokens: selectedPackage.amount,
            package_id: selectedPackage.id,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setCurrentTransactionId(data.transaction_id);
        setPaymentStatus('pending');
        setPaymentLoading(false);
        startPolling(data.transaction_id);
      } else {
        setPaymentStatus('failed');
        setPaymentLoading(false);
        Alert.alert('❌ Error', data.error || 'Payment initiation failed');
      }
    } catch (e) {
      setPaymentStatus('failed');
      setPaymentLoading(false);
      Alert.alert('Error', 'Cannot connect to server');
    }
  };

  const startPolling = (txId) => {
    setCheckingPayment(true);
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 12) {
        clearInterval(interval);
        setCheckingPayment(false);
        setPaymentStatus('timeout');
        return;
      }

      try {
        const res = await fetch(
          'https://scilearnbackend.onrender.com/api/mpesa/status/',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction_id: txId }),
          }
        );
        const data = await res.json();

        if (data.status === 'success') {
          clearInterval(interval);
          setCheckingPayment(false);
          setPaymentStatus('success');

          // Update balance
          const newBalance = balance + data.tokens;
          setBalance(newBalance);

          // Update stored user data
          const userData = await getUserData();
          if (userData) {
            const user = JSON.parse(userData);
            user.tokens = newBalance;
            await saveUserData(user);
          }

          // Refresh transactions
          loadData();

        } else if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(interval);
          setCheckingPayment(false);
          setPaymentStatus('failed');
        }
      } catch {}
    }, 5000);
  };

  const closeModal = () => {
    setShowPhoneModal(false);
    setPaymentStatus(null);
    setPaymentLoading(false);
    setSelectedPackage(null);
    setCheckingPayment(false);
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'initiating':
        return (
          <View style={styles.statusBox}>
            <ActivityIndicator color={COLORS.green} size="large" />
            <Text style={styles.statusText}>Sending STK Push...</Text>
            <Text style={styles.statusSub}>Please wait</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={styles.statusBox}>
            <Text style={styles.statusIcon}>📲</Text>
            <Text style={[styles.statusText, { color: COLORS.amber }]}>
              CHECK YOUR PHONE!
            </Text>
            <Text style={styles.statusSub}>
              Enter your M-PESA PIN to complete payment
            </Text>
            {checkingPayment && (
              <View style={styles.pollingRow}>
                <ActivityIndicator color={COLORS.green} size="small" />
                <Text style={styles.pollingText}> Verifying payment...</Text>
              </View>
            )}
          </View>
        );
      case 'success':
        return (
          <View style={styles.statusBox}>
            <Text style={styles.statusIcon}>🎉</Text>
            <Text style={[styles.statusText, { color: COLORS.green }]}>
              PAYMENT SUCCESSFUL!
            </Text>
            <Text style={styles.statusSub}>
              {selectedPackage?.amount} tokens added to your account
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={closeModal}>
              <Text style={styles.doneBtnText}>✓ DONE</Text>
            </TouchableOpacity>
          </View>
        );
      case 'failed':
        return (
          <View style={styles.statusBox}>
            <Text style={styles.statusIcon}>❌</Text>
            <Text style={[styles.statusText, { color: COLORS.red }]}>
              PAYMENT FAILED
            </Text>
            <Text style={styles.statusSub}>Please try again</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => {
              setPaymentStatus(null);
              setPaymentLoading(false);
            }}>
              <Text style={styles.retryBtnText}>↺ TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        );
      case 'timeout':
        return (
          <View style={styles.statusBox}>
            <Text style={styles.statusIcon}>⏱️</Text>
            <Text style={[styles.statusText, { color: COLORS.amber }]}>
              VERIFICATION TIMEOUT
            </Text>
            <Text style={styles.statusSub}>
              Payment may still be processing.{'\n'}
              Check your notifications.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={closeModal}>
              <Text style={styles.doneBtnText}>✓ CLOSE</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tag}>// TOKEN STORE</Text>
        <Text style={styles.title}>BUY TOKENS 🪙</Text>
        <Text style={styles.subtitle}>Power your learning journey 🚀</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceLeft}>
          <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
          <Text style={styles.balanceNum}>
            {balance} <Text style={styles.balanceIcon}>🪙</Text>
          </Text>
          <Text style={styles.balanceHint}>
            Enough for {balance} minutes of content
          </Text>
        </View>
        <View style={styles.balanceRight}>
          <Text style={styles.balanceKes}>= KES {balance}</Text>
          <Text style={styles.balanceRate}>1 token = 1 KES</Text>
        </View>
      </View>

      {/* C2B Info */}
      <View style={styles.c2bCard}>
        <Text style={styles.c2bTitle}>📲 SEND DIRECTLY VIA M-PESA</Text>
        <Text style={styles.c2bText}>
          Send any amount to our Paybill/Till and tokens will be added automatically!
        </Text>
        <View style={styles.c2bDetails}>
          <View style={styles.c2bItem}>
            <Text style={styles.c2bLabel}>PAYBILL/TILL</Text>
            <Text style={styles.c2bValue}>{'XXXXXX'}</Text>
          </View>
          <View style={styles.c2bItem}>
            <Text style={styles.c2bLabel}>ACCOUNT REF</Text>
            <Text style={styles.c2bValue}>{username || 'your_username'}</Text>
          </View>
        </View>
        <Text style={styles.c2bNote}>
          ⚠️ Use your username as the account reference
        </Text>
      </View>

      {/* Packages */}
      <Text style={styles.sectionTitle}>// SELECT PACKAGE</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.green} style={{ marginTop: 40 }} />
      ) : packages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🪙</Text>
          <Text style={styles.emptyText}>No packages available</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          {packages.map((pkg, i) => (
            <TokenCard
              key={pkg.id}
              pkg={pkg}
              index={i}
              onBuyMpesa={handleBuyMpesa}
              onBuyPaypal={handleBuyPaypal}
            />
          ))}
        </View>
      )}

      {/* Transaction History */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        // TRANSACTION HISTORY
      </Text>

      {transactions.length === 0 ? (
        <View style={styles.noTransactions}>
          <Text style={styles.noTransText}>No transactions yet</Text>
        </View>
      ) : (
        <View style={styles.transactionList}>
          {transactions.map((t, i) => (
            <View key={i} style={styles.transaction}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionIcon}>
                  {t.status === 'success' ? '✅' : t.status === 'failed' ? '❌' : '⏳'}
                </Text>
                <View>
                  <Text style={styles.transactionDesc}>
                    KES {t.amount} → {t.tokens} tokens
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </Text>
                  {t.mpesa_receipt ? (
                    <Text style={styles.transactionReceipt}>
                      Receipt: {t.mpesa_receipt}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={[
                styles.transactionBadge,
                { backgroundColor: t.status === 'success' ? COLORS.green + '22' : COLORS.red + '22' }
              ]}>
                <Text style={[
                  styles.transactionStatus,
                  { color: t.status === 'success' ? COLORS.green : t.status === 'failed' ? COLORS.red : COLORS.amber }
                ]}>
                  {t.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🇰🇪</Text>

      {/* M-PESA Payment Modal */}
      <Modal
        visible={showPhoneModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalFlagBar}>
                <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
                <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
                <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
              </View>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>📱 M-PESA PAYMENT</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Package Summary */}
            {selectedPackage && (
              <View style={styles.packageSummary}>
                <Text style={styles.summaryLabel}>PAYING FOR:</Text>
                <Text style={styles.summaryTokens}>
                  {selectedPackage.amount} 🪙 TOKENS
                </Text>
                <Text style={styles.summaryAmount}>
                  KES {selectedPackage.price_kes}
                </Text>
              </View>
            )}

            {/* Payment Status or Phone Input */}
            {paymentStatus ? renderPaymentStatus() : (
              <View style={styles.phoneSection}>
                <Text style={styles.phoneLabel}>M-PESA PHONE NUMBER</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="0712345678"
                  placeholderTextColor={COLORS.textDim}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
                <Text style={styles.phoneHint}>
                  Format: 0712345678 or +254712345678
                </Text>

                <TouchableOpacity
                  style={[styles.payBtn, paymentLoading && { opacity: 0.7 }]}
                  onPress={initiatePayment}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.payBtnText}>
                      💚 PAY KES {selectedPackage?.price_kes} NOW
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.secureText}>
                  🔒 Secured by Safaricom M-PESA Daraja API
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  flagBanner: { flexDirection: 'row', height: 6 },
  flagStripe: { flex: 1 },
  header: {
    padding: 24, paddingTop: 32,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tag: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6,
  },
  title: {
    color: COLORS.green, fontSize: 28,
    fontWeight: '900', fontFamily: 'monospace',
  },
  subtitle: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, marginTop: 4,
  },
  balanceCard: {
    margin: 16, borderWidth: 1,
    borderColor: COLORS.green, borderLeftWidth: 4,
    borderLeftColor: COLORS.green,
    backgroundColor: COLORS.surfaceGreen,
    padding: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  balanceLeft: { flex: 1 },
  balanceLabel: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8,
  },
  balanceNum: {
    color: COLORS.green, fontSize: 44,
    fontWeight: '900', fontFamily: 'monospace',
  },
  balanceIcon: { fontSize: 28 },
  balanceHint: {
    color: COLORS.textDim, fontSize: 10,
    fontFamily: 'monospace', marginTop: 4,
  },
  balanceRight: { alignItems: 'flex-end' },
  balanceKes: {
    color: COLORS.amber, fontFamily: 'monospace',
    fontSize: 14, fontWeight: '700',
  },
  balanceRate: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 10,
  },
  c2bCard: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.blue,
    borderLeftWidth: 4, borderLeftColor: COLORS.blue,
    backgroundColor: COLORS.surfaceBlue, padding: 16,
  },
  c2bTitle: {
    color: COLORS.blue, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 12,
    letterSpacing: 1, marginBottom: 8,
  },
  c2bText: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, lineHeight: 20, marginBottom: 12,
  },
  c2bDetails: {
    flexDirection: 'row', gap: 16, marginBottom: 8,
  },
  c2bItem: {
    flex: 1, borderWidth: 1,
    borderColor: COLORS.borderBlue, padding: 10,
    backgroundColor: COLORS.bg,
  },
  c2bLabel: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 9, letterSpacing: 2, marginBottom: 4,
  },
  c2bValue: {
    color: COLORS.blue, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 14,
  },
  c2bNote: {
    color: COLORS.amber, fontFamily: 'monospace', fontSize: 10,
  },
  sectionTitle: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace',
    paddingHorizontal: 16, marginBottom: 12,
  },
  popularBadge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: 'flex-start', marginLeft: 16,
  },
  popularText: {
    color: COLORS.white, fontSize: 10,
    fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1,
  },
  tokenCard: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 12, overflow: 'hidden',
  },
  tokenCardPopular: {
    borderColor: COLORS.red, borderWidth: 2,
  },
  tokenCardTop: {
    padding: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tokenAmount: {
    color: COLORS.green, fontSize: 36,
    fontWeight: '900', fontFamily: 'monospace',
  },
  tokenUnit: {
    color: COLORS.textDim, fontSize: 11,
    letterSpacing: 2, fontFamily: 'monospace',
  },
  tokenPrice: {
    color: COLORS.amber, fontSize: 20,
    fontFamily: 'monospace', fontWeight: '700', marginTop: 8,
  },
  tokenValue: {
    color: COLORS.textDim, fontSize: 10,
    fontFamily: 'monospace', marginTop: 4,
  },
  tokenCardButtons: {
    flexDirection: 'row',
  },
  buyBtn: {
    flex: 1, borderWidth: 1,
    padding: 14, alignItems: 'center',
    borderTopWidth: 0, borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  buyBtnIcon: { fontSize: 20, marginBottom: 4 },
  buyBtnText: {
    fontFamily: 'monospace', fontSize: 12,
    fontWeight: '700', letterSpacing: 1,
  },
  buyBtnSub: {
    fontFamily: 'monospace', fontSize: 9,
    letterSpacing: 1, marginTop: 2,
  },
  transactionList: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  transaction: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  transactionLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1,
  },
  transactionIcon: { fontSize: 20 },
  transactionDesc: {
    color: COLORS.text, fontFamily: 'monospace', fontSize: 13,
  },
  transactionDate: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 10,
    marginTop: 2,
  },
  transactionReceipt: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 9,
    marginTop: 2,
  },
  transactionBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
  },
  transactionStatus: {
    fontFamily: 'monospace', fontWeight: '700', fontSize: 10,
    letterSpacing: 1,
  },
  noTransactions: {
    marginHorizontal: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  noTransText: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 12,
  },
  empty: {
    alignItems: 'center', padding: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    color: COLORS.white, fontSize: 16, fontFamily: 'monospace',
  },
  footer: {
    textAlign: 'center', color: COLORS.textDim,
    fontSize: 11, margin: 32, fontFamily: 'monospace',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    minHeight: 400,
  },
  modalFlagBar: { flexDirection: 'row', height: 6 },
  modalHeader: { overflow: 'hidden' },
  modalTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.green, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 16, letterSpacing: 2,
  },
  closeBtn: {
    borderWidth: 1, borderColor: COLORS.border,
    padding: 8, paddingHorizontal: 12,
  },
  closeBtnText: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 14,
  },
  packageSummary: {
    padding: 16, borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surfaceGreen,
    alignItems: 'center',
  },
  summaryLabel: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 10, letterSpacing: 3,
  },
  summaryTokens: {
    color: COLORS.green, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 24, marginTop: 4,
  },
  summaryAmount: {
    color: COLORS.amber, fontFamily: 'monospace',
    fontWeight: '700', fontSize: 18,
  },
  phoneSection: { padding: 20 },
  phoneLabel: {
    color: COLORS.textDim, fontSize: 11,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8,
  },
  phoneInput: {
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text, padding: 14,
    fontFamily: 'monospace', fontSize: 18,
    backgroundColor: COLORS.surface, marginBottom: 8,
    letterSpacing: 2,
  },
  phoneHint: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 10, marginBottom: 20,
  },
  payBtn: {
    backgroundColor: COLORS.green,
    padding: 18, alignItems: 'center',
    borderBottomWidth: 4, borderBottomColor: COLORS.greenLight,
  },
  payBtnText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 16, letterSpacing: 2,
  },
  secureText: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 10, textAlign: 'center', marginTop: 12,
  },

  // Status Styles
  statusBox: {
    padding: 32, alignItems: 'center',
  },
  statusIcon: { fontSize: 56, marginBottom: 16 },
  statusText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 16, letterSpacing: 2,
    textAlign: 'center',
  },
  statusSub: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, textAlign: 'center',
    marginTop: 8, lineHeight: 20,
  },
  pollingRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
  },
  pollingText: {
    color: COLORS.green, fontFamily: 'monospace', fontSize: 12,
  },
  doneBtn: {
    marginTop: 20, backgroundColor: COLORS.green,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  doneBtnText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', letterSpacing: 3,
  },
  retryBtn: {
    marginTop: 20, borderWidth: 1,
    borderColor: COLORS.green,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  retryBtnText: {
    color: COLORS.green, fontFamily: 'monospace',
    fontWeight: '900', letterSpacing: 3,
  },
});