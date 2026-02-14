import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  PermissionsAndroid,
  StyleSheet,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios'; // Import axios
import { COLORS } from '../../constants/colors';
import commonStyles from './FormComponents.styles';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Permission checking helper for Android
const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to your location to capture GPS coordinates.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      return false;
    }
  } else {
    // iOS handles permissions through info.plist
    return true;
  }
};

// Helper function to create location data object
const createLocationData = (
  coords,
  timestamp,
  address = null,
  isManualEntry = false,
) => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  accuracy: coords.accuracy || 0,
  altitude: coords.altitude,
  altitudeAccuracy: coords.altitudeAccuracy,
  heading: coords.heading,
  speed: coords.speed,
  timestamp,
  address,
  isManualEntry,
});

// Helper function to get accuracy status
const getAccuracyStatus = accuracy => {
  if (accuracy < 20) return { text: 'High Accuracy', color: COLORS.success };
  if (accuracy < 100) return { text: 'Good Accuracy', color: COLORS.info };
  if (accuracy < 500)
    return { text: 'Moderate Accuracy', color: COLORS.warning };
  return { text: 'Low Accuracy', color: COLORS.error };
};

// Helper function to get address from coordinates using axios
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          format: 'json',
          lat: latitude,
          lon: longitude,
          zoom: 18,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'Your-App-Name/1.0', // Required by Nominatim
          Accept: 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      },
    );

    if (response.data) {
      const data = response.data;
      const addressParts = [];

      if (data.address?.road) addressParts.push(data.address.road);
      if (data.address?.suburb) addressParts.push(data.address.suburb);
      if (data.address?.city || data.address?.town || data.address?.village) {
        addressParts.push(
          data.address.city || data.address.town || data.address.village,
        );
      }
      if (data.address?.state) addressParts.push(data.address.state);
      if (data.address?.country) addressParts.push(data.address.country);

      return addressParts.join(', ');
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error.message || error);
    return null;
  }
};

const LocationField = ({
  fcId,
  label,
  value, // JSON string of location data
  onChange, // function to call with updated location data
  required = false,
  disabled = false,
  description,
  error,
  enableHighAccuracy = true,
  timeout = 25000, // in milliseconds
  maximumAge = 0, // in milliseconds
  minAccuracy = 100, // in meters
  showAddress = false,
  showMapPreview = false,
  onCaptureStart,
  onCaptureComplete,
  onCaptureError,
  isMannualEntryAllowed = true,
}) => {
  const [capturedLocation, setCapturedLocation] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isManualEntryModalVisible, setIsManualEntryModalVisible] =
    useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  // Initialize with existing value
  useEffect(() => {
    if (value) {
      try {
        const parsedValue =
          typeof value === 'string' ? JSON.parse(value) : value;
        setCapturedLocation(parsedValue);
      } catch (e) {
        console.error('Error parsing location value:', e);
      }
    }
  }, [value]);

  const formatTimestamp = useCallback(timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, []);

  const formatCoordinate = useCallback(coord => {
    return coord.toFixed(6);
  }, []);

  // Main location capture handler - calls onChange only once
  const handleLocationCapture = useCallback(
    async (position, isAccurate = true) => {
      const { coords, timestamp } = position;

      let locationData = createLocationData(coords, timestamp);

      // Fetch address if needed before updating state
      if (showAddress) {
        try {
          const address = await getAddressFromCoordinates(
            coords.latitude,
            coords.longitude,
          );
          if (address) {
            locationData = {
              ...locationData,
              address,
            };
          } else {
            console.warn(
              'No address found for coordinates:',
              coords.latitude,
              coords.longitude,
            );
          }
        } catch (error) {
          console.error('Failed to fetch address:', error);
          // Continue without address - address is optional
        }
      }

      // SINGLE onChange call with complete data
      setCapturedLocation(locationData);
      onChange(JSON.stringify(locationData));
      // setLocationError(null);

      onCaptureComplete?.(locationData, isAccurate);
    },
    [onChange, showAddress, onCaptureComplete],
  );

  const captureLocation = async () => {
    if (disabled) return;

    setIsCapturing(true);
    setLocationError(null);
    onCaptureStart?.();

    try {
      // Check and request permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error(
          'Location permission denied. Please enable location access in settings.',
        );
      }

      // Configure geolocation options
      const options = {
        enableHighAccuracy,
        timeout,
        maximumAge,
      };

      // Get current position
      Geolocation.getCurrentPosition(
        async position => {
          try {
            const { coords } = position;

            // Check if accuracy meets minimum requirement
            let isAccurate = true;
            if (coords.accuracy <= minAccuracy) {
              isAccurate = true;
            } else {
              const accuracyStatus = getAccuracyStatus(coords.accuracy);
              setLocationError(
                `Location accuracy (${coords.accuracy.toFixed(
                  0,
                )}m) is below the required threshold (${minAccuracy}m).`,
              );
              isAccurate = false;
            }

            // Handle location capture (with address if needed)
            await handleLocationCapture(position, isAccurate);
          } catch (error) {
            console.error('Error processing location:', error);
            setLocationError('Failed to process location data.');
            onCaptureError?.(error);
          } finally {
            setIsCapturing(false);
          }
        },
        error => {
          setIsCapturing(false);
          let errorMessage = 'Failed to capture location. ';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                'Location permission denied. Please enable location access in settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = `Location request timed out after ${
                timeout / 1000
              } seconds.`;
              break;
            default:
              errorMessage += error.message;
          }

          setLocationError(errorMessage);
          onCaptureError?.(error);
        },
        options,
      );
    } catch (error) {
      setIsCapturing(false);
      setLocationError(error.message);
      onCaptureError?.(error);
    }
  };

  const clearLocation = () => {
    setCapturedLocation(null);
    setLocationError(null);
    onChange('');
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleManualEntry = () => {
    setIsManualEntryModalVisible(true);
  };

  const submitManualEntry = () => {
    const lat = parseFloat(manualLatitude);
    const lng = parseFloat(manualLongitude);

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      Alert.alert(
        'Invalid Coordinates',
        'Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.',
      );
      return;
    }

    const locationData = createLocationData(
      { latitude: lat, longitude: lng },
      Date.now(),
      manualAddress || null,
      true,
    );

    // SINGLE onChange call for manual entry too
    setCapturedLocation(locationData);
    onChange(JSON.stringify(locationData));
    setIsManualEntryModalVisible(false);

    // Clear manual entry fields
    setManualLatitude('');
    setManualLongitude('');
    setManualAddress('');
  };

  const renderLocationDisplay = () => {
    if (!capturedLocation) return null;

    const accuracyStatus =
      capturedLocation.accuracy > 0
        ? getAccuracyStatus(capturedLocation.accuracy)
        : null;

    return (
      <View style={commonStyles.locationDisplayContainer}>
        {accuracyStatus && (
          <View style={commonStyles.locationDisplayRow}>
            <View
              style={[
                commonStyles.locationAccuracyBadge,
                { backgroundColor: accuracyStatus.color + '20' },
              ]}
            >
              <Text
                style={[
                  commonStyles.locationAccuracyText,
                  { color: accuracyStatus.color },
                ]}
              >
                {accuracyStatus.text} ({capturedLocation.accuracy.toFixed(0)}m)
              </Text>
            </View>
          </View>
        )}
        <View style={styles.coordinatesContainer}>
          <View style={styles.coordinateBox}>
            <Text style={styles.coordinateLabel}>Latitude</Text>
            <Text style={styles.coordinateValue}>
              {formatCoordinate(capturedLocation.latitude)}
            </Text>
          </View>
          <View style={styles.coordinateBox}>
            <Text style={styles.coordinateLabel}>Longitude</Text>
            <Text style={styles.coordinateValue}>
              {formatCoordinate(capturedLocation.longitude)}
            </Text>
          </View>
        </View>

        {capturedLocation.address && (
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Address</Text>
            <Text style={styles.addressText}>
              {capturedLocation.address}
            </Text>
          </View>
        )}

        {capturedLocation.isManualEntry && (
          <View style={commonStyles.locationDisplayRow}>
            <Icon name="edit" size={14} color={COLORS.warning} />
            <Text
              style={[
                commonStyles.locationDisplayValue,
                { color: COLORS.warning, marginLeft: 4 },
              ]}
            >
              Manually entered
            </Text>
          </View>
        )}

        {/* {accuracyStatus && (
          <View style={commonStyles.locationDisplayRow}>
            <Text style={commonStyles.locationDisplayLabel}>Accuracy:</Text>
            <View style={[commonStyles.locationAccuracyBadge, { backgroundColor: accuracyStatus.color + '20' }]}>
              <Text style={[commonStyles.locationAccuracyText, { color: accuracyStatus.color }]}>
                {accuracyStatus.text} ({capturedLocation.accuracy.toFixed(0)}m)
              </Text>
            </View>
          </View>
        )} */}

        <Text style={commonStyles.locationTimestamp}>
          Captured: {formatTimestamp(capturedLocation.timestamp)}
        </Text>

        {showMapPreview && (
          <View style={commonStyles.mapPreviewContainer}>
            <Icon name="map" size={32} color={COLORS.gray[400]} />
            <Text style={commonStyles.mapPreviewPlaceholder}>
              Map preview available with react-native-maps integration
            </Text>
          </View>
        )}

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={captureLocation}
            disabled={disabled || isCapturing}
          >
            <Icon name="refresh" size={18} color={COLORS.text.primary} />
            <Text style={styles.secondaryActionButtonText}>
              Recapture
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearLocation}
            disabled={disabled}
          >
            <Icon name="delete-outline" size={18} color={COLORS.error} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderManualEntryModal = () => (
    <Modal
      visible={isManualEntryModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsManualEntryModalVisible(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
        }}
      >
        <View style={styles.manualEntryContainer}>
          <Text style={styles.manualEntryTitle}>
            Manual Location Entry
          </Text>

          <TextInput
            style={styles.manualInput}
            placeholder="Latitude (e.g., 12.345678)"
            value={manualLatitude}
            onChangeText={setManualLatitude}
            keyboardType="numeric"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.manualInput}
            placeholder="Longitude (e.g., 98.765432)"
            value={manualLongitude}
            onChangeText={setManualLongitude}
            keyboardType="numeric"
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.manualInput, { minHeight: 80 }]}
            placeholder="Address (optional)"
            value={manualAddress}
            onChangeText={setManualAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setIsManualEntryModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={submitManualEntry}
            >
              <Text style={styles.modalSubmitButtonText}>
                Save Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={commonStyles.fieldContainer}>
      <View style={commonStyles.labelContainer}>
        <Text style={commonStyles.labelText}>{label}</Text>
        {required && <Text style={commonStyles.requiredStar}>*</Text>}
      </View>

      {description && <Text style={commonStyles.descriptionText}>{description}</Text>}

      {!capturedLocation ? (
        <View>
          <TouchableOpacity
            style={[
              commonStyles.locationButton,
              disabled && commonStyles.locationButtonDisabled,
              isCapturing && { backgroundColor: COLORS.primaryLight },
            ]}
            onPress={captureLocation}
            disabled={disabled || isCapturing}
            activeOpacity={0.8}
          >
            <Icon name="location-on" size={20} color={COLORS.text.inverse} />
            <Text style={commonStyles.locationButtonText}>Capture Location</Text>
          </TouchableOpacity>

          {isMannualEntryAllowed && (
            <TouchableOpacity
              style={[commonStyles.secondaryButton, { marginTop: 8 }]}
              onPress={handleManualEntry}
              disabled={disabled}
            >
              <Icon name="edit" size={18} color={COLORS.text.primary} />
              <Text style={commonStyles.secondaryButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        renderLocationDisplay()
      )}

      {locationError && (
        <View style={commonStyles.locationErrorContainer}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Icon name="error-outline" size={18} color={COLORS.error} />
            <Text style={[commonStyles.errorText, { marginLeft: 8, flex: 1 }]}>
              {locationError}
            </Text>
          </View>
          {locationError.includes('permission') && (
            <TouchableOpacity
              style={[commonStyles.secondaryButton, { alignSelf: 'flex-start' }]}
              onPress={openSettings}
            >
              <Icon name="settings" size={16} color={COLORS.text.primary} />
              <Text style={commonStyles.secondaryButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {error && !locationError && <Text style={commonStyles.errorText}>{error}</Text>}

      {renderManualEntryModal()}

      {isCapturing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Getting location...</Text>
        </View>
      )}
    </View>
  );
};

export default LocationField;

const styles = StyleSheet.create({
  // Location coordinates display
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  coordinateBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
  },
  coordinateLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  
  // Address display
  addressContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  
  // Action buttons container
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryActionButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
    marginLeft: 6,
  },
  
  // Manual entry modal
  manualEntryContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
  },
  manualEntryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  manualInput: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 12,
    fontFamily: 'System',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  manualInputHalf: {
    flex: 1,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  modalSubmitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});
