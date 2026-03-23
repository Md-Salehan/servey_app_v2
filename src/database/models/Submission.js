import { Model } from '@nozbe/watermelondb';
import { field, json, readonly, date } from '@nozbe/watermelondb/decorators';
import { v4 as uuidv4 } from 'uuid';

export default class Submission extends Model {
  static table = 'submissions';

  static STATUS = {
    PENDING: 'pending',
    UPLOADED: 'uploaded',
    FAILED: 'failed',
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

  // Create a new submission
  static async createSubmission(database, { formId, formName, appId, data }) {
    const submissionId = uuidv4();
    const now = Date.now();

    return await database.collections.get('submissions').create(record => {
      record.submissionId = submissionId;
      record.formId = formId;
      record.formName = formName;
      record.appId = appId;
      record.payload = payload;
      record.status = Submission.STATUS.PENDING;
      record.retryCount = 0;
      record.submittedAt = now;
      record.createdAt = now;
      record.updatedAt = now;
    });
  }

  // Mark as uploaded
  async markAsUploaded() {
    await this.update(record => {
      record.status = Submission.STATUS.UPLOADED;
      record.uploadedAt = Date.now();
      record.updatedAt = Date.now();
    });
  }

  // Mark as failed
  async markAsFailed(error) {
    await this.update(record => {
      record.status = Submission.STATUS.FAILED;
      record.retryCount = (record.retryCount || 0) + 1;
      record.lastAttemptAt = Date.now();
      record.errorMessage = error.message || String(error);
      record.updatedAt = Date.now();
    });
  }

  // Increment retry and set back to pending
  async retry() {
    await this.update(record => {
      record.status = Submission.STATUS.PENDING;
      record.retryCount = (record.retryCount || 0) + 1;
      record.lastAttemptAt = Date.now();
      record.errorMessage = null;
      record.updatedAt = Date.now();
    });
  }

  // Check if can retry (less than max retries)
  canRetry(maxRetries = 5) {
    return this.retryCount < maxRetries;
  }

  // Get formatted date for display
  getFormattedSubmittedDate() {
    return new Date(this.submittedAt).toLocaleString();
  }

  getFormattedUploadedDate() {
    return this.uploadedAt ? new Date(this.uploadedAt).toLocaleString() : 'Not uploaded';
  }
}