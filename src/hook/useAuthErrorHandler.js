
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import TokenService from '../services/storage/tokenService';

export const useAuthErrorHandler = () => {
  const dispatch = useDispatch();

  const handleApiError = useCallback(async (error, customHandler) => {
    console.error('API Error:', error);

    // Check if error response exists
    if (error?.status === 'FETCH_ERROR') {
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Handle token expiration (401)
    if (error?.status === 401) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await TokenService.clearTokens();
              dispatch(logout());
            },
          },
        ]
      );
      return;
    }

    // Handle server errors (500)
    if (error?.status >= 500) {
      Alert.alert(
        'Server Error',
        'Something went wrong on our end. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Use custom handler if provided
    if (customHandler) {
      customHandler(error);
      return;
    }

    // Default error message from API or generic message
    const errorMessage = error?.data?.message || 
                        error?.data?.details || 
                        error?.message || 
                        'An error occurred. Please try again.';

    Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
  }, [dispatch]);

  return { handleApiError };
};
