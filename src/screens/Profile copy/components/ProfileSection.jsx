// src/screens/Profile/components/ProfileSection.jsx
import React from 'react';
import { View, Text } from 'react-native';
import styles from '../Profile.styles';

const ProfileSection = ({ title, children, rightComponent }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightComponent}
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

ProfileSection.Skeleton = () => <View style={styles.sectionSkeleton} />;

export default ProfileSection;