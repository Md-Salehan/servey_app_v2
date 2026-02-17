// src/screens/Profile/components/ProfileHeader.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '../../../constants/colors';
import styles from '../Profile.styles';

// Dummy avatar color mapping based on user ID or name
const getAvatarColor = (seed) => {
  const colors = [
    styles.avatar1,
    styles.avatar2,
    styles.avatar3,
    styles.avatar4,
    styles.avatar5,
    styles.avatar6,
    styles.avatar7,
    styles.avatar8,
  ];
  
  let hash = 0;
  const str = seed || 'default';
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const ProfileHeader = ({ userData, isEditing, onImageChange }) => {
  const [avatarColor, setAvatarColor] = useState(styles.avatar1);

  useEffect(() => {
    // Set avatar color based on user identifier
    const seed = userData?.id || userData?.phone || userData?.email || 'default';
    setAvatarColor(getAvatarColor(seed));
  }, [userData]);

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.assets && response.assets[0]) {
        onImageChange(response.assets[0]);
      }
    });
  };

  const getInitials = () => {
    if (userData?.firstName && userData?.lastName) {
      return (userData.firstName.charAt(0) + userData.lastName.charAt(0)).toUpperCase();
    }
    if (userData?.firstName) {
      return userData.firstName.charAt(0).toUpperCase();
    }
    if (userData?.phone) {
      return userData.phone.slice(-2);
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    if (userData?.firstName) {
      return userData.firstName;
    }
    if (userData?.phone) {
      return `User ${userData.phone.slice(-4)}`;
    }
    if (userData?.email) {
      return userData.email.split('@')[0];
    }
    return 'Survey Collector';
  };

  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        {userData?.profilePicture ? (
          <Image
            source={{ uri: userData.profilePicture }}
            style={styles.avatar}
            accessibilityLabel="Profile picture"
          />
        ) : (
          <View style={[styles.dummyAvatar, avatarColor]}>
            <Text style={styles.avatarPlaceholderText}>{getInitials()}</Text>
          </View>
        )}
        
        {isEditing && (
          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={handleImagePick}
            activeOpacity={0.8}
            accessibilityLabel="Change profile picture"
          >
            <Icon name="camera-alt" size={18} color={COLORS.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.userName}>{getDisplayName()}</Text>
      
      {userData?.designation && (
        <Text style={styles.userDesignation}>{userData.designation}</Text>
      )}
      
      {userData?.employeeId && (
        <Text style={styles.userId}>ID: {userData.employeeId}</Text>
      )}

      <View style={styles.userBadge}>
        <Text style={styles.userBadgeText}>
          {userData?.role || 'Survey Collector'}
        </Text>
      </View>
    </View>
  );
};

// Add Skeleton loading state
ProfileHeader.Skeleton = () => (
  <View style={styles.profileHeader}>
    <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.gray[200] }]} />
    <View style={[styles.userName, { backgroundColor: COLORS.gray[200], width: 200, height: 32, borderRadius: 8, marginTop: 16 }]} />
    <View style={[styles.userDesignation, { backgroundColor: COLORS.gray[200], width: 150, height: 24, borderRadius: 12, marginTop: 8 }]} />
  </View>
);

export default ProfileHeader;