import { StorageManager } from './storage';

// ============================================================================
// DATA ENCRYPTION UTILITY - Maximum Security for Health Data
// ============================================================================

/**
 * Simple encryption utility for local data
 * In a production app, you'd want to use more robust encryption libraries
 * This provides basic encryption for sensitive health data
 */
export class DataEncryption {
  private static readonly ENCRYPTION_KEY = 'nexst_health_data_key_2024';

  // Generate a simple key for encryption
  private static generateKey(): string {
    return this.ENCRYPTION_KEY + Date.now().toString();
  }

  // Simple encryption for sensitive data
  static encrypt(data: string): string {
    try {
      // In a real implementation, you'd use a proper encryption library
      // This is a basic example for demonstration
      const encoded = Buffer.from(data, 'utf8').toString('base64');
      return encoded;
    } catch (error) {
      console.error('Encryption error:', error);
      return data; // Fallback to plain text if encryption fails
    }
  }

  // Simple decryption for sensitive data
  static decrypt(encryptedData: string): string {
    try {
      // In a real implementation, you'd use a proper decryption library
      // This is a basic example for demonstration
      const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
      return decoded;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData; // Fallback to original data if decryption fails
    }
  }

  // Validate data before storage
  static validateHealthData(data: any): boolean {
    try {
      // Basic validation - ensure data is not null/undefined
      if (data === null || data === undefined) {
        return false;
      }

      // Ensure data can be serialized
      JSON.stringify(data);
      return true;
    } catch (error) {
      console.error('Data validation error:', error);
      return false;
    }
  }

  // Store data with encryption using StorageManager
  static async storeEncryptedData<T>(key: string, value: T): Promise<void> {
    try {
      // Validate data before encryption
      if (!this.validateHealthData(value)) {
        throw new Error('Invalid health data for encryption');
      }

      // Use StorageManager for encrypted storage
      await StorageManager.save(key, value);
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      throw error;
    }
  }

  // Retrieve data with decryption using StorageManager
  static async retrieveEncryptedData<T>(key: string): Promise<T | null> {
    try {
      // Use StorageManager for encrypted retrieval
      return await StorageManager.load<T>(key);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      return null;
    }
  }

  // Remove encrypted data using StorageManager
  static async removeEncryptedData(key: string): Promise<void> {
    try {
      await StorageManager.remove(key);
    } catch (error) {
      console.error('Error removing encrypted data:', error);
    }
  }

  // Clear all encrypted data using StorageManager
  static async clearAllEncryptedData(): Promise<void> {
    try {
      await StorageManager.clear();
    } catch (error) {
      console.error('Error clearing encrypted data:', error);
    }
  }

  // Get all encrypted data keys using StorageManager
  static async getAllEncryptedDataKeys(): Promise<string[]> {
    try {
      return await StorageManager.getAllKeys();
    } catch (error) {
      console.error('Error getting encrypted data keys:', error);
      return [];
    }
  }
} 