import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_COLORS = {
  green: '#00cc44',
  greenLight: '#00ff55',
  greenDim: '#004422',
  red: '#bb0000',
  black: '#0a0a0a',
  white: '#ffffff',
  blue: '#0f268c',
  blueLight: '#1a35b5',
  amber: '#ffd700',

  bg: '#080c14',
  bg2: '#0d1320',
  surface: '#11182a',
  surfaceGreen: '#0a1f14',
  surfaceBlue: '#0a0f1f',

  border: '#1c2536',
  borderBlue: '#1a2a5a',
  borderRed: '#3f1a1a',

  text: '#f0f0f0',
  textDim: '#7c8aa3',

  primary: '#00cc44',
  accent: '#bb0000',
  accentBlue: '#0f268c',
};

const LIGHT_COLORS = {
  // Kenyan Flag
  green: '#005500',
  greenLight: '#006600',
  greenDim: '#004400',
  red: '#aa0000',
  black: '#0a0a0a',
  white: '#ffffff',
  blue: '#0f268c',
  blueLight: '#1a35b5',
  amber: '#cc8800',

  // Backgrounds
  bg: '#f5f5f0',
  bg2: '#eeeeea',
  surface: '#ffffff',
  surfaceGreen: '#e8f5e8',
  surfaceBlue: '#e8eaf5',

  // Borders
  border: '#c8e0c8',
  borderBlue: '#c8cce8',
  borderRed: '#e8c8c8',

  // Text
  text: '#1a1a1a',
  textDim: '#666666',

  // Primary
  primary: '#005500',
  accent: '#aa0000',
  accentBlue: '#0f268c',
};

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('dark'); // dark | light | system

  const getStoredTheme = async () => {
    try {
      const stored = Platform.OS === 'web'
        ? localStorage.getItem('scilearn_theme')
        : await AsyncStorage.getItem('scilearn_theme');
      if (stored) setThemeMode(stored);
    } catch {}
  };

  useEffect(() => {
    getStoredTheme();
  }, []);

  const setTheme = async (mode) => {
    setThemeMode(mode);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('scilearn_theme', mode);
      } else {
        await AsyncStorage.setItem('scilearn_theme', mode);
      }
    } catch {}
  };

  const isDark = themeMode === 'system'
    ? systemScheme === 'dark'
    : themeMode === 'dark';

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ colors, themeMode, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
