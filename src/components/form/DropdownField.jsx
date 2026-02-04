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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const dropdownRef = useRef(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;


  // Animation for dropdown arrow
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

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

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchText) return parsedOptions;
    const searchLower = searchText.toLowerCase();
    return parsedOptions.filter(option =>
      option.label.toLowerCase().includes(searchLower) ||
      option.key.toLowerCase().includes(searchLower)
    );
  }, [parsedOptions, searchText]);

  // Handle selection
  const handleSelect = (option) => {
    if (disabled) return;

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
    if (!multiple || disabled || parsedOptions.length === 0) return;
    const allKeys = parsedOptions.map(opt => opt.key);
    onChange(allKeys);
  };

  // Handle clear all
  const handleClearAll = () => {
    if (disabled) return;
    onChange(multiple ? [] : '');
  };

  // Get display text for selected value(s)
  const getDisplayText = () => {
    if (!value || (multiple && value.length === 0)) {
      return placeholder;
    }

    if (multiple) {
      const selectedOptions = parsedOptions.filter(opt => 
        Array.isArray(value) && value.includes(opt.key)
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
  const isSelected = (optionKey) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionKey);
    }
    return value === optionKey;
  };

  // Web-specific click outside handling
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleClickOutside = (event) => {
      // Use a different approach for web - check if click is outside the component
      if (dropdownRef.current) {
        const dropdownElement = dropdownRef.current;
        // In React Native Web, we can use getBoundingClientRect
        // This is a simplified approach
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Add event listener with capture phase
      document.addEventListener('mousedown', handleClickOutside, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [isOpen]);

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
      {checked && (
        <Icon name="check" size={16} color={COLORS.surface} />
      )}
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
      {checked && (
        <View style={styles.radioInner} />
      )}
    </TouchableOpacity>
  );

  // Render option item
  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        isSelected(item.key) && styles.optionItemSelected,
      ]}
      onPress={() => handleSelect(item)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {multiple ? (
        <CheckboxComponent
          checked={isSelected(item.key)}
          onPress={() => handleSelect(item)}
          disabled={disabled}
        />
      ) : (
        <RadioButtonComponent
          checked={isSelected(item.key)}
          onPress={() => handleSelect(item)}
          disabled={disabled}
        />
      )}
      <Text
        style={[
          styles.optionText,
          isSelected(item.key) && styles.selectedOptionText,
          disabled && styles.disabledText,
        ]}
        numberOfLines={2}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Render dropdown content for mobile (modal) and web (dropdown)
  const renderDropdownContent = () => (
    <View style={styles.dropdownContent}>
      {/* Search input for searchable dropdowns */}
      {searchable && parsedOptions.length > 5 && (
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search options..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.text.disabled}
            editable={!disabled}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="clear" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Action buttons for multiple selection */}
      {multiple && parsedOptions.length > 0 && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSelectAll}
            disabled={disabled || parsedOptions.length === 0}
            activeOpacity={0.7}
          >
            <Icon name="check-box" size={16} color={disabled ? COLORS.text.disabled : COLORS.text.secondary} />
            <Text style={[
              styles.actionButtonText,
              disabled && styles.disabledText
            ]}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAll}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Icon name="check-box-outline-blank" size={16} color={disabled ? COLORS.text.disabled : COLORS.text.secondary} />
            <Text style={[
              styles.actionButtonText,
              disabled && styles.disabledText
            ]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Options list */}
      {filteredOptions.length > 0 ? (
        <FlatList
          data={filteredOptions}
          renderItem={renderOption}
          keyExtractor={(item) => item.key}
          style={styles.optionsList}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={21} // Better performance for mobile
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="search-off" size={40} color={COLORS.text.disabled} />
          <Text style={styles.emptyText}>No options found</Text>
          {searchText && (
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
      {multiple && Array.isArray(value) && value.length > 0 && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionInfoText}>
            {value.length} option{value.length !== 1 ? 's' : ''} selected
          </Text>
          {maxSelections && (
            <Text style={styles.maxSelectionsText}>
              Max: {maxSelections}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setSearchText(''); // Clear search when modal closes
  };

  return (
    <View style={commonStyles.fieldContainer} ref={Platform.OS === 'web' ? dropdownRef : null}>
      {/* Label */}
      <View style={commonStyles.labelContainer}>
        <Text style={commonStyles.labelText}>{label}</Text>
        {required && <Text style={commonStyles.requiredStar}>*</Text>}
      </View>

      {/* Dropdown trigger */}
      <TouchableOpacity
        style={[
          commonStyles.selectionButton,
          styles.triggerButton,
          isOpen && styles.triggerButtonOpen,
          disabled && styles.disabled,
          required && !value && styles.errorBorder,
        ]}
        onPress={() => {
          if (disabled) return;
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            setModalVisible(true);
            Keyboard.dismiss();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        activeOpacity={0.7}
        disabled={disabled}
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
      {required && !value && (
        <Text style={styles.errorText}>This field is required</Text>
      )}

      {/* Mobile modal */}
      {Platform.OS !== 'web' && (
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
                        <Icon name="close" size={24} color={COLORS.text.primary} />
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
      )}

      {/* Web dropdown */}
      {Platform.OS === 'web' && isOpen && (
        <View style={styles.webDropdown}>
          {renderDropdownContent()}
        </View>
      )}
    </View>
  );
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
    maxHeight: 300,
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
    maxHeight: 200,
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