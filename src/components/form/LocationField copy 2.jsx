import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  PermissionsAndroid,
  StyleSheet,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import { COLORS } from '../../constants/colors';
import commonStyles from './FormComponents.styles';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Conditionally import MapView only if available
let MapView, UrlTile, Marker, Circle, ProviderPropType;
try {
  if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    UrlTile = Maps.UrlTile;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
    ProviderPropType = Maps.ProviderPropType;
  }
} catch (error) {
  console.warn('react-native-maps not available:', error);
}

const { width: screenWidth } = Dimensions.get('window');

// Permission checking helper for Android
const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to capture GPS coordinates.',
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
    return true;
  }
};

// Promisified version of Geolocation.getCurrentPosition
const getCurrentPositionAsync = (options = {}) => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, options);
  });
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
  if (accuracy < 500) return { text: 'Moderate Accuracy', color: COLORS.warning };
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
          'User-Agent': 'Your-App-Name/1.0',
          Accept: 'application/json',
        },
        timeout: 10000,
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
  value,
  onChange,
  required = false,
  disabled = false,
  description,
  error,
  enableHighAccuracy = true,
  timeout = 25000,
  maximumAge = 0,
  minAccuracy = 100,
  showAddress = false,
  onCaptureStart,
  onCaptureComplete,
  onCaptureError,
  isMannualEntryAllowed = true,
  isPreview = false,
  errorText = '',
  onError = null,
}) => {
  const [capturedLocation, setCapturedLocation] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isEditingCoords, setIsEditingCoords] = useState(false);
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [fieldValidationError, setFieldValidationError] = useState(errorText || '');
  const [mapRegion, setMapRegion] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [tileError, setTileError] = useState(false);
  
  const mapRef = useRef(null);

  const handleFieldValidation = (errorMessage, externalErrorMessage) => {
    setFieldValidationError(errorMessage || '');
    onError && onError(externalErrorMessage || errorMessage || '');
  };

  // Validation effect for required fields
  useEffect(() => {
    if (isPressed) {
      if (required && !capturedLocation) {
        handleFieldValidation('This field is required', `${label} is required`);
        return;
      }
      handleFieldValidation('');
    }
  }, [capturedLocation, required, isPressed]);

  // Initialize with existing value
  useEffect(() => {
    if (value) {
      try {
        const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
        setCapturedLocation(parsedValue);
        if (parsedValue.address) {
          setManualAddress(parsedValue.address);
        }
        // Set map region based on captured location
        if (parsedValue.latitude && parsedValue.longitude) {
          const region = {
            latitude: parsedValue.latitude,
            longitude: parsedValue.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setMapRegion(region);
        }
      } catch (e) {
        console.error('Error parsing location value:', e);
      }
    } else {
      // Set default region (e.g., center of the world or a default location)
      const defaultRegion = {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 50,
        longitudeDelta: 50,
      };
      setMapRegion(defaultRegion);
    }
  }, [value]);

  const formatTimestamp = useCallback(timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, []);

  const formatCoordinate = useCallback(coord => {
    return coord?.toFixed(6) || '';
  }, []);

  // Update location on map
  const updateMapLocation = useCallback((latitude, longitude) => {
    try {
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      if (mapRef.current && mapRef.current.animateToRegion) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (err) {
      console.warn('Error updating map location:', err);
    }
  }, []);

  // Main location capture handler
  const handleLocationCapture = useCallback(
    async (position, isAccurate = true) => {
      const { coords, timestamp } = position;

      let locationData = createLocationData(coords, timestamp);

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
            setManualAddress(address);
          }
        } catch (error) {
          console.error('Failed to fetch address:', error);
        }
      }

      setCapturedLocation(locationData);
      
      // Only update map if MapView is available
      if (MapView) {
        updateMapLocation(coords.latitude, coords.longitude);
      }
      
      onChange(JSON.stringify(locationData));
      onCaptureComplete?.(locationData, isAccurate);
    },
    [onChange, showAddress, onCaptureComplete, updateMapLocation],
  );

  const captureLocation = async () => {
    if (disabled || isPreview) {
      console.log('Location capture blocked: disabled or preview mode');
      return;
    }

    setIsCapturing(true);
    handleFieldValidation('');
    onCaptureStart?.();

    try {
      console.log('Requesting location permission...');
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error(
          'Location permission denied. Please enable location access in settings.',
        );
      }

      console.log('Permission granted, getting location...');
      const options = {
        enableHighAccuracy,
        timeout,
        maximumAge,
      };

      const position = await getCurrentPositionAsync(options);
      console.log('Location received:', position.coords);
      
      const { coords } = position;

      let isAccurate = true;

      if (coords.accuracy > minAccuracy) {
        handleFieldValidation(
          `Location accuracy (${coords.accuracy.toFixed(0)}m) is below the required threshold (${minAccuracy}m).`,
          `${label} accuracy is too low: ${coords.accuracy.toFixed(0)}m`,
        );
        isAccurate = false;
      }

      await handleLocationCapture(position, isAccurate);
    } catch (error) {
      console.error('Location capture error details:', error);
      let errorMessage = 'Failed to capture location. ';

      if (error?.code !== undefined) {
        switch (error.code) {
          case 1:
            errorMessage = 'Location permission denied. Please enable location access in settings.';
            break;
          case 2:
            errorMessage = 'Location information is unavailable. Please check your GPS.';
            break;
          case 3:
            errorMessage = `Location request timed out after ${timeout / 1000} seconds. Please try again.`;
            break;
          default:
            errorMessage += error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Location Error', errorMessage);
      handleFieldValidation(errorMessage, `${label} capture failed: ${errorMessage}`);
      onCaptureError?.(error);
    } finally {
      setIsCapturing(false);
      setIsPressed(true);
    }
  };

  const retryLocation = () => {
    captureLocation();
  };

  const clearLocation = () => {
    if (disabled || isPreview) return;
    setCapturedLocation(null);
    setManualAddress('');
    setEditLatitude('');
    setEditLongitude('');
    setIsEditingCoords(false);
    handleFieldValidation('');
    onChange('');
    // Reset map to default view
    setMapRegion({
      latitude: 20.5937,
      longitude: 78.9629,
      latitudeDelta: 50,
      longitudeDelta: 50,
    });
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const startEditingCoords = () => {
    if (!isMannualEntryAllowed || disabled || isPreview) return;
    setIsEditingCoords(true);
    setEditLatitude(capturedLocation ? formatCoordinate(capturedLocation.latitude) : '');
    setEditLongitude(capturedLocation ? formatCoordinate(capturedLocation.longitude) : '');
  };

  const saveEditedCoordinates = async () => {
    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

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

    setIsEditingCoords(false);
    
    const locationData = createLocationData(
      { latitude: lat, longitude: lng, accuracy: capturedLocation?.accuracy || 0 },
      Date.now(),
      manualAddress || null,
      true,
    );

    setCapturedLocation(locationData);
    
    if (MapView) {
      updateMapLocation(lat, lng);
    }
    
    onChange(JSON.stringify(locationData));
    setIsPressed(true);
  };

  const cancelEditingCoords = () => {
    setIsEditingCoords(false);
    setEditLatitude('');
    setEditLongitude('');
  };

  const updateAddress = (address) => {
    setManualAddress(address);
    if (capturedLocation) {
      const updatedLocation = {
        ...capturedLocation,
        address: address || null,
      };
      setCapturedLocation(updatedLocation);
      onChange(JSON.stringify(updatedLocation));
    }
  };

  // Render map component safely
  const renderMap = () => {
    if (!MapView) {
      return (
        <View style={styles.mapPlaceholder}>
          <Icon name="map" size={48} color={COLORS.text.secondary} />
          <Text style={styles.mapPlaceholderText}>
            Map view is not available. Location capture still works.
          </Text>
        </View>
      );
    }

    if (mapError) {
      return (
        <View style={styles.mapPlaceholder}>
          <Icon name="map" size={48} color={COLORS.text.secondary} />
          <Text style={styles.mapPlaceholderText}>
            Map failed to load. You can still capture location.
          </Text>
        </View>
      );
    }

    if (mapRegion) {
      try {
        // Use multiple tile URLs as fallbacks
        const tileUrl = tileError 
          ? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        
        return (
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            zoomEnabled={true}
            scrollEnabled={true}
            zoomControlEnabled={true}
            showsUserLocation={true}
            showsMyLocationButton={true}
            loadingEnabled={true}
            loadingIndicatorColor={COLORS.primary}
            loadingBackgroundColor={COLORS.surface}
            onMapReady={() => console.log('Map ready')}
            onError={(e) => {
              console.warn('MapView error:', e);
              setMapError(true);
            }}
          >
            <UrlTile
              urlTemplate={tileUrl}
              maximumZ={19}
              minimumZ={0}
              shouldReplaceMapContent={true}
              flipY={false}
              onError={() => {
                console.log('Tile load error, trying fallback');
                if (!tileError) {
                  setTileError(true);
                }
              }}
            />
            <Marker
              coordinate={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              }}
              title="Selected Location"
              description={capturedLocation?.address || "Current location"}
              draggable={isMannualEntryAllowed && !disabled}
              onDragEnd={(e) => {
                if (isMannualEntryAllowed && !disabled) {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  const locationData = createLocationData(
                    { latitude, longitude, accuracy: 10 },
                    Date.now(),
                    manualAddress || null,
                    true,
                  );
                  setCapturedLocation(locationData);
                  onChange(JSON.stringify(locationData));
                  updateMapLocation(latitude, longitude);
                }
              }}
            />
            {capturedLocation?.accuracy > 0 && capturedLocation?.accuracy < 500 && (
              <Circle
                center={{
                  latitude: mapRegion.latitude,
                  longitude: mapRegion.longitude,
                }}
                radius={capturedLocation.accuracy}
                strokeColor={`${COLORS.primary}80`}
                fillColor={`${COLORS.primary}20`}
                strokeWidth={2}
              />
            )}
          </MapView>
        );
      } catch (err) {
        console.warn('Error rendering MapView:', err);
        setMapError(true);
        return (
          <View style={styles.mapPlaceholder}>
            <Icon name="map" size={48} color={COLORS.text.secondary} />
            <Text style={styles.mapPlaceholderText}>
              Map error. Location capture still works.
            </Text>
          </View>
        );
      }
    }

    return (
      <View style={styles.mapPlaceholder}>
        <Icon name="map" size={48} color={COLORS.text.secondary} />
        <Text style={styles.mapPlaceholderText}>
          Loading map...
        </Text>
      </View>
    );
  };

  // Preview mode render
  if (isPreview) {
    return (
      <View style={commonStyles.fieldContainer}>
        <View style={commonStyles.labelContainer}>
          <Text style={commonStyles.labelText}>{label}</Text>
          {required && <Text style={commonStyles.requiredStar}>*</Text>}
        </View>

        {description && (
          <Text style={commonStyles.descriptionText}>{description}</Text>
        )}

        <View
          style={[
            commonStyles.previewValueContainer,
            !capturedLocation && commonStyles.previewEmptyValue,
          ]}
        >
          {capturedLocation ? (
            <View>
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

              {capturedLocation.accuracy > 0 && (
                <View style={styles.accuracyContainer}>
                  <Icon name="gps-fixed" size={14} color={COLORS.text.secondary} />
                  <Text style={styles.accuracyText}>
                    Accuracy: ±{capturedLocation.accuracy.toFixed(0)}m
                  </Text>
                </View>
              )}

              {capturedLocation.isManualEntry && (
                <View style={styles.manualEntryIndicator}>
                  <Icon name="edit" size={14} color={COLORS.warning} />
                  <Text style={[styles.manualEntryText, { color: COLORS.warning }]}>
                    Manually entered
                  </Text>
                </View>
              )}

              <Text style={styles.timestampText}>
                {formatTimestamp(capturedLocation.timestamp)}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                commonStyles.previewValueText,
                commonStyles.previewPlaceholderText,
              ]}
            >
              No location captured
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Regular edit mode render
  return (
    <View style={commonStyles.fieldContainer}>
      <View style={commonStyles.labelContainer}>
        <Text style={commonStyles.labelText}>{label}</Text>
        {required && <Text style={commonStyles.requiredStar}>*</Text>}
      </View>

      {description && (
        <Text style={commonStyles.descriptionText}>{description}</Text>
      )}

      {/* Map View - Safely rendered */}
      <View style={styles.mapContainer}>
        {renderMap()}
      </View>

      {/* Coordinates Section */}
      <View style={styles.coordinatesSection}>
        <View style={styles.coordinatesHeader}>
          <Text style={styles.sectionTitle}>Coordinates</Text>
          {isMannualEntryAllowed && capturedLocation && !isEditingCoords && (
            <TouchableOpacity
              style={styles.editCoordsButton}
              onPress={startEditingCoords}
              disabled={disabled}
            >
              <Icon name="edit" size={18} color={COLORS.primary} />
              <Text style={styles.editCoordsButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingCoords ? (
          <View style={styles.editCoordsContainer}>
            <View style={styles.editCoordRow}>
              <Text style={styles.editCoordLabel}>Latitude:</Text>
              <TextInput
                style={styles.editCoordInput}
                value={editLatitude}
                onChangeText={setEditLatitude}
                keyboardType="numeric"
                placeholder="e.g., 12.345678"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
            <View style={styles.editCoordRow}>
              <Text style={styles.editCoordLabel}>Longitude:</Text>
              <TextInput
                style={styles.editCoordInput}
                value={editLongitude}
                onChangeText={setEditLongitude}
                keyboardType="numeric"
                placeholder="e.g., 98.765432"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
            <View style={styles.editCoordsActions}>
              <TouchableOpacity
                style={styles.cancelEditButton}
                onPress={cancelEditingCoords}
              >
                <Text style={styles.cancelEditButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveEditButton}
                onPress={saveEditedCoordinates}
              >
                <Text style={styles.saveEditButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.coordinatesContainer}>
            <View style={styles.coordinateBox}>
              <Text style={styles.coordinateLabel}>Latitude</Text>
              <Text style={styles.coordinateValue}>
                {capturedLocation ? formatCoordinate(capturedLocation.latitude) : '—'}
              </Text>
            </View>
            <View style={styles.coordinateBox}>
              <Text style={styles.coordinateLabel}>Longitude</Text>
              <Text style={styles.coordinateValue}>
                {capturedLocation ? formatCoordinate(capturedLocation.longitude) : '—'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Address Input */}
      {showAddress && (
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Address</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter address or edit automatically fetched address"
            value={manualAddress}
            onChangeText={updateAddress}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            editable={!disabled}
            placeholderTextColor={COLORS.text.secondary}
          />
        </View>
      )}

      {/* Info Section */}
      {capturedLocation && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Location Info</Text>
          
          {capturedLocation.accuracy > 0 && (
            <View style={styles.infoRow}>
              <Icon name="gps-fixed" size={16} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>
                Accuracy: ±{capturedLocation.accuracy.toFixed(0)}m
                {(() => {
                  const status = getAccuracyStatus(capturedLocation.accuracy);
                  return status ? (
                    <Text style={[styles.accuracyBadge, { backgroundColor: status.color + '20', color: status.color }]}>
                      {' '}{status.text}
                    </Text>
                  ) : null;
                })()}
              </Text>
            </View>
          )}

          {capturedLocation.altitude && (
            <View style={styles.infoRow}>
              <Icon name="terrain" size={16} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>Altitude: {capturedLocation.altitude.toFixed(1)}m</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="schedule" size={16} color={COLORS.text.secondary} />
            <Text style={styles.infoText}>Captured: {formatTimestamp(capturedLocation.timestamp)}</Text>
          </View>

          {capturedLocation.isManualEntry && (
            <View style={styles.infoRow}>
              <Icon name="edit" size={16} color={COLORS.warning} />
              <Text style={[styles.infoText, { color: COLORS.warning }]}>Manually entered location</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.captureButton]}
          onPress={captureLocation}
          disabled={disabled || isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator size="small" color={COLORS.text.inverse} />
          ) : (
            <>
              <Icon name="my-location" size={18} color={COLORS.text.inverse} />
              <Text style={styles.actionButtonText}>Capture</Text>
            </>
          )}
        </TouchableOpacity>

        {capturedLocation && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.retryButton]}
              onPress={retryLocation}
              disabled={disabled || isCapturing}
            >
              <Icon name="refresh" size={18} color={COLORS.text.primary} />
              <Text style={[styles.actionButtonText, { color: COLORS.text.primary }]}>
                Retry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={clearLocation}
              disabled={disabled}
            >
              <Icon name="delete-outline" size={18} color={COLORS.error} />
              <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Error Display */}
      {fieldValidationError && (
        <View style={commonStyles.locationErrorContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="error-outline" size={18} color={COLORS.error} />
            <Text
              style={[
                commonStyles.errorText,
                { marginLeft: 8, flex: 1, marginTop: 0 },
              ]}
            >
              {fieldValidationError}
            </Text>
          </View>
          {fieldValidationError.includes('permission') && (
            <TouchableOpacity
              style={[commonStyles.secondaryButton, { alignSelf: 'flex-start', marginTop: 8 }]}
              onPress={openSettings}
            >
              <Icon name="settings" size={16} color={COLORS.text.primary} />
              <Text style={commonStyles.secondaryButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

LocationField.propTypes = {
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  description: PropTypes.string,
  error: PropTypes.string,
  enableHighAccuracy: PropTypes.bool,
  timeout: PropTypes.number,
  maximumAge: PropTypes.number,
  minAccuracy: PropTypes.number,
  showAddress: PropTypes.bool,
  onCaptureStart: PropTypes.func,
  onCaptureComplete: PropTypes.func,
  onCaptureError: PropTypes.func,
  isMannualEntryAllowed: PropTypes.bool,
  isPreview: PropTypes.bool,
  errorText: PropTypes.string,
  onError: PropTypes.func,
};

LocationField.defaultProps = {
  value: '',
  onChange: null,
  required: false,
  disabled: false,
  description: '',
  error: '',
  enableHighAccuracy: true,
  timeout: 25000,
  maximumAge: 0,
  minAccuracy: 100,
  showAddress: false,
  onCaptureStart: null,
  onCaptureComplete: null,
  onCaptureError: null,
  isMannualEntryAllowed: true,
  isPreview: false,
  errorText: '',
  onError: null,
};

export default LocationField;

const styles = StyleSheet.create({
  mapContainer: {
    height: 250,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray?.[50] || '#f5f5f5',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray?.[50] || '#f5f5f5',
    minHeight: 200,
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text?.secondary || '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  coordinatesSection: {
    marginBottom: 16,
  },
  addressSection: {
    marginBottom: 16,
  },
  infoSection: {
    backgroundColor: COLORS.surface || '#fff',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text?.primary || '#000',
    marginBottom: 8,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateBox: {
    flex: 1,
    backgroundColor: COLORS.surface || '#fff',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  coordinateLabel: {
    fontSize: 12,
    color: COLORS.text?.secondary || '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 14,
    color: COLORS.text?.primary || '#000',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  coordinatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editCoordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight || '#e3f2fd',
  },
  editCoordsButtonText: {
    fontSize: 12,
    color: COLORS.primary || '#1976d2',
    fontWeight: '500',
    marginLeft: 4,
  },
  editCoordsContainer: {
    backgroundColor: COLORS.surface || '#fff',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  editCoordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  editCoordLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text?.primary || '#000',
  },
  editCoordInput: {
    flex: 1,
    backgroundColor: COLORS.gray?.[50] || '#fafafa',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text?.primary || '#000',
    fontFamily: 'monospace',
  },
  editCoordsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: COLORS.gray?.[100] || '#eeeeee',
  },
  cancelEditButtonText: {
    fontSize: 14,
    color: COLORS.text?.primary || '#000',
    fontWeight: '500',
  },
  saveEditButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: COLORS.primary || '#1976d2',
  },
  saveEditButtonText: {
    fontSize: 14,
    color: COLORS.text?.inverse || '#fff',
    fontWeight: '600',
  },
  addressInput: {
    backgroundColor: COLORS.gray?.[50] || '#fafafa',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text?.primary || '#000',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text?.primary || '#000',
    marginLeft: 8,
    flex: 1,
  },
  accuracyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  captureButton: {
    backgroundColor: COLORS.primary || '#1976d2',
  },
  retryButton: {
    backgroundColor: COLORS.gray?.[100] || '#eeeeee',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
  },
  clearButton: {
    backgroundColor: COLORS.errorLight || '#ffebee',
    borderWidth: 1,
    borderColor: COLORS.error || '#f44336',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text?.inverse || '#fff',
  },
  manualEntryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  manualEntryText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 12,
    color: COLORS.text?.secondary || '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  addressContainer: {
    backgroundColor: COLORS.surface || '#fff',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.text?.secondary || '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text?.primary || '#000',
    lineHeight: 20,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 13,
    color: COLORS.text?.secondary || '#666',
    marginLeft: 6,
  },
});