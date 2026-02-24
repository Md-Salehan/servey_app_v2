import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import commonStyles from './FormComponents.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');



const DropdownField = ({
  fcId,
  label,
  placeholder = 'Select option',
  options = '',
  value,
  onChange,
  multiple = false,
  required = false,
  disabled = false,
  searchable = true,
  maxSelections,
  isPreview = false, // New prop for preview mode
  errorText = '', // New prop for external error messages
  onError = null, // New prop for error callback
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isModelOpened, setIsModelOpened] = useState(false);
  const [fieldValidationError, setFieldValidationError] = useState(errorText || ''); // Local state for validation errors

  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Parse options string into array of objects
  const parsedOptions = useMemo(() => {
    if (!options) return [];

    try {
      return options
        .split(';')
        .map(option => option.trim())
        .filter(option => option.includes('~'))
        .map(option => {
          const [key, ...valueParts] = option.split('~');
          return {
            key: key.trim(),
            value: valueParts.join('~').trim(),
            label: valueParts.join('~').trim(),
          };
        })
        .filter(option => option.key && option.value);
    } catch (error) {
      console.error('Error parsing dropdown options:', error);
      return [];
    }
  }, [options]);

  const selectAllDisabled = useMemo(() => {
    let state = false;
    console.log({
      label,
      multiple,
      disabled,
      isPreview,
      parsedOptions,
      value,
      maxSelections,
    });
    console.log(
      label,
      !multiple,
      disabled,
      isPreview,
      parsedOptions?.length === 0,
      Array.isArray(value) && value.length === parsedOptions?.length,
      maxSelections && Array.isArray(value) && value.length >= maxSelections,
      // !parsedOptions?.some(
      //   opt => !Array.isArray(value) || !value.includes(opt.key),
      // ),
      maxSelections && maxSelections < parsedOptions?.length,
    );

    if (
      !multiple ||
      disabled ||
      isPreview ||
      parsedOptions?.length === 0 ||
      (Array.isArray(value) && value.length === parsedOptions?.length) || // Disable if all options are already selected
      (maxSelections &&
        Array.isArray(value) &&
        value.length >= maxSelections) || // Disable if max selections reached
      (maxSelections && maxSelections < parsedOptions?.length) // Disable if max selections is less than total options
    )
      state = true;
    else state = false;
    return state;
  }, [multiple, disabled, isPreview, parsedOptions, value, maxSelections]);

  // Animation for dropdown arrow
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  // Validation effect for required fields
  useEffect(() => {
    if (required && isModelOpened && !value) {
      handleFieldValidation('This field is required', `${label} is required.`);
      return;
    }
    handleFieldValidation('');
  }, [value, required, isModelOpened]);

  const handleFieldValidation = (errorMessage, externalErrorMessage) => {
    setFieldValidationError(errorMessage || '');
    onError && onError(externalErrorMessage || errorMessage || '');
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchText) return parsedOptions;
    const searchLower = searchText.toLowerCase();
    return parsedOptions.filter(
      option =>
        option.label.toLowerCase().includes(searchLower) ||
        option.key.toLowerCase().includes(searchLower),
    );
  }, [parsedOptions, searchText]);

  // Handle selection
  const handleSelect = option => {
    if (disabled || isPreview) return;

    let newValue;

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(option.key);

      if (isSelected) {
        // Deselect
        newValue = currentValues.filter(v => v !== option.key);
      } else {
        // Check max selections limit
        if (maxSelections && currentValues.length >= maxSelections) {
          return; // Don't exceed max selections
        }
        newValue = [...currentValues, option.key];
      }
    } else {
      newValue = option.key;
      setIsOpen(false);
      setModalVisible(false);
    }

    onChange(newValue);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!multiple || disabled || isPreview || parsedOptions.length === 0)
      return;
    const allKeys = parsedOptions.map(opt => opt.key);
    onChange(allKeys);
  };

  // Handle clear all
  const handleClearAll = () => {
    if (disabled || isPreview) return;
    onChange(multiple ? [] : '');
  };

  // Get display text for selected value(s)
  const getDisplayText = () => {
    if (!value || (multiple && value.length === 0)) {
      return placeholder;
    }

    if (multiple) {
      const selectedOptions = parsedOptions.filter(
        opt => Array.isArray(value) && value.includes(opt.key),
      );

      if (selectedOptions.length === 0) return placeholder;

      if (selectedOptions.length > 2) {
        return `${selectedOptions.length} selected`;
      }

      return selectedOptions.map(opt => opt.label).join(', ');
    } else {
      const selectedOption = parsedOptions.find(opt => opt.key === value);
      return selectedOption ? selectedOption.label : placeholder;
    }
  };

  // Check if option is selected
  const isSelected = optionKey => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionKey);
    }
    return value === optionKey;
  };

  // Custom Checkbox Component
  const CheckboxComponent = ({ checked, onPress, disabled: isDisabled }) => (
    <TouchableOpacity
      style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        isDisabled && styles.checkboxDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {checked && <Icon name="check" size={16} color={COLORS.surface} />}
    </TouchableOpacity>
  );

  // Custom Radio Button Component
  const RadioButtonComponent = ({ checked, onPress, disabled: isDisabled }) => (
    <TouchableOpacity
      style={[
        styles.radio,
        checked && styles.radioChecked,
        isDisabled && styles.radioDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {checked && <View style={styles.radioInner} />}
    </TouchableOpacity>
  );

  // Render option item
  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        isSelected(item.key) && styles.optionItemSelected,
        (disabled || isPreview) && styles.optionItemDisabled,
      ]}
      onPress={() => handleSelect(item)}
      disabled={disabled || isPreview}
      activeOpacity={0.7}
    >
      {multiple ? (
        <CheckboxComponent
          checked={isSelected(item.key)}
          onPress={() => handleSelect(item)}
          disabled={disabled || isPreview}
        />
      ) : (
        <RadioButtonComponent
          checked={isSelected(item.key)}
          onPress={() => handleSelect(item)}
          disabled={disabled || isPreview}
        />
      )}
      <Text
        style={[
          styles.optionText,
          isSelected(item.key) && styles.selectedOptionText,
          (disabled || isPreview) && styles.disabledText,
        ]}
        numberOfLines={2}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Render dropdown content for mobile (modal)
  const renderDropdownContent = () => (
    <View style={styles.dropdownContent}>
      {/* Search input for searchable dropdowns */}
      {searchable && parsedOptions.length > 5 && !isPreview && (
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search options..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.text.disabled}
            editable={!disabled && !isPreview}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="clear" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Action buttons for multiple selection */}
      {multiple && parsedOptions.length > 0 && !isPreview && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              !selectAllDisabled && { backgroundColor: COLORS.primaryLight },
            ]}
            onPress={handleSelectAll}
            disabled={
              disabled ||
              isPreview ||
              parsedOptions.length === 0 ||
              selectAllDisabled
            }
            activeOpacity={0.7}
          >
            <Icon
              name="check-box"
              size={16}
              color={
                disabled || isPreview || selectAllDisabled
                  ? COLORS.text.disabled
                  : COLORS.text.inverse
                // COLORS.text.inverse
              }
            />
            <Text
              style={[
                styles.actionButtonText,
                disabled || isPreview || selectAllDisabled
                  ? styles.disabledText
                  : { color: COLORS.text.inverse },
              ]}
            >
              Select All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.error }]}
            onPress={handleClearAll}
            disabled={disabled || isPreview}
            activeOpacity={0.7}
          >
            <Icon
              name="check-box-outline-blank"
              size={16}
              color={
                // disabled || isPreview
                //   ? COLORS.text.disabled
                //   : COLORS.text.secondary
                COLORS.text.inverse
              }
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: COLORS.text.inverse },
                // (disabled || isPreview) && styles.disabledText
              ]}
            >
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Options list */}
      {filteredOptions.length > 0 ? (
        <FlatList
          data={filteredOptions}
          renderItem={renderOption}
          keyExtractor={item => item.key}
          style={styles.optionsList}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={21}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isPreview} // Disable scrolling in preview mode
        />
      ) : (
        <View style={[styles.emptyContainer]}>
          <Icon name="search-off" size={40} color={COLORS.text.disabled} />
          <Text style={styles.emptyText}>No options found</Text>
          {searchText && !isPreview && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchText('')}
              activeOpacity={0.7}
            >
              <Text style={styles.clearSearchText}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Selection info */}
      {multiple && !isPreview && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionInfoText}>
            {value.length} option{value.length !== 1 ? 's' : ''} selected
          </Text>
          {maxSelections && (
            <Text style={styles.maxSelectionsText}>Max: {maxSelections}</Text>
          )}
        </View>
      )}
    </View>
  );

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setSearchText('');
  };

  // Preview mode render
  if (isPreview) {
    const displayValue = getDisplayText();
    const hasValue = value && (multiple ? value.length > 0 : value !== '');

    return (
      <View style={commonStyles.fieldContainer}>
        <View style={commonStyles.labelContainer}>
          <Text style={commonStyles.labelText}>{label}</Text>
          {required && <Text style={commonStyles.requiredStar}>*</Text>}
        </View>

        <View
          style={[
            commonStyles.previewValueContainer,
            !hasValue && commonStyles.previewEmptyValue,
          ]}
        >
          <Text
            style={[
              commonStyles.previewValueText,
              !hasValue && commonStyles.previewPlaceholderText,
            ]}
          >
            {hasValue ? displayValue : placeholder}
          </Text>
        </View>

        {required && !hasValue && (
          <Text style={commonStyles.errorText}>This field is required</Text>
        )}
      </View>
    );
  }

  // Regular edit mode render
  return (
    <View style={commonStyles.fieldContainer}>
      {/* Label */}
      <View style={commonStyles.labelContainer}>
        <Text style={commonStyles.labelText}>{label}</Text>
        {required && <Text style={commonStyles.requiredStar}>*</Text>}
      </View>
      {console.log(value, 'vax2')}
      {/* Dropdown trigger */}
      <TouchableOpacity
        style={[
          commonStyles.selectionButton,
          styles.triggerButton,
          isOpen && styles.triggerButtonOpen,
          disabled && styles.disabled,
          required && isModelOpened && !value && styles.errorBorder,
        ]}
        onPress={() => {
          if (disabled || isPreview) return;
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            setModalVisible(true);
            setIsModelOpened(true);
            Keyboard.dismiss();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        activeOpacity={0.7}
        disabled={disabled || isPreview}
        accessibilityLabel={`${label} dropdown. ${getDisplayText()}. Tap to open options.`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <Text
          style={[
            commonStyles.datePickerText,
            !value && commonStyles.datePickerPlaceholder,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon
            name="arrow-drop-down"
            size={24}
            color={disabled ? COLORS.text.disabled : COLORS.text.primary}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Error message for required field */}
      {fieldValidationError && (
        <Text style={styles.errorText}>{fieldValidationError}</Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleModalClose}>
            <View style={styles.modalOverlayTouchable}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{label}</Text>
                    <TouchableOpacity
                      onPress={handleModalClose}
                      style={styles.closeButton}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="close"
                        size={24}
                        color={COLORS.text.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  {renderDropdownContent()}
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleModalClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </View>
  );
};

DropdownField.propTypes = {
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  options: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),  
  onChange: PropTypes.func,
  multiple: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  searchable: PropTypes.bool,
  maxSelections: PropTypes.number,
  isPreview: PropTypes.bool,
  errorText: PropTypes.string,
  onError: PropTypes.func,
};

DropdownField.defaultProps = {
  placeholder: 'Select option',
  options: '',
  value: '',
  onChange: null,
  multiple: false,
  required: false,
  disabled: false,
  searchable: true,
  maxSelections: null,
  isPreview: false,
  errorText: '',
  onError: null,
};


const styles = StyleSheet.create({
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Dropdown trigger button
  triggerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerButtonOpen: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  disabled: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[200],
  },
  disabledText: {
    color: COLORS.text.disabled,
  },

  // Custom Checkbox
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxDisabled: {
    backgroundColor: COLORS.gray[200],
    borderColor: COLORS.gray[300],
  },

  // Custom Radio Button
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioChecked: {
    borderColor: COLORS.primary,
  },
  radioDisabled: {
    borderColor: COLORS.gray[300],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  // Dropdown content
  webDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 300,
  },

  dropdownContent: {
    padding: 8,
    maxHeight: 350,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: COLORS.text.primary,
    fontFamily: 'System',
    padding: 0,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: COLORS.gray[100],
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '500',
    fontFamily: 'System',
  },

  // Options list
  optionsList: {
    maxHeight: 250,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 1,
  },
  optionItemSelected: {
    backgroundColor: COLORS.gray[50],
  },
  optionItemDisabled: {
    opacity: 0.7,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    fontFamily: 'System',
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 8,
    fontFamily: 'System',
  },
  clearSearchButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.gray[100],
    borderRadius: 6,
  },
  clearSearchText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },

  // Selection info
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectionInfoText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },
  maxSelectionsText: {
    fontSize: 12,
    color: COLORS.warning,
    fontFamily: 'System',
  },

  // Error state
  errorBorder: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    fontFamily: 'System',
  },

  // Modal (for mobile)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    fontFamily: 'System',
  },
  closeButton: {
    padding: 4,
  },
  doneButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default DropdownField;
