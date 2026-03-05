import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import useInternetStatus from '../../hook/useInternetStatus';

export default function OfflineBanner() {
  const { isOnline, isChecking } = useInternetStatus();
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? 100 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  if (isChecking) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.text}>
        {isOnline
          ? 'Back Online'
          : 'No Internet Connection'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#ff3b30',
    paddingVertical: 5,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});