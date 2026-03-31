import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ProtectedRoute from './ProtectedRoute';
import OfflineBanner from '../components/UI/OfflineBanner';
import Screen from '../Layout/Screen';

const RootNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <NavigationContainer>
      <ProtectedRoute>
        <Screen>
          {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
          {/* <MainNavigator /> */}
        </Screen>
      </ProtectedRoute>
      {/* <OfflineBanner /> */}
    </NavigationContainer>
  );
};

export default RootNavigator;
