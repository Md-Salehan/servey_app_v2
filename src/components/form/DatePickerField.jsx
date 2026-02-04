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

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>
          {label}
        </Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.datePickerText,
          !internalDate && styles.datePickerPlaceholder
        ]}>
          {internalDate ? formatDate(internalDate) : placeholder}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
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