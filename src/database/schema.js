// schema.js - Updated with new tables
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1, // Increment version
  tables: [
    tableSchema({
      name: 'forms',
      columns: [
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'form_name', type: 'string' },
        { name: 'form_schema', type: 'string' },
        { name: 'app_id', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'priority', type: 'string' },
        { name: 'totalFields', type: 'number' },
        { name: 'estimatedTime', type: 'number' },
        { name: 'completionRate', type: 'number' },
        { name: 'deadline', type: 'number' },
        { name: 'surFormGenFlg', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'form_components',
      columns: [
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'components', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // NEW: Pending Submissions table
    tableSchema({
      name: 'pending_submissions',
      columns: [
        { name: 'submission_id', type: 'string', isIndexed: true },
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'form_name', type: 'string' },
        { name: 'app_id', type: 'string' },
        { name: 'payload', type: 'string' }, // Full form submission payload
        { name: 'field_values', type: 'string' }, // Field values for preview
        { name: 'form_components', type: 'string' }, // Form components for preview
        { name: 'status', type: 'string' }, // pending, uploading, submitting, confirming, completed, failed
        { name: 'retry_count', type: 'number' },
        { name: 'max_retries', type: 'number' },
        { name: 'last_attempt_at', type: 'number' },
        { name: 'next_retry_at', type: 'number' },
        { name: 'error_message', type: 'string' },
        { name: 'error_stack', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'completed_at', type: 'number' },
      ],
    }),

    // NEW: Pending Files table
    tableSchema({
      name: 'pending_files',
      columns: [
        { name: 'file_id', type: 'string', isIndexed: true },
        { name: 'submission_id', type: 'string', isIndexed: true },
        { name: 'fc_id', type: 'string', isIndexed: true },
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'local_uri', type: 'string' },
        { name: 'file_name', type: 'string' },
        { name: 'file_type', type: 'string' },
        { name: 'file_size', type: 'number' },
        { name: 'status', type: 'string' }, // pending, uploading, uploaded, confirmed, failed
        { name: 'retry_count', type: 'number' },
        { name: 'max_retries', type: 'number' },
        { name: 'last_attempt_at', type: 'number' },
        { name: 'next_retry_at', type: 'number' },
        { name: 'error_message', type: 'string' },
        { name: 'fl_upld_log_no', type: 'string' },
        { name: 'file_id_server', type: 'string' },
        { name: 'file_uri_server', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'uploaded_at', type: 'number' },
        { name: 'confirmed_at', type: 'number' },
      ],
    }),

    // NEW: Submission Attempts table for detailed tracking
    tableSchema({
      name: 'submission_attempts',
      columns: [
        { name: 'attempt_id', type: 'string', isIndexed: true },
        { name: 'submission_id', type: 'string', isIndexed: true },
        { name: 'step', type: 'string' }, // upload, submit, confirm
        { name: 'status', type: 'string' }, // started, success, failed
        { name: 'retry_count', type: 'number' },
        { name: 'error_message', type: 'string' },
        { name: 'started_at', type: 'number' },
        { name: 'completed_at', type: 'number' },
        { name: 'duration_ms', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'submissions',
      columns: [
        { name: 'submission_id', type: 'string', isIndexed: true },
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'form_name', type: 'string' },
        { name: 'app_id', type: 'string' },
        { name: 'payload', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_attempt_at', type: 'number' },
        { name: 'error_message', type: 'string' },
        { name: 'submitted_at', type: 'number' },
        { name: 'uploaded_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});