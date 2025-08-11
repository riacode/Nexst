import { StorageManager } from './storage';

// ============================================================================
// TEST UTILITIES - For Development and Testing Purposes
// ============================================================================

/**
 * Clear all stored data (useful for testing and debugging)
 */
export const clearAllStoredData = async (): Promise<void> => {
  try {
    // Get all keys and remove them
    const keys = await StorageManager.getAllKeys();
    if (keys.length > 0) {
      await StorageManager.multiRemove(keys);
      console.log('✅ All stored data cleared');
    } else {
      console.log('ℹ️ No stored data found to clear');
    }
  } catch (error) {
    console.error('Error clearing stored data:', error);
  }
};

/**
 * Inspect storage contents for debugging
 */
export const inspectStorage = async (): Promise<void> => {
  try {
    console.log('🔍 Inspecting storage contents...');
    
    const keys = await StorageManager.getAllKeys();
    console.log(`Found ${keys.length} keys in storage:`);
    
    for (const key of keys) {
      try {
        const data = await StorageManager.load(key);
        console.log(`  ${key}:`, data ? '✅ Valid data' : '❌ No data');
      } catch (error) {
        console.log(`  ${key}: ❌ Error loading - ${error}`);
      }
    }
    
    // Check data health
    const health = await StorageManager.checkDataHealth();
    console.log('Overall data health:', health);
    
  } catch (error) {
    console.error('Error inspecting storage:', error);
  }
};

/**
 * Migrate legacy data to encrypted format
 */
export const migrateLegacyData = async (): Promise<void> => {
  try {
    console.log('🔄 Starting legacy data migration...');
    
    // First, try to migrate any legacy data
    await StorageManager.migrateLegacyData();
    
    // Then check data health
    const health = await StorageManager.checkDataHealth();
    console.log('Data health after migration:', health);
    
    console.log('✅ Legacy data migration completed');
  } catch (error) {
    console.error('Error during legacy data migration:', error);
  }
};

/**
 * Clear all corrupted data and reset app state
 */
export const clearCorruptedData = async (): Promise<void> => {
  try {
    console.log('🧹 Starting corrupted data cleanup...');
    
    // First, try to migrate and clean up any corrupted data
    await StorageManager.migrateCorruptedData();
    
    // Then clear all data to start fresh
    await clearAllStoredData();
    
    console.log('✅ Corrupted data cleanup completed');
  } catch (error) {
    console.error('Error during corrupted data cleanup:', error);
  }
}; 