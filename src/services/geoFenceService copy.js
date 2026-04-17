// services/geoFenceService.js

import { Q } from '@nozbe/watermelondb';
// import GeoFence from '../models/GeoFence';

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
    console.log({appId, userId, geojson}, "saveGeoFenceData");
    
    try {
      const geoFencesCollection = this.database.collections.get('geo_fences');

      // Check if geofence already exists for this form
      const existing = await geoFencesCollection
        .query(
          Q.where('app_id', appId),
          Q.where('user_id', userId),
        )
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
        .query(
          Q.where('app_id', appId),
          Q.where('user_id', userId),
        )
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
        .query(
          Q.where('app_id', appId),
          Q.where('user_id', userId),
        )
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
}

export default GeoFenceService;
