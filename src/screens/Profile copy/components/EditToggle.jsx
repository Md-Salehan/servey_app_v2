// src/screens/Profile/components/EditToggle.jsx
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../constants/colors';
import styles from '../Profile.styles';

const EditToggle = ({ isEditing, onEdit, onSave, onCancel }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isEditing) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      //   <Animated.View
      //     style={[
      //       styles.editToggle,
      //       {
      //         transform: [{
      //           translateX: slideAnim.interpolate({
      //             inputRange: [0, 1],
      //             outputRange: [50, 0],
      //           }),
      //         }],
      //       },
      //     ]}
      //   >
      <View style={styles.editToggle}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
          accessibilityLabel="Cancel editing"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSave}
          activeOpacity={0.7}
          accessibilityLabel="Save changes"
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      //   </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={onEdit}
        activeOpacity={0.8}
        accessibilityLabel="Edit profile"
      >
        <Icon name="edit" size={20} color={COLORS.text.inverse} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default EditToggle;
