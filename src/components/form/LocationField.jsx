import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
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
import { localeData } from 'moment';

// Conditionally import MapView only if available
let MapView, UrlTile, Marker, Circle;
try {
  // Only import on native platforms
  if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    UrlTile = Maps.UrlTile;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
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

// Helper function to calculate distance between two points in meters
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to adjust coordinates by approximately 0.5 meters in a direction
// 0.5 meters in latitude is approximately 0.5 / 111,320 degrees
// 0.5 meters in longitude depends on latitude: 0.5 / (111,320 * cos(latitude))
const adjustCoordinates = (latitude, longitude, direction) => {
  const metersToDegreesLat = 0.5 / 111320; // ~0.5 meters to degrees
  const metersToDegreesLng =
    0.5 / (111320 * Math.cos((latitude * Math.PI) / 180));

  let newLat = latitude;
  let newLng = longitude;

  switch (direction) {
    case 'up':
      newLat = latitude + metersToDegreesLat;
      break;
    case 'down':
      newLat = latitude - metersToDegreesLat;
      break;
    case 'left':
      newLng = longitude - metersToDegreesLng;
      break;
    case 'right':
      newLng = longitude + metersToDegreesLng;
      break;
    default:
      break;
  }

  // Clamp latitude to valid range
  newLat = Math.max(-90, Math.min(90, newLat));
  // Clamp longitude to valid range
  newLng = Math.max(-180, Math.min(180, newLng));

  return { latitude: newLat, longitude: newLng };
};

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
  geoFenceData = null,
  onGeoFenceValidation = null,
}) => {
  const [capturedLocation, setCapturedLocation] = useState(null);
  const [originalCapturedLocation, setOriginalCapturedLocation] =
    useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null); // User's current location
  const [isCapturing, setIsCapturing] = useState(false);
  const [isEditingCoords, setIsEditingCoords] = useState(false);
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [isPressed, setIsPressed] = useState(false); // To track if user has attempted to capture/save
  const [isSave, setIsSave] = useState(false);
  const [fieldValidationError, setFieldValidationError] = useState(
    errorText || '',
  );
  const [mapRegion, setMapRegion] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [geoFenceValidation, setGeoFenceValidation] = useState(null);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] =
    useState(false);

  const mapRef = useRef(null);

  const handleFieldValidation = (errorMessage, externalErrorMessage) => {
    setFieldValidationError(errorMessage || '');
    onError && onError(externalErrorMessage || errorMessage || '');
  };

  // Validation effect for required fields
  useEffect(() => {
    console.log('Validation effect triggered:', {isPressed, capturedLocation, required, isSave});
    if (isPressed) {
      if (required && !capturedLocation) {
        handleFieldValidation('This field is required', `${label} is required`);
        return;
      } 
      else if (!isSave) {
        handleFieldValidation(
          '',
          `${label} need to be validated`,
        );
      }
      else {
        handleFieldValidation('', '');
      }
    }
  }, [capturedLocation, required, isPressed, isSave]);

  // Initialize with existing value
  useEffect(() => {
    if (value) {
      try {
        const parsedValue =
          typeof value === 'string' ? JSON.parse(value) : value;
        setCapturedLocation(parsedValue);
        setOriginalCapturedLocation(parsedValue);
        if (parsedValue.address) {
          setManualAddress(parsedValue.address);
        }
        // Set map region based on captured location
        if (parsedValue.latitude && parsedValue.longitude) {
          setMapRegion({
            latitude: parsedValue.latitude,
            longitude: parsedValue.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setShowActionButtons(true);
        }
      } catch (e) {
        console.error('Error parsing location value:', e);
      }
    }
  }, [value]);

  // Get user's current location for the circle and marker
  const getCurrentUserLocation = useCallback(async () => {
    if (disabled || isPreview) return null;

    setIsGettingCurrentLocation(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log('No permission to get current location');
        return null;
      }

      const options = {
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: 5000,
      };

      const position = await getCurrentPositionAsync(options);
      const userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setCurrentUserLocation(userLocation);

      // If no captured location yet, center map on user location
      if (!mapRegion && !capturedLocation) {
        setMapRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      return userLocation;
    } catch (error) {
      console.error('Error getting current user location:', error);
      return null;
    } finally {
      setIsGettingCurrentLocation(false);
    }
  }, [disabled, isPreview, enableHighAccuracy]);

  // Get user location when component mounts
  useEffect(() => {
    getCurrentUserLocation();
  }, []);

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
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      if (mapRef.current && mapRef.current.animateToRegion) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (err) {
      console.warn('Error updating map location:', err);
    }
  }, []);

  // Directional adjustment handlers
  const handleAdjustUp = useCallback(() => {
    if (!editLatitude || !editLongitude) return;

    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const { latitude, longitude } = adjustCoordinates(lat, lng, 'up');
    const locationData = createLocationData(
      { latitude, longitude, accuracy: 0 },
      Date.now(),
      manualAddress || null,
      true,
    );

    setEditLatitude(locationData.latitude.toString());
    setEditLongitude(locationData.longitude.toString());
    setCapturedLocation(locationData);
  }, [editLatitude, editLongitude]);

  const handleAdjustDown = useCallback(() => {
    if (!editLatitude || !editLongitude) return;

    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const { latitude, longitude } = adjustCoordinates(lat, lng, 'down');
    const locationData = createLocationData(
      { latitude, longitude, accuracy: 0 },
      Date.now(),
      manualAddress || null,
      true,
    );

    setEditLatitude(locationData.latitude.toString());
    setEditLongitude(locationData.longitude.toString());
    setCapturedLocation(locationData);
  }, [editLatitude, editLongitude]);

  const handleAdjustLeft = useCallback(() => {
    if (!editLatitude || !editLongitude) return;

    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const { latitude, longitude } = adjustCoordinates(lat, lng, 'left');
    const locationData = createLocationData(
      { latitude, longitude, accuracy: 0 },
      Date.now(),
      manualAddress || null,
      true,
    );

    setEditLatitude(locationData.latitude.toString());
    setEditLongitude(locationData.longitude.toString());
    setCapturedLocation(locationData);
  }, [editLatitude, editLongitude]);

  const handleAdjustRight = useCallback(() => {
    if (!editLatitude || !editLongitude) return;

    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const { latitude, longitude } = adjustCoordinates(lat, lng, 'right');
    const locationData = createLocationData(
      { latitude, longitude, accuracy: 0 },
      Date.now(),
      manualAddress || null,
      true,
    );
    console.log(locationData, 'dddc');

    setEditLatitude(locationData.latitude.toString());
    setEditLongitude(locationData.longitude.toString());
    setCapturedLocation(locationData);
  }, [editLatitude, editLongitude]);

  // Validate location against geofence
  const validateAgainstGeoFence = useCallback(
    (latitude, longitude) => {
      if (!geoFenceData) {
        return { isValid: true, error: null };
      }

      let isInside = false;
      try {
        // Placeholder for actual geofence validation
        isInside = true;
      } catch (err) {
        console.error('GeoFence validation error:', err);
        return { isValid: false, error: 'Geofence validation failed' };
      }

      if (!isInside) {
        return {
          isValid: false,
          error:
            'Location is outside the permitted survey area. Please capture location within the designated geofence.',
        };
      }

      return { isValid: true, error: null };
    },
    [geoFenceData],
  );

  // Check if captured location is within 15m of user's current location
  const isWithin15mRadius = useCallback(() => {
    if (!capturedLocation || !currentUserLocation) {
      return true; // Skip validation if no current location
    }

    const distance = calculateDistanceInMeters(
      currentUserLocation.latitude,
      currentUserLocation.longitude,
      capturedLocation.latitude,
      capturedLocation.longitude,
    );

    return distance <= 15;
  }, [capturedLocation, currentUserLocation]);

  // Save the captured location
  const handleSave = useCallback(async () => {
    if (!capturedLocation) {
      Alert.alert(
        'Error',
        'No location to save. Please capture a location first.',
      );
      return;
    }

    // Check if required field has value
    if (required && !capturedLocation) {
      Alert.alert('Validation Error', `${label} is required.`);
      return;
    }

    // Validate coordinates are valid
    const lat = capturedLocation.latitude;
    const lng = capturedLocation.longitude;
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      Alert.alert('Invalid Location', 'Please enter valid coordinates.');
      return;
    }

    // Check if captured location is within 15m of user's current location
    if (!isWithin15mRadius()) {
      const distance = calculateDistanceInMeters(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        lat,
        lng,
      );
      Alert.alert(
        'Location Too Far',
        `Captured location is ${distance.toFixed(
          1,
        )}m away from your current location. You must be within 15m of your current location to save.`,
        [{ text: 'Retry', onPress: () => retryLocation() }],
      );
      return;
    }

    // Check if address is required but missing
    if (showAddress && (!manualAddress || manualAddress.trim() === '')) {
      Alert.alert(
        'Address Required',
        'Please enter or verify the address before saving.',
        [
          { text: 'Edit Address', style: 'cancel' },
          { text: 'Save Without Address', onPress: () => finalizeSave() },
        ],
      );
      return;
    }

    finalizeSave();
  }, [
    capturedLocation,
    required,
    label,
    showAddress,
    manualAddress,
    isWithin15mRadius,
    currentUserLocation,
  ]);

  const finalizeSave = async () => {
    console.log("Validation effect triggered:");
    
    // Validate against geofence
    const geoFenceCheck = validateAgainstGeoFence(
      capturedLocation.latitude,
      capturedLocation.longitude,
    );

    if (!geoFenceCheck.isValid) {
      Alert.alert(
        'Geofence Validation Failed',
        geoFenceCheck.error ||
          'Location is outside the permitted area. Please retry.',
        [{ text: 'Retry', onPress: () => retryLocation() }],
      );
      onGeoFenceValidation?.({ isValid: false, error: geoFenceCheck.error });
      return;
    }
    setIsSave(true);
    onChange(JSON.stringify(capturedLocation));
    onGeoFenceValidation?.({ isValid: true, error: null });
    Alert.alert('Success', 'Location captured successfully.');
  };

  // Retry location capture
  const retryLocation = () => {
    captureLocation();
  };

  // Cancel everything - reset to initial state
  const cancelCapture = () => {
    Alert.alert(
      'Cancel Capture',
      'Are you sure you want to cancel? All captured data will be lost.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => clearLocation(),
        },
      ],
    );
  };

  // Main location capture handler
  const handleLocationCapture = useCallback(
    async (position, isAccurate = true) => {
      const { coords, timestamp } = position;

      // Also update current user location
      setCurrentUserLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });

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
      setOriginalCapturedLocation(locationData);
      setShowActionButtons(true);

      // Only update map if MapView is available xx
      // if (MapView) {
      //   updateMapLocation(coords.latitude, coords.longitude);
      // }

      // onChange(JSON.stringify(locationData));
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
    setIsSave(false);
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
          `Location accuracy (${coords.accuracy.toFixed(
            0,
          )}m) is below the required threshold (${minAccuracy}m).`,
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
            errorMessage =
              'Location permission denied. Please enable location access in settings.';
            break;
          case 2:
            errorMessage =
              'Location information is unavailable. Please check your GPS.';
            break;
          case 3:
            errorMessage = `Location request timed out after ${
              timeout / 1000
            } seconds. Please try again.`;
            break;
          default:
            errorMessage += error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Location Error', errorMessage);
      handleFieldValidation(
        errorMessage,
        `${label} capture failed: ${errorMessage}`,
      );
      onCaptureError?.(error);
      setShowActionButtons(false);
    } finally {
      setIsCapturing(false);
      setIsPressed(true);
    }
    // handleSave();
  };

  const clearLocation = () => {
    if (disabled || isPreview) return;
    setCapturedLocation(null);
    setOriginalCapturedLocation(null);
    setManualAddress('');
    setEditLatitude('');
    setEditLongitude('');
    setIsEditingCoords(false);
    setShowActionButtons(false);
    handleFieldValidation('');
    setIsSave(false);
    onChange('');
    if (currentUserLocation) {
      updateMapLocation(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
      );
    } else {
      setMapRegion(null);
    }
    setGeoFenceValidation(null);
  };

  // Open app settings for permission issues
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Edit coordinates manually
  const startEditingCoords = () => {
    if (!isMannualEntryAllowed || disabled || isPreview) return;
    setIsEditingCoords(true);
    setEditLatitude(
      capturedLocation ? formatCoordinate(capturedLocation.latitude) : '',
    );
    setEditLongitude(
      capturedLocation ? formatCoordinate(capturedLocation.longitude) : '',
    );
  };

  const saveEditedCoordinates = async () => {
    setIsSave(false);
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

    // Check distance from user's current location
    if (currentUserLocation) {
      const distance = calculateDistanceInMeters(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        lat,
        lng,
      );
      if (distance > 15) {
        Alert.alert(
          'Invalid Coordinates',
          `Coordinates are ${distance.toFixed(
            1,
          )}m from your current location. Must be within 15m radius.`,
        );
        return;
      }
    }

    setIsEditingCoords(false);
    const locationData = createLocationData(
      {
        latitude: lat,
        longitude: lng,
        accuracy: capturedLocation?.accuracy || 0,
      },
      Date.now(),
      manualAddress || null,
      true,
    );

    setCapturedLocation(locationData);
    setOriginalCapturedLocation(locationData);
    // handleSave();
  };

  const cancelEditingCoords = () => {
    setIsEditingCoords(false);
    setEditLatitude('');
    setEditLongitude('');
    setCapturedLocation(originalCapturedLocation);
  };

  // Update address
  const updateAddress = address => {
    setManualAddress(address);
    if (capturedLocation) {
      const updatedLocation = {
        ...capturedLocation,
        address: address || null,
      };
      setCapturedLocation(updatedLocation);
      // onChange(JSON.stringify(updatedLocation));
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
        return (
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            zoomEnabled={true}
            scrollEnabled={true}
            showsUserLocation={false} // Don't show default user location, we'll use custom marker
            showsMyLocationButton={false} // Show button to center on user location
            followsUserLocation={false} // Center map on user location when it changes
            onError={e => {
              console.warn('MapView error:', e);
              setMapError(true);
            }}
          >
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
            />

            {/* 15m Radius Circle centered on User's Current Location */}
            {currentUserLocation && (
              <Circle
                center={{
                  latitude: currentUserLocation.latitude,
                  longitude: currentUserLocation.longitude,
                }}
                radius={15}
                strokeColor={`${COLORS.error || '#f44336'}80`}
                fillColor={`${COLORS.error || '#f44336'}20`}
                strokeWidth={2}
              />
            )}

            {/* User's Current Location Marker (Blue) */}
            {currentUserLocation && (
              <Marker
                coordinate={{
                  latitude: currentUserLocation.latitude,
                  longitude: currentUserLocation.longitude,
                }}
                title="Your Current Location"
                pinColor="#2196F3"
              >
                <View style={styles.currentLocationMarker}>
                  <View style={styles.currentLocationDot} />
                </View>
              </Marker>
            )}

            {/* Captured Location Marker (Red/Draggable) */}
            {capturedLocation && (
              <Marker
                coordinate={{
                  latitude: capturedLocation.latitude,
                  longitude: capturedLocation.longitude,
                }}
                title="Captured Location"
                description={`Accuracy: ±${capturedLocation.accuracy.toFixed(
                  0,
                )}m`}
                pinColor="#f44336"
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
          {isGettingCurrentLocation
            ? 'Getting your location...'
            : 'Capture location to see map'}
        </Text>
        {isGettingCurrentLocation && (
          <ActivityIndicator
            style={{ marginTop: 12 }}
            size="small"
            color={COLORS.primary}
          />
        )}
      </View>
    );
  };

  // Render edit coordinates with directional controls
  const renderEditCoordinates = () => {
    return (
      <View style={styles.editCoordsContainer}>
        <View style={styles.editCoordRow}>
          <Text style={styles.editCoordLabel}>Latitude:</Text>
          <TextInput
            style={[styles.editCoordInput, styles.editCoordInputWithControls]}
            value={editLatitude}
            onChangeText={setEditLatitude}
            keyboardType="numeric"
            placeholder="e.g., 12.345678"
            placeholderTextColor={COLORS.text.secondary}
          />
          <View style={styles.directionControls}>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={handleAdjustUp}
              disabled={disabled}
            >
              <Icon name="arrow-upward" size={20} color={COLORS.text.inverse} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={handleAdjustDown}
              disabled={disabled}
            >
              <Icon
                name="arrow-downward"
                size={20}
                color={COLORS.text.inverse}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.editCoordRow}>
          <Text style={styles.editCoordLabel}>Longitude:</Text>
          <TextInput
            style={[styles.editCoordInput, styles.editCoordInputWithControls]}
            value={editLongitude}
            onChangeText={setEditLongitude}
            keyboardType="numeric"
            // placeholder="e.g., 98.765432"
            placeholderTextColor={COLORS.text.secondary}
          />
          <View style={styles.directionControls}>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={handleAdjustLeft}
              disabled={disabled}
            >
              <Icon name="arrow-back" size={20} color={COLORS.text.inverse} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={handleAdjustRight}
              disabled={disabled}
            >
              <Icon
                name="arrow-forward"
                size={20}
                color={COLORS.text.inverse}
              />
            </TouchableOpacity>
          </View>
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
            <Text style={styles.saveEditButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
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
                  <Icon
                    name="gps-fixed"
                    size={14}
                    color={COLORS.text.secondary}
                  />
                  <Text style={styles.accuracyText}>
                    Accuracy: ±{capturedLocation.accuracy.toFixed(0)}m
                  </Text>
                </View>
              )}

              {capturedLocation.isManualEntry && (
                <View style={styles.manualEntryIndicator}>
                  <Icon name="edit" size={14} color={COLORS.warning} />
                  <Text
                    style={[styles.manualEntryText, { color: COLORS.warning }]}
                  >
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
      <View style={styles.mapContainer}>{renderMap()}</View>

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
              <Icon name="edit" size={18} color={COLORS.text.inverse} />
              <Text style={styles.editCoordsButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingCoords ? (
          renderEditCoordinates()
        ) : (
          <View style={styles.coordinatesContainer}>
            <View style={styles.coordinateBox}>
              <Text style={styles.coordinateLabel}>Latitude</Text>
              <Text style={styles.coordinateValue}>
                {capturedLocation
                  ? formatCoordinate(capturedLocation.latitude)
                  : '—'}
              </Text>
            </View>
            <View style={styles.coordinateBox}>
              <Text style={styles.coordinateLabel}>Longitude</Text>
              <Text style={styles.coordinateValue}>
                {capturedLocation
                  ? formatCoordinate(capturedLocation.longitude)
                  : '—'}
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
      {/* {capturedLocation && (
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

          {currentUserLocation && (
            <View style={styles.infoRow}>
              <Icon name="circle" size={16} color={COLORS.error} />
              <Text style={styles.infoText}>
                Must be within 15m of your current location
              </Text>
            </View>
          )}

          {currentUserLocation && capturedLocation && (() => {
            const distance = calculateDistanceInMeters(
              currentUserLocation.latitude,
              currentUserLocation.longitude,
              capturedLocation.latitude,
              capturedLocation.longitude
            );
            return (
              <View style={styles.infoRow}>
                <Icon name="straighten" size={16} color={distance <= 15 ? COLORS.success : COLORS.error} />
                <Text style={[styles.infoText, { color: distance <= 15 ? COLORS.success : COLORS.error }]}>
                  Distance from you: {distance.toFixed(1)}m {distance > 15 ? '(Too far)' : '(OK)'}
                </Text>
              </View>
            );
          })()}

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

          {geoFenceValidation && !geoFenceValidation.isValid && (
            <View style={styles.infoRow}>
              <Icon name="warning" size={16} color={COLORS.error} />
              <Text style={[styles.infoText, { color: COLORS.error }]}>
                {geoFenceValidation.error}
              </Text>
            </View>
          )}
        </View>
      )} */}

      {/* Action Buttons - Show Capture button initially, then Save/Retry/Cancel after capture */}
      <View style={styles.actionButtonsContainer}>
        {!showActionButtons ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.captureButton]}
            onPress={captureLocation}
            disabled={disabled || isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color={COLORS.text.inverse} />
            ) : (
              <>
                <Icon
                  name="my-location"
                  size={18}
                  color={COLORS.text.inverse}
                />
                <Text style={styles.actionButtonText}>Capture</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles[isSave ? 'disabledButton' : 'saveButton']]}
              onPress={handleSave}
              disabled={disabled}
            >
              <Icon name="save" size={18} color={isSave ? COLORS.text.disabled :COLORS.text.inverse} />
              <Text style={[styles.actionButtonText, { color: isSave ? COLORS.text.disabled : COLORS.text.inverse }]}>
                Validate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.retryButton]}
              onPress={retryLocation}
              disabled={disabled || isCapturing}
            >
              <Icon name="refresh" size={18} color={COLORS.gray[500]} />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: COLORS.gray[500] },
                ]}
              >
                Retry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={cancelCapture}
              disabled={disabled}
            >
              <Icon name="close" size={18} color={COLORS.error} />
              <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Clear button - always available when location exists */}
      {capturedLocation && !showActionButtons && (
        <TouchableOpacity
          style={[styles.clearFullButton]}
          onPress={clearLocation}
          disabled={disabled}
        >
          <Icon name="delete-outline" size={18} color={COLORS.error} />
          <Text style={[styles.clearFullButtonText, { color: COLORS.error }]}>
            Clear Location
          </Text>
        </TouchableOpacity>
      )}

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
              style={[
                commonStyles.secondaryButton,
                { alignSelf: 'flex-start', marginTop: 8 },
              ]}
              onPress={openSettings}
            >
              <Icon name="settings" size={16} color={COLORS.text.primary} />
              <Text style={commonStyles.secondaryButtonText}>
                Open Settings
              </Text>
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
  geoFenceData: PropTypes.object,
  onGeoFenceValidation: PropTypes.func,
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
  geoFenceData: null,
  onGeoFenceValidation: null,
};

export default memo(LocationField);

const styles = StyleSheet.create({
  // Map Container
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

  // Current Location Marker Styles
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Sections
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

  // Coordinates Display
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

  // Coordinates Header with Edit Button
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
    color: COLORS.text.inverse || '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },

  // Edit Coordinates Mode
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
  editCoordInputWithControls: {
    marginRight: 8,
  },
  directionControls: {
    flexDirection: 'row',
    gap: 4,
  },
  directionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight || '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Address Input
  addressInput: {
    backgroundColor: COLORS.surface || '#fff',
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

  // Info Row
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

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
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
  saveButton: {
    backgroundColor: COLORS.success || '#4caf50',
  },
  retryButton: {
    backgroundColor: COLORS.gray?.[100] || '#eeeeee',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
  },
  disabledButton: {
    backgroundColor: COLORS.gray?.[200] || '#e0e0e0',
  },
  cancelButton: {
    backgroundColor: COLORS.errorLight || '#ffebee',
    borderWidth: 1,
    borderColor: COLORS.error || '#f44336',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text?.inverse || '#fff',
  },
  clearFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
    backgroundColor: COLORS.errorLight || '#ffebee',
    borderWidth: 1,
    borderColor: COLORS.error || '#f44336',
  },
  clearFullButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Manual Entry Indicator (for preview compatibility)
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

  // Timestamp (for preview compatibility)
  timestampText: {
    fontSize: 12,
    color: COLORS.text?.secondary || '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Address container (for preview compatibility)
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

  // Accuracy container (for preview compatibility)
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
