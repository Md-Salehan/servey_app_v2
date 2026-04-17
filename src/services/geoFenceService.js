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
   */
  async saveGeoFenceData(appId, userId, geojson) {
    console.log({ appId, userId, hasGeojson: !!geojson }, 'saveGeoFenceData');

    if (!geojson) {
      console.error('❌ Cannot save geofence: geojson is null or undefined');
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
            record.geojson = geojson;
          });
          console.log('✅ Geofence data updated in local DB');
        } else {
          // Create new geofence
          await geoFencesCollection.create(record => {
            record.appId = appId;
            record.userId = userId;
            record.geojson = geojson;
          });
          console.log('✅ Geofence data saved to local DB');
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
   * Validate if a location is inside the geofence
   * @param {Object} geojson - The GeoJSON object representing the geofence
   * @param {Object} location - Location object with latitude and longitude
   * @returns {Object} Validation result
   */
  validateLocationInGeofence(geojson, location) {
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

      let isInside = false;

      // Check if it's a FeatureCollection
      if (geojson.type === 'FeatureCollection') {
        isInside = geojson.features.some(feature =>
          turf.booleanPointInPolygon(point, feature),
        );
      }
      // Check if it's a single Feature
      else if (geojson.type === 'Feature') {
        isInside = turf.booleanPointInPolygon(point, geojson);
      }
      // Check if it's a Polygon or MultiPolygon directly
      else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
        isInside = turf.booleanPointInPolygon(point, geojson);
      } else {
        return {
          isValid: false,
          error: 'Invalid GeoJSON format',
          isInside: false,
        };
      }

      return {
        isValid: true, // Validation successful
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

  /**
   * Check if submission is allowed based on geofence
   */
  async isSubmissionAllowed(appId, userId, location) {
    try {
      // Get geofence data from local DB
      const geojson = await this.getGeoFenceData(appId, userId);

      if (!geojson) {
        return {
          allowed: false,
          reason: 'Geofence data not available. Please sync with server.',
        };
      }

      const validation = this.validateLocationInGeofence(geojson, location);

      if (!validation.isValid) {
        return {
          allowed: false,
          reason: validation.error || 'Unable to validate location',
        };
      }

      if (!validation.isInside) {
        return {
          allowed: false,
          reason:
            'You are outside the permitted survey area. Submission is only allowed within the designated geofence.',
        };
      }

      return {
        allowed: true,
        reason: null,
      };
    } catch (error) {
      console.error('Error checking submission allowance:', error);
      return {
        allowed: false,
        reason: 'Error validating geofence. Please try again.',
      };
    }
  }

  /**
   * Process geofence data with buffer
   */
  processGeofenceWithBuffer(geojson, bufferMeters = 0) {
    if (!geojson) return null;

    if (bufferMeters <= 0) return geojson;

    const bufferKm = bufferMeters / 1000;

    // FeatureCollection case
    if (geojson.type === 'FeatureCollection') {
      return {
        ...geojson,
        features: geojson.features.map(feature =>
          turf.buffer(feature, bufferKm, { units: 'kilometers' }),
        ),
      };
    }

    // Single geometry
    return turf.buffer(geojson, bufferKm, {
      units: 'kilometers',
    });
  }
}

export default GeoFenceService;
