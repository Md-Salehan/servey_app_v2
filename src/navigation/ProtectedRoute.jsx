import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { initializeAuth } from '../features/auth/authSlice';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }

  return children;
};

export default ProtectedRoute;