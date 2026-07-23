// services/LovCache.service.js
import { Q } from '@nozbe/watermelondb';

/**
 * Service for managing LOV cache in the local database.
 * Provides methods to load, save, and clean up cached LOV data.
 */
class LovCacheService {
  constructor(database) {
    this.database = database;
    this.cacheCollection = database.collections.get('lov_cache');
  }

  /**
   * Build a cache key based on the parameters.
   * Used for logging and debugging.
   */
  static buildCacheKey({ appId, formId, fcId, parId, query, parentValue }) {
    return `${appId}_${formId}_${fcId}_${parId}_${query}_${
      parentValue || 'null'
    }`;
  }

  /**
   * Load cached LOV data from the database.
   * Returns null if not found or expired.
   */
  async loadLovCache({ appId, formId, fcId, parId, query, parentValue }) {
    if (!this.database) {
      console.warn('LOV Cache: Database not available');
      return null;
    }

    try {
      const whereClause = [
        Q.where('app_id', appId),
        Q.where('form_id', formId),
        Q.where('fc_id', fcId),
        Q.where('par_id', parId),
        Q.where('query', query),
        // Q.where('parent_value', parentValue || null),
      ];

      const cached = await this.cacheCollection.query(...whereClause).fetch();

      if (cached.length === 0) {
        return null;
      }

      const entry = cached[0];

      // Parse stored JSON data
      return {
        data: JSON.parse(entry.data),
        columns: JSON.parse(entry.columns),
        primaryKey: entry.primaryKey,
        displayKey: entry.displayKey,
        expiresAt: entry.expiresAt,
      };
    } catch (error) {
      console.error('LOV Cache: Error loading from database:', error);
      return null;
    }
  }

  /**
   * Save LOV data to the database cache.
   * Upserts (updates if exists, otherwise creates) based on the composite key.
   */
  async saveLovCache({
    appId,
    formId,
    fcId,
    parId,
    query,
    // parentValue,
    data,
    columns,
    primaryKey,
    displayKey,
  }) {
    if (!this.database) {
      console.warn('LOV Cache: Database not available');
      return;
    }

    try {
      const whereClause = [
        Q.where('app_id', appId),
        Q.where('form_id', formId),
        Q.where('fc_id', fcId),
        Q.where('par_id', parId),
        Q.where('query', query),
        // Q.where('parent_value', parentValue || null),
      ];

      const existing = await this.cacheCollection.query(...whereClause).fetch();

      const now = Date.now();

      await this.database.write(async () => {
        if (existing.length > 0) {
          // Update existing entry
          await existing[0].update(record => {
            record.data = JSON.stringify(data);
            record.columns = JSON.stringify(columns);
            record.primaryKey = primaryKey;
            record.displayKey = displayKey;
            // record.updatedAt = now;
          });
        } else {
          // Create new entry
          await this.cacheCollection.create(record => {
            record.appId = appId;
            record.formId = formId;
            record.fcId = fcId;
            record.parId = parId;
            record.query = query;
            // record.parentValue = parentValue || null;
            record.data = JSON.stringify(data);
            record.columns = JSON.stringify(columns);
            record.primaryKey = primaryKey;
            record.displayKey = displayKey;
            // record.createdAt = now;
            // record.updatedAt = now;
          });
        }
      });
    } catch (error) {
      console.error('LOV Cache: Error saving to database:', error);
    }
  }

  //EXTRA METHODS FOR CLEANUP AND MAINTENANCE
  /**
   * Delete all expired cache entries.
   * Can be called periodically (e.g., on app start or background task).
   */
  async deleteExpired() {
    if (!this.database) return;

    try {
      const now = Date.now();
      const expired = await this.cacheCollection
        .query(Q.where('expires_at', Q.lt(now)))
        .fetch();

      if (expired.length === 0) return;

      await this.database.write(async () => {
        for (const entry of expired) {
          await entry.destroyPermanently();
        }
      });

      console.log(`LOV Cache: Deleted ${expired.length} expired entries`);
    } catch (error) {
      console.error('LOV Cache: Error deleting expired entries:', error);
    }
  }

  /**
   * Clear all cache entries for a specific form (e.g., when form is updated).
   * This leverages the cascade delete if the form is deleted, but we provide
   * a manual method for clearing specific form cache.
   */
  async clearFormCache(formId) {
    if (!this.database) return;

    try {
      const entries = await this.cacheCollection
        .query(Q.where('form_id', formId))
        .fetch();

      if (entries.length === 0) return;

      await this.database.write(async () => {
        for (const entry of entries) {
          await entry.destroyPermanently();
        }
      });

      console.log(`LOV Cache: Cleared cache for form ${formId}`);
    } catch (error) {
      console.error('LOV Cache: Error clearing form cache:', error);
    }
  }

  /**
   * Clear all cache entries for a specific LOV field and parent value.
   * Useful when parent value changes and we want to force refresh.
   */
  async clearLovCache({ appId, formId, fcId, parId, query, parentValue }) {
    if (!this.database) return;

    try {
      const whereClause = [
        Q.where('app_id', appId),
        Q.where('form_id', formId),
        Q.where('fc_id', fcId),
        Q.where('par_id', parId),
        Q.where('query', query),
        Q.where('parent_value', parentValue || null),
      ];

      const entries = await this.cacheCollection.query(...whereClause).fetch();

      if (entries.length === 0) return;

      await this.database.write(async () => {
        for (const entry of entries) {
          await entry.destroyPermanently();
        }
      });

      console.log(
        `LOV Cache: Cleared cache for LOV ${fcId} with parent ${parentValue}`,
      );
    } catch (error) {
      console.error('LOV Cache: Error clearing LOV cache:', error);
    }
  }
}

export default LovCacheService;
