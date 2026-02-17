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
      activeOpacity={0.7}
    >
      <Icon name="logout" size={18} color={COLORS.error} />
      <Text style={styles.logoutButtonText}>Log out</Text>
    </TouchableOpacity>
  );
};

export default LogoutButton;