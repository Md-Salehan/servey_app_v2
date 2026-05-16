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
    console.log({ appId, userId, arrayLength: geoJSONsArray?.length }, 'saveGeoFenceData');

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

      // Store the entire array of FeatureCollections
      const dataToStore = {
        type: 'GeofenceCollection',
        geofences: geoJSONsArray,
        totalGeofences: geoJSONsArray.length,
        lastUpdated: Date.now()
      };

      await this.database.write(async () => {
        if (existing.length > 0) {
          // Update existing geofence
          await existing[0].update(record => {
            record.geojson = dataToStore;
          });
          console.log(`✅ Geofence data updated in local DB (${geoJSONsArray.length} geofence(s))`);
        } else {
          // Create new geofence
          await geoFencesCollection.create(record => {
            record.appId = appId;
            record.userId = userId;
            record.geojson = dataToStore;
          });
          console.log(`✅ Geofence data saved to local DB (${geoJSONsArray.length} geofence(s))`);
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
   * @returns {Object|null} Object containing geofences array or null
   */
  async getGeoFenceData(appId, userId) {
    try {
      const geoFencesCollection = this.database.collections.get('geo_fences');
      const geofences = await geoFencesCollection
        .query(Q.where('app_id', appId), Q.where('user_id', userId))
        .fetch();

      if (geofences.length > 0) {
        console.log('📦 Geofence data loaded from local DB');
        const storedData = geofences[0].geojson;
        
        // Handle both old and new format for backward compatibility
        if (storedData && storedData.type === 'GeofenceCollection') {
          return storedData;
        }
        
        // If old format (direct array), convert to new format
        if (Array.isArray(storedData)) {
          return {
            type: 'GeofenceCollection',
            geofences: storedData,
            totalGeofences: storedData.length,
            lastUpdated: Date.now()
          };
        }
        
        return storedData;
      }
      return null;
    } catch (error) {
      console.error('Error loading geofence from DB:', error);
      return null;
    }
  }


  /**
   * Get count of geofences
   */
  async getGeofenceCount(appId, userId) {
    const geofenceData = await this.getGeoFenceData(appId, userId);
    if (geofenceData && geofenceData.geofences) {
      return geofenceData.geofences.length;
    }
    return 0;
  }

  /**
   * Get summary of all geofences (names, IDs, etc.)
   */
  async getGeofenceSummary(appId, userId) {
    const geofenceData = await this.getGeoFenceData(appId, userId);
    if (!geofenceData || !geofenceData.geofences) {
      return [];
    }
    
    const summary = [];
    for (let i = 0; i < geofenceData.geofences.length; i++) {
      const geofence = geofenceData.geofences[i];
      const firstFeature = geofence.features?.[0];
      summary.push({
        index: i,
        name: firstFeature?.properties?.blk_nm || 
              firstFeature?.properties?.name || 
              `Geofence ${i + 1}`,
        id: firstFeature?.properties?.gid ||
             firstFeature?.properties?.blk_cd ||
             `geofence_${i}`,
        featureCount: geofence.features?.length || 0
      });
    }
    
    return summary;
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
   * @param {Object} geofenceData - The stored geofence data with geofences array
   * @param {Object} location - Location object with latitude and longitude
   * @returns {Object} Validation result with which geofence matched (if any)
   */
  validateLocationInGeofence(geofenceData, location) {
    if (!geofenceData || !geofenceData.geofences || !Array.isArray(geofenceData.geofences)) {
      return {
        isValid: false,
        error: 'Geofence data not available',
        isInside: false,
        matchedGeofenceIndex: -1,
        matchedGeofenceName: null,
        matchedGeofenceId: null
      };
    }

    if (!location || !location.latitude || !location.longitude) {
      return {
        isValid: false,
        error: 'Location data not available',
        isInside: false,
        matchedGeofenceIndex: -1,
        matchedGeofenceName: null,
        matchedGeofenceId: null
      };
    }

    try {
      const point = turf.point([location.longitude, location.latitude]);
      let isInside = false;
      let matchedGeofenceIndex = -1;
      let matchedFeature = null;
      let matchedGeofenceName = null;
      let matchedGeofenceId = null;

      // Iterate through each geofence (FeatureCollection) in the array
      for (let i = 0; i < geofenceData.geofences.length; i++) {
        const featureCollection = geofenceData.geofences[i];
        
        // Skip if not a valid FeatureCollection
        if (!featureCollection || featureCollection.type !== 'FeatureCollection') {
          continue;
        }
        
        // Get features array
        const features = featureCollection.features || [];
        
        // Check each feature in this geofence
        for (let j = 0; j < features.length; j++) {
          const feature = features[j];
          try {
            // Check if point is inside this feature's geometry
            if (turf.booleanPointInPolygon(point, feature)) {
              isInside = true;
              matchedGeofenceIndex = i;
              matchedFeature = feature;
              matchedGeofenceName = feature.properties?.blk_nm || 
                                     feature.properties?.subd_nm ||
                                     feature.properties?.name ||
                                     `Geofence ${i + 1}`;
              matchedGeofenceId = feature.properties?.gid?.toString() ||
                                  feature.properties?.blk_cd ||
                                  feature.properties?.blk_nm ||
                                  `geofence_${i}`;
              break;
            }
          } catch (e) {
            console.warn(`Error checking feature at geofence ${i}, feature ${j}:`, e);
            continue;
          }
        }
        
        if (isInside) break;
      }

      return {
        isValid: true,
        isInside,
        location,
        matchedGeofenceIndex: matchedGeofenceIndex,
        matchedGeofenceName: matchedGeofenceName,
        matchedGeofenceId: matchedGeofenceId,
        totalGeofences: geofenceData.geofences.length,
        error: isInside ? null : 'Location is outside all permitted survey areas'
      };
    } catch (error) {
      console.error('Error validating location:', error);
      return {
        isValid: false,
        error: `Geofence validation error: ${error.message}`,
        isInside: false,
        matchedGeofenceIndex: -1,
        matchedGeofenceName: null,
        matchedGeofenceId: null
      };
    }
  }

  

  /**
   * Process all geofences with buffer
   */
  processGeofenceWithBuffer(geofenceData, bufferMeters = 0) {
    if (!geofenceData || !geofenceData.geofences) return null;

    if (bufferMeters <= 0) return geofenceData;

    const bufferKm = bufferMeters / 1000;
    
    const bufferedGeofences = geofenceData.geofences.map(featureCollection => {
      if (featureCollection.type === 'FeatureCollection') {
        return {
          ...featureCollection,
          features: featureCollection.features.map(feature =>
            turf.buffer(feature, bufferKm, { units: 'kilometers' })
          ),
        };
      }
      return turf.buffer(featureCollection, bufferKm, { units: 'kilometers' });
    });

    return {
      ...geofenceData,
      geofences: bufferedGeofences,
    };
  }
}

export default GeoFenceService;