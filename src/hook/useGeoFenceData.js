// hook/useGeoFenceData.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
// import { useGetFenceDataMutation } from '../features/geoFence/geoFence.api';
import { useGetFenceDataMutation } from '../api';
import GeoFenceService from '../services/geoFenceService';
import useInternetStatus from './useInternetStatus';

const useGeoFenceData = (database, appId, useLocalDB = false) => {
  const [geoFenceData, setGeoFenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const { user } = useSelector(state => state.auth);
  const { isOnline } = useInternetStatus();
  const [getFenceData, { isLoading: isApiLoading }] = useGetFenceDataMutation();

  const geoFenceService = new GeoFenceService(database);

  // Load from local database
  const loadFromLocalDB = useCallback(async () => {
    try {
      const data = await geoFenceService.getGeoFenceData(appId, user?.userId);
      if (data) {
        setGeoFenceData(data);
        setIsFromCache(true);
        setError(null);
        console.log('✅ GeoFence loaded from local DB');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error loading from local DB:', err);
      return false;
    }
  }, [appId, user?.userId]);

  // Fetch from server and save to local DB
  const fetchFromServer = useCallback(async () => {
    try {
      const payload = {
        apiId: 'SUA01049',
        criteria: {
          appId: appId,
          userId: user?.userId || '',
        },
      };

      const geoJSONsArray = await getFenceData(payload).unwrap();

      if (geoJSONsArray && Array.isArray(geoJSONsArray)) {
        // Save to local database
        await geoFenceService.saveGeoFenceData(appId, user?.userId, geoJSONsArray);

        setGeoFenceData(geoJSONsArray);
        setIsFromCache(false);
        setError(null);
        console.log('✅ GeoFence fetched from server and saved to local DB');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error fetching from server:', err);
      return false;
    }
  }, [appId, user?.userId, getFenceData]);

  // Main initialization function
  const initializeGeoFence = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First, try to load from local DB
      const hasLocalData = await loadFromLocalDB();

      // If online, try to fetch latest from server regardless of local data
      if (isOnline && (!hasLocalData || useLocalDB === false)) {
        const success = await fetchFromServer();
        if (!success && !hasLocalData) {
          setError(
            'Failed to load geoFence data. Please check your connection and try again.',
          );
        }
      } else if (!hasLocalData) {
        // Offline and no local data
        setError(
          'No geoFence data available offline. Please connect to the internet to download it.',
        );
      }
    } catch (err) {
      console.error('Error initializing geoFence:', err);
      setError('Failed to load geoFence data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isOnline, loadFromLocalDB, fetchFromServer]);

  // Validate current location against geofence
  const validateLocation = useCallback(
    (givenGeoFenceData,location )=> {
      if (!givenGeoFenceData) {
        return {
          isValid: false,
          error: 'Geofence data not loaded yet',
          isInside: false,
        };
      }
      
      const result = geoFenceService.validateLocationInGeoFence(
        givenGeoFenceData,
        location,
      );

      setValidationResult(result);
      return result;
    },
    [],
  );



  // Process geofence with buffer
  const getProcessedGeofence = useCallback(
    (bufferMeters = 0) => {
      return geoFenceService.processGeofenceWithBuffer(
        geoFenceData,
        bufferMeters,
      );
    },
    [geoFenceData],
  );

  // Retry function
  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isOnline) {
      const success = await fetchFromServer();
      if (!success) {
        const hasLocalData = await loadFromLocalDB();
        if (!hasLocalData) {
          setError('Failed to load geoFence data. Please try again.');
        }
      }
    } else {
      const hasLocalData = await loadFromLocalDB();
      if (!hasLocalData) {
        setError(
          'No geoFence data available offline. Please connect to the internet.',
        );
      }
    }

    setLoading(false);
  }, [isOnline, fetchFromServer, loadFromLocalDB]);

  // Clear validation result
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  useEffect(() => {
    if (appId && user?.userId) {
      initializeGeoFence();
    }
  }, [appId, user?.userId]);

  return {
    geoFenceData,
    loading: loading || isApiLoading,
    error,
    isFromCache,
    validationResult,
    validateLocation,
    getProcessedGeofence,
    retry,
    refresh: fetchFromServer,
    clearValidation,
  };
};

export default useGeoFenceData;