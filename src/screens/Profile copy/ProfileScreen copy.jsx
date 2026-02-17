import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { ErrorState } from '../../components';

const ProfileScreen = ({ navigation }) => {
  return (
    <ErrorState
      title="Profile Screen - Coming Soon!"
      error={{ data: { message: 'This feature is currently under development.' } }}
      onAction={() => navigation.goBack()}
      actionButtonText="Go Back"
      actionButtonColor="#007BFF"
      showHeader={true}
      navigation={navigation}
    />
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({});
