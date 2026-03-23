// models/PendingFile.js
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
import { v4 as uuidv4 } from 'uuid';

export default class PendingFile extends Model {
  static table = 'pending_files';

  static STATUS = {
    PENDING: 'pending',      // Waiting to be uploaded
    UPLOADING: 'uploading',  // Currently uploading
    UPLOADED: 'uploaded',    // Uploaded but not confirmed
    CONFIRMED: 'confirmed',  // Confirmed with server
    FAILED: 'failed',        // Failed after max retries
  };

  @field('file_id') fileId;
  @field('submission_id') submissionId;
  @field('fc_id') fcId;
  @field('form_id') formId;
  @field('local_uri') localUri;
  @field('file_name') fileName;
  @field('file_type') fileType;
  @field('file_size') fileSize;
  @field('status') status;
  @field('retry_count') retryCount;
  @field('max_retries') maxRetries;
  @field('last_attempt_at') lastAttemptAt;
  @field('next_retry_at') nextRetryAt;
  @field('error_message') errorMessage;
  @field('fl_upld_log_no') flUpldLogNo;
  @field('file_id_server') fileIdServer;
  @field('file_uri_server') fileUriServer;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
  @field('uploaded_at') uploadedAt;
  @field('confirmed_at') confirmedAt;

  static async createPendingFile(database, { submissionId, fcId, formId, localUri, fileName, fileType, fileSize }) {
    const fileId = uuidv4();
    const now = Date.now();

    return await database.collections.get('pending_files').create(record => {
      record.fileId = fileId;
      record.submissionId = submissionId;
      record.fcId = fcId;
      record.formId = formId;
      record.localUri = localUri;
      record.fileName = fileName;
      record.fileType = fileType;
      record.fileSize = fileSize;
      record.status = PendingFile.STATUS.PENDING;
      record.retryCount = 0;
      record.maxRetries = 3;
      record.createdAt = now;
      record.updatedAt = now;
    });
  }

  async markAsUploading() {
    await this.update(record => {
      record.status = PendingFile.STATUS.UPLOADING;
      record.updatedAt = Date.now();
    });
  }

  async markAsUploaded(flUpldLogNo, fileIdServer, fileUriServer) {
    await this.update(record => {
      record.status = PendingFile.STATUS.UPLOADED;
      record.flUpldLogNo = flUpldLogNo;
      record.fileIdServer = fileIdServer;
      record.fileUriServer = fileUriServer;
      record.uploadedAt = Date.now();
      record.updatedAt = Date.now();
    });
  }

  async markAsConfirmed() {
    await this.update(record => {
      record.status = PendingFile.STATUS.CONFIRMED;
      record.confirmedAt = Date.now();
      record.updatedAt = Date.now();
    });
  }

  async markAsFailed(error) {
    await this.update(record => {
      record.status = PendingFile.STATUS.FAILED;
      record.errorMessage = error.message || String(error);
      record.updatedAt = Date.now();
    });
  }

  async incrementRetry() {
    await this.update(record => {
      record.retryCount = (record.retryCount || 0) + 1;
      record.lastAttemptAt = Date.now();
      // Exponential backoff: 2^retryCount * 1000 ms, max 5 minutes
      const delay = Math.min(Math.pow(2, record.retryCount) * 1000, 300000);
      record.nextRetryAt = Date.now() + delay;
      record.updatedAt = Date.now();
    });
  }

  canRetry() {
    return this.retryCount < this.maxRetries;
  }

  shouldRetryNow() {
    return this.status === PendingFile.STATUS.FAILED && 
           this.canRetry() && 
           (!this.nextRetryAt || this.nextRetryAt <= Date.now());
  }

  toImageObject() {
    return {
      id: this.fileId,
      uri: this.localUri,
      type: this.fileType,
      fileNm: this.fileName,
      fileSize: this.fileSize,
      uploaded: this.status === PendingFile.STATUS.UPLOADED || this.status === PendingFile.STATUS.CONFIRMED,
      confirmed: this.status === PendingFile.STATUS.CONFIRMED,
      uploading: this.status === PendingFile.STATUS.UPLOADING,
      flUpldLogNo: this.flUpldLogNo,
      fileId: this.fileIdServer,
      fileUri: this.fileUriServer,
      error: this.errorMessage,
    };
  }
}