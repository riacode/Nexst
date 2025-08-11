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
    if (!startDate || !endDate) {
      return { isValid: false, error: 'Start and end dates are required' };
    }

    if (startDate >= endDate) {
      return { isValid: false, error: 'Start date must be before end date' };
    }

    return { isValid: true };
  }

  /**
   * Validate notification settings
   */
  static validateNotificationSettings(settings: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings) {
      errors.push('Notification settings are required');
      return { isValid: false, errors };
    }

    if (typeof settings.enabled !== 'boolean') {
      errors.push('Notifications enabled must be a boolean');
    }

    if (typeof settings.dailyReminderEnabled !== 'boolean') {
      errors.push('Daily reminder enabled must be a boolean');
    }

    if (settings.dailyReminderTime && !(settings.dailyReminderTime instanceof Date)) {
      errors.push('Daily reminder time must be a valid date');
    }

    if (settings.time && !(settings.time instanceof Date)) {
      errors.push('Notification time must be a valid date');
    }

    if (settings.frequency && !['Daily', 'Weekdays', 'Weekly'].includes(settings.frequency)) {
      errors.push('Frequency must be Daily, Weekdays, or Weekly');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate follow-up question
   */
  static validateFollowUpQuestion(question: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!question) {
      errors.push('Follow-up question is required');
      return { isValid: false, errors };
    }

    if (!question.id || typeof question.id !== 'string') {
      errors.push('Valid question ID is required');
    }

    if (!question.question || typeof question.question !== 'string') {
      errors.push('Question text is required');
    }

    if (!question.questionType || typeof question.questionType !== 'string') {
      errors.push('Question type is required');
    }

    if (!question.timestamp || !(question.timestamp instanceof Date)) {
      errors.push('Valid timestamp is required');
    }

    if (typeof question.isAnswered !== 'boolean') {
      errors.push('Answered status must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate privacy settings
   */
  static validatePrivacySettings(settings: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings) {
      errors.push('Privacy settings are required');
      return { isValid: false, errors };
    }

    if (typeof settings.aiProcessingEnabled !== 'boolean') {
      errors.push('AI processing enabled must be a boolean');
    }

    if (typeof settings.dataSharingEnabled !== 'boolean') {
      errors.push('Data sharing enabled must be a boolean');
    }

    if (typeof settings.analyticsEnabled !== 'boolean') {
      errors.push('Analytics enabled must be a boolean');
    }

    if (typeof settings.dataRetentionDays !== 'number' || settings.dataRetentionDays < 1) {
      errors.push('Data retention days must be a positive number');
    }

    if (settings.lastPrivacyUpdate && !(settings.lastPrivacyUpdate instanceof Date)) {
      errors.push('Last privacy update must be a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate tutorial state
   */
  static validateTutorialState(state: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!state) {
      errors.push('Tutorial state is required');
      return { isValid: false, errors };
    }

    if (typeof state.hasSeenOnboarding !== 'boolean') {
      errors.push('Has seen onboarding must be a boolean');
    }

    if (typeof state.hasSeenSymptomTutorial !== 'boolean') {
      errors.push('Has seen symptom tutorial must be a boolean');
    }

    if (typeof state.hasSeenRecommendationTutorial !== 'boolean') {
      errors.push('Has seen recommendation tutorial must be a boolean');
    }

    if (typeof state.hasSeenAppointmentTutorial !== 'boolean') {
      errors.push('Has seen appointment tutorial must be a boolean');
    }

    if (typeof state.hasSeenPrivacyTutorial !== 'boolean') {
      errors.push('Has seen privacy tutorial must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 