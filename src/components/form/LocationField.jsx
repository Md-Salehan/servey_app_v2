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
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios'; // Import axios
import { COLORS } from '../../constants/colors';
import styles from './FormComponents.styles';
import locationStyles from './LocationField.styles';
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
      <View style={styles.locationDisplayContainer}>
        {accuracyStatus && (
          <View style={styles.locationDisplayRow}>
            <View
              style={[
                styles.locationAccuracyBadge,
                { backgroundColor: accuracyStatus.color + '20' },
              ]}
            >
              <Text
                style={[
                  styles.locationAccuracyText,
                  { color: accuracyStatus.color },
                ]}
              >
                {accuracyStatus.text} ({capturedLocation.accuracy.toFixed(0)}m)
              </Text>
            </View>
          </View>
        )}
        <View style={locationStyles.coordinatesContainer}>
          <View style={locationStyles.coordinateBox}>
            <Text style={locationStyles.coordinateLabel}>Latitude</Text>
            <Text style={locationStyles.coordinateValue}>
              {formatCoordinate(capturedLocation.latitude)}
            </Text>
          </View>
          <View style={locationStyles.coordinateBox}>
            <Text style={locationStyles.coordinateLabel}>Longitude</Text>
            <Text style={locationStyles.coordinateValue}>
              {formatCoordinate(capturedLocation.longitude)}
            </Text>
          </View>
        </View>

        {capturedLocation.address && (
          <View style={locationStyles.addressContainer}>
            <Text style={locationStyles.addressLabel}>Address</Text>
            <Text style={locationStyles.addressText}>
              {capturedLocation.address}
            </Text>
          </View>
        )}

        {capturedLocation.isManualEntry && (
          <View style={styles.locationDisplayRow}>
            <Icon name="edit" size={14} color={COLORS.warning} />
            <Text
              style={[
                styles.locationDisplayValue,
                { color: COLORS.warning, marginLeft: 4 },
              ]}
            >
              Manually entered
            </Text>
          </View>
        )}

        {/* {accuracyStatus && (
          <View style={styles.locationDisplayRow}>
            <Text style={styles.locationDisplayLabel}>Accuracy:</Text>
            <View style={[styles.locationAccuracyBadge, { backgroundColor: accuracyStatus.color + '20' }]}>
              <Text style={[styles.locationAccuracyText, { color: accuracyStatus.color }]}>
                {accuracyStatus.text} ({capturedLocation.accuracy.toFixed(0)}m)
              </Text>
            </View>
          </View>
        )} */}

        <Text style={styles.locationTimestamp}>
          Captured: {formatTimestamp(capturedLocation.timestamp)}
        </Text>

        {showMapPreview && (
          <View style={styles.mapPreviewContainer}>
            <Icon name="map" size={32} color={COLORS.gray[400]} />
            <Text style={styles.mapPreviewPlaceholder}>
              Map preview available with react-native-maps integration
            </Text>
          </View>
        )}

        <View style={locationStyles.actionButtonsContainer}>
          <TouchableOpacity
            style={locationStyles.secondaryActionButton}
            onPress={captureLocation}
            disabled={disabled || isCapturing}
          >
            <Icon name="refresh" size={18} color={COLORS.text.primary} />
            <Text style={locationStyles.secondaryActionButtonText}>
              Recapture
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={locationStyles.clearButton}
            onPress={clearLocation}
            disabled={disabled}
          >
            <Icon name="delete-outline" size={18} color={COLORS.error} />
            <Text style={locationStyles.clearButtonText}>Clear</Text>
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
        <View style={locationStyles.manualEntryContainer}>
          <Text style={locationStyles.manualEntryTitle}>
            Manual Location Entry
          </Text>

          <TextInput
            style={locationStyles.manualInput}
            placeholder="Latitude (e.g., 12.345678)"
            value={manualLatitude}
            onChangeText={setManualLatitude}
            keyboardType="numeric"
            autoCapitalize="none"
          />

          <TextInput
            style={locationStyles.manualInput}
            placeholder="Longitude (e.g., 98.765432)"
            value={manualLongitude}
            onChangeText={setManualLongitude}
            keyboardType="numeric"
            autoCapitalize="none"
          />

          <TextInput
            style={[locationStyles.manualInput, { minHeight: 80 }]}
            placeholder="Address (optional)"
            value={manualAddress}
            onChangeText={setManualAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={locationStyles.modalButtonsContainer}>
            <TouchableOpacity
              style={locationStyles.modalCancelButton}
              onPress={() => setIsManualEntryModalVisible(false)}
            >
              <Text style={locationStyles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={locationStyles.modalSubmitButton}
              onPress={submitManualEntry}
            >
              <Text style={locationStyles.modalSubmitButtonText}>
                Save Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{label}</Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>

      {description && <Text style={styles.descriptionText}>{description}</Text>}

      {!capturedLocation ? (
        <View>
          <TouchableOpacity
            style={[
              styles.locationButton,
              disabled && styles.locationButtonDisabled,
              isCapturing && { backgroundColor: COLORS.primaryLight },
            ]}
            onPress={captureLocation}
            disabled={disabled || isCapturing}
            activeOpacity={0.8}
          >
            <Icon name="location-on" size={20} color={COLORS.text.inverse} />
            <Text style={styles.locationButtonText}>Capture Location</Text>
          </TouchableOpacity>

          {isMannualEntryAllowed && (
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 8 }]}
              onPress={handleManualEntry}
              disabled={disabled}
            >
              <Icon name="edit" size={18} color={COLORS.text.primary} />
              <Text style={styles.secondaryButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        renderLocationDisplay()
      )}

      {locationError && (
        <View style={styles.locationErrorContainer}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Icon name="error-outline" size={18} color={COLORS.error} />
            <Text style={[styles.errorText, { marginLeft: 8, flex: 1 }]}>
              {locationError}
            </Text>
          </View>
          {locationError.includes('permission') && (
            <TouchableOpacity
              style={[styles.secondaryButton, { alignSelf: 'flex-start' }]}
              onPress={openSettings}
            >
              <Icon name="settings" size={16} color={COLORS.text.primary} />
              <Text style={styles.secondaryButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {error && !locationError && <Text style={styles.errorText}>{error}</Text>}

      {renderManualEntryModal()}

      {isCapturing && (
        <View style={locationStyles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={locationStyles.loadingText}>Getting location...</Text>
        </View>
      )}
    </View>
  );
};

export default LocationField;
