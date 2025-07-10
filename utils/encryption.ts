import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple encryption utility for local data
// In a production app, you'd want to use more robust encryption libraries

export class DataEncryption {
  private static readonly ENCRYPTION_KEY = 'clynic_health_data_key_2024';

  // Generate a simple key for encryption
  static generateKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  // Simple encryption for sensitive data
  static encrypt(data: string): string {
    try {
      // In a real implementation, you'd use a proper encryption library
      // For now, we'll use a simple base64 encoding with a salt
      const salt = this.generateSalt();
      const saltedData = salt + data;
      return Buffer.from(saltedData).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      return data; // Fallback to plain text if encryption fails
    }
  }

  // Simple decryption for sensitive data
  static decrypt(encryptedData: string): string {
    try {
      // In a real implementation, you'd use a proper decryption library
      const decoded = Buffer.from(encryptedData, 'base64').toString();
      // Remove salt (first 16 characters)
      return decoded.substring(16);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData; // Fallback to original data if decryption fails
    }
  }

  // Generate a random salt
  private static generateSalt(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 16; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  }

  // Simple hash for data integrity
  static hash(data: string): string {
    try {
      // Simple hash function - in production, use a proper crypto library
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    } catch (error) {
      console.error('Hashing error:', error);
      return data; // Fallback to original data if hashing fails
    }
  }

  // Verify data integrity
  static verifyIntegrity(data: string, hash: string): boolean {
    try {
      const computedHash = this.hash(data);
      return computedHash === hash;
    } catch (error) {
      console.error('Integrity verification error:', error);
      return false;
    }
  }
}

// Secure storage wrapper
export class SecureStorage {
  // Store data with encryption
  static async setItem(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const encryptedValue = DataEncryption.encrypt(stringValue);
      await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Secure storage set error:', error);
      // Fallback to regular storage
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  }

  // Retrieve data with decryption
  static async getItem(key: string): Promise<any> {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;

      const decryptedValue = DataEncryption.decrypt(encryptedValue);
      try {
        return JSON.parse(decryptedValue);
      } catch {
        return decryptedValue; // Return as string if not JSON
      }
    } catch (error) {
      console.error('Secure storage get error:', error);
      // Fallback to regular storage
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
  }

  // Remove item
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Secure storage remove error:', error);
    }
  }

  // Clear all data
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Secure storage clear error:', error);
    }
  }

  // Get all keys
  static async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return Array.from(keys);
    } catch (error) {
      console.error('Secure storage getAllKeys error:', error);
      return [];
    }
  }
}

// Data sanitization utilities
export class DataSanitization {
  // Remove personally identifiable information from data
  static sanitizeHealthData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    
    // Remove or anonymize sensitive fields
    const sensitiveFields: string[] = [
      'name', 'email', 'phone', 'address', 'ssn', 'socialSecurity',
      'insurance', 'policyNumber', 'memberId', 'dateOfBirth'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Recursively sanitize nested objects
    const keys = Object.keys(sanitized);
    keys.forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeHealthData(sanitized[key]);
      }
    });

    return sanitized;
  }

  // Validate data before storage
  static validateHealthData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for required fields in symptom logs
    if (data.type === 'symptomLog') {
      return !!(data.timestamp && data.transcript && data.summary);
    }

    // Check for required fields in recommendations
    if (data.type === 'recommendation') {
      return !!(data.title && data.description && data.priority);
    }

    // Check for required fields in appointments
    if (data.type === 'appointment') {
      return !!(data.title && data.date);
    }

    return true;
  }
}

// Audit logging for privacy compliance
export class PrivacyAudit {
  private static readonly AUDIT_KEY = 'privacy_audit_log';

  // Log privacy-related actions
  static async logAction(action: string, details?: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const auditEntry = {
        timestamp,
        action,
        details: details || {},
        userId: 'local_user', // In a real app, this would be the actual user ID
      };

      const existingLog = await SecureStorage.getItem(this.AUDIT_KEY) || [];
      const updatedLog = [...existingLog, auditEntry];

      // Keep only last 1000 entries to prevent storage bloat
      if (updatedLog.length > 1000) {
        updatedLog.splice(0, updatedLog.length - 1000);
      }

      await SecureStorage.setItem(this.AUDIT_KEY, updatedLog);
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Get audit log
  static async getAuditLog(): Promise<any[]> {
    try {
      return await SecureStorage.getItem(this.AUDIT_KEY) || [];
    } catch (error) {
      console.error('Get audit log error:', error);
      return [];
    }
  }

  // Clear audit log
  static async clearAuditLog(): Promise<void> {
    try {
      await SecureStorage.removeItem(this.AUDIT_KEY);
    } catch (error) {
      console.error('Clear audit log error:', error);
    }
  }
} 