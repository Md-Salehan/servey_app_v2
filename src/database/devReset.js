import { database } from './index';

/**
 * ⚠️ DEV ONLY
 * Safely reset WatermelonDB during development
 */
export const resetDatabaseIfNeeded = async () => {
  if (!__DEV__) return;

  try {
    console.log('🧪 DEV: Resetting WatermelonDB...');
    await database.write(() => database.unsafeResetDatabase());


    console.log('✅ DEV: Database reset complete');
  } catch (error) {
    console.log('❌ DEV: Reset failed', error);
  }
};