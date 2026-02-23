import React, { use, useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, TextInput } from 'react-native';
import { COLORS } from '../../constants/colors';
import styles from './FormComponents.styles';

const TextInputField = ({
  fcId,
  label,
  placeholder,
  value,
  onChangeText,
  maxLength,
  keyboardType = 'default',
  editable = true,
  multiline = false,
  required = false,
  isPreview = false, // New prop for preview mode
  errorText='', // New prop for external error messages
  onError=null, // New prop for error callback
}) => {
  const [text, setText] = useState(value || '');
  const [validationError, setValidationError] = useState(errorText ||''); // Local state for validation errors
  
  const handleChangeText = input => {
    setText(input);
    onChangeText && onChangeText(input);
    checkValidation(); // Validate on every change for real-time feedback
  };

  const handleValidation = () => {
    checkValidation(); // Validate on blur as well to catch any remaining issues
  };

  const checkValidation = () => {
    if (required && !text.trim()) {
      setValidationError('This field is required');
      onError && onError(`${label} is required`);
      return false;
    } else {
      setValidationError('');
      onError && onError('');
      return true;
    }
  };


  // For preview mode, we want to show the value in a non-editable container
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
            {value || '—'}
          </Text>
        </View>
      </View>
    );
  }

  // Regular edit mode
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{label}</Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      <TextInput
        style={[
          styles.textInput,
          !editable && styles.disabledInput,
          multiline && styles.multilineInput,
          validationError && styles.errorBorder,
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text.disabled}
        value={text}
        onChangeText={handleChangeText}
        onBlur={handleValidation}
        maxLength={maxLength}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
      {validationError ? (
        <Text style={styles.errorText}>{validationError}</Text>
      ) : null}
      {maxLength && (
        <Text style={styles.counterText}>
          {text?.length || 0}/{maxLength}
        </Text>
      )}
    </View>
  );
};

TextInputField.propTypes = {
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  maxLength: PropTypes.number,
  keyboardType: PropTypes.string,
  editable: PropTypes.bool,
  multiline: PropTypes.bool,
  required: PropTypes.bool,
  isPreview: PropTypes.bool,
  errorText: PropTypes.string,
  onError: PropTypes.func,
};

TextInputField.defaultProps = {
  placeholder: '',
  value: '',
  onChangeText: null,
  maxLength: null,
  keyboardType: 'default',
  editable: true,
  multiline: false,
  required: false,
  isPreview: false,
  errorText: '',
  onError: null,
};  

export default TextInputField;
