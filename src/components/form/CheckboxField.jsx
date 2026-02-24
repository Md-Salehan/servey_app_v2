import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import commonStyles from './FormComponents.styles';

const CheckboxField = ({
  fcId,
  label,
  value = false,
  onChange,
  required = false,
  disabled = false,
  description = '',
  error = '',
  size = 'medium',
  customStyle = {},
  isPreview = false, // New prop for preview mode
  onError = null // New prop for error handling callback
}) => {
  // Parse boolean value - handle string "true"/"false" as well
  const isChecked = useMemo(() => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return Boolean(value);
  }, [value]);
  
  const [isPressed, setIsPressed] = useState(false);
  const [fieldValidationError, setFieldValidationError] = useState('');


  // Animation value for scale effect
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Animation value for checkmark
  const checkmarkAnim = useRef(new Animated.Value(isChecked ? 1 : 0)).current;

  // Handle checkbox press
  const handlePress = useCallback(() => {
    if (disabled || isPreview) return;
    setIsPressed(true);
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle checkmark animation
    Animated.timing(checkmarkAnim, {
      toValue: isChecked ? 0 : 1,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();

    onChange(!isChecked);
  }, [disabled, isChecked, onChange, scaleAnim, checkmarkAnim, isPreview]);

  // Update checkmark animation when value changes externally
  useEffect(() => {
    if (!isPreview) {
      Animated.timing(checkmarkAnim, {
        toValue: isChecked ? 1 : 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  }, [isChecked, checkmarkAnim, isPreview]);

  // Validation effect for required fields
  useEffect(() => {
    if (isPressed && required && !isChecked) {
      handleFieldValidation('This field is required', `${label} is required`);
      return;
    }
    handleFieldValidation('');
  }, [isChecked, required, isPressed]);

  const handleFieldValidation = (errorMessage, externalErrorMessage) => {
    setFieldValidationError(errorMessage || '');
    onError && onError(externalErrorMessage || errorMessage || '');
  };

    

  // Determine styles based on state
  const checkboxStyle = useMemo(() => {
    const baseStyles = [styles.checkbox];
    
    // Size variant
    if (size === 'small') baseStyles.push(styles.checkboxSmall);
    if (size === 'large') baseStyles.push(styles.checkboxLarge);
    
    // State styles
    if (isChecked) {
      baseStyles.push(disabled || isPreview ? styles.checkboxDisabledChecked : styles.checkboxChecked);
    } else {
      baseStyles.push(styles.checkboxUnchecked);
    }
    
    if (disabled || isPreview) baseStyles.push(styles.checkboxDisabled);
    if (error && !isChecked && required) baseStyles.push(styles.checkboxError);
    
    return baseStyles;
  }, [isChecked, disabled, error, required, size, isPreview]);

  const labelStyle = useMemo(() => {
    const baseStyles = [styles.labelText];
    
    // Size variant
    if (size === 'small') baseStyles.push(styles.labelTextSmall);
    if (size === 'large') baseStyles.push(styles.labelTextLarge);
    
    // State styles
    if (isChecked && !disabled && !isPreview) baseStyles.push(styles.labelTextChecked);
    if (disabled ) baseStyles.push(styles.labelTextDisabled);
    if (error && !isChecked && required) baseStyles.push(styles.labelTextError);
    
    return baseStyles;
  }, [isChecked, disabled, error, required, size, isPreview]);

  const checkmarkStyle = useMemo(() => {
    const baseStyles = [styles.checkmark];
    
    // Size variant
    if (size === 'small') baseStyles.push(styles.checkmarkSmall);
    if (size === 'large') baseStyles.push(styles.checkmarkLarge);
    
    // State styles
    if (disabled || isPreview) baseStyles.push(styles.checkmarkDisabled);
    
    return baseStyles;
  }, [size, disabled, isPreview]);

  // Animated opacity for checkmark (fade in/out)
  const checkmarkOpacity = checkmarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Animated scale for checkmark (pop effect)
  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 1],
  });

  // Render checkmark with animation
  const renderCheckmark = () => (
    <Animated.View
      style={{
        opacity: checkmarkOpacity,
        transform: [{ scale: checkmarkScale }],
      }}
    >
      <Icon name="check" style={checkmarkStyle} />
    </Animated.View>
  );

  // Accessibility label
  const accessibilityLabel = useMemo(() => {
    let labelText = `${label}. ${isChecked ? 'Checked' : 'Unchecked'}.`;
    if (required) labelText += ' Required.';
    if (disabled) labelText += ' Disabled.';
    if (isPreview) labelText += ' Preview mode.';
    if (error) labelText += ` Error: ${error}`;
    return labelText;
  }, [label, isChecked, required, disabled, error, isPreview]);

  // Preview mode render
  if (isPreview) {
    return (
      <View style={[commonStyles.fieldContainer, styles.container, customStyle.container]}>
        <View style={styles.checkboxWrapper}>
          <View style={styles.previewContainer}>
            {/* Checkbox box */}
            <View style={checkboxStyle}>
              {isChecked && (
                <Icon name="check" style={[checkmarkStyle, styles.previewCheckmark]} />
              )}
            </View>

            {/* Label */}
            <View style={styles.labelContainer}>
              <Text style={labelStyle}>
                {label}
                {required && (
                  <Text style={commonStyles.requiredStar}> *</Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {description ? (
          <View style={styles.descriptionContainer}>
            <Text style={commonStyles.descriptionText}>
              {description}
            </Text>
          </View>
        ) : null}

        {/* Error message for required fields */}
        {required && !isChecked && (
          <View style={styles.errorContainer}>
            <Text style={commonStyles.errorText}>
              This field is required
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Regular edit mode render
  return (
    <View style={[commonStyles.fieldContainer, styles.container, customStyle.container]}>
      <View style={styles.checkboxWrapper}>
        <Pressable
          style={styles.pressableArea}
          onPress={handlePress}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: isChecked,
            disabled,
          }}
          accessibilityHint={required ? 'Required field' : 'Optional field'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {/* Animated checkbox box */}
          <Animated.View
            style={[
              checkboxStyle,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {isChecked && renderCheckmark()}
          </Animated.View>

          {/* Label */}
          <View style={styles.labelContainer}>
            <Text style={labelStyle}>
              {label}
              {required && (
                <Text style={commonStyles.requiredStar}> *</Text>
              )}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Description */}
      {description ? (
        <View style={styles.descriptionContainer}>
          <Text style={commonStyles.descriptionText}>
            {description}
          </Text>
        </View>
      ) : null}

      {/* Error message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={commonStyles.errorText}>
            {error}
          </Text>
        </View>
      ) : fieldValidationError ? (
        <View style={styles.errorContainer}>
          <Text style={commonStyles.errorText}>
            {fieldValidationError}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

CheckboxField.propTypes = {
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string,
    PropTypes.number,
  ]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  description: PropTypes.string,
  error: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  customStyle: PropTypes.object,
  isPreview: PropTypes.bool,
  onError: PropTypes.func,
};

CheckboxField.defaultProps = {
  value: false,
  required: false,
  disabled: false,
  description: '',
  error: '',
  size: 'medium',
  customStyle: {},
  isPreview: false,
  onError: null,
};

export default React.memo(CheckboxField);

const styles = StyleSheet.create({
  // Container styles
  container: {
    marginBottom: 16,
  },
  
  // Checkbox wrapper (label + checkbox)
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  // Pressable area for better touch target
  pressableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingRight: 8,
  },

  // Preview container (non-interactive)
  previewContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingRight: 8,
    opacity: 0.8,
  },
  
  // Checkbox box styles
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxUnchecked: {
    backgroundColor: COLORS.surface,
  },
  checkboxDisabled: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[300],
  },
  checkboxDisabledChecked: {
    backgroundColor: COLORS.gray[300],
    borderColor: COLORS.gray[300],
  },
  checkboxError: {
    borderColor: COLORS.error,
  },
  
  // Size variants
  checkboxSmall: {
    width: 16,
    height: 16,
  },
  checkboxLarge: {
    width: 24,
    height: 24,
  },
  
  // Label styles
  labelContainer: {
    flex: 1,
  },
  labelText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontFamily: 'System',
    lineHeight: 22,
  },
  labelTextChecked: {
    color: COLORS.primary,
  },
  labelTextDisabled: {
    color: COLORS.text.disabled,
  },
  labelTextError: {
    color: COLORS.error,
  },
  
  // Size variants for label
  labelTextSmall: {
    fontSize: 14,
  },
  labelTextLarge: {
    fontSize: 18,
  },
  
  // Checkmark icon
  checkmark: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkmarkSmall: {
    fontSize: 12,
  },
  checkmarkLarge: {
    fontSize: 16,
  },
  checkmarkDisabled: {
    color: COLORS.gray[100],
  },
  previewCheckmark: {
    color: COLORS.gray[500],
  },
  
  // Error message container
  errorContainer: {
    marginTop: 4,
    marginLeft: 32, // Align with checkbox position
  },
  
  // Description container
  descriptionContainer: {
    marginTop: 0,
    marginLeft: 32, // Align with checkbox position
  },
  
  // Ripple effect for Android
  ripple: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 12,
  },
  
  // Focus ring for web/accessibility
  focusRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderRadius: 8,
  },
});