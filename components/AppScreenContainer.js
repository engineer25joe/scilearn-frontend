import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import SideDrawer from './SideDrawer';

const { width } = Dimensions.get('window');
const EDGE_ZONE = 40; // px from left edge where swipe-open starts
const SWIPE_THRESHOLD = 60; // px of horizontal drag needed to trigger open
const CLOSE_SWIPE_THRESHOLD = 60; // px of leftward drag to close when open

export default function AppScreenContainer({ navigation, user, children, style }) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const startX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        startX.current = evt.nativeEvent.pageX;
        if (drawerVisible) return false; // let drawer handle its own overlay taps
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

  const closeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gesture) => {
        return drawerVisible && gesture.dx < -10 && Math.abs(gesture.dy) < 30;
      },
      onPanResponderRelease: (evt, gesture) => {
        if (drawerVisible && gesture.dx < -CLOSE_SWIPE_THRESHOLD) {
          setDrawerVisible(false);
        }
      },
    })
  ).current;

  return (
    <View style={[styles.root, style]} {...panResponder.panHandlers}>
      {children({ openDrawer: () => setDrawerVisible(true) })}

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
        user={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
