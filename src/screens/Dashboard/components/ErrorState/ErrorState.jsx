import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../../constants/colors';
import { errorStateStyles as styles } from './ErrorState.styles';

export const ErrorState = ({ 
  error,
  onRetry 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="error-outline" size={64} color={COLORS.error} />
      </View>
      <Text style={styles.title}>Unable to Load Forms</Text>
      <Text style={styles.message}>
        {error?.data?.message || 'Please check your connection and try again.'}
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};