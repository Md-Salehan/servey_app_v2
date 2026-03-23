// models/PendingSubmission.js
import { Model } from '@nozbe/watermelondb';
import { field, json, readonly, date, children, relation } from '@nozbe/watermelondb/decorators';
import uuid from 'react-native-uuid';

export default class PendingSubmission extends Model {
  static table = 'pending_submissions';

  static STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  };

  static STEP = {
    UPLOAD: 'upload',
    SUBMIT: 'submit',
    CONFIRM: 'confirm',
  };

  static associations = {
    pending_files: { type: 'has_many', foreignKey: 'submission_id' },
    submission_attempts: { type: 'has_many', foreignKey: 'submission_id' },
    forms: { type: 'belongs_to', key: 'form_id' },
  };

  @field('submission_id') submissionId;
  @field('form_id') formId;
  @field('form_name') formName;
  @field('app_id') appId;
  @json('payload', payload => payload) payload;
  @json('field_values', values => values) fieldValues;
  @json('form_components', components => components) formComponents;
  @field('status') status;
  @field('retry_count') retryCount;
  @field('max_retries') maxRetries;
  @field('last_attempt_at') lastAttemptAt;
  @field('next_retry_at') nextRetryAt;
  @field('error_message') errorMessage;
  @field('error_stack') errorStack;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
  @field('completed_at') completedAt;

  @children('pending_files') files;
  @children('submission_attempts') attempts;
  @relation('forms', 'form_id') form;

  static async createPendingSubmission(database, { 
    formId, 
    formName, 
    appId, 
    fieldValues, 
    formComponents, 
    payload 
  }) {
    let createdSubmission = null;
    
    await database.write(async () => {
      const submissionId = uuid.v4();

      const pendingSubmissionsCollection = database.collections.get('pending_submissions');
      
      createdSubmission = await pendingSubmissionsCollection.create(record => {
        record.submissionId = submissionId;
        record.formId = formId;
        record.formName = formName;
        record.appId = appId;
        record.fieldValues = fieldValues;
        record.formComponents = formComponents;
        record.payload = payload;
        record.status = PendingSubmission.STATUS.PENDING;
        record.retryCount = 0;
        record.maxRetries = 3;
      });
    });
    
    return createdSubmission;
  }

  async markAsProcessing() {
    const database = this.collections.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = PendingSubmission.STATUS.PROCESSING;
      });
    });
  }

  async markAsCompleted() {
    const database = this.collections.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = PendingSubmission.STATUS.COMPLETED;
        record.completedAt = Date.now();
      });
    });
  }

  async markAsFailed(error) {
    const database = this.collections.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = PendingSubmission.STATUS.FAILED;
        record.errorMessage = error.message || String(error);
        record.errorStack = error.stack;
      });
    });
  }

  async incrementRetry() {
    const database = this.collections.database;
    await database.write(async () => {
      await this.update(record => {
        record.retryCount = (record.retryCount || 0) + 1;
        record.lastAttemptAt = Date.now();
        const delay = Math.min(Math.pow(2, record.retryCount) * 1000, 300000);
        record.nextRetryAt = Date.now() + delay;
      });
    });
  }

  canRetry() {
    return this.retryCount < this.maxRetries;
  }

  shouldRetryNow() {
    return this.status === PendingSubmission.STATUS.FAILED && 
           this.canRetry() && 
           (!this.nextRetryAt || this.nextRetryAt <= Date.now());
  }

  getFilesByStatus(status) {
    return this.files.filter(file => file.status === status);
  }

  getUploadedFiles() {
    return this.files.filter(file => file.status === 'uploaded');
  }

  getFailedFiles() {
    return this.files.filter(file => file.status === 'failed');
  }
}