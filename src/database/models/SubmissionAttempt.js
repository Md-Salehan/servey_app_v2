// models/SubmissionAttempt.js
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import uuid from 'react-native-uuid';

export default class SubmissionAttempt extends Model {
  static table = 'submission_attempts';

  static STEP = {
    UPLOAD: 'upload',
    SUBMIT: 'submit',
    CONFIRM: 'confirm',
  };

  static STATUS = {
    STARTED: 'started',
    SUCCESS: 'success',
    FAILED: 'failed',
  };

  static associations = {
    pending_submissions: { type: 'belongs_to', key: 'submission_id' },
  };

  @field('attempt_id') attemptId;
  @field('submission_id') submissionId;
  @field('step') step;
  @field('status') status;
  @field('retry_count') retryCount;
  @field('error_message') errorMessage;
  @field('started_at') startedAt;
  @field('completed_at') completedAt;
  @field('duration_ms') durationMs;

  @relation('pending_submissions', 'submission_id') submission;

  static async createAttempt(database, { submissionId, step, retryCount = 0 }) {
    let createdAttempt = null;
    
    await database.write(async () => {
      const attemptId = uuid.v4();
      const now = Date.now();

      const attemptsCollection = database.collections.get('submission_attempts');
      
      createdAttempt = await attemptsCollection.create(record => {
        record.attemptId = attemptId;
        record.submissionId = submissionId;
        record.step = step;
        record.status = SubmissionAttempt.STATUS.STARTED;
        record.retryCount = retryCount;
        record.startedAt = now;
      });
    });
    
    return createdAttempt;
  }

  async markAsSuccess() {
    const database = this.collections.database;
    const completedAt = Date.now();
    await database.write(async () => {
      await this.update(record => {
        record.status = SubmissionAttempt.STATUS.SUCCESS;
        record.completedAt = completedAt;
        record.durationMs = completedAt - record.startedAt;
      });
    });
  }

  async markAsFailed(error) {
    const database = this.collections.database;
    const completedAt = Date.now();
    await database.write(async () => {
      await this.update(record => {
        record.status = SubmissionAttempt.STATUS.FAILED;
        record.errorMessage = error.message || String(error);
        record.completedAt = completedAt;
        record.durationMs = completedAt - record.startedAt;
      });
    });
  }
}