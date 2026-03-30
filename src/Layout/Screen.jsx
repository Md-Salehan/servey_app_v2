import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OfflineBanner from '../components/UI/OfflineBanner';
import React from 'react';
import useInternetStatus from '../hook/useInternetStatus';

const Screen = ({ children }) => {
  const { isOnline, isChecking } = useInternetStatus(); // Ensure the hook is used to trigger the banner logic
  return (
    <SafeAreaView style={[styles.container]}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: isOnline ? '100%' : '50%', // Adjust height when offline to accommodate banner
          overflow: 'hidden', // Prevent content from being hidden behind the banner
        }}
      >
        {children}
      </View>
      <OfflineBanner />
    </SafeAreaView>
  );
};

export default Screen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenContent: {},
});
