import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../constants/colors';
import styles from './FormComponents.styles';

const DatePickerField = ({
  fcId,
  label,
  placeholder,
  value,
  onChange,
  maximumDate,
  required = false,
  editable = true, // New prop
  isPreview = false, // New prop for preview mode
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [internalDate, setInternalDate] = useState(value ? new Date(value) : null);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setInternalDate(selectedDate);
      onChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // For preview mode, show the formatted date in a non-interactive container
  if (isPreview) {
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            {label}
          </Text>
          {required && <Text style={styles.requiredStar}>*</Text>}
        </View>
        <View style={[styles.previewValueContainer, !value && styles.previewEmptyValue]}>
          <Text style={[styles.previewValueText, !value && styles.previewPlaceholderText]}>
            {value ? formatDate(value) : '—'}
          </Text>
        </View>
      </View>
    );
  }

  // Regular edit mode
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>
          {label}
        </Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      
      <TouchableOpacity
        style={[styles.selectionButton, !editable && styles.disabledInput]}
        onPress={() => editable && setShowDatePicker(true)}
        activeOpacity={editable ? 0.7 : 1}
        disabled={!editable}
      >
        <Text style={[
          styles.datePickerText,
          !internalDate && styles.datePickerPlaceholder,
          !editable && styles.disabledInput
        ]}>
          {internalDate ? formatDate(internalDate) : placeholder}
        </Text>
      </TouchableOpacity>

      {showDatePicker && editable && (
        <DateTimePicker
          value={internalDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          style={styles.dateTimePicker}
        />
      )}
    </View>
  );
};

export default DatePickerField;