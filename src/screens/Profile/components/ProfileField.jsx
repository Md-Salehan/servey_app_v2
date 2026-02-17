// src/screens/Profile/components/ProfileField.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../../constants/colors';
import styles from '../Profile.styles';

const ProfileField = ({
  label,
  value,
  displayValue,
  placeholder = 'Not provided',
  isEditing,
  onChangeText,
  onDateChange,
  onDropdownChange,
  onLocationChange,
  onToggleChange,
  isDate = false,
  isDropdown = false,
  isLocation = false,
  isToggle = false,
  toggleValue = false,
  dropdownOptions = [],
  keyboardType = 'default',
  maxLength,
  rightIcon,
  rightIconColor,
  helperText,
  description,
  multiline = false,
  required = false,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && onDateChange) {
      onDateChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleDropdownSelect = (item) => {
    setSelectedValue(item.value);
    setShowDropdown(false);
    if (onDropdownChange) {
      onDropdownChange(item.value);
    }
  };

  const handleLocationPress = () => {
    if (onLocationChange) {
      onLocationChange('Fetching location...');
      setTimeout(() => {
        onLocationChange('Current location captured');
      }, 1000);
    }
  };

  // View mode
  if (!isEditing) {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {label} {required && <Text style={{ color: COLORS.error }}>*</Text>}
        </Text>
        <View style={styles.fieldValueContainer}>
          <Text style={[styles.fieldValue, !value && { color: COLORS.text.disabled }]}>
            {displayValue || value || placeholder}
          </Text>
          {rightIcon && (
            <Icon name={rightIcon} size={18} color={rightIconColor || COLORS.success} />
          )}
        </View>
        {helperText && <Text style={styles.fieldHelper}>{helperText}</Text>}
      </View>
    );
  }

  // Edit mode
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={{ color: COLORS.error }}>*</Text>}
      </Text>
      
      {isDate ? (
        <>
          <TouchableOpacity
            style={[styles.datePickerButton, isFocused && styles.textInputFocused]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={value ? styles.dateText : styles.placeholderText}>
              {value ? formatDate(value) : 'Select date'}
            </Text>
            <Icon name="calendar-today" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
          {(showDatePicker || Platform.OS === 'ios') && (
            <DateTimePicker
              value={value ? new Date(value) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </>
      ) : isDropdown ? (
        <>
          <TouchableOpacity
            style={[styles.dropdownButton, isFocused && styles.textInputFocused]}
            onPress={() => setShowDropdown(true)}
            activeOpacity={0.7}
          >
            <Text style={value ? styles.dropdownText : styles.placeholderText}>
              {displayValue || value || placeholder}
            </Text>
            <Icon name="arrow-drop-down" size={22} color={COLORS.text.secondary} />
          </TouchableOpacity>
          
          <Modal
            visible={showDropdown}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDropdown(false)}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select {label}</Text>
                  <TouchableOpacity onPress={() => setShowDropdown(false)}>
                    <Icon name="close" size={22} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={dropdownOptions}
                  keyExtractor={(item) => item.value}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        selectedValue === item.value && styles.dropdownItemSelected,
                      ]}
                      onPress={() => handleDropdownSelect(item)}
                      activeOpacity={0.6}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedValue === item.value && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {selectedValue === item.value && (
                        <Icon name="check" size={18} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      ) : isLocation ? (
        <TouchableOpacity
          style={[styles.locationButton, isFocused && styles.textInputFocused]}
          onPress={handleLocationPress}
          activeOpacity={0.7}
        >
          <Icon name="location-on" size={18} color={COLORS.primary} />
          <Text style={value ? styles.locationText : styles.placeholderText}>
            {value || 'Add location'}
          </Text>
        </TouchableOpacity>
      ) : isToggle ? (
        <View style={styles.toggleContainer}>
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
            thumbColor={COLORS.surface}
            ios_backgroundColor={COLORS.gray[300]}
          />
          {description && (
            <Text style={styles.fieldDescription}>{description}</Text>
          )}
        </View>
      ) : (
        <TextInput
          style={[
            styles.textInput, 
            multiline && styles.multilineInput,
            isFocused && styles.textInputFocused
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.disabled}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={COLORS.primary}
        />
      )}
      
      {description && !isToggle && (
        <Text style={styles.fieldDescription}>{description}</Text>
      )}
    </View>
  );
};

export default ProfileField;