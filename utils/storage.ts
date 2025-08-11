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
      const storedData = await AsyncStorage.getItem(key);
      if (!storedData) return null;
      
      // Check if the data is Base64 encoded (encrypted) or plain text (legacy)
      let decryptedData: string;
      
      if (DataEncryption.isValidBase64(storedData)) {
        // Data is encrypted, decrypt it
        try {
          decryptedData = DataEncryption.decrypt(storedData);
        } catch (decryptError) {
          console.warn(`Decryption failed for key ${key}, treating as legacy data:`, decryptError);
          decryptedData = storedData; // Use as-is if decryption fails
        }
      } else {
        // Data is not encrypted (legacy data), use as-is
        console.log(`Key ${key} contains legacy (non-encrypted) data`);
        decryptedData = storedData;
      }
      
      // Validate that the decrypted data is valid JSON
      if (!decryptedData || typeof decryptedData !== 'string') {
        console.warn(`Invalid decrypted data for key ${key}, removing corrupted data`);
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      try {
        return JSON.parse(decryptedData);
      } catch (parseError) {
        console.error(`JSON parse error for key ${key}:`, parseError);
        console.error(`Raw decrypted data:`, decryptedData);
        
        // Remove corrupted data to prevent future errors
        await AsyncStorage.removeItem(key);
        return null;
      }
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      
      // If there's an error, try to remove the corrupted data
      try {
        await AsyncStorage.removeItem(key);
        console.log(`Removed corrupted data for key ${key}`);
      } catch (removeError) {
        console.error(`Error removing corrupted data for key ${key}:`, removeError);
      }
      
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
      throw error;
    }
  }

  /**
   * Clear all data from AsyncStorage
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('✅ All data cleared from AsyncStorage');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
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
   * Remove multiple keys from AsyncStorage
   */
  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
      console.log(`✅ Removed ${keys.length} keys from AsyncStorage`);
    } catch (error) {
      console.error('Error removing multiple keys:', error);
      throw error;
    }
  }

  /**
   * Safe load with automatic corruption detection and cleanup
   */
  static async safeLoad<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await this.load<T>(key);
      if (data !== null) {
        return data;
      }
      // If loading failed, return default value
      return defaultValue;
    } catch (error) {
      console.error(`Safe load failed for key ${key}, using default:`, error);
      return defaultValue;
    }
  }

  /**
   * Migrate corrupted data by cleaning up invalid entries
   */
  static async migrateCorruptedData(): Promise<void> {
    try {
      console.log('🔄 Starting corrupted data migration...');
      const keys = await this.getAllKeys();
      let migratedCount = 0;
      let corruptedCount = 0;

      for (const key of keys) {
        try {
          const data = await this.load(key);
          if (data === null) {
            // Data was corrupted and removed during load
            corruptedCount++;
          } else {
            migratedCount++;
          }
        } catch (error) {
          console.warn(`Removing corrupted key ${key}:`, error);
          try {
            await AsyncStorage.removeItem(key);
            corruptedCount++;
          } catch (removeError) {
            console.error(`Failed to remove corrupted key ${key}:`, removeError);
          }
        }
      }

      console.log(`✅ Data migration complete: ${migratedCount} valid, ${corruptedCount} corrupted`);
    } catch (error) {
      console.error('Error during data migration:', error);
    }
  }

  /**
   * Migrate legacy (non-encrypted) data to encrypted format
   */
  static async migrateLegacyData(): Promise<void> {
    try {
      console.log('🔄 Starting legacy data migration...');
      const keys = await this.getAllKeys();
      let migratedCount = 0;

      for (const key of keys) {
        try {
          const rawData = await AsyncStorage.getItem(key);
          if (rawData && !DataEncryption.isValidBase64(rawData)) {
            // This is legacy data, migrate it to encrypted format
            console.log(`Migrating legacy data for key: ${key}`);
            
            // Parse the legacy data
            const legacyData = JSON.parse(rawData);
            
            // Save it in encrypted format
            await this.save(key, legacyData);
            
            migratedCount++;
          }
        } catch (error) {
          console.warn(`Error migrating legacy data for key ${key}:`, error);
        }
      }

      console.log(`✅ Legacy data migration complete: ${migratedCount} keys migrated`);
    } catch (error) {
      console.error('Error during legacy data migration:', error);
    }
  }

  /**
   * Check data health and report issues
   */
  static async checkDataHealth(): Promise<{ healthy: boolean; totalKeys: number; corruptedKeys: number; errors: string[] }> {
    try {
      const keys = await this.getAllKeys();
      const errors: string[] = [];
      let corruptedKeys = 0;

      for (const key of keys) {
        try {
          const data = await this.load(key);
          if (data === null) {
            corruptedKeys++;
            errors.push(`Key ${key}: Data corrupted and removed`);
          }
        } catch (error) {
          corruptedKeys++;
          errors.push(`Key ${key}: ${error}`);
        }
      }

      const healthy = corruptedKeys === 0;
      
      return {
        healthy,
        totalKeys: keys.length,
        corruptedKeys,
        errors
      };
    } catch (error) {
      console.error('Error checking data health:', error);
      return {
        healthy: false,
        totalKeys: 0,
        corruptedKeys: 0,
        errors: [`Data health check failed: ${error}`]
      };
    }
  }
} 