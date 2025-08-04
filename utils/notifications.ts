import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ============================================================================
// NOTIFICATION SERVICE - Handles All App Notifications
// ============================================================================

/**
 * Notification types for different app events
 */
export type NotificationType = 
  | 'new_recommendation'
  | 'follow_up_question'
  | 'appointment_reminder'
  | 'daily_symptom_log';

/**
 * Notification settings interface
 */
export interface NotificationSettings {
  enabled: boolean;
  dailyReminderTime: { hour: number; minute: number };
  dailyReminderEnabled: boolean;
  recommendationAlerts: boolean;
  followUpAlerts: boolean;
  appointmentReminders: boolean;
}

/**
 * Default notification settings
 */
export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  dailyReminderTime: { hour: 9, minute: 0 }, // 9 AM default
  dailyReminderEnabled: true,
  recommendationAlerts: true,
  followUpAlerts: true,
  appointmentReminders: true,
};

// ============================================================================
// NOTIFICATION CONFIGURATION
// ============================================================================

/**
 * Configure notification behavior
 */
export const configureNotifications = () => {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Request permissions
  requestNotificationPermissions();
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }
    
    // Get push token for remote notifications (if needed in future)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// ============================================================================
// NOTIFICATION SCHEDULING
// ============================================================================

/**
 * Schedule daily symptom log reminder
 * 
 * @param time - Time object with hour and minute
 * @param enabled - Whether the reminder is enabled
 */
export const scheduleDailyReminder = async (
  time: { hour: number; minute: number },
  enabled: boolean = true
): Promise<void> => {
  try {
    // Cancel existing daily reminder
    await Notifications.cancelScheduledNotificationAsync('daily_symptom_reminder');
    
    if (!enabled) {
      console.log('Daily reminder disabled');
      return;
    }
    
    // Calculate next occurrence
    const now = new Date();
    const nextReminder = new Date();
    nextReminder.setHours(time.hour, time.minute, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }
    
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Health Check-in',
        body: 'Time to record your daily symptom log and track your health progress.',
        data: { type: 'daily_symptom_log' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
      identifier: 'daily_symptom_reminder',
    });
    
    console.log(`Daily reminder scheduled for ${time.hour}:${time.minute.toString().padStart(2, '0')}`);
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
};

/**
 * Schedule appointment reminder (1 day before)
 * 
 * @param appointmentId - Unique appointment identifier
 * @param appointmentTitle - Title of the appointment
 * @param appointmentDate - Date of the appointment
 */
export const scheduleAppointmentReminder = async (
  appointmentId: string,
  appointmentTitle: string,
  appointmentDate: Date
): Promise<void> => {
  try {
    // Calculate reminder time (1 day before at 10 AM)
    const reminderDate = new Date(appointmentDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(10, 0, 0, 0);
    
    // Don't schedule if reminder time has passed
    if (reminderDate <= new Date()) {
      console.log('Appointment reminder time has passed');
      return;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Appointment Tomorrow',
        body: `You have an appointment tomorrow: ${appointmentTitle}. Don't forget to review your questions!`,
        data: { 
          type: 'appointment_reminder',
          appointmentId,
          appointmentTitle 
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
      identifier: `appointment_reminder_${appointmentId}`,
    });
    
    console.log(`Appointment reminder scheduled for ${reminderDate.toLocaleString()}`);
  } catch (error) {
    console.error('Error scheduling appointment reminder:', error);
  }
};

/**
 * Cancel appointment reminder
 * 
 * @param appointmentId - Unique appointment identifier
 */
export const cancelAppointmentReminder = async (appointmentId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(`appointment_reminder_${appointmentId}`);
    console.log(`Appointment reminder cancelled for ${appointmentId}`);
  } catch (error) {
    console.error('Error cancelling appointment reminder:', error);
  }
};

// ============================================================================
// IMMEDIATE NOTIFICATIONS
// ============================================================================

/**
 * Send immediate notification for new recommendation
 * 
 * @param recommendationTitle - Title of the new recommendation
 */
export const sendRecommendationAlert = async (recommendationTitle: string): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Health Recommendation',
        body: `You have a new recommendation: ${recommendationTitle}. Tap to view details.`,
        data: { 
          type: 'new_recommendation',
          recommendationTitle 
        },
      },
      trigger: null, // Immediate
    });
    
    console.log('Recommendation alert sent');
  } catch (error) {
    console.error('Error sending recommendation alert:', error);
  }
};

/**
 * Send immediate notification for follow-up question
 * 
 * @param questionText - The follow-up question text
 */
export const sendFollowUpQuestionAlert = async (questionText: string): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Follow-up Question',
        body: questionText.length > 100 ? `${questionText.substring(0, 100)}...` : questionText,
        data: { 
          type: 'follow_up_question',
          questionText 
        },
      },
      trigger: null, // Immediate
    });
    
    console.log('Follow-up question alert sent');
  } catch (error) {
    console.error('Error sending follow-up question alert:', error);
  }
};

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

/**
 * Get notification permissions status
 */
export const getNotificationPermissions = async (): Promise<Notifications.NotificationPermissionsStatus> => {
  try {
    return await Notifications.getPermissionsAsync();
  } catch (error) {
    console.error('Error getting notification permissions:', error);
    return { status: 'undetermined', granted: false, expires: 'never' } as Notifications.NotificationPermissionsStatus;
  }
};

// ============================================================================
// NOTIFICATION LISTENERS
// ============================================================================

/**
 * Add notification received listener
 * 
 * @param callback - Function to call when notification is received
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add notification response listener
 * 
 * @param callback - Function to call when user taps notification
 */
export const addNotificationResponseReceivedListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Remove notification listener
 * 
 * @param subscription - Subscription to remove
 */
export const removeNotificationListener = (subscription: Notifications.Subscription): void => {
  subscription.remove();
}; 