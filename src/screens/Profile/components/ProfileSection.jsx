// src/screens/Profile/components/ProfileSection.jsx
import React from 'react';
import { View, Text } from 'react-native';
import styles from '../Profile.styles';

const ProfileSection = ({ title, children }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export default ProfileSection;