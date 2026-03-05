import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations';

// Import models
import Form from './models/Form';
import FormComponents from './models/FormComponents';
import Submission from './models/Submission';

// Create adapter
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'surveycollector.db',
  jsi: true, // Enable JSI for better performance
  onSetUpError: error => {
    console.error('Database setup error:', error);
  },
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    Form,
    FormComponents,
    Submission,
  ],
  actionsEnabled: true, // Enable actions for better performance
});

// Initialize database with default values if needed
export const initializeDatabase = async () => {
  console.log('📦 Database initialized');
  
  // Optional: Perform any initial setup
  // For example, you might want to clean up old submissions
  
  return database;
};

// Helper function to reset database (useful for development/testing)
export const resetDatabase = async () => {
  if (__DEV__) {
    try {
      await database.write(async () => {
        // Delete all records from all tables
        const forms = await database.collections.get('forms').query().fetch();
        const components = await database.collections.get('form_components').query().fetch();
        const submissions = await database.collections.get('submissions').query().fetch();
        
        for (const form of forms) {
          await form.destroyPermanently();
        }
        for (const component of components) {
          await component.destroyPermanently();
        }
        for (const submission of submissions) {
          await submission.destroyPermanently();
        }
      });
      console.log('🗑️ Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
    }
  }
};

export default database;