// hook/useGeoFenceData.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetFenceDataMutation } from '../features/geoFence/geoFence.api';
import GeoFenceService from '../services/geoFenceService';
import useInternetStatus from './useInternetStatus';

const useGeoFenceData = (database, appId, formId) => {
  const [geoFenceData, setGeoFenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const { user } = useSelector(state => state.auth);
  const { isOnline } = useInternetStatus();
  const [getFenceData, { isLoading: isApiLoading }] = useGetFenceDataMutation();
  
  const geoFenceService = new GeoFenceService(database);

  // Load from local database
  const loadFromLocalDB = useCallback(async () => {
    try {
      const data = await geoFenceService.getGeoFenceData(
        appId,
        formId,
        user?.userId
      );
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
  }, [appId, formId, user?.userId]);

  // Fetch from server and save to local DB
  const fetchFromServer = useCallback(async () => {
    try {
      const payload = {
        apiId: 'WGA00238',
        criteria: {
          layerId: '00001',
          portalId: '00001',
        },
      };
      
      const response = await getFenceData(payload).unwrap();
      
      if (response) {
        // Save to local database
        await geoFenceService.saveGeoFenceData(
          appId,
          formId,
          user?.userId,
          response,
          0, // latitude
          0  // longitude
        );
        
        setGeoFenceData(response);
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
  }, [appId, formId, user?.userId, getFenceData]);

  // Main initialization function
  const initializeGeoFence = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, try to load from local DB
      const hasLocalData = await loadFromLocalDB();
      
      // If online, try to fetch latest from server regardless of local data
      if (isOnline) {
        const success = await fetchFromServer();
        if (!success && !hasLocalData) {
          setError('Failed to load geoFence data. Please check your connection and try again.');
        }
      } else if (!hasLocalData) {
        // Offline and no local data
        setError('No geoFence data available offline. Please connect to the internet to download it.');
      }
    } catch (err) {
      console.error('Error initializing geoFence:', err);
      setError('Failed to load geoFence data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isOnline, loadFromLocalDB, fetchFromServer]);

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
        setError('No geoFence data available offline. Please connect to the internet.');
      }
    }
    
    setLoading(false);
  }, [isOnline, fetchFromServer, loadFromLocalDB]);

  useEffect(() => {
    if (appId && formId && user?.userId) {
      initializeGeoFence();
    }
  }, [appId, formId, user?.userId]);

  return {
    geoFenceData,
    loading: loading || isApiLoading,
    error,
    isFromCache,
    retry,
    refresh: fetchFromServer,
  };
};

export default useGeoFenceData;