// src/screens/Profile/components/EditToggle.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../constants/colors';
import styles from '../Profile.styles';

const EditToggle = ({ isEditing, onEdit, onSave, onCancel }) => {
  if (isEditing) {
    return (
      <View style={styles.editToggle}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.editButton}
      onPress={onEdit}
      activeOpacity={0.8}
    >
      <Icon name="edit" size={16} color={COLORS.text.inverse} />
      <Text style={styles.editButtonText}>Edit</Text>
    </TouchableOpacity>
  );
};

export default EditToggle;