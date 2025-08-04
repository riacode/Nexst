import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// SHARED STORAGE UTILITY - Reduces AsyncStorage Code Duplication
// ============================================================================

export class StorageManager {
  /**
   * Save data to AsyncStorage with error handling
   */
  static async save<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Load data from AsyncStorage with error handling
   */
  static async load<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
    }
  }

  /**
   * Clear all data from AsyncStorage
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys as string[];
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Multi-remove specific keys
   */
  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error in multi-remove:', error);
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON PATTERNS
// ============================================================================

/**
 * Save data with user-specific key
 */
export const saveUserData = async <T>(userId: string, key: string, data: T): Promise<void> => {
  const fullKey = `${key}_${userId}`;
  await StorageManager.save(fullKey, data);
};

/**
 * Load data with user-specific key
 */
export const loadUserData = async <T>(userId: string, key: string): Promise<T | null> => {
  const fullKey = `${key}_${userId}`;
  return await StorageManager.load<T>(fullKey);
};

/**
 * Remove data with user-specific key
 */
export const removeUserData = async (userId: string, key: string): Promise<void> => {
  const fullKey = `${key}_${userId}`;
  await StorageManager.remove(fullKey);
}; 