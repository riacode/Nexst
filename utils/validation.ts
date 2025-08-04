import { SymptomLog, MedicalRecommendation } from '../types/recommendations';

// ============================================================================
// VALIDATION UTILITIES - Input Validation and Data Integrity
// ============================================================================

export class ValidationUtils {
  /**
   * Validate symptom log data
   */
  static validateSymptomLog(log: Partial<SymptomLog>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!log.id) errors.push('Symptom log must have an ID');
    if (!log.timestamp) errors.push('Symptom log must have a timestamp');
    if (!log.summary || log.summary.trim().length === 0) errors.push('Symptom log must have a summary');
    if (!log.transcript || log.transcript.trim().length === 0) errors.push('Symptom log must have a transcript');
    
    if (log.severity && !['mild', 'moderate', 'severe'].includes(log.severity)) {
      errors.push('Severity must be mild, moderate, or severe');
    }
    
    if (log.impact && !['low', 'medium', 'high'].includes(log.impact)) {
      errors.push('Impact must be low, medium, or high');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate medical recommendation data
   */
  static validateRecommendation(rec: Partial<MedicalRecommendation>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rec.title || rec.title.trim().length === 0) errors.push('Recommendation must have a title');
    if (!rec.description || rec.description.trim().length === 0) errors.push('Recommendation must have a description');
    
    if (rec.priority && !['HIGH', 'MEDIUM', 'LOW'].includes(rec.priority)) {
      errors.push('Priority must be HIGH, MEDIUM, or LOW');
    }
    
    if (rec.urgency && !['immediate', 'within days', 'within weeks'].includes(rec.urgency)) {
      errors.push('Urgency must be immediate, within days, or within weeks');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate appointment data
   */
  static validateAppointment(appointment: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!appointment.title || appointment.title.trim().length === 0) {
      errors.push('Appointment must have a title');
    }
    
    if (!appointment.date || !(appointment.date instanceof Date)) {
      errors.push('Appointment must have a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate audio file
   */
  static validateAudioFile(uri: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!uri || uri.trim().length === 0) {
      errors.push('Audio file URI is required');
    }

    if (uri && !uri.startsWith('file://') && !uri.startsWith('content://')) {
      errors.push('Invalid audio file URI format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate required field
   */
  static validateRequired(value: any, fieldName: string): { isValid: boolean; error?: string } {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return {
        isValid: false,
        error: `${fieldName} is required`
      };
    }
    return { isValid: true };
  }

  /**
   * Validate string length
   */
  static validateStringLength(value: string, minLength: number, maxLength: number, fieldName: string): { isValid: boolean; error?: string } {
    if (value.length < minLength) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${minLength} characters`
      };
    }
    if (value.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must be no more than ${maxLength} characters`
      };
    }
    return { isValid: true };
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
    if (startDate >= endDate) {
      return {
        isValid: false,
        error: 'Start date must be before end date'
      };
    }
    return { isValid: true };
  }
} 