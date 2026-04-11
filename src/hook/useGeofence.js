import { useEffect, useState, useCallback, useMemo } from 'react';
import * as turf from '@turf/turf';
import Geolocation from '@react-native-community/geolocation';

export function useGeofence(geoJSON, options = {}) {
  const {
    bufferMeters = 0,
    retryCount = 3,
    highAccuracy = true,
    inputLocation = null, // { latitude: number, longitude: number }
  } = options;

  const [location, setLocation] = useState(inputLocation);
  const [isInside, setIsInside] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Memoized buffered polygon (important optimization)
  const processedGeoJSON = useMemo(() => {
    if (!geoJSON) return null;

    // 🔥 If no buffer → return as-is
    if (bufferMeters <= 0) return geoJSON;

    const bufferKm = bufferMeters / 1000;

    // FeatureCollection case
    if (geoJSON.type === 'FeatureCollection') {
      return {
        ...geoJSON,
        features: geoJSON.features.map(feature =>
          turf.buffer(feature, bufferKm, { units: 'kilometers' }),
        ),
      };
    }

    // Single geometry
    return turf.buffer(geoJSON, bufferKm, {
      units: 'kilometers',
    });
  }, [geoJSON, bufferMeters]);

  // 📍 Get device location (only if needed)
  const getLocation = () =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        { enableHighAccuracy: highAccuracy, timeout: 10000 },
      );
    });

  const checkInside = (point, geoJSON) => {
    // Case 1: FeatureCollection
    if (geoJSON.type === 'FeatureCollection') {
      return geoJSON.features.some(feature =>
        turf.booleanPointInPolygon(point, feature),
      );
    }

    // Case 2: Single Feature / Polygon / MultiPolygon
    return turf.booleanPointInPolygon(point, geoJSON);
  };

  const validateLocation = useCallback(
    async (overrideLocation = null) => {
      if (!processedGeoJSON) return;

      setLoading(true);
      setError(null);

      let attempts = 0;
      let coords = overrideLocation || inputLocation;

      while (attempts < retryCount) {
        try {
          // 🔥 Priority:
          // 1. overrideLocation (manual call)
          // 2. inputLocation (passed param)
          // 3. device GPS
          if (!coords) {
            const gpsCoords = await getLocation();
            coords = {
              latitude: gpsCoords.latitude,
              longitude: gpsCoords.longitude,
            };
          }

          const { latitude, longitude } = coords;

          setLocation({ latitude, longitude });

          const point = turf.point([longitude, latitude]);

          const result = checkInside(point, processedGeoJSON);

          setIsInside(result);

          if (result) break;

          // If using external location → don't retry GPS
          if (overrideLocation || inputLocation) break;

          attempts++;
        } catch (err) {
          setError(err.message);
          break;
        }
      }

      setLoading(false);
    },
    [processedGeoJSON, retryCount, inputLocation],
  );

  // 🔄 Auto-run when inputLocation changes
  useEffect(() => {
    if (inputLocation) {
      validateLocation(inputLocation);
    } else {
      validateLocation();
    }
  }, [inputLocation, validateLocation]);

  return {
    location,
    isInside,
    loading,
    error,
    retry: validateLocation, // can pass overrideLocation here
    validateWithLocation: (lat, lng) =>
      validateLocation({ latitude: lat, longitude: lng }), // 🔥 helper
  };
}
