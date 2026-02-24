import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  errorText = '', // For external error messages
  onError = null, // Callback for validation errors
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState(mode);
  const [internalDate, setInternalDate] = useState(
    value ? parseDateString(value) : null,
  );
  const [tempDate, setTempDate] = useState(null);
  const [fieldValidationError, setFieldValidationError] = useState(
    errorText || '',
  );

  const handleFieldValidation = (errorMessage, externalErrorMessage) => {
    setFieldValidationError(errorMessage || '');
    onError && onError(externalErrorMessage || errorMessage || '');
  };

  // Helper function to parse date string
  function parseDateString(dateString) {
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
  }

  // Validate if date/time is within constraints
  const isWithinConstraints = dateToCheck => {
    if (!dateToCheck) return true;

    if (mode === 'time') {
      return isTimeWithinConstraints(dateToCheck);
    } else if (mode === 'date') {
      return isDateWithinConstraints(dateToCheck);
    } else if (mode === 'datetime') {
      return (
        isDateWithinConstraints(dateToCheck) &&
        isTimeWithinConstraints(dateToCheck)
      );
    }
    return true;
  };

  const isDateWithinConstraints = dateToCheck => {
    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);

    if (minimumDate) {
      const minDate = new Date(minimumDate);
      minDate.setHours(0, 0, 0, 0);
      if (checkDate < minDate) return false;
    }

    if (maximumDate) {
      const maxDate = new Date(maximumDate);
      maxDate.setHours(23, 59, 59, 999);
      if (checkDate > maxDate) return false;
    }

    return true;
  };

  const isTimeWithinConstraints = timeToCheck => {
    console.log(timeToCheck.toString(), 'ssa');

    if (!minimumTime && !maximumTime) return true;

    const checkTime = new Date(timeToCheck);
    const timeValue = checkTime.getHours() * 60 + checkTime.getMinutes();

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

  // Helper function to combine date and time
  const combineDateAndTime = (date, time) => {
    if (!date) return time;
    if (!time) return date;

    const result = new Date(date);
    result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return result;
  };

  const handleDateChange = (event, selectedValue) => {
    // Handle cancel/dismiss on Android (event type is 'dismissed')

    if (event.type === 'dismissed' || !selectedValue) {
      setShowPicker(false);
      setPickerMode(mode); // Reset picker mode to original
      setTempDate(null); // Clear temporary date

      required && handleFieldValidation('This field is required', `${label} is required.`); // Clear any existing validation errors
      return; 
    }

    // On iOS, we might keep the picker open
    setShowPicker(Platform.OS === 'ios');

    if (selectedValue) {
      let finalValue = selectedValue;
      let errorFlag = false;
      let errorMessage = '';

      if (mode === 'time') {
        // Check if selected time is within constraints
        if (!isTimeWithinConstraints(selectedValue)) {
          handleFieldValidation(
            `Time must be between ${formatTime(minimumTime)} and ${formatTime(
              maximumTime,
            )}`,
            `At ${label} time must be between ${formatTime(
              minimumTime,
            )} and ${formatTime(maximumTime)}.`,
          );
          errorFlag = true;
          setShowPicker(false);
        } else {
          handleFieldValidation('');
          finalValue = selectedValue;
        }
      } else if (mode === 'date') {
        // Check if selected date is within constraints
        if (!isDateWithinConstraints(selectedValue)) {
          handleFieldValidation(
            `Date must be between ${formatDate(minimumDate)} and ${formatDate(
              maximumDate,
            )}`,
            `At ${label} date must be between ${formatDate(
              minimumDate,
            )} and ${formatDate(maximumDate)}.`,
          );
          errorFlag = true;
          setShowPicker(false);
        } else {
          handleFieldValidation('');
          finalValue = selectedValue;
        }
      } else if (mode === 'datetime') {
        if (pickerMode === 'date') {
          // Check if selected date is within constraints
          if (!isDateWithinConstraints(selectedValue)) {
            handleFieldValidation(
              `Date must be between ${formatDate(minimumDate)} and ${formatDate(
                maximumDate,
              )}`,
              `At ${label} date must be between ${formatDate(
                minimumDate,
              )} and ${formatDate(maximumDate)}.`,
            );
            errorFlag = true;
            setShowPicker(false);
          } else {
            // Store the date part and show time picker
            setTempDate(selectedValue);
            setPickerMode('time');
            // setShowPicker(true);
            handleFieldValidation('');
            return;
          }
        } else if (pickerMode === 'time') {
          // Check if selected time is within constraints
          if (!isTimeWithinConstraints(selectedValue)) {
            handleFieldValidation(
              `Time must be between ${formatTime(minimumTime)} and ${formatTime(
                maximumTime,
              )}`,
              `At ${label} time must be between ${formatTime(
                minimumTime,
              )} and ${formatTime(maximumTime)}.`,
            );
            errorFlag = true;
            setShowPicker(false);
            setTempDate(null);
          } else {
            // Combine date and time
            finalValue = combineDateAndTime(tempDate, selectedValue);
            handleFieldValidation('');
            setTempDate(null);
          }
        }
      }

      setInternalDate(finalValue);

      // Format the output based on mode
      let formattedValue;
      if (mode === 'time') {
        // Format as HH:mm
        formattedValue = finalValue.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } else if (mode === 'datetime') {
        // Format as YYYY-MM-DDTHH:mm
        const dateStr = finalValue.toISOString().split('T')[0];
        const timeStr = finalValue.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        formattedValue = `${dateStr}T${timeStr}`;
      } else {
        // Default: date only - format as YYYY-MM-DD
        formattedValue = finalValue.toISOString().split('T')[0];
      }

      if (errorFlag) {
        onChange(''); // Clear the value if there's a validation error
        return;
      }

      onChange(formattedValue);
    }
  };

  // Helper functions to format date and time for error messages
  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = timeString => {
    if (!timeString) return '';
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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
    }
    // For time picker, DateTimePicker doesn't support min/max time directly
    // We handle validation manually

    return props;
  };

  const handlePickerButtonPress = () => {
    if (!editable) return;
    handleFieldValidation(''); // Validate before showing picker

    if (mode === 'datetime') {
      // For datetime, start with date picker
      setPickerMode('date');
    }
    setShowPicker(true);
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
        style={[
          styles.selectionButton,
          !editable && styles.disabledInput,
          fieldValidationError && styles.errorBorder,
        ]}
        onPress={handlePickerButtonPress}
        activeOpacity={editable ? 0.7 : 1}
        disabled={!editable}
      >
        <Text
          style={[
            styles.datePickerText,
            !value && styles.datePickerPlaceholder,
            fieldValidationError && styles.errorText,
          ]}
        >
          {value
            ? formatDisplayValue(value)
            : placeholder || getDefaultPlaceholder()}
        </Text>
      </TouchableOpacity>

      {/* Display validation error */}
      {fieldValidationError ? (
        <Text style={styles.errorText}>{fieldValidationError}</Text>
      ) : null}

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

DatePickerField.propTypes = {
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  maximumDate: PropTypes.string,
  minimumDate: PropTypes.string,
  maximumTime: PropTypes.string,
  minimumTime: PropTypes.string,
  required: PropTypes.bool,
  editable: PropTypes.bool,
  isPreview: PropTypes.bool,
  mode: PropTypes.oneOf(['date', 'time', 'datetime']),
  format: PropTypes.string,
  errorText: PropTypes.string,
  onError: PropTypes.func,
};

DatePickerField.defaultProps = {
  placeholder: '',
  value: '',
  onChange: null,
  maximumDate: null,
  minimumDate: null,
  maximumTime: null,
  minimumTime: null,
  required: false,
  editable: true,
  isPreview: false,
  mode: 'date',
  format: 'YYYY-MM-DD',
  errorText: '',
  onError: null,
};

export default DatePickerField;
