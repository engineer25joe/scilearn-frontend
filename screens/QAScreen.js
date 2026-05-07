import React, { useState, useEffect, useRef, Platform } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator,
  Alert, Animated, ScrollView, KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';

export default function QAScreen({ navigation, route }) {
  const courseId = route?.params?.courseId || null;
  const courseTitle = route?.params?.courseTitle || 'General';
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [username, setUsername] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getUserData = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('scibase_user');
    return await AsyncStorage.getItem('scibase_user');
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
    loadUser();
    fetchQuestions();
  }, []);

  const loadUser = async () => {
    const data = await getUserData();
    if (data) setUsername(JSON.parse(data).username);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const url = courseId
        ? `https://scilearnbackend.onrender.com/api/qa/questions/?course_id=${courseId}`
        : 'https://scilearnbackend.onrender.com/api/qa/questions/';
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      Alert.alert('Error', 'Cannot load questions');
    }
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please type your question');
      return;
    }
    if (!username) {
      Alert.alert('Error', 'Please login first');
      return;
    }
    setAsking(true);
    try {
      const res = await fetch(
        'https://scilearnbackend.onrender.com/api/qa/ask/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            question: question.trim(),
            course_id: courseId,
            course_context: courseTitle,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setQuestion('');
        fetchQuestions();
        Alert.alert('✅ AI Answered!', data.ai_answer.substring(0, 200) + '...');
      } else {
        Alert.alert('Error', data.error || 'Failed to ask question');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setAsking(false);
  };

  const renderQuestion = ({ item, index }) => {
    const isExpanded = expandedId === item.id;
    const cardColors = [COLORS.green, COLORS.blue, COLORS.red, COLORS.amber];
    const cardColor = cardColors[index % cardColors.length];

    return (
      <TouchableOpacity
        style={[styles.questionCard, { borderLeftColor: cardColor }]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.9}
      >
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <View style={[styles.userAvatar, { backgroundColor: cardColor }]}>
            <Text style={styles.userAvatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.questionMeta}>
            <Text style={styles.questionUsername}>{item.username}</Text>
            <Text style={styles.questionTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {/* Question Text */}
        <Text style={styles.questionText}>{item.question}</Text>

        {/* AI Answer Preview */}
        {!isExpanded && item.ai_answer && (
          <View style={styles.aiPreview}>
            <Text style={styles.aiPreviewLabel}>🤖 AI: </Text>
            <Text style={styles.aiPreviewText} numberOfLines={2}>
              {item.ai_answer}
            </Text>
          </View>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* AI Answer */}
            {item.ai_answer && (
              <View style={styles.aiAnswer}>
                <View style={styles.aiAnswerHeader}>
                  <Text style={styles.aiIcon}>🤖</Text>
                  <Text style={styles.aiLabel}>SCI AI ASSISTANT</Text>
                </View>
                <Text style={styles.aiAnswerText}>{item.ai_answer}</Text>
              </View>
            )}

            {/* Human Answers */}
            {item.answers.filter(a => !a.is_ai).map((answer, i) => (
              <View key={i} style={styles.humanAnswer}>
                <View style={styles.humanAnswerHeader}>
                  <Text style={styles.humanIcon}>👤</Text>
                  <Text style={styles.humanLabel}>{answer.username}</Text>
                </View>
                <Text style={styles.humanAnswerText}>{answer.answer}</Text>
              </View>
            ))}

            {/* Answer count */}
            <Text style={styles.answerCount}>
              {item.answers.length} answer{item.answers.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">

      {/* Flag Banner */}
      <View style={styles.flagBanner}>
        <View style={[styles.flagStripe, { backgroundColor: COLORS.black }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: COLORS.green }]} />
      </View>

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.tag}>// Q&A PLATFORM</Text>
          <Text style={styles.title}>ASK ANYTHING 🤖</Text>
          <Text style={styles.subtitle}>
            {courseId ? `Course: ${courseTitle}` : 'General Questions'}
          </Text>
        </View>

        {/* Ask Question Box */}
        <View style={styles.askBox}>
          <View style={styles.askHeader}>
            <Text style={styles.askIcon}>💬</Text>
            <Text style={styles.askLabel}>ASK THE AI ASSISTANT</Text>
          </View>
          <TextInput
            style={styles.askInput}
            placeholder="Type your question here..."
            placeholderTextColor={COLORS.textDim}
            value={question}
            onChangeText={setQuestion}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.askBtn, asking && { opacity: 0.7 }]}
            onPress={askQuestion}
            disabled={asking}
          >
            {asking ? (
              <View style={styles.askBtnInner}>
                <ActivityIndicator color={COLORS.white} size="small" />
                <Text style={styles.askBtnText}>  AI IS THINKING...</Text>
              </View>
            ) : (
              <Text style={styles.askBtnText}>🚀 ASK AI →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Questions List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>// RECENT QUESTIONS</Text>
          <TouchableOpacity onPress={fetchQuestions}>
            <Text style={styles.refreshBtn}>↻ REFRESH</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.green} size="large" />
            <Text style={styles.loadingText}>LOADING QUESTIONS...</Text>
          </View>
        ) : questions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💭</Text>
            <Text style={styles.emptyText}>No questions yet</Text>
            <Text style={styles.emptyHint}>Be the first to ask!</Text>
          </View>
        ) : (
          <FlatList
            data={questions}
            keyExtractor={item => item.id.toString()}
            renderItem={renderQuestion}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}

      </Animated.View>
    </KeyboardAvoidingView>
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
  tag: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6,
  },
  title: {
    color: COLORS.green, fontSize: 24,
    fontWeight: '900', fontFamily: 'monospace',
  },
  subtitle: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 12, marginTop: 4,
  },
  askBox: {
    margin: 16, borderWidth: 1,
    borderColor: COLORS.blue, borderTopWidth: 3,
    borderTopColor: COLORS.blue,
    backgroundColor: COLORS.surfaceBlue, padding: 16,
  },
  askHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 12,
  },
  askIcon: { fontSize: 18 },
  askLabel: {
    color: COLORS.blue, fontFamily: 'monospace',
    fontSize: 11, letterSpacing: 2, fontWeight: '700',
  },
  askInput: {
    borderWidth: 1, borderColor: COLORS.borderBlue,
    color: COLORS.text, padding: 12,
    fontFamily: 'monospace', fontSize: 13,
    backgroundColor: COLORS.bg, minHeight: 80,
    marginBottom: 12, borderRadius: 4,
  },
  askBtn: {
    backgroundColor: COLORS.blue,
    padding: 14, alignItems: 'center',
    borderRadius: 4,
  },
  askBtnInner: {
    flexDirection: 'row', alignItems: 'center',
  },
  askBtnText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', letterSpacing: 2, fontSize: 14,
  },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16,
    marginBottom: 4,
  },
  listTitle: {
    color: COLORS.textDim, fontSize: 10,
    letterSpacing: 3, fontFamily: 'monospace',
  },
  refreshBtn: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 12, letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: {
    color: COLORS.green, fontFamily: 'monospace',
    marginTop: 16, letterSpacing: 3, fontSize: 11,
  },
  questionCard: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16, marginBottom: 12,
    borderLeftWidth: 4,
  },
  questionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 12,
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '900', fontSize: 16,
  },
  questionMeta: { flex: 1 },
  questionUsername: {
    color: COLORS.white, fontFamily: 'monospace',
    fontWeight: '700', fontSize: 13,
  },
  questionTime: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 10,
  },
  expandIcon: {
    color: COLORS.textDim, fontFamily: 'monospace', fontSize: 12,
  },
  questionText: {
    color: COLORS.text, fontFamily: 'monospace',
    fontSize: 14, lineHeight: 22, marginBottom: 12,
  },
  aiPreview: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceBlue,
    padding: 10, borderRadius: 4,
  },
  aiPreviewLabel: {
    color: COLORS.blue, fontFamily: 'monospace',
    fontSize: 11, fontWeight: '700',
  },
  aiPreviewText: {
    flex: 1, color: COLORS.textDim,
    fontFamily: 'monospace', fontSize: 11,
  },
  expandedContent: { marginTop: 8 },
  aiAnswer: {
    backgroundColor: COLORS.surfaceBlue,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    padding: 14, marginBottom: 12, borderRadius: 4,
  },
  aiAnswerHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 10,
  },
  aiIcon: { fontSize: 18 },
  aiLabel: {
    color: COLORS.blue, fontFamily: 'monospace',
    fontSize: 10, fontWeight: '900', letterSpacing: 2,
  },
  aiAnswerText: {
    color: COLORS.text, fontFamily: 'monospace',
    fontSize: 13, lineHeight: 22,
  },
  humanAnswer: {
    backgroundColor: COLORS.surfaceGreen,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14, marginBottom: 8, borderRadius: 4,
  },
  humanAnswerHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 8,
  },
  humanIcon: { fontSize: 16 },
  humanLabel: {
    color: COLORS.green, fontFamily: 'monospace',
    fontSize: 11, fontWeight: '700',
  },
  humanAnswerText: {
    color: COLORS.text, fontFamily: 'monospace',
    fontSize: 13, lineHeight: 20,
  },
  answerCount: {
    color: COLORS.textDim, fontFamily: 'monospace',
    fontSize: 11, textAlign: 'right',
  },
  empty: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    color: COLORS.white, fontSize: 16,
    fontFamily: 'monospace', marginBottom: 8,
  },
  emptyHint: {
    color: COLORS.textDim, fontSize: 13, fontFamily: 'monospace',
  },
});
