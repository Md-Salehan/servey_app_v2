import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import { errorStateStyles as styles } from './ErrorState.styles';

const Header = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

const ErrorState = ({
  error,
  showHeader = false,
  navigation,
  title,
  onAction,
  actionButtonText,
  actionButtonColor = COLORS.primary,
}) => {
  console.log(error, 'errr');

  return (
    <>
      {showHeader && <Header navigation={navigation} />}

      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon name="error-outline" size={64} color={COLORS.error} />
        </View>
        <Text style={styles.title}>{title || 'Something went wrong!'}</Text>
        <Text style={styles.message}>
          {error?.data?.message ||
            'Please check your connection and try again.'}
        </Text>
        {onAction && (
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: actionButtonColor }]} onPress={onAction}>
            <Text style={styles.retryButtonText}>
              {actionButtonText || 'Try Again'}
            </Text>
          </TouchableOpacity>
        )} 
      </View>
    </>
  );
};

export default ErrorState;
