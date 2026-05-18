// services/geoFenceService.js

import { Q } from '@nozbe/watermelondb';
import * as turf from '@turf/turf';

class GeoFenceService {
  constructor(database) {
    if (!database) {
      throw new Error('Database is required for GeoFenceService');
    }
    this.database = database;
  }

  /**
   * Save geofence data to local database
   * @param {string} appId - Application ID
   * @param {string} userId - User ID
   * @param {Array} geoJSONsArray - Array of FeatureCollection objects
   */
  async saveGeoFenceData(appId, userId, geoJSONsArray) {
    console.log(
      { appId, userId, arrayLength: geoJSONsArray?.length },
      'saveGeoFenceData',
    );

    if (!geoJSONsArray || !Array.isArray(geoJSONsArray)) {
      console.error('❌ Cannot save geofence: geoJSONsArray is not an array');
      return false;
    }

    try {
      const geoFencesCollection = this.database.collections.get('geo_fences');

      // Check if geofence already exists for this user/app
      const existing = await geoFencesCollection
        .query(Q.where('app_id', appId), Q.where('user_id', userId))
        .fetch();

      await this.database.write(async () => {
        if (existing.length > 0) {
          // Update existing geofence
          await existing[0].update(record => {
            record.geojson = geoJSONsArray;
          });
          console.log(
            `✅ Geofence data updated in local DB (${geoJSONsArray.length} geofence(s))`,
          );
        } else {
          // Create new geofence
          await geoFencesCollection.create(record => {
            record.appId = appId;
            record.userId = userId;
            record.geojson = JSON.stringify(geoJSONsArray);
          });
          console.log(
            `✅ Geofence data saved to local DB (${geoJSONsArray.length} geofence(s))`,
          );
        }
      });

      return true;
    } catch (error) {
      console.error('Error saving geofence data:', error);
      return false;
    }
  }

  /**
   * Get geofence data from local database
   */
  async getGeoFenceData(appId, userId) {
    try {
      const geoFencesCollection = this.database.collections.get('geo_fences');
      const geofences = await geoFencesCollection
        .query(Q.where('app_id', appId), Q.where('user_id', userId))
        .fetch();

      if (geofences.length > 0) {
        console.log('📦 Geofence data loaded from local DB');
        return geofences[0].geojson;
      }
      return null;
    } catch (error) {
      console.error('Error loading geofence from DB:', error);
      return null;
    }
  }

  /**
   * Delete geofence data
   */
  async deleteGeoFenceData(appId, userId) {
    try {
      const geoFencesCollection = this.database.collections.get('geo_fences');
      const existing = await geoFencesCollection
        .query(Q.where('app_id', appId), Q.where('user_id', userId))
        .fetch();

      if (existing.length > 0) {
        await this.database.write(async () => {
          await existing[0].destroyPermanently();
        });
        console.log('🗑️ Geofence data deleted from local DB');
      }
      return true;
    } catch (error) {
      console.error('Error deleting geofence data:', error);
      return false;
    }
  }

  /**
   * Validate if a location is inside ANY of the geofences assigned to the user
   * @param {Array} geoJSONsArray - Array of FeatureCollection objects
   * @param {Object} location - Location object with latitude and longitude
   * @returns {Object} Validation result
   */
  //  validateLocationInGeoFence(geojson, location) {
  //   console.log('xxw:', {geojson, location});

  //     if (!geojson) {
  //       return {
  //         isValid: false,
  //         error: 'Geofence data not available',
  //         isInside: false,
  //       };
  //     }

  //     if (!location || !location.latitude || !location.longitude) {
  //       return {
  //         isValid: false,
  //         error: 'Location data not available',
  //         isInside: false,
  //       };
  //     }

  //     try {
  //       const point = turf.point([location.longitude, location.latitude]);

  //       let isInside = false;

  //       // Check if it's a FeatureCollection
  //       if (geojson.type === 'FeatureCollection') {
  //         isInside = geojson.features.some(feature =>
  //           turf.booleanPointInPolygon(point, feature),
  //         );
  //       }
  //       // Check if it's a single Feature
  //       else if (geojson.type === 'Feature') {
  //         isInside = turf.booleanPointInPolygon(point, geojson);
  //       }
  //       // Check if it's a Polygon or MultiPolygon directly
  //       else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
  //         isInside = turf.booleanPointInPolygon(point, geojson);
  //       } else {
  //         return {
  //           isValid: false,
  //           error: 'Invalid GeoJSON format',
  //           isInside: false,
  //         };
  //       }

  //       return {
  //         isValid: true, // Validation successful
  //         isInside,
  //         location,
  //         error: null,
  //       };
  //     } catch (error) {
  //       console.error('Error validating location:', error);
  //       return {
  //         isValid: false,
  //         error: `Geofence validation error: ${error.message}`,
  //         isInside: false,
  //       };
  //     }
  //   }

  validateLocationInGeoFence(geojson, location) {
    // Handle multiple GeoJSON (array)
    if (Array.isArray(geojson)) {
      if (geojson.length === 0) {
        return {
          isValid: false,
          error: 'Geofence data not available - empty array',
          isInside: false,
        };
      }

      if (!location || !location.latitude || !location.longitude) {
        return {
          isValid: false,
          error: 'Location data not available',
          isInside: false,
        };
      }

      try {
        const point = turf.point([location.longitude, location.latitude]);

        // Check if point is inside ANY of the GeoJSONs
        const isInside = geojson.some(geo => {
          return this.isPointInGeoJSON(point, geo);
        });

        return {
          isValid: true,
          isInside,
          location,
          error: null,
        };
      } catch (error) {
        console.error(
          'Error validating location against multiple GeoJSONs:',
          error,
        );
        return {
          isValid: false,
          error: `Geofence validation error: ${error.message}`,
          isInside: false,
          location,
        };
      }
    }

    // Handle single GeoJSON (original logic)
    if (!geojson) {
      return {
        isValid: false,
        error: 'Geofence data not available',
        isInside: false,
      };
    }

    if (!location || !location.latitude || !location.longitude) {
      return {
        isValid: false,
        error: 'Location data not available',
        isInside: false,
      };
    }

    try {
      const point = turf.point([location.longitude, location.latitude]);
      const isInside = this.isPointInGeoJSON(point, geojson);

      return {
        isValid: true,
        isInside,
        location,
        error: null,
      };
    } catch (error) {
      console.error('Error validating location:', error);
      return {
        isValid: false,
        error: `Geofence validation error: ${error.message}`,
        isInside: false,
      };
    }
  }

  // Helper method to check if a point is inside a single GeoJSON
  isPointInGeoJSON(point, geojson) {
    if (!geojson) return false;

    // Check if it's a FeatureCollection
    if (geojson.type === 'FeatureCollection') {
      return geojson.features.some(feature =>
        turf.booleanPointInPolygon(point, feature),
      );
    }
    // Check if it's a single Feature
    else if (geojson.type === 'Feature') {
      return turf.booleanPointInPolygon(point, geojson);
    }
    // Check if it's a Polygon or MultiPolygon directly
    else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
      return turf.booleanPointInPolygon(point, geojson);
    } else {
      throw new Error('Invalid GeoJSON format');
    }
  }

  /**
   * Process geofence data with buffer
   */
  processGeofenceWithBuffer(geoJSONsArray, bufferMeters = 0) {
    if (!geoJSONsArray || !Array.isArray(geoJSONsArray)) return null;

    if (bufferMeters <= 0) return geoJSONsArray;

    const bufferKm = bufferMeters / 1000;

    return geoJSONsArray.map(featureCollection => {
      if (featureCollection.type === 'FeatureCollection') {
        return {
          ...featureCollection,
          features: featureCollection.features.map(feature =>
            turf.buffer(feature, bufferKm, { units: 'kilometers' }),
          ),
        };
      }
      return turf.buffer(featureCollection, bufferKm, { units: 'kilometers' });
    });
  }
}

export default GeoFenceService;
