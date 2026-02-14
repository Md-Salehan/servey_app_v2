import React from 'react';
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
}) => {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>
          {label}
        </Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      <TextInput
        style={[
          styles.textInput,
          !editable && styles.disabledInput,
          multiline && styles.multilineInput,
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text.disabled}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
      {maxLength && (
        <Text style={styles.counterText}>
          {value?.length || 0}/{maxLength}
        </Text>
      )}
    </View>
  );
};

export default TextInputField;