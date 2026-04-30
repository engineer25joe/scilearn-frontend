import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../constants/colors';
import { endpoints } from '../constants/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoints.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          phone_number: form.phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem('scibase_user', JSON.stringify(data));
        Alert.alert('🎉 Welcome!', `Account created! You got ${data.tokens} free tokens 🪙`, [
          { text: 'LETS GO!', onPress: () => navigation.replace('Dashboard') }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Registration failed');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.tag}>// CREATE ACCOUNT</Text>
      <Text style={styles.title}>JOIN<Text style={styles.accent}>.</Text></Text>

      <View style={styles.tokenBadge}>
        <Text style={styles.tokenIcon}>🪙</Text>
        <Text style={styles.tokenText}>Get <Text style={styles.tokenAccent}>7 FREE TOKENS</Text> on signup</Text>
      </View>

      <View style={styles.form}>
        {[
          { label: 'USERNAME', key: 'username', placeholder: 'engineer_joe' },
          { label: 'EMAIL', key: 'email', placeholder: 'joe@example.com' },
          { label: 'PHONE (M-PESA)', key: 'phone', placeholder: '0712345678' },
          { label: 'PASSWORD', key: 'password', placeholder: 'min. 8 characters', secure: true },
        ].map(field => (
          <View key={field.key}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={COLORS.textDim}
              value={form[field.key]}
              onChangeText={v => update(field.key, v)}
              secureTextEntry={field.secure}
              autoCapitalize="none"
              keyboardType={field.key === 'phone' ? 'phone-pad' : field.key === 'email' ? 'email-address' : 'default'}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.bg} />
            : <Text style={styles.btnText}>CREATE ACCOUNT →</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already registered? <Text style={styles.linkAccent}>LOGIN →</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.bg, padding: 28 },
  tag: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, marginBottom: 16, marginTop: 40, fontFamily: 'monospace' },
  title: { fontSize: 42, fontWeight: '900', color: COLORS.primary, marginBottom: 24, fontFamily: 'monospace' },
  accent: { color: COLORS.amber },
  tokenBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 24, backgroundColor: COLORS.surface, gap: 12 },
  tokenIcon: { fontSize: 24 },
  tokenText: { color: COLORS.textDim, fontFamily: 'monospace', fontSize: 13 },
  tokenAccent: { color: COLORS.primary, fontWeight: '700' },
  form: { borderWidth: 1, borderColor: COLORS.border, padding: 24, backgroundColor: COLORS.surface },
  label: { color: COLORS.textDim, fontSize: 11, letterSpacing: 3, marginBottom: 8, fontFamily: 'monospace' },
  input: { borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, padding: 14, marginBottom: 20, fontFamily: 'monospace', fontSize: 14, backgroundColor: COLORS.bg },
  btn: { backgroundColor: COLORS.primary, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: COLORS.bg, fontWeight: '700', letterSpacing: 3, fontFamily: 'monospace' },
  link: { textAlign: 'center', marginTop: 20, color: COLORS.textDim, fontFamily: 'monospace', fontSize: 13 },
  linkAccent: { color: COLORS.primary },
});
