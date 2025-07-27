import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior for better lock screen visibility
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, // Enable badge for lock screen visibility
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  }

  static async getExpoPushToken() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // You'll need to replace this with your actual Expo project ID
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async scheduleLocalNotification(title: string, body: string, data?: any) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // null means show immediately
    });
  }

  static async sendRecommendationNotification(recommendation: any) {
    const title = 'New Health Recommendation';
    const body = `You have a new ${recommendation.priority.toLowerCase()} priority recommendation: ${recommendation.title}`;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'recommendation',
      recommendationId: recommendation.id,
    });
  }

  static async sendHighPriorityNotification(recommendation: any) {
    const title = '🚨 High Priority Health Alert';
    const body = `Urgent: ${recommendation.title} - Please review immediately`;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'high_priority_recommendation',
      recommendationId: recommendation.id,
    });
  }

  // ============================================================================
  // APPOINTMENT REMINDER NOTIFICATIONS
  // ============================================================================
  
  static async sendAppointmentReminder(appointment: any) {
    const title = '📅 Upcoming Appointment';
    const body = `Your appointment "${appointment.title}" is in 2 days. Tap to review your personalized questions.`;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'appointment_reminder',
      appointmentId: appointment.id,
    });
  }

  static async sendAppointmentDayReminder(appointment: any) {
    const title = '🏥 Appointment Today';
    const body = `Your appointment "${appointment.title}" is today. Don't forget to review your questions!`;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'appointment_day_reminder',
      appointmentId: appointment.id,
    });
  }

  // ============================================================================
  // FOLLOW-UP QUESTION NOTIFICATIONS
  // ============================================================================
  
  static async sendFollowUpQuestion(question: string, questionType: string) {
    const title = '❓ Health Follow-up';
    const body = question;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'follow_up_question',
      questionType: questionType,
    });
  }

  // ============================================================================
  // MISSED LOG REMINDER NOTIFICATIONS
  // ============================================================================
  
  static async sendMissedLogReminder() {
    const title = '⏰ Missed Your Health Check-in';
    const body = "It's been an hour since your scheduled time. Your health insights are waiting!";
    
    await this.scheduleLocalNotification(title, body, {
      type: 'missed_log_reminder',
    });
  }

  static async sendMissedLogSpotlight() {
    const title = '🌟 Spotlight: Health Check-in Overdue';
    const body = "Your daily health log is waiting! This helps track your wellness journey.";
    
    // Use high priority and badge for spotlight effect
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'missed_log_spotlight' },
        sound: 'default',
        priority: 'high' as any,
        badge: 1,
        // iOS specific settings for maximum prominence
        ...(Platform.OS === 'ios' && {
          categoryIdentifier: 'missed_log_spotlight',
          threadIdentifier: 'health_logging',
          interruptionLevel: 'timeSensitive', // iOS 15+ for maximum prominence
        }),
      },
      trigger: null, // Show immediately
    });
  }
}

// Set up notification listeners
export const setupNotificationListeners = () => {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'recommendation' || data?.type === 'high_priority_recommendation') {
      // Just log the notification tap - user can manually navigate to recommendations
      console.log('Recommendation notification tapped:', data);
    } else if (data?.type === 'appointment_reminder' || data?.type === 'appointment_day_reminder') {
      // Navigate to appointment detail
      console.log('Appointment notification tapped:', data);
      // Note: Navigation would be handled by the app's navigation system
    } else if (data?.type === 'follow_up_question') {
      // Navigate to symptoms screen for follow-up
      console.log('Follow-up question notification tapped:', data);
    } else if (data?.type === 'missed_log_reminder' || data?.type === 'missed_log_spotlight') {
      // Navigate to symptoms screen for logging
      console.log('Missed log notification tapped:', data);
    }
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}; 