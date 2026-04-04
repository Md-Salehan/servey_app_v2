// LOVField.jsx - Fixed Version
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  Keyboard,
  Animated,
  StatusBar,
  Easing,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import commonStyles from './FormComponents.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Enhanced LOV (List of Values) Component
 * Fixed version with bug fixes and improved logic
 */
const LOVField = ({
  fcId,
  label,
  placeholder = 'Select value',
  data = [],
  columns = [],
  value,
  onChange,
  multiple = false,
  required = false,
  disabled = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  maxSelections,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  searchKeys = [],
  displayKey = null,
  primaryKey = 'id',
  showSelectAll = true,
  showClearAll = true,
  modalTitle = 'Select Options',
  renderRowItem,
  onSearch,
  onLoadMore,
  hasMore = false,
  onError,
  isPreview = false,
  showSelectionCount = true,
  animationType = 'slide',
  closeOnSelect = false,
  showFooter = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [localData, setLocalData] = useState(data);
  const [selectedItems, setSelectedItems] = useState([]);
  const [fieldValidationError, setFieldValidationError] = useState('');
  const [isModelOpened, setIsModelOpened] = useState(false);

  // Animation refs
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Initialize selected items from value prop - FIXED: Handle different value types
  useEffect(() => {
    if (multiple) {
      if (Array.isArray(value)) {
        setSelectedItems(value);
      } else if (value) {
        // Handle case where value is a string/object but multiple is true
        setSelectedItems([value]);
      } else {
        setSelectedItems([]);
      }
    } else {
      if (value) {
        setSelectedItems([value]);
      } else {
        setSelectedItems([]);
      }
    }
  }, [value, multiple]);

  // Update local data when prop changes - FIXED: Reset search when data changes
  useEffect(() => {
    setLocalData(data);
    // Reset search text when data changes to avoid stale search results
    setSearchText('');
  }, [data]);

  // Animation for dropdown arrow
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: modalVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [modalVisible, rotateAnim]);

  // Validation effect for required fields
  useEffect(() => {
    if (isModelOpened) {
      if (
        required &&
        (!value || (multiple && Array.isArray(value) && value.length === 0))
      ) {
        handleFieldValidation(
          'This field is required',
          `${label} is required.`,
        );
        return;
      }
      handleFieldValidation('');
    }
  }, [value, required, isModelOpened, multiple, label]);

  const handleFieldValidation = (errorMessage, externalErrorMessage) => {
    if (!isMountedRef.current) return;
    setFieldValidationError(errorMessage || '');
    onError && onError(externalErrorMessage || errorMessage || '');
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // FIXED: Improved search filtering with proper null/undefined handling
  const filteredData = useMemo(() => {
    // If no search text or search is disabled, return all data
    if (!searchText.trim() || !searchable) {
      return localData;
    }

    const searchLower = searchText.toLowerCase().trim();
    // Use provided searchKeys or fall back to column keys
    const searchKeysToUse =
      searchKeys.length > 0 ? searchKeys : columns.map(col => col.key);

    const filtered = localData.filter(item => {
      // Skip null/undefined items
      if (!item) return false;

      return searchKeysToUse.some(key => {
        const itemValue = item[key];
        if (itemValue == null) return false;

        if (typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(searchLower);
        }
        if (typeof itemValue === 'number') {
          return itemValue.toString().includes(searchLower);
        }
        if (typeof itemValue === 'boolean') {
          return itemValue.toString().includes(searchLower);
        }
        return false;
      });
    });

    return filtered;
  }, [localData, searchText, searchable, searchKeys, columns]);

  console.log(filteredData, "filteredData");
  

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    if (!multiple || filteredData.length === 0) return false;

    const selectedKeys = selectedItems.map(item => {
      // Handle both primitive values and objects
      return typeof item === 'object' && item !== null
        ? item[primaryKey]
        : item;
    });

    return filteredData.every(item => {
      const itemKey = typeof item === 'object' ? item[primaryKey] : item;
      return selectedKeys.includes(itemKey);
    });
  }, [multiple, filteredData, selectedItems, primaryKey]);

  // Check if select all is disabled
  const isSelectAllDisabled = useMemo(() => {
    if (!multiple) return true;
    if (disabled) return true;
    if (filteredData.length === 0) return true;
    if (
      maxSelections &&
      selectedItems.length >= maxSelections &&
      !isAllSelected
    )
      return true;
    return false;
  }, [
    multiple,
    disabled,
    filteredData,
    maxSelections,
    selectedItems,
    isAllSelected,
  ]);

  // FIXED: Get display text for trigger button - Properly handle missing items
  const getDisplayText = useCallback(() => {
    if (!value || (multiple && selectedItems.length === 0)) {
      return placeholder;
    }

    if (multiple) {
      if (selectedItems.length === 0) return placeholder;
      if (selectedItems.length > 2) {
        return `${selectedItems.length} selected`;
      }

      const selectedLabels = selectedItems.map(selected => {
        const item = localData.find(d => {
          if (!d) return false;
          const itemVal = typeof d === 'object' ? d[primaryKey] : d;
          return itemVal === selected;
        });

        if (displayKey && item) {
          return item[displayKey];
        }
        return String(selected);
      });

      return selectedLabels.join(', ');
    } else {
      if (displayKey) {
        const item = localData.find(d => {
          if (!d) return false;
          const itemVal = typeof d === 'object' ? d[primaryKey] : d;
          return itemVal === value;
        });
        return item ? item[displayKey] : placeholder;
      }

      return value || placeholder;
    }
  }, [
    value,
    multiple,
    selectedItems,
    localData,
    displayKey,
    placeholder,
    primaryKey,
  ]);

  // Handle selection
  const handleSelect = useCallback(
    item => {
      if (disabled) return;

      const itemVal = typeof item === 'object' ? item[primaryKey] : item;

      if (multiple) {
        const isSelected = selectedItems.includes(itemVal);
        let newSelectedItems;

        if (isSelected) {
          newSelectedItems = selectedItems.filter(key => key !== itemVal);
        } else {
          if (maxSelections && selectedItems.length >= maxSelections) {
            return;
          }
          newSelectedItems = [...selectedItems, itemVal];
        }

        setSelectedItems(newSelectedItems);
        onChange(newSelectedItems);
      } else {
        setSelectedItems([itemVal]);
        onChange(itemVal);
        // Auto-close for single select
        closeModal();
      }
    },
    [multiple, selectedItems, maxSelections, onChange, disabled, primaryKey],
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!multiple || disabled || filteredData.length === 0) return;

    if (isAllSelected) {
      // Deselect all visible items
      const visibleKeys = filteredData.map(item =>
        typeof item === 'object' ? item[primaryKey] : item,
      );
      const newSelectedItems = selectedItems.filter(
        key => !visibleKeys.includes(key),
      );
      setSelectedItems(newSelectedItems);
      onChange(newSelectedItems);
    } else {
      // Select all visible items respecting max selections
      const visibleKeys = filteredData.map(item =>
        typeof item === 'object' ? item[primaryKey] : item,
      );
      let newSelectedItems = [...selectedItems];

      for (const key of visibleKeys) {
        if (!newSelectedItems.includes(key)) {
          if (maxSelections && newSelectedItems.length >= maxSelections) {
            break;
          }
          newSelectedItems.push(key);
        }
      }

      setSelectedItems(newSelectedItems);
      onChange(newSelectedItems);
    }
  }, [
    multiple,
    disabled,
    filteredData,
    isAllSelected,
    selectedItems,
    maxSelections,
    onChange,
    primaryKey,
  ]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (disabled) return;
    setSelectedItems([]);
    onChange(multiple ? [] : '');
  }, [disabled, multiple, onChange]);

  // FIXED: Enhanced search with debounce - Properly handle search clearing
  const handleSearchChange = useCallback(
    text => {
      setSearchText(text);

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (onSearch) {
        debounceTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            onSearch(text);
          }
        }, 300);
      }
    },
    [onSearch],
  );

  // FIXED: Clear search function
  const handleClearSearch = useCallback(() => {
    setSearchText('');
    // If there's an external search handler, call it with empty string
    if (onSearch && isMountedRef.current) {
      onSearch('');
    }
    // Focus back on search input after clearing
    setTimeout(() => {
      if (searchInputRef.current && isMountedRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, [onSearch]);

  // Load more with loading indicator
  const handleLoadMore = useCallback(() => {
    if (onLoadMore && hasMore && !loading && filteredData.length > 0) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loading, filteredData]);

  // Enhanced modal open with animations
  const openModal = useCallback(() => {
    if (disabled || isPreview) return;

    setModalVisible(true);
    setIsModelOpened(true);
    Keyboard.dismiss();

    // Reset animations
    modalScaleAnim.setValue(0);
    modalOpacityAnim.setValue(0);

    // Animate modal entrance
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(0.5)),
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-focus search input after modal opens
    setTimeout(() => {
      if (searchInputRef.current && isMountedRef.current) {
        searchInputRef.current.focus();
      }
    }, 300);
  }, [disabled, isPreview, modalScaleAnim, modalOpacityAnim]);

  // Enhanced modal close with animations
  const closeModal = useCallback(() => {
    if (!isMountedRef.current) return;

    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isMountedRef.current) {
        setModalVisible(false);
        setSearchText('');
        Keyboard.dismiss();
      }
    });
  }, [modalScaleAnim, modalOpacityAnim]);

  // FIXED: Render column headers with proper keys
  const renderColumnHeaders = useCallback(() => {
    return (
      <View style={styles.headerRow}>
        {multiple && (
          <View style={styles.checkboxColumn}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                isAllSelected && styles.checkboxChecked,
                isSelectAllDisabled && styles.checkboxDisabled,
              ]}
              onPress={handleSelectAll}
              disabled={isSelectAllDisabled}
              activeOpacity={0.6}
            >
              {isAllSelected && (
                <Icon name="check" size={14} color={COLORS.surface} />
              )}
            </TouchableOpacity>
          </View>
        )}
        {columns.map((column, index) => (
          <View
            key={`header-${column.key}`}
            style={[
              styles.headerCell,
              column.width && { width: column.width },
              index === columns.length - 1 && styles.lastHeaderCell,
            ]}
          >
            <Text style={styles.headerText} numberOfLines={1}>
              {column.title}
            </Text>
          </View>
        ))}
      </View>
    );
  }, [columns, multiple, isAllSelected, isSelectAllDisabled, handleSelectAll]);

  // FIXED: Default row renderer with stable keys and proper null checking
  const defaultRenderRow = useCallback(
    ({ item, index }) => {
      if (!item) return null;

      const itemKey = typeof item === 'object' ? item[primaryKey] : item;
      const isItemSelected = multiple
        ? selectedItems.includes(itemKey)
        : selectedItems[0] === itemKey;

      // Ensure we have a valid key
      const stableKey = itemKey != null ? String(itemKey) : `index-${index}`;

      return (
        <TouchableOpacity
          key={stableKey}
          style={[
            styles.row,
            isItemSelected && styles.rowSelected,
            index % 2 === 0 && !isItemSelected && styles.rowEven,
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.6}
        >
          {multiple && (
            <View style={styles.checkboxColumn}>
              <View
                style={[
                  styles.checkbox,
                  isItemSelected && styles.checkboxChecked,
                ]}
              >
                {isItemSelected && (
                  <Icon name="check" size={14} color={COLORS.surface} />
                )}
              </View>
            </View>
          )}
          {columns.map((column, colIndex) => {
            const cellValue =
              typeof item === 'object' ? item[column.key] : item;
            const cellDisplay = cellValue != null ? String(cellValue) : '-';

            return (
              <View
                key={`${stableKey}-${column.key}`}
                style={[
                  styles.cell,
                  column.width && { width: column.width },
                  colIndex === columns.length - 1 && styles.lastCell,
                ]}
              >
                {column.render ? (
                  column.render(item, isItemSelected)
                ) : (
                  <Text
                    style={[
                      styles.cellText,
                      isItemSelected && styles.cellTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {cellDisplay}
                  </Text>
                )}
              </View>
            );
          })}
        </TouchableOpacity>
      );
    },
    [columns, multiple, selectedItems, handleSelect, primaryKey],
  );

  // Render footer with improved UI
  const renderFooter = useCallback(() => {
    if (!multiple || !showFooter) return null;

    return (
      <View style={styles.footer}>
        <View style={styles.selectionInfo}>
          <Icon name="check-circle" size={16} color={COLORS.primary} />
          <Text style={styles.selectionInfoText}>
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}{' '}
            selected
          </Text>
          {maxSelections && (
            <View style={styles.maxBadge}>
              <Text style={styles.maxSelectionsText}>Max: {maxSelections}</Text>
            </View>
          )}
        </View>

        {showClearAll && selectedItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
            disabled={disabled}
            activeOpacity={0.6}
          >
            <Icon name="clear" size={18} color={COLORS.error} />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [
    multiple,
    selectedItems,
    maxSelections,
    showClearAll,
    handleClearAll,
    disabled,
    showFooter,
  ]);

  // FIXED: Render empty state with clear search functionality
  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Icon
            name={searchText ? 'search-off' : 'inbox'}
            size={56}
            color={COLORS.gray[300]}
          />
        </View>
        <Text style={styles.emptyText}>
          {searchText ? 'No results found' : emptyMessage}
        </Text>
        {searchText && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={handleClearSearch}
            activeOpacity={0.6}
          >
            <Text style={styles.clearSearchText}>Clear search</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [searchText, emptyMessage, handleClearSearch],
  );

  // Render loading state
  const renderLoadingState = useCallback(
    () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading options...</Text>
      </View>
    ),
    [],
  );

  // Render selection count badge
  const renderSelectionBadge = useCallback(() => {
    if (!showSelectionCount || !multiple || selectedItems.length === 0)
      return null;

    return (
      <View style={styles.selectionBadge}>
        <Text style={styles.selectionBadgeText}>{selectedItems.length}</Text>
      </View>
    );
  }, [multiple, selectedItems, showSelectionCount]);

  // FIXED: Get stable key extractor
  const getItemKey = useCallback(
    (item, index) => {
      if (!item) return `empty-${index}`;
      const key = typeof item === 'object' ? item[primaryKey] : item;
      return key != null ? String(key) : `index-${index}`;
    },
    [primaryKey],
  );

  // Preview mode render
  if (isPreview) {
    const displayValue = getDisplayText();
    const hasValue =
      value && (multiple ? selectedItems.length > 0 : value !== '');

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
      <View style={commonStyles.labelContainer}>
        <Text style={commonStyles.labelText}>{label}</Text>
        {required && <Text style={commonStyles.requiredStar}>*</Text>}
        {renderSelectionBadge()}
      </View>

      <TouchableOpacity
        style={[
          commonStyles.selectionButton,
          styles.triggerButton,
          modalVisible && styles.triggerButtonOpen,
          disabled && styles.disabled,
          required && isModelOpened && !value && styles.errorBorder,
        ]}
        onPress={openModal}
        activeOpacity={0.7}
        disabled={disabled || isPreview}
      >
        <Text
          style={[
            commonStyles.datePickerText,
            (!value || (multiple && selectedItems.length === 0)) &&
              commonStyles.datePickerPlaceholder,
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

      {fieldValidationError && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>{fieldValidationError}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.5)" />
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      transform: [{ scale: modalScaleAnim }],
                      opacity: modalOpacityAnim,
                    },
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <Text style={styles.modalTitle}>{modalTitle}</Text>
                      {multiple &&
                        showSelectionCount &&
                        selectedItems.length > 0 && (
                          <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>
                              {selectedItems.length}
                            </Text>
                          </View>
                        )}
                    </View>
                    <TouchableOpacity
                      onPress={closeModal}
                      style={styles.closeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.6}
                    >
                      <Icon
                        name="close"
                        size={24}
                        color={COLORS.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {searchable && (
                    <View style={styles.searchContainer}>
                      <Icon
                        name="search"
                        size={20}
                        color={COLORS.text.secondary}
                      />
                      <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={searchPlaceholder}
                        value={searchText}
                        onChangeText={handleSearchChange}
                        placeholderTextColor={COLORS.text.disabled}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                      />
                      {searchText.length > 0 && (
                        <TouchableOpacity
                          onPress={handleClearSearch}
                          activeOpacity={0.6}
                        >
                          <Icon
                            name="clear"
                            size={20}
                            color={COLORS.text.secondary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {showSelectAll && multiple && filteredData.length > 0 && (
                    <View style={styles.selectAllContainer}>
                      <TouchableOpacity
                        style={styles.selectAllButton}
                        onPress={handleSelectAll}
                        disabled={isSelectAllDisabled}
                        activeOpacity={0.6}
                      >
                        <View
                          style={[
                            styles.checkboxSmall,
                            isAllSelected && styles.checkboxChecked,
                            isSelectAllDisabled && styles.checkboxDisabled,
                          ]}
                        >
                          {isAllSelected && (
                            <Icon
                              name="check"
                              size={12}
                              color={COLORS.surface}
                            />
                          )}
                        </View>
                        <Text style={styles.selectAllText}>
                          {isAllSelected ? 'Deselect All' : 'Select All'}
                        </Text>
                        {maxSelections && !isAllSelected && (
                          <Text style={styles.selectAllLimit}>
                            (Max {maxSelections})
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.tableContainer}>
                    <FlatList
                      data={filteredData}
                      keyExtractor={getItemKey}
                      renderItem={renderRowItem || defaultRenderRow}
                      ListHeaderComponent={
                        filteredData.length > 0 ? renderColumnHeaders : null
                      }
                      ListEmptyComponent={
                        loading ? renderLoadingState : renderEmptyState
                      }
                      ListFooterComponent={renderFooter}
                      stickyHeaderIndices={filteredData.length > 0 ? [0] : []}
                      onEndReached={handleLoadMore}
                      onEndReachedThreshold={0.3}
                      showsVerticalScrollIndicator={true}
                      initialNumToRender={20}
                      maxToRenderPerBatch={15}
                      windowSize={21}
                      contentContainerStyle={styles.listContent}
                      keyboardShouldPersistTaps="handled"
                      removeClippedSubviews={Platform.OS === 'android'}
                      // FIXED: Add extra data to force re-render when selections change
                      extraData={selectedItems}
                    />
                  </View>

                  {showFooter && (
                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={styles.doneButton}
                        onPress={closeModal}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </View>
  );
};

LOVField.propTypes = {
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  data: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      width: PropTypes.number,
      render: PropTypes.func,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
  multiple: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  maxSelections: PropTypes.number,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyMessage: PropTypes.string,
  searchKeys: PropTypes.arrayOf(PropTypes.string),
  displayKey: PropTypes.string,
  primaryKey: PropTypes.string,
  showSelectAll: PropTypes.bool,
  showClearAll: PropTypes.bool,
  modalTitle: PropTypes.string,
  renderRowItem: PropTypes.func,
  onSearch: PropTypes.func,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  onError: PropTypes.func,
  isPreview: PropTypes.bool,
  showSelectionCount: PropTypes.bool,
  animationType: PropTypes.oneOf(['slide', 'fade', 'none']),
  closeOnSelect: PropTypes.bool,
  showFooter: PropTypes.bool,
};

LOVField.defaultProps = {
  placeholder: 'Select value',
  data: [],
  value: '',
  onChange: null,
  multiple: false,
  required: false,
  disabled: false,
  searchable: true,
  searchPlaceholder: 'Search...',
  maxSelections: null,
  loading: false,
  error: null,
  emptyMessage: 'No data available',
  searchKeys: [],
  displayKey: null,
  primaryKey: 'id',
  showSelectAll: true,
  showClearAll: true,
  modalTitle: 'Select Options',
  renderRowItem: null,
  onSearch: null,
  onLoadMore: null,
  hasMore: false,
  onError: null,
  isPreview: false,
  showSelectionCount: true,
  animationType: 'slide',
  closeOnSelect: false,
  showFooter: true,
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
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
  errorBorder: {
    borderColor: COLORS.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    fontFamily: 'System',
    flex: 1,
  },
  selectionBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  selectionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.surface,
    fontFamily: 'System',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '75%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    fontFamily: 'System',
  },
  headerBadge: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },
  closeButton: {
    padding: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
    fontSize: 16,
    color: COLORS.text.primary,
    fontFamily: 'System',
    padding: 0,
  },

  // Select All
  selectAllContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.gray[50],
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 10,
    fontWeight: '500',
    fontFamily: 'System',
  },
  selectAllLimit: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 6,
    fontFamily: 'System',
  },

  // Table styles
  tableContainer: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerCell: {
    flex: 1,
    justifyContent: 'center',
  },
  lastHeaderCell: {
    marginRight: 0,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    fontFamily: 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  rowSelected: {
    backgroundColor: COLORS.primaryLight + '08',
  },
  rowEven: {
    backgroundColor: COLORS.gray[50],
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
  },
  lastCell: {
    marginRight: 0,
  },
  cellText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontFamily: 'System',
    lineHeight: 20,
  },
  cellTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Checkbox styles
  checkboxColumn: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxSmall: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxDisabled: {
    backgroundColor: COLORS.gray[200],
    borderColor: COLORS.gray[300],
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.gray[50],
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionInfoText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: 'System',
    fontWeight: '500',
  },
  maxBadge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  maxSelectionsText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '600',
    fontFamily: 'System',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.errorLight,
  },
  clearAllText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  clearSearchButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.gray[100],
    borderRadius: 10,
  },
  clearSearchText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
    fontFamily: 'System',
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 12,
    fontFamily: 'System',
  },

  // Modal footer
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  doneButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    fontFamily: 'System',
  },
});

export default LOVField;
