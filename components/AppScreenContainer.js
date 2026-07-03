import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, PanResponder, Dimensions, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SideDrawer from './SideDrawer';
import FloatingAIChat from './FloatingAIChat';

const { width } = Dimensions.get('window');
const EDGE_ZONE = 40;
const SWIPE_THRESHOLD = 60;

export default function AppScreenContainer({ navigation, user, children, style }) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(user || null);
  const startX = useRef(0);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      loadUser();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const raw = Platform.OS === 'web'
        ? localStorage.getItem('scibase_user')
        : await AsyncStorage.getItem('scibase_user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        startX.current = evt.nativeEvent.pageX;
        if (drawerVisible) return false;
        return startX.current <= EDGE_ZONE;
      },
      onMoveShouldSetPanResponder: (evt, gesture) => {
        if (drawerVisible) return false;
        return startX.current <= EDGE_ZONE && gesture.dx > 10 && Math.abs(gesture.dy) < 30;
      },
      onPanResponderRelease: (evt, gesture) => {
        if (!drawerVisible && gesture.dx > SWIPE_THRESHOLD) {
          setDrawerVisible(true);
        }
      },
    })
  ).current;

  return (
    <View style={[styles.root, style]} {...panResponder.panHandlers}>
      {typeof children === 'function'
        ? children({ openDrawer: () => setDrawerVisible(true) })
        : children
      }

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
        user={currentUser}
      />

      <FloatingAIChat user={currentUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});