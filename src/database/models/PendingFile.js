// models/PendingFile.js
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import uuid from 'react-native-uuid';

export default class PendingFile extends Model {
  static table = 'pending_files';

  static STATUS = {
    PENDING: 'pending',
    UPLOADING: 'uploading',
    UPLOADED: 'uploaded',
    FAILED: 'failed',
  };

  static associations = {
    pending_submissions: { type: 'belongs_to', key: 'submission_id' },
    forms: { type: 'belongs_to', key: 'form_id' },
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

  @relation('pending_submissions', 'submission_id') submission;
  @relation('forms', 'form_id') form;

  static async createPendingFile(database, { 
    submissionId, 
    fcId, 
    formId, 
    localUri, 
    fileName, 
    fileType, 
    fileSize 
  }) {
    let createdFile = null;
    
    await database.write(async () => {
      const fileId = uuid.v4();

      const pendingFilesCollection = database.collections.get('pending_files');
      
      createdFile = await pendingFilesCollection.create(record => {
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
      });
    });
    
    return createdFile;
  }

  async markAsUploading() {
    const database = this.collections.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = PendingFile.STATUS.UPLOADING;
      });
    });
  }

  async markAsUploaded(flUpldLogNo, fileIdServer, fileUriServer) {
    const database = this.collections.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = PendingFile.STATUS.UPLOADED;
        record.flUpldLogNo = flUpldLogNo;
        record.fileIdServer = fileIdServer;
        record.fileUriServer = fileUriServer;
        record.uploadedAt = Date.now();
      });
    });
  }

  async markAsFailed(error) {
    const database = this.collections.database;
    await database.write(async () => {
      await this.update(record => {
        record.status = PendingFile.STATUS.FAILED;
        record.errorMessage = error.message || String(error);
      });
    });
  }

  async incrementRetry() {
    const database = this.collections.database;
    await database.write(async () => {
      await this.update(record => {
        record.retryCount = (record.retryCount || 0) + 1;
        record.lastAttemptAt = Date.now();
        const delay = Math.min(Math.pow(2, record.retryCount) * 1000, 120000);
        record.nextRetryAt = Date.now() + delay;
      });
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
      uploaded: this.status === PendingFile.STATUS.UPLOADED,
      uploading: this.status === PendingFile.STATUS.UPLOADING,
      flUpldLogNo: this.flUpldLogNo,
      fileId: this.fileIdServer,
      fileUri: this.fileUriServer,
      error: this.errorMessage,
    };
  }
}