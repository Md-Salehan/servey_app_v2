import React, { useState, useEffect } from 'react';
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
  minimumDate,
  maximumTime,
  minimumTime,
  required = false,
  editable = true,
  isPreview = false,
  mode = 'date', // 'date', 'time', or 'datetime'
  format = 'YYYY-MM-DD', // Format string for display
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState(mode);
  const [internalDate, setInternalDate] = useState(
    value ? new Date(value) : null,
  );
  const [tempDate, setTempDate] = useState(null);

  // Helper function to combine date and time
  const combineDateAndTime = (date, time) => {
    if (!date) return time;
    if (!time) return date;

    const result = new Date(date);
    result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return result;
  };

  // Apply time constraints
  const applyTimeConstraints = selectedTime => {
    if (!selectedTime) return selectedTime;

    let constrainedTime = new Date(selectedTime);
    console.log('log1 Selected Time:', selectedTime);
    console.log('log2 Constrained Time:', constrainedTime);

    if (minimumTime) {
      const minTime = new Date(minimumTime);
      console.log('log3 Minimum Time:', minTime);
      // Compare only time values (ignore date part)
      const selectedMinutes =
        constrainedTime.getHours() * 60 + constrainedTime.getMinutes();
      const minMinutes = minTime.getHours() * 60 + minTime.getMinutes();
      console.log('log4 Selected Minutes:', selectedMinutes);
      console.log('log5 Minimum Minutes:', minMinutes);
      if (selectedMinutes < minMinutes) {
        // Set to minimum time
        constrainedTime.setHours(
          minTime.getHours(),
          minTime.getMinutes(),
          0,
          0,
        );
      }
    }

    if (maximumTime) {
      const maxTime = new Date(maximumTime);
      console.log('log6 Maximum Time:', maxTime);
      // Compare only time values (ignore date part)
      const selectedMinutes =
        constrainedTime.getHours() * 60 + constrainedTime.getMinutes();
      const maxMinutes = maxTime.getHours() * 60 + maxTime.getMinutes();
      console.log('log7 Selected Minutes:', selectedMinutes);
      console.log('log8 Maximum Minutes:', maxMinutes);
      if (selectedMinutes > maxMinutes) {
        // Set to maximum time
        constrainedTime.setHours(
          maxTime.getHours(),
          maxTime.getMinutes(),
          0,
          0,
        );
      }
    }
    console.log('log9 Final Constrained Time:', constrainedTime);
    return constrainedTime;
  };

  // Apply date constraints
  const applyDateConstraints = selectedDate => {
    if (!selectedDate) return selectedDate;

    let constrainedDate = new Date(selectedDate);

    if (minimumDate) {
      const minDate = new Date(minimumDate);
      minDate.setHours(0, 0, 0, 0);
      constrainedDate.setHours(0, 0, 0, 0);

      if (constrainedDate < minDate) {
        constrainedDate = minDate;
      }
    }

    if (maximumDate) {
      const maxDate = new Date(maximumDate);
      maxDate.setHours(23, 59, 59, 999);

      if (constrainedDate > maxDate) {
        constrainedDate = maxDate;
      }
    }

    return constrainedDate;
  };

  const handleDateChange = (event, selectedDate) => {
    // Handle cancel/dismiss on Android (event type is 'dismissed')
    if (event.type === 'dismissed' || !selectedDate) {
      setShowPicker(false);
      setPickerMode(mode); // Reset picker mode to original
      setTempDate(null); // Clear temporary date
      return;
    }

    // On iOS, we might keep the picker open
    setShowPicker(Platform.OS === 'ios');

    if (selectedDate) {
      let finalDate = selectedDate;

      if (mode === 'time') {
        // Apply time constraints
        finalDate = applyTimeConstraints(selectedDate);
      } else if (mode === 'date') {
        // Apply date constraints
        finalDate = applyDateConstraints(selectedDate);
      } else if (mode === 'datetime') {
        if (pickerMode === 'date') {
          // Store the date part and show time picker
          setTempDate(selectedDate);
          setPickerMode('time');
          setShowPicker(true);
          return;
        } else if (pickerMode === 'time') {
          // Combine date and time, then apply constraints
          const combinedDate = combineDateAndTime(tempDate, selectedDate);
          finalDate = applyDateConstraints(combinedDate);
          finalDate = applyTimeConstraints(finalDate);
          setTempDate(null);
        }
      }

      setInternalDate(finalDate);

      // Format the output based on mode
      let formattedValue;
      if (mode === 'time') {
        // Format as HH:mm
        formattedValue = finalDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } else if (mode === 'datetime') {
        // Format as YYYY-MM-DDTHH:mm
        const dateStr = finalDate.toISOString().split('T')[0];
        const timeStr = finalDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        formattedValue = `${dateStr}T${timeStr}`;
      } else {
        // Default: date only - format as YYYY-MM-DD
        formattedValue = finalDate.toISOString().split('T')[0];
      }

      onChange(formattedValue);
    }
  };

  const parseDateString = dateString => {
    if (!dateString) return null;

    // Handle different formats
    if (dateString.includes('T')) {
      // ISO format: YYYY-MM-DDTHH:mm
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    } else if (dateString.includes(':')) {
      // Time only: HH:mm
      const [hours, minutes] = dateString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } else {
      // Date only: YYYY-MM-DD
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  };

  const formatDisplayValue = dateString => {
    if (!dateString) return '';

    const date = parseDateString(dateString);
    if (!date) return '';

    if (mode === 'time') {
      // For time only, extract time part
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } else if (mode === 'datetime') {
      // For datetime, show both date and time
      const datePart = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const timePart = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart} ${timePart}`;
    } else {
      // Default: date only
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getPickerMode = () => {
    if (mode === 'datetime') {
      // For datetime, we need to show date picker first then time picker
      return pickerMode;
    }
    return mode;
  };

  const getPickerProps = () => {
    const props = {};

    if (mode === 'date' || (mode === 'datetime' && pickerMode === 'date')) {
      if (minimumDate) props.minimumDate = new Date(minimumDate);
      if (maximumDate) props.maximumDate = new Date(maximumDate);
    } else if (
      mode === 'time' ||
      (mode === 'datetime' && pickerMode === 'time')
    ) {
      // For time picker, we need to handle min/max time differently
      // DateTimePicker doesn't directly support min/max time, so we'll use the date object with time constraints
      const baseDate = internalDate || new Date();

      if (minimumTime) {
        const minTime = new Date(minimumTime);
        baseDate.setHours(minTime.getHours(), minTime.getMinutes(), 0, 0);
      }

      if (maximumTime) {
        const maxTime = new Date(maximumTime);
        baseDate.setHours(maxTime.getHours(), maxTime.getMinutes(), 59, 999);
      }
    }

    return props;
  };

  const handlePickerButtonPress = () => {
    if (!editable) return;

    if (mode === 'datetime') {
      // For datetime, start with date picker
      setPickerMode('date');
    }
    setShowPicker(true);
  };

  const isTimeWithinConstraints = time => {
    if (!minimumTime && !maximumTime) return true;

    const timeValue = time.getHours() * 60 + time.getMinutes();

    if (minimumTime) {
      const minTime = new Date(minimumTime);
      const minValue = minTime.getHours() * 60 + minTime.getMinutes();
      if (timeValue < minValue) return false;
    }

    if (maximumTime) {
      const maxTime = new Date(maximumTime);
      const maxValue = maxTime.getHours() * 60 + maxTime.getMinutes();
      if (timeValue > maxValue) return false;
    }

    return true;
  };

  // For preview mode, show the formatted value in a non-interactive container
  if (isPreview) {
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{label}</Text>
          {required && <Text style={styles.requiredStar}>*</Text>}
        </View>
        <View
          style={[
            styles.previewValueContainer,
            !value && styles.previewEmptyValue,
          ]}
        >
          <Text
            style={[
              styles.previewValueText,
              !value && styles.previewPlaceholderText,
            ]}
          >
            {value ? formatDisplayValue(value) : '—'}
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
          {mode === 'datetime' && ' (Date & Time)'}
          {mode === 'time' && ' (Time)'}
        </Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>

      <TouchableOpacity
        style={[styles.selectionButton, !editable && styles.disabledInput]}
        onPress={handlePickerButtonPress}
        activeOpacity={editable ? 0.7 : 1}
        disabled={!editable}
      >
        <Text
          style={[
            styles.datePickerText,
            !value && styles.datePickerPlaceholder,
          ]}
        >
          {value
            ? formatDisplayValue(value)
            : placeholder || getDefaultPlaceholder()}
        </Text>
      </TouchableOpacity>

      {showPicker && editable && (
        <DateTimePicker
          value={internalDate || new Date()}
          mode={getPickerMode()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          {...getPickerProps()}
          style={styles.dateTimePicker}
        />
      )}
    </View>
  );

  function getDefaultPlaceholder() {
    switch (mode) {
      case 'time':
        return 'Select time';
      case 'datetime':
        return 'Select date and time';
      default:
        return 'Select date';
    }
  }
};

export default DatePickerField;
