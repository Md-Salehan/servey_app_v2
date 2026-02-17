// src/screens/Profile/ProfileScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES } from '../../constants/routes';
import { COLORS } from '../../constants/colors';
import { logout, updateUserField } from '../../features/auth/authSlice';
import TokenService from '../../services/storage/tokenService';
import styles from './Profile.styles';

// Components
import ProfileHeader from './components/ProfileHeader';
import ProfileSection from './components/ProfileSection';
import ProfileField from './components/ProfileField';
import EditToggle from './components/EditToggle';
import LogoutButton from './components/LogoutButton';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  // Initialize form data from Redux store
  useEffect(() => {
    if (user) {
      // Map the API response structure to our form structure
      const mappedData = {
        id: user.userId || user.id || '',
        phone: user.mobNo || user.phone || '',
        email: user.emailId || user.email || '',
        firstName: user.userNm || user.firstName || '',
        lastName: user.lastName || '',
        profilePicture: user.profilePicture || '',
        designation: user.userDsgn || user.designation || '',
        department: user.department || '',
        employeeId: user.mobRegno || user.employeeId || '',
        joinDate: user.joinDate || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'IN',
        },
        preferences: user.preferences || {
          language: 'en',
          notifications: true,
          darkMode: false,
          syncFrequency: 'realtime',
        },
        emergencyContact: user.emergencyContact || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        workLocation: user.workLocation || '',
        role: user.role || 'Survey Collector',
      };
      
      setFormData(mappedData);
      setOriginalData(mappedData);
    }
  }, [user]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleNestedFieldChange = useCallback((parent, child, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value,
      },
    }));
  }, []);

  const handleSave = async () => {
    // Validate required fields
    const requiredFields = [
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'email', label: 'Email' },
    ];

    const missingFields = requiredFields.filter(
      req => !formData[req.field]?.trim()
    );

    if (missingFields.length > 0) {
      Alert.alert(
        'Required Fields',
        `Please fill in: ${missingFields.map(f => f.label).join(', ')}`
      );
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (JSON.stringify(formData) !== JSON.stringify(originalData)) {
      // Update Redux store with changes
      Object.keys(formData).forEach(key => {
        if (JSON.stringify(formData[key]) !== JSON.stringify(originalData[key])) {
          dispatch(updateUserField({ [key]: formData[key] }));
        }
      });
      setOriginalData(formData);
      
      // Show success message
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', style: 'default' }]
      );
    }
    
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (JSON.stringify(formData) !== JSON.stringify(originalData)) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setFormData(originalData);
              setIsEditing(false);
            },
          },
        ]
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh user data from AsyncStorage
    const userData = await TokenService.getUserData();
    if (userData) {
      dispatch(updateUserField(userData));
    }
    setRefreshing(false);
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.LOGIN }],
            });
          },
        },
      ]
    );
  }, [dispatch, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* Header with Back and Edit Toggle */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              handleCancel();
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        {isSaving ? (
          <View style={styles.editToggle}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <EditToggle
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Header */}
        <ProfileHeader
          userData={formData}
          isEditing={isEditing && !isSaving}
          onImageChange={(imageData) => handleFieldChange('profilePicture', imageData.uri)}
        />

        {/* Personal Information Section */}
        <ProfileSection title="Personal Information">
          <ProfileField
            label="First Name"
            value={formData.firstName}
            placeholder="Enter first name"
            isEditing={isEditing}
            onChangeText={(value) => handleFieldChange('firstName', value)}
            required
          />

          <ProfileField
            label="Last Name"
            value={formData.lastName}
            placeholder="Enter last name"
            isEditing={isEditing}
            onChangeText={(value) => handleFieldChange('lastName', value)}
            required
          />

          <ProfileField
            label="Email"
            value={formData.email}
            placeholder="Enter email address"
            isEditing={isEditing}
            onChangeText={(value) => handleFieldChange('email', value)}
            keyboardType="email-address"
            required
            rightIcon={!isEditing && formData.email ? "verified" : null}
            rightIconColor={COLORS.success}
          />

          <ProfileField
            label="Phone"
            value={formData.phone}
            placeholder="Not provided"
            isEditing={false}
            rightIcon="check-circle"
            rightIconColor={COLORS.success}
            helperText="Verified phone number"
          />

          <ProfileField
            label="Date of Birth"
            value={formData.dateOfBirth}
            placeholder="Select date of birth"
            isEditing={isEditing}
            isDate
            onDateChange={(date) => handleFieldChange('dateOfBirth', date)}
          />

          <ProfileField
            label="Gender"
            value={formData.gender}
            placeholder="Select gender"
            isEditing={isEditing}
            isDropdown
            dropdownOptions={[
              { label: 'Male', value: 'M' },
              { label: 'Female', value: 'F' },
              { label: 'Other', value: 'O' },
              { label: 'Prefer not to say', value: 'N' },
            ]}
            onDropdownChange={(value) => handleFieldChange('gender', value)}
          />
        </ProfileSection>

        {/* Professional Information Section */}
        <ProfileSection title="Professional Information">
          <ProfileField
            label="Employee ID"
            value={formData.employeeId}
            placeholder="Not provided"
            isEditing={false}
            helperText="Cannot be changed"
          />

          <ProfileField
            label="Designation"
            value={formData.designation}
            placeholder="Enter designation"
            isEditing={isEditing}
            onChangeText={(value) => handleFieldChange('designation', value)}
          />

          <ProfileField
            label="Department"
            value={formData.department}
            placeholder="Enter department"
            isEditing={isEditing}
            onChangeText={(value) => handleFieldChange('department', value)}
          />

          <ProfileField
            label="Join Date"
            value={formData.joinDate}
            placeholder="Select join date"
            isEditing={isEditing}
            isDate
            onDateChange={(date) => handleFieldChange('joinDate', date)}
          />

          <ProfileField
            label="Work Location"
            value={formData.workLocation}
            placeholder="Capture work location"
            isEditing={isEditing}
            isLocation
            onLocationChange={(location) => handleFieldChange('workLocation', location)}
          />
        </ProfileSection>

        {/* Contact Information Section */}
        <ProfileSection title="Contact Information">
          <ProfileField
            label="Street Address"
            value={formData.address?.street}
            placeholder="Enter street address"
            isEditing={isEditing}
            onChangeText={(value) => handleNestedFieldChange('address', 'street', value)}
            multiline
          />

          <ProfileField
            label="City"
            value={formData.address?.city}
            placeholder="Enter city"
            isEditing={isEditing}
            onChangeText={(value) => handleNestedFieldChange('address', 'city', value)}
          />

          <ProfileField
            label="State"
            value={formData.address?.state}
            placeholder="Enter state"
            isEditing={isEditing}
            onChangeText={(value) => handleNestedFieldChange('address', 'state', value)}
          />

          <ProfileField
            label="Pincode"
            value={formData.address?.pincode}
            placeholder="Enter 6-digit pincode"
            isEditing={isEditing}
            onChangeText={(value) => handleNestedFieldChange('address', 'pincode', value)}
            keyboardType="numeric"
            maxLength={6}
          />

          <ProfileField
            label="Country"
            value={formData.address?.country}
            placeholder="Select country"
            isEditing={isEditing}
            isDropdown
            dropdownOptions={[
              { label: 'India', value: 'IN' },
              { label: 'United States', value: 'US' },
              { label: 'United Kingdom', value: 'UK' },
              { label: 'Canada', value: 'CA' },
              { label: 'Australia', value: 'AU' },
            ]}
            onDropdownChange={(value) => handleNestedFieldChange('address', 'country', value)}
          />

          <ProfileField
            label="Emergency Contact"
            value={formData.emergencyContact}
            placeholder="Enter emergency contact"
            isEditing={isEditing}
            onChangeText={(value) => handleFieldChange('emergencyContact', value)}
            keyboardType="phone-pad"
            helperText="For emergency purposes only"
          />
        </ProfileSection>

        {/* Preferences Section */}
        <ProfileSection title="Preferences">
          <ProfileField
            label="Language"
            value={formData.preferences?.language}
            displayValue={
              formData.preferences?.language === 'en' ? 'English' :
              formData.preferences?.language === 'hi' ? 'Hindi' :
              formData.preferences?.language === 'bn' ? 'Bengali' :
              formData.preferences?.language === 'te' ? 'Telugu' :
              formData.preferences?.language === 'ta' ? 'Tamil' : 'English'
            }
            isEditing={isEditing}
            isDropdown
            dropdownOptions={[
              { label: 'English', value: 'en' },
              { label: 'Hindi', value: 'hi' },
              { label: 'Bengali', value: 'bn' },
              { label: 'Telugu', value: 'te' },
              { label: 'Tamil', value: 'ta' },
            ]}
            onDropdownChange={(value) => handleNestedFieldChange('preferences', 'language', value)}
          />

          <ProfileField
            label="Push Notifications"
            value={formData.preferences?.notifications}
            isEditing={isEditing}
            isToggle
            toggleValue={formData.preferences?.notifications}
            onToggleChange={(value) => handleNestedFieldChange('preferences', 'notifications', value)}
            description="Receive notifications about survey assignments and updates"
          />

          <ProfileField
            label="Dark Mode"
            value={formData.preferences?.darkMode}
            isEditing={isEditing}
            isToggle
            toggleValue={formData.preferences?.darkMode}
            onToggleChange={(value) => handleNestedFieldChange('preferences', 'darkMode', value)}
            description="Switch to dark theme for better visibility in low light"
          />

          <ProfileField
            label="Sync Frequency"
            value={formData.preferences?.syncFrequency}
            displayValue={
              formData.preferences?.syncFrequency === 'realtime' ? 'Real Time' :
              formData.preferences?.syncFrequency === 'hourly' ? 'Hourly' :
              formData.preferences?.syncFrequency === 'daily' ? 'Daily' :
              formData.preferences?.syncFrequency === 'weekly' ? 'Weekly' : 'Real Time'
            }
            isEditing={isEditing}
            isDropdown
            dropdownOptions={[
              { label: 'Real Time', value: 'realtime' },
              { label: 'Hourly', value: 'hourly' },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
            ]}
            onDropdownChange={(value) => handleNestedFieldChange('preferences', 'syncFrequency', value)}
            description="How often to sync data with server"
          />
        </ProfileSection>

        {/* Account Actions */}
        <ProfileSection title="Account Actions">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Change password feature will be available soon')}
            activeOpacity={0.6}
          >
            <Icon name="lock" size={22} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Icon name="chevron-right" size={22} color={COLORS.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Export data feature will be available soon')}
            activeOpacity={0.6}
          >
            <Icon name="download" size={22} color={COLORS.info} />
            <Text style={styles.actionButtonText}>Export My Data</Text>
            <Icon name="chevron-right" size={22} color={COLORS.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.destructiveAction]}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'This action cannot be undone. All your data will be permanently deleted.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => Alert.alert('Coming Soon', 'Delete account feature will be available soon')
                  },
                ]
              );
            }}
            activeOpacity={0.6}
          >
            <Icon name="delete" size={22} color={COLORS.error} />
            <Text style={[styles.actionButtonText, styles.destructiveText]}>
              Delete Account
            </Text>
            <Icon name="chevron-right" size={22} color={COLORS.error} />
          </TouchableOpacity>
        </ProfileSection>

        {/* Logout Button */}
        <LogoutButton onPress={handleLogout} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;