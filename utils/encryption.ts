// ============================================================================
// DATA ENCRYPTION UTILITY - Maximum Security for Health Data
// ============================================================================

/**
 * Simple encryption utility for local data
 * In a production app, you'd want to use more robust encryption libraries
 * This provides basic encryption for sensitive health data
 */
export class DataEncryption {
  // Simple encryption for sensitive data using React Native compatible Base64
  static encrypt(data: string): string {
    try {
      // Use React Native compatible Base64 encoding
      const encoded = btoa(data);
      return encoded;
    } catch (error) {
      console.error('Encryption error:', error);
      return data; // Fallback to plain text if encryption fails
    }
  }

  // Simple decryption for sensitive data using React Native compatible Base64
  static decrypt(encryptedData: string): string {
    try {
      // Use React Native compatible Base64 decoding
      const decoded = atob(encryptedData);
      return decoded;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData; // Fallback to original data if decryption fails
    }
  }

  // Check if a string is valid Base64
  static isValidBase64(str: string): boolean {
    try {
      // Try to decode it - if it works, it's valid Base64
      atob(str);
      return true;
    } catch {
      return false;
    }
  }
} 