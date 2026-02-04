import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCurrentUserQuery } from '../../features/auth/authApi';
import { logout } from '../../features/auth/authSlice';
import { styles } from './Profile.styles';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user: cachedUser } = useSelector((state) => state.auth);
  
  const {
    data: userData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetCurrentUserQuery(undefined, {
    skip: !cachedUser?.id, // Skip if we don't have cached user
  });

  const user = userData || cachedUser;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading || isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading profile...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error?.data?.message || 'Failed to load profile'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No user data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={handleRefresh}
          colors={['#1890ff']}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            {/* <Image
              source={{ uri: user.image || 'https://dummyjson.com/icon/user/128' }}
              style={styles.avatar}
              defaultSource={require('../../assets/default-avatar.png')}
            /> */}
            <View style={styles.userInfo}>
              <Text style={styles.name}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.username}>@{user.username}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.value}>{user.id}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.value}>
                {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not specified'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;