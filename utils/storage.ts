import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataEncryption } from './encryption';

// ============================================================================
// ENCRYPTED STORAGE MANAGER - Maximum Security for User Data
// ============================================================================

/**
 * Secure storage manager that encrypts all data before storage
 * All user data is encrypted to maximize security and privacy
 */
export class StorageManager {
  /**
   * Save data to AsyncStorage with encryption
   */
  static async save<T>(key: string, data: T): Promise<void> {
    try {
      // Encrypt data before storage for maximum security
      const encryptedData = DataEncryption.encrypt(JSON.stringify(data));
      await AsyncStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error(`Error saving encrypted data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Load data from AsyncStorage with decryption
   */
  static async load<T>(key: string): Promise<T | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(key);
      if (!encryptedData) return null;
      
      // Decrypt data after retrieval
      const decryptedData = DataEncryption.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error(`Error loading encrypted data for key ${key}:`, error);
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
// USER-SPECIFIC ENCRYPTED STORAGE FUNCTIONS
// ============================================================================

/**
 * Save user data with encryption and user-specific key
 */
export const saveUserData = async <T>(userId: string, key: string, data: T): Promise<void> => {
  const fullKey = `${key}_${userId}`;
  await StorageManager.save(fullKey, data);
};

/**
 * Load user data with decryption and user-specific key
 */
export const loadUserData = async <T>(userId: string, key: string): Promise<T | null> => {
  const fullKey = `${key}_${userId}`;
  return await StorageManager.load<T>(fullKey);
};

/**
 * Remove user data with user-specific key
 */
export const removeUserData = async (userId: string, key: string): Promise<void> => {
  const fullKey = `${key}_${userId}`;
  await StorageManager.remove(fullKey);
}; 