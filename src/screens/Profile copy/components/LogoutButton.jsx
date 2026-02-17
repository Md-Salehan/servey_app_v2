// src/screens/Profile/components/LogoutButton.jsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../constants/colors';
import styles from '../Profile.styles';

const LogoutButton = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={onPress}
      accessibilityLabel="Logout"
      accessibilityHint="Logs out of the application and returns to login screen"
    >
      <Icon name="logout" size={20} color={COLORS.error} />
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  );
};

export default LogoutButton;