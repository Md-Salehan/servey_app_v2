import { Model } from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
  json,
  children,
} from '@nozbe/watermelondb/decorators';
import uuid from 'react-native-uuid';
import { STATUS } from '../../constants/enums';

export default class GeoFence extends Model {
  static table = 'geo_fences';

  static associations = {
    // pending_submissions: { type: 'belongs_to', key: 'submission_id' },
    forms: { type: 'belongs_to', key: 'form_id' },
  };

  @field('fence_id') fenceId;
  // @field('submission_id') submissionId;
  @field('app_id') appId;
  @field('form_id') formId;
  @field('user_id') userId;
  @json('geojson', geojson => geojson) geojson;
  @field('latitude') latitude;
  @field('longitude') longitude;
  @field('status') status;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  // @relation('pending_submissions', 'submission_id') submission;
  @relation('forms', 'form_id') form;

  // static async createGeoFence(
  //   database,
  //   {
  //     fenceId,
  //     submissionId,
  //     appId,
  //     formId,
  //     userId,
  //     geojson,
  //     latitude,
  //     longitude,
  //   },
  // ) {
  //   let createdGeoFence = null;
  //   await database.write(async () => {
  //     const geoFencesCollection = database.collections.get('geo_fences');
  //     createdGeoFence = await geoFencesCollection.create(record => {
  //       record.fenceId = fenceId;
  //       // record.submissionId = submissionId;
  //       record.appId = appId;
  //       record.formId = formId;
  //       record.userId = userId;
  //       record.geojson = geojson;
  //       record.latitude = latitude || 0;
  //       record.longitude = longitude || 0;
  //       record.status = STATUS.PENDING;
  //     });
  //   });
  //   return createdGeoFence;
  // }

  // static async updateGeoFenceStatus(geoFenceId, newGeojson) {
  //   const database = this.database;
  //   await database.write(async () => {
  //     const geoFencesCollection = database.collections.get('geo_fences');
  //     const geoFence = await geoFencesCollection.find(geoFenceId);
  //     if (geoFence) {
  //       geoFence.geojson = newGeojson;
  //       await geoFence.save();
  //     }
  //   });
  // }

  // static async deleteGeoFence(geoFenceId) {
  //   const database = this.database;
  //   await database.write(async () => {
  //     const geoFencesCollection = database.collections.get('geo_fences');
  //     const geoFence = await geoFencesCollection.find(geoFenceId);
  //     if (geoFence) {
  //       await geoFence.destroy();
  //     }
  //   });
  // }

  // static async getGeoFences(appId, userId, formId) {
  //   const database = this.database;
  //   const geoFencesCollection = database.collections.get('geo_fences');
  //   const geoFences = await geoFencesCollection
  //     .query(
  //       // Q.where('submission_id', submissionId),
  //       Q.where('app_id', appId),
  //       Q.where('user_id', userId),
  //       Q.where('form_id', formId),
  //     )
  //     .fetch();
  //   return geoFences;
  // }
}
