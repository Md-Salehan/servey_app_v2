// models/PendingSubmission.js
import { Model } from '@nozbe/watermelondb';
import { field, json, readonly, date, children } from '@nozbe/watermelondb/decorators';
import { v4 as uuidv4 } from 'uuid';

export default class PendingSubmission extends Model {
  static table = 'pending_submissions';

  static STATUS = {
    PENDING: 'pending',      // Initial state
    UPLOADING: 'uploading',  // Currently uploading files
    SUBMITTING: 'submitting', // Currently submitting form data
    CONFIRMING: 'confirming', // Currently confirming uploads
    COMPLETED: 'completed',   // All steps successful
    FAILED: 'failed',         // Failed after max retries
  };

  static associations = {
    pending_files: { type: 'has_many', foreignKey: 'submission_id' },
    submission_attempts: { type: 'has_many', foreignKey: 'submission_id' },
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

  static async createPendingSubmission(database, { formId, formName, appId, fieldValues, formComponents, payload }) {
    const submissionId = uuidv4();
    const now = Date.now();

    return await database.collections.get('pending_submissions').create(record => {
      record.submissionId = submissionId;
      record.formId = formId;
      record.formName = formName;
      record.appId = appId;
      record.fieldValues = fieldValues;
      record.formComponents = formComponents;
      record.payload = payload;
      record.status = PendingSubmission.STATUS.PENDING;
      record.retryCount = 0;
      record.maxRetries = 5;
      record.createdAt = now;
      record.updatedAt = now;
    });
  }

  async markAsUploading() {
    await this.update(record => {
      record.status = PendingSubmission.STATUS.UPLOADING;
      record.updatedAt = Date.now();
    });
  }

  async markAsSubmitting() {
    await this.update(record => {
      record.status = PendingSubmission.STATUS.SUBMITTING;
      record.updatedAt = Date.now();
    });
  }

  async markAsConfirming() {
    await this.update(record => {
      record.status = PendingSubmission.STATUS.CONFIRMING;
      record.updatedAt = Date.now();
    });
  }

  async markAsCompleted() {
    await this.update(record => {
      record.status = PendingSubmission.STATUS.COMPLETED;
      record.completedAt = Date.now();
      record.updatedAt = Date.now();
    });
  }

  async markAsFailed(error) {
    await this.update(record => {
      record.status = PendingSubmission.STATUS.FAILED;
      record.errorMessage = error.message || String(error);
      record.errorStack = error.stack;
      record.updatedAt = Date.now();
    });
  }

  async incrementRetry() {
    await this.update(record => {
      record.retryCount = (record.retryCount || 0) + 1;
      record.lastAttemptAt = Date.now();
      // Exponential backoff: 2^retryCount * 1000 ms, max 1 hour
      const delay = Math.min(Math.pow(2, record.retryCount) * 1000, 3600000);
      record.nextRetryAt = Date.now() + delay;
      record.updatedAt = Date.now();
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
    return this.files.filter(file => file.status === 'uploaded' || file.status === 'confirmed');
  }

  getFailedFiles() {
    return this.files.filter(file => file.status === 'failed');
  }
}