// hook/useCurrentLocation.js
import { useState, useCallback } from 'react';
import LocationService from '../services/LocationService';

const useCurrentLocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get position using the promisified method
      const position = await LocationService.getCurrentLocation(options);
      
      // Extract coordinates (same structure as LocationField)
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
      setLoading(false);
      return coords;
    } catch (err) {
      console.error('Location error in hook:', err);
      
      // Extract meaningful error message (same as LocationField)
      let errorMessage;
      if (err.code !== undefined) {
        switch (err.code) {
          case 1:
            errorMessage = 'Location permission denied. Please enable location access in settings.';
            break;
          case 2:
            errorMessage = 'Location information is unavailable.';
            break;
          case 3:
            errorMessage = `Location request timed out after ${options.timeout / 1000 || 25} seconds.`;
            break;
          default:
            errorMessage = err.message || 'Failed to get location';
        }
      } else {
        errorMessage = err.message || 'Failed to get location';
      }
      
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [options]);

  const retry = useCallback(() => {
    return getLocation();
  }, [getLocation]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    getLocation,
    retry,
    clearLocation,
  };
};

export default useCurrentLocation;