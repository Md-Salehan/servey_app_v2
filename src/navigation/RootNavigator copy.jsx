import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ProtectedRoute from './ProtectedRoute';

const RootNavigator = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <MainNavigator />
      {/* <ProtectedRoute>
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      </ProtectedRoute> */}
    </NavigationContainer>
  );
};

export default RootNavigator;