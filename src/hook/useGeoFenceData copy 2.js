// hook/useGeoFenceData.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useGetFenceDataMutation } from '../features/geoFence/geoFence.api';
import GeoFenceService from '../services/geoFenceService';
import useInternetStatus from './useInternetStatus';

//this time your implementation sound correct , just make it simpler just stick to the essential requirements but no comporomiseation 

const useGeoFenceData = (database, appId, useLocalDB = false) => {
  const [geoFenceData, setGeoFenceData] = useState(null);
  const [geofenceList, setGeofenceList] = useState([]); // Array of FeatureCollections
  const [geofenceSummary, setGeofenceSummary] = useState([]); // Summary of all geofences
  const [geofenceCount, setGeofenceCount] = useState(0);
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
      if (data && data.geofences && Array.isArray(data.geofences)) {
        setGeoFenceData(data);
        setGeofenceList(data.geofences);
        setGeofenceCount(data.geofences.length);
        
        // Get summary of all geofences
        const summary = await geoFenceService.getGeofenceSummary(appId, user?.userId);
        setGeofenceSummary(summary);
        
        setIsFromCache(true);
        setError(null);
        console.log(`✅ GeoFence loaded from local DB (${data.geofences.length} geofence(s))`);
        return true;
      }
      setGeofenceList([]);
      setGeofenceCount(0);
      setGeofenceSummary([]);
      return false;
    } catch (err) {
      console.error('Error loading from local DB:', err);
      setGeofenceList([]);
      setGeofenceCount(0);
      setGeofenceSummary([]);
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

        const data = {
          type: 'GeofenceCollection',
          geofences: geoJSONsArray,
          totalGeofences: geoJSONsArray.length,
          lastUpdated: Date.now()
        };
        
        setGeoFenceData(data);
        setGeofenceList(geoJSONsArray);
        setGeofenceCount(geoJSONsArray.length);
        
        // Get summary of all geofences
        const summary = await geoFenceService.getGeofenceSummary(appId, user?.userId);
        setGeofenceSummary(summary);
        
        setIsFromCache(false);
        setError(null);
        console.log(`✅ GeoFence fetched from server and saved to local DB (${geoJSONsArray.length} geofence(s))`);
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

  // Validate current location against ALL geofences (returns true if inside ANY)
  const validateLocation = useCallback(
    async location => {
      if (!geoFenceData) {
        return {
          isValid: false,
          error: 'Geofence data not loaded yet',
          isInside: false,
          matchedGeofenceIndex: -1,
          matchedGeofenceName: null,
          matchedGeofenceId: null,
        };
      }

      const result = geoFenceService.validateLocationInGeofence(
        geoFenceData,
        location,
      );
      setValidationResult(result);
      return result;
    },
    [geoFenceData],
  );

  // Get specific geofence by index
  const getGeofenceByIndex = useCallback(
    index => {
      if (geofenceList && geofenceList[index]) {
        return geofenceList[index];
      }
      return null;
    },
    [geofenceList],
  );

  // Get geofence by name or ID
  const getGeofenceById = useCallback(
    id => {
      return geofenceSummary.find(
        summary => summary.id === id || summary.name === id
      );
    },
    [geofenceSummary],
  );

  // Process all geofences with buffer
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
    geofenceList,           // Array of FeatureCollections
    geofenceSummary,        // Summary of all geofences (names, IDs)
    geofenceCount,          // Total number of geofences assigned to user
    loading: loading || isApiLoading,
    error,
    isFromCache,
    validationResult,
    validateLocation,       // Returns true if inside ANY geofence
    getProcessedGeofence,
    getGeofenceByIndex,     // Get specific geofence by index
    getGeofenceById,        // Get geofence by ID or name
    retry,
    refresh: fetchFromServer,
    clearValidation,
  };
};

export default useGeoFenceData;