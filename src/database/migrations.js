import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // Define migrations here if you need to update the schema in the future
    // {
    //   toVersion: 2,
    //   steps: [
    //     addColumn({ table: 'submissions', column: 'synced_at' }),
    //   ],
    // },
  ],
});