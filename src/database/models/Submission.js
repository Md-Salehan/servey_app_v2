// models/Submission.js
import { Model } from '@nozbe/watermelondb';
import { field, json, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import uuid from 'react-native-uuid';
import { STATUS } from '../../constants/enums';
export default class Submission extends Model {
  static table = 'submissions';

  static STATUS = {
    PENDING: STATUS.PENDING,
    UPLOADED: STATUS.UPLOADED,
    FAILED: STATUS.FAILED,
  };

  static associations = {
    forms: { type: 'belongs_to', key: 'form_id' },
  };

  @field('submission_id') submissionId;
  @field('form_id') formId;
  @field('form_name') formName;
  @field('app_id') appId;
  @json('payload', payload => payload) payload;
  @field('status') status;
  @field('retry_count') retryCount;
  @field('last_attempt_at') lastAttemptAt;
  @field('error_message') errorMessage;
  @field('submitted_at') submittedAt;
  @field('uploaded_at') uploadedAt;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
  @relation('forms', 'form_id') form;

  static async createSubmission(database, { formId, formName, appId, payload }) {
    let createdSubmission = null;
    
    await database.write(async () => {
      const submissionId = uuid.v4();
      const now = Date.now();

      const submissionsCollection = database.collections.get('submissions');
      
      createdSubmission = await submissionsCollection.create(record => {
        record.submissionId = submissionId;
        record.formId = formId;
        record.formName = formName;
        record.appId = appId;
        record.payload = payload;
        record.status = Submission.STATUS.PENDING;
        record.retryCount = 0;
        record.submittedAt = now;
      });
    });
    
    return createdSubmission;
  }

  async markAsUploaded() {
    const database = this.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = Submission.STATUS.UPLOADED;
        record.uploadedAt = Date.now();
      });
    });
  }

  async markAsFailed(error) {
    const database = this.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = Submission.STATUS.FAILED;
        record.retryCount = (record.retryCount || 0) + 1;
        record.lastAttemptAt = Date.now();
        record.errorMessage = error.message || String(error);
      });
    });
  }

  async retry() {
    const database = this.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = Submission.STATUS.PENDING;
        record.retryCount = (record.retryCount || 0) + 1;
        record.lastAttemptAt = Date.now();
        record.errorMessage = null;
      });
    });
  }

  canRetry(maxRetries = 5) {
    return this.retryCount < maxRetries;
  }

  getFormattedSubmittedDate() {
    return new Date(this.submittedAt).toLocaleString();
  }

  getFormattedUploadedDate() {
    return this.uploadedAt ? new Date(this.uploadedAt).toLocaleString() : 'Not uploaded';
  }
}