// hook/useCurrentLocation.js
import { useState, useEffect, useCallback, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

const useCurrentLocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    retryCount = 3,
    retryDelay = 2000, // milliseconds
    distanceFilter = 0,
    watchPosition = false,
    onLocationChange = null,
  } = options;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [watchId, setWatchId] = useState(null);
  const isMounted = useRef(true);
  const retryTimeoutRef = useRef(null);
  const watchIdRef = useRef(null);

  // Request location permissions
  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to validate geofence areas.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    } else {
      // iOS permissions are handled in Info.plist
      return true;
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          resolve(coords);
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
          distanceFilter,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, distanceFilter]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (watchIdRef.current) {
      Geolocation.clearWatch(watchIdRef.current);
    }

    const id = Geolocation.watchPosition(
      position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };
        
        setLocation(coords);
        setError(null);
        
        if (onLocationChange) {
          onLocationChange(coords);
        }
      },
      error => {
        console.error('Watch position error:', error);
        setError(error.message);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
        distanceFilter,
      }
    );
    
    watchIdRef.current = id;
    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, distanceFilter, onLocationChange]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setWatchId(null);
    }
  }, []);

  // Main function to fetch location with retry
  const fetchLocation = useCallback(async (skipPermissionCheck = false) => {
    if (!isMounted.current) return null;

    setLoading(true);
    setError(null);

    try {
      // Check permissions
      if (!skipPermissionCheck) {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('Location permission denied');
        }
      }

      // Get current location
      const currentLocation = await getCurrentLocation();
      
      if (isMounted.current) {
        setLocation(currentLocation);
        setRetryAttempt(0);
        setError(null);
      }
      
      return currentLocation;
    } catch (err) {
      console.error('Error getting location:', err);
      
      let errorMessage = 'Failed to get location';
      
      switch (err.code) {
        case 1:
          errorMessage = 'Location permission denied. Please enable location permissions.';
          break;
        case 2:
          errorMessage = 'Location unavailable. Please check your GPS settings.';
          break;
        case 3:
          errorMessage = 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage = err.message || 'Failed to get location';
      }
      
      if (isMounted.current) {
        setError(errorMessage);
      }
      
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [getCurrentLocation, requestPermissions]);

  // Fetch location with automatic retry
  const fetchLocationWithRetry = useCallback(async () => {
    if (!isMounted.current) return null;

    setLoading(true);
    setError(null);
    
    let attempt = 0;
    let lastError = null;
    
    while (attempt < retryCount) {
      try {
        // Check permissions
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('Location permission denied');
        }
        
        // Get current location
        const currentLocation = await getCurrentLocation();
        
        if (isMounted.current) {
          setLocation(currentLocation);
          setRetryAttempt(0);
          setError(null);
          setLoading(false);
          return currentLocation;
        }
        
        break;
      } catch (err) {
        lastError = err;
        attempt++;
        setRetryAttempt(attempt);
        
        if (attempt < retryCount) {
          // Wait before retrying
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, retryDelay);
          });
        }
      }
    }
    
    // All retries failed
    let errorMessage = 'Failed to get location after multiple attempts';
    
    if (lastError) {
      switch (lastError.code) {
        case 1:
          errorMessage = 'Location permission denied. Please enable location permissions.';
          break;
        case 2:
          errorMessage = 'Location unavailable. Please check your GPS settings.';
          break;
        case 3:
          errorMessage = 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage = lastError.message || 'Failed to get location';
      }
    }
    
    if (isMounted.current) {
      setError(errorMessage);
      setLoading(false);
    }
    
    return null;
  }, [getCurrentLocation, requestPermissions, retryCount, retryDelay]);

  // Manual retry function
  const retry = useCallback(async () => {
    return await fetchLocationWithRetry();
  }, [fetchLocationWithRetry]);

  // Get location with custom options
  const getLocationWithOptions = useCallback(async (customOptions = {}) => {
    const mergedOptions = { ...options, ...customOptions };
    const {
      enableHighAccuracy: customAccuracy = true,
      timeout: customTimeout = 15000,
      maximumAge: customMaxAge = 10000,
    } = mergedOptions;
    
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          resolve(coords);
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: customAccuracy,
          timeout: customTimeout,
          maximumAge: customMaxAge,
        }
      );
    });
  }, []);

  // Start watching location (if watchPosition is true)
  useEffect(() => {
    if (watchPosition) {
      startWatching();
    }
    
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch(watchIdRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      isMounted.current = false;
    };
  }, [watchPosition, startWatching]);

  return {
    location,
    loading,
    error,
    retryAttempt,
    retry,
    fetchLocation,
    fetchLocationWithRetry,
    getLocationWithOptions,
    refresh: fetchLocationWithRetry,
    requestPermissions,
    startWatching,
    stopWatching,
    isWatching: !!watchId,
  };
};

export default useCurrentLocation;