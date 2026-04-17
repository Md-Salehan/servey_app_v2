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
      const coords = await LocationService.getCurrentLocation(options);
      setLocation(coords);
      setLoading(false);
      return coords;
    } catch (err) {
      setError(err.message);
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