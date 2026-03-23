// models/SubmissionAttempt.js
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
import { v4 as uuidv4 } from 'uuid';

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

  @field('attempt_id') attemptId;
  @field('submission_id') submissionId;
  @field('step') step;
  @field('status') status;
  @field('retry_count') retryCount;
  @field('error_message') errorMessage;
  @field('started_at') startedAt;
  @field('completed_at') completedAt;
  @field('duration_ms') durationMs;

  static async createAttempt(database, { submissionId, step, retryCount = 0 }) {
    const attemptId = uuidv4();
    const now = Date.now();

    return await database.collections.get('submission_attempts').create(record => {
      record.attemptId = attemptId;
      record.submissionId = submissionId;
      record.step = step;
      record.status = SubmissionAttempt.STATUS.STARTED;
      record.retryCount = retryCount;
      record.startedAt = now;
    });
  }

  async markAsSuccess() {
    const completedAt = Date.now();
    await this.update(record => {
      record.status = SubmissionAttempt.STATUS.SUCCESS;
      record.completedAt = completedAt;
      record.durationMs = completedAt - record.startedAt;
    });
  }

  async markAsFailed(error) {
    const completedAt = Date.now();
    await this.update(record => {
      record.status = SubmissionAttempt.STATUS.FAILED;
      record.errorMessage = error.message || String(error);
      record.completedAt = completedAt;
      record.durationMs = completedAt - record.startedAt;
    });
  }
}