import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Platform,
  TouchableOpacity, TextInput, ScrollView,
  Animated, PanResponder, KeyboardAvoidingView,
  ActivityIndicator, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BTN_SIZE = 64;
const MARGIN_PCT = 0.02;
const SIDE_MARGIN = SCREEN_WIDTH * MARGIN_PCT;
const CHAT_WIDTH = SCREEN_WIDTH * 0.75;
const STORAGE_KEY = 'scilearn_ai_btn_side';
const HISTORY_KEY = 'scilearn_ai_chat_history';
const API_URL = 'https://scilearnbackend.onrender.com/api';
const MIN_HEIGHT = SCREEN_HEIGHT * 0.25;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.75;

export default function FloatingAIChat({ user }) {
  const [side, setSide] = useState('right');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHeight, setChatHeight] = useState(MIN_HEIGHT);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const pan = useRef(new Animated.ValueXY({
    x: SCREEN_WIDTH - BTN_SIZE - SIDE_MARGIN,
    y: SCREEN_HEIGHT * 0.65,
  })).current;
  const chatAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    loadSide();
    loadHistory();
  }, []);

  useEffect(() => {
    if (messages.length > 0 && chatOpen) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Grow chat height as messages increase, capped at MAX_HEIGHT
    if (messages.length > 0) {
      const estimated = MIN_HEIGHT + messages.length * 60;
      const next = Math.min(estimated, MAX_HEIGHT);
      if (next > chatHeight) setChatHeight(next);
    }
  }, [messages.length]);

  const loadSide = async () => {
    try {
      const saved = Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'left') {
        setSide('left');
        pan.setValue({ x: SIDE_MARGIN, y: SCREEN_HEIGHT * 0.65 });
      }
    } catch {}
  };

  const saveSide = async (value) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, value);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, value);
      }
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const raw = Platform.OS === 'web'
        ? localStorage.getItem(HISTORY_KEY)
        : await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          const estimated = MIN_HEIGHT + parsed.length * 60;
          setChatHeight(Math.min(estimated, MAX_HEIGHT));
        }
      }
    } catch {}
    setSessionLoaded(true);
  };

  const saveHistory = async (msgs) => {
    try {
      const json = JSON.stringify(msgs);
      if (Platform.OS === 'web') {
        localStorage.setItem(HISTORY_KEY, json);
      } else {
        await AsyncStorage.setItem(HISTORY_KEY, json);
      }
    } catch {}
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragging.current = false;
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
          dragging.current = true;
        }
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        )(e, gesture);
      },
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();

        if (!dragging.current) {
          toggleChat();
          return;
        }

        const currentX = pan.x._value;
        const snapLeft = currentX < SCREEN_WIDTH / 2;
        let finalY = pan.y._value;
        if (finalY < 80) finalY = 80;
        if (finalY > SCREEN_HEIGHT - BTN_SIZE - 40) {
          finalY = SCREEN_HEIGHT - BTN_SIZE - 40;
        }

        Animated.spring(pan, {
          toValue: {
            x: snapLeft ? SIDE_MARGIN : SCREEN_WIDTH - BTN_SIZE - SIDE_MARGIN,
            y: finalY,
          },
          useNativeDriver: false, friction: 6,
        }).start();

        const newSide = snapLeft ? 'left' : 'right';
        setSide(newSide);
        saveSide(newSide);
      },
    })
  ).current;

  const toggleChat = () => {
    if (chatOpen) {
      Animated.timing(chatAnim, {
        toValue: 0, duration: 250, useNativeDriver: false,
      }).start(() => setChatOpen(false));
    } else {
      setChatOpen(true);
      Animated.spring(chatAnim, {
        toValue: 1, tension: 60, friction: 10, useNativeDriver: false,
      }).start();
    }
  };

  const getUserData = async () => {
    try {
      const raw = Platform.OS === 'web'
        ? localStorage.getItem('scibase_user')
        : await AsyncStorage.getItem('scibase_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || aiLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setInput('');
    setAiLoading(true);

    try {
      const userData = await getUserData();
      const username = userData?.username || 'guest';

      const res = await fetch(`${API_URL}/qa/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
        },
        body: JSON.stringify({ question: text }),
      });

      const data = await res.json();
      const answer = data.answer || data.response || data.message || 'I could not get a response. Please try again.';

      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedWithAi = [...updatedWithUser, aiMsg];
      setMessages(updatedWithAi);
      await saveHistory(updatedWithAi);
    } catch {
      const errMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: 'Sorry, I could not connect to the server. Please check your internet and try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updated = [...updatedWithUser, errMsg];
      setMessages(updated);
      await saveHistory(updated);
    }

    setAiLoading(false);
  };

  const clearHistory = async () => {
    setMessages([]);
    setChatHeight(MIN_HEIGHT);
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(HISTORY_KEY);
      } else {
        await AsyncStorage.removeItem(HISTORY_KEY);
      }
    } catch {}
  };

  // Chat box position: same side as bubble, 2% from edge
  const chatLeft = side === 'left' ? SIDE_MARGIN : undefined;
  const chatRight = side === 'right' ? SIDE_MARGIN : undefined;

  const chatHeightAnim = chatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, chatHeight],
  });

  const chatOpacity = chatAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const userAvatar = user?.avatar_url || null;
  const userInitial = (user?.username || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Chat Popup */}
      {chatOpen && (
        <KeyboardAvoidingView
          style={[styles.chatWrapper, { left: chatLeft, right: chatRight, width: CHAT_WIDTH }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <Animated.View style={[
            styles.chatBox,
            { height: chatHeightAnim, opacity: chatOpacity },
          ]}>

            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.aiAvatarSmall}>
                  <Text style={styles.aiAvatarSmallText}>🤖</Text>
                </View>
                <View>
                  <Text style={styles.chatHeaderTitle}>SCI LEARN AI</Text>
                  <View style={styles.onlineRow}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Online</Text>
                  </View>
                </View>
              </View>
              <View style={styles.chatHeaderRight}>
                <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
                  <Text style={styles.clearBtnText}>🗑️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={toggleChat}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }}
            >
              {messages.length === 0 && (
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatIcon}>🤖</Text>
                  <Text style={styles.emptyChatTitle}>SCI LEARN AI</Text>
                  <Text style={styles.emptyChatSub}>
                    Ask me anything about coding, data science, cybersecurity, or your courses!
                  </Text>
                </View>
              )}

              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgRow,
                      isUser ? styles.msgRowUser : styles.msgRowAI,
                    ]}
                  >
                    {/* AI avatar — left side */}
                    {!isUser && (
                      <View style={styles.aiAvatar}>
                        <Text style={styles.aiAvatarText}>🤖</Text>
                      </View>
                    )}

                    {/* Bubble */}
                    <View style={[
                      styles.bubble,
                      isUser ? styles.bubbleUser : styles.bubbleAI,
                    ]}>
                      <Text style={[
                        styles.bubbleText,
                        isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
                      ]}>
                        {msg.text}
                      </Text>
                      <Text style={styles.bubbleTime}>{msg.time}</Text>
                    </View>

                    {/* User avatar — right side */}
                    {isUser && (
                      <View style={styles.userAvatar}>
                        {userAvatar ? (
                          <Image
                            source={{ uri: userAvatar }}
                            style={styles.userAvatarImg}
                          />
                        ) : (
                          <Text style={styles.userAvatarText}>{userInitial}</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* AI typing indicator */}
              {aiLoading && (
                <View style={[styles.msgRow, styles.msgRowAI]}>
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiAvatarText}>🤖</Text>
                  </View>
                  <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                    <ActivityIndicator color="#22c55e" size="small" />
                    <Text style={styles.typingText}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputField}
                value={input}
                onChangeText={setInput}
                placeholder="Ask anything..."
                placeholderTextColor="#6b7280"
                multiline
                maxLength={500}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || aiLoading) && { opacity: 0.4 }]}
                onPress={sendMessage}
                disabled={!input.trim() || aiLoading}
              >
                <Text style={styles.sendBtnText}>▶</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      )}

      {/* Floating Bubble */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bubble_btn,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          },
        ]}
      >
        <View style={[styles.bubble_inner, chatOpen && styles.bubble_innerActive]}>
          <Text style={styles.bubble_icon}>🤖</Text>
          <View style={styles.sparkle} />
        </View>
        {!chatOpen && (
          <Text style={styles.bubble_label}>Ask Q&A AI</Text>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  // Chat wrapper
  chatWrapper: {
    position: 'absolute',
    bottom: BTN_SIZE + 20,
    zIndex: 998,
  },
  chatBox: {
    backgroundColor: '#0e1117',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1c2a1e',
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 14,
  },
  chatHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#0a1a10', borderBottomWidth: 1, borderBottomColor: '#1a2e1c',
  },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatarSmall: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#122218', borderWidth: 1.5, borderColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
  },
  aiAvatarSmallText: { fontSize: 16 },
  chatHeaderTitle: { color: '#22c55e', fontWeight: '800', fontSize: 13 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineText: { color: '#6b7280', fontSize: 10 },
  chatHeaderRight: { flexDirection: 'row', gap: 8 },
  clearBtn: {
    width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 14 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#1c2a1e',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#9ca3af', fontSize: 14, fontWeight: '700' },
  messages: { flex: 1 },
  messagesContent: { padding: 12, gap: 10 },
  emptyChat: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  emptyChatIcon: { fontSize: 32, marginBottom: 8 },
  emptyChatTitle: { color: '#22c55e', fontWeight: '800', fontSize: 14, marginBottom: 6 },
  emptyChatSub: {
    color: '#6b7280', fontSize: 11.5, textAlign: 'center', lineHeight: 17,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#122218',
    borderWidth: 1, borderColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  aiAvatarText: { fontSize: 14 },
  userAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
  },
  userAvatarImg: { width: 28, height: 28, borderRadius: 14 },
  userAvatarText: { color: '#000', fontWeight: '900', fontSize: 12 },
  bubble: {
    maxWidth: '74%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
  },
  bubbleUser: {
    backgroundColor: '#22c55e', borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#131d17', borderWidth: 1, borderColor: '#1c2e20',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  bubbleTextUser: { color: '#000', fontWeight: '600' },
  bubbleTextAI: { color: '#e5e7eb' },
  bubbleTime: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  typingText: { color: '#22c55e', fontSize: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, borderTopWidth: 1, borderTopColor: '#1a2e1c',
    backgroundColor: '#0a1a10',
  },
  inputField: {
    flex: 1, backgroundColor: '#121d15', borderWidth: 1, borderColor: '#1c2e20',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    color: '#e5e7eb', fontSize: 13, maxHeight: 80,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },

  // Floating bubble
  bubble_btn: {
    position: 'absolute', zIndex: 999, alignItems: 'center',
  },
  bubble_inner: {
    width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2,
    backgroundColor: '#0e1a10', borderWidth: 2, borderColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
  },
  bubble_innerActive: {
    backgroundColor: '#22c55e', borderColor: '#16a34a',
  },
  bubble_icon: { fontSize: 28 },
  sparkle: {
    position: 'absolute', top: 6, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e',
  },
  bubble_label: {
    color: '#22c55e', fontSize: 9, fontFamily: 'monospace',
    fontWeight: '700', marginTop: 4, textAlign: 'center', width: 80,
  },
});
