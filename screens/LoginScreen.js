import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoints.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem('scibase_user', JSON.stringify(data));
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}> ATENTION ATENTION {`\n`} THIS APP IS CURRENTLY UNDER DEVELOPMENT {`\n`} YOU MAY EXPIRIENCE SOME ERRORS</Text>
      <Text style={styles.title}>WELCOME{'\n'}<Text style={styles.accent}>.</Text></Text>

      <View style={styles.form}>
        <Text style={styles.label}>USERNAME</Text>
        <TextInput
          style={styles.input}
          placeholder="your_username"
          placeholderTextColor={COLORS.textDim}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.bg} />
            : <Text style={styles.btnText}>LOGIN →</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>No account? <Text style={styles.linkAccent}>REGISTER HERE →</Text></Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Developed by: 💞🙏 Engineer Joe 🙏💞</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.bg, padding: 28, justifyContent: 'center' },
  tag: { color: COLORS.textDim, fontSize: 35, letterSpacing: 3, marginBottom: 16, fontFamily: 'monospace', justifyContent: 'center' },
  title: { fontSize: 42, fontWeight: '900', color: COLORS.primary, lineHeight: 48, marginBottom: 40, fontFamily: 'monospace' },
  accent: { color: COLORS.amber },
  form: { borderWidth: 1, borderColor: COLORS.border, padding: 24, backgroundColor: COLORS.surface },
  label: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, marginBottom: 8, fontFamily: 'monospace' },
  input: {
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text, padding: 14, marginBottom: 20,
    fontFamily: 'monospace', fontSize: 14, backgroundColor: COLORS.bg,
  },
  btn: { backgroundColor: COLORS.primary, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: COLORS.bg, fontWeight: '700', letterSpacing: 3, fontFamily: 'monospace' },
  link: { textAlign: 'center', marginTop: 20, color: COLORS.textDim, fontFamily: 'monospace', fontSize: 13 },
  linkAccent: { color: COLORS.primary },
  footer: { textAlign: 'center', color: COLORS.textDim, fontSize: 11, marginTop: 40, fontFamily: 'monospace' },
});
