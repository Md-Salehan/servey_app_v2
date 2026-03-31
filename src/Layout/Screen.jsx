// Screen.jsx
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OfflineBanner from '../components/UI/OfflineBanner';
import React from 'react';
import useInternetStatus from '../hook/useInternetStatus';

const Screen = ({ children }) => {
  const { isOnline, isChecking } = useInternetStatus();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.contentContainer,
        !isOnline && !isChecking && styles.contentWithBanner // Add padding when offline
      ]}>
        {children}
      </View>
      <OfflineBanner />
    </SafeAreaView>
  );
};

export default Screen;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff', // Add background color
  },
  contentContainer: {
    flex: 1,
  },
  contentWithBanner: {
    paddingBottom: 25, // Add padding when banner is visible
  },
});