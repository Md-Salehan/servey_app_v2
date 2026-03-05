import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'forms',
      columns: [
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'form_name', type: 'string' },
        { name: 'form_schema', type: 'string' }, // JSON string
        { name: 'app_id', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    
    tableSchema({
      name: 'form_components',
      columns: [
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'components', type: 'string' }, // JSON array of components
        { name: 'version', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    
    tableSchema({
      name: 'submissions',
      columns: [
        { name: 'submission_id', type: 'string', isIndexed: true },
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'form_name', type: 'string' },
        { name: 'app_id', type: 'string' },
        { name: 'data', type: 'string' }, // JSON of field values
        { name: 'status', type: 'string' }, // pending, uploaded, failed
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