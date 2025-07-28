import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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

  // ============================================================================
  // NEW NOTIFICATION SYSTEM
  // ============================================================================

  // 1. Smart initial notification for new users
  static async handleNewUserNotification(scheduledTime: Date) {
    const now = new Date();
    const scheduledHour = scheduledTime.getHours();
    const scheduledMinute = scheduledTime.getMinutes();
    
    // Create today's scheduled time
    const todayScheduled = new Date();
    todayScheduled.setHours(scheduledHour, scheduledMinute, 0, 0);
    
    // Create one hour after scheduled time
    const oneHourAfter = new Date(todayScheduled);
    oneHourAfter.setHours(oneHourAfter.getHours() + 1);
    
    if (now < todayScheduled) {
      // Before scheduled time - no notification needed
      console.log('New user: Before scheduled time, no notification sent');
      return;
    } else if (now >= todayScheduled && now < oneHourAfter) {
      // At scheduled time - send reminder
      await this.scheduleLocalNotification(
        "Time to Log Your Symptoms",
        "Tap to quickly record how you're feeling today.",
        { type: 'daily_reminder', priority: 'high' }
      );
      console.log('New user: At scheduled time, sent reminder');
    } else {
      // More than one hour past - send missed reminder
      await this.scheduleLocalNotification(
        "Missed Your Health Check-in",
        "Make sure you log your symptoms today!",
        { type: 'missed_log_reminder', priority: 'high' }
      );
      console.log('New user: More than one hour past, sent missed reminder');
    }
  }

  // 2. Schedule recurring log reminders
  static async scheduleLogReminders(time: Date, frequency: string = 'Daily') {
    try {
      // Cancel any existing reminders
      await this.cancelNotification('daily_reminder');

      const triggerTime = new Date(time);
      const now = new Date();

      // If time has passed today, schedule for tomorrow
      if (triggerTime <= now) {
        triggerTime.setDate(triggerTime.getDate() + 1);
      }

      // Create trigger based on frequency
      let trigger: any;
      
      if (frequency === 'Daily') {
        trigger = {
          hour: triggerTime.getHours(),
          minute: triggerTime.getMinutes(),
          repeats: true,
        };
      } else if (frequency === 'Weekdays') {
        trigger = {
          hour: triggerTime.getHours(),
          minute: triggerTime.getMinutes(),
          weekday: 1, // Monday
          repeats: true,
        };
      } else if (frequency === 'Weekly') {
        trigger = {
          hour: triggerTime.getHours(),
          minute: triggerTime.getMinutes(),
          weekday: 1, // Monday
          repeats: true,
        };
      }

      // Schedule daily reminder with high priority for iOS lock screen
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to Log Your Symptoms",
          body: "Tap to quickly record how you're feeling today.",
          data: { type: 'daily_reminder', priority: 'high' },
          sound: 'default',
          // Ensure high priority for iOS lock screen positioning
          ...(Platform.OS === 'ios' && {
            priority: 'high',
            categoryIdentifier: 'high_priority'
          })
        },
        trigger,
        identifier: 'daily_reminder',
      });

      console.log(`${frequency} reminders scheduled for:`, triggerTime.toLocaleString());
    } catch (error) {
      console.error('Error scheduling log reminders:', error);
    }
  }





  // 5. New recommendation notification (high priority)
  static async sendRecommendationNotification(recommendation: any) {
    await this.scheduleLocalNotification(
      'New Health Recommendation',
      `You have a new ${recommendation.priority.toLowerCase()} priority recommendation: ${recommendation.title}`,
      { 
        type: 'recommendation', 
        recommendationId: recommendation.id,
        priority: 'high' // Stays at top of lock screen
      }
    );
  }

  // 6. Follow-up question notification (high priority)
  static async sendFollowUpQuestion(question: string, questionType: string) {
    await this.scheduleLocalNotification(
      'Health Follow-up',
      question,
      { 
        type: 'follow_up_question', 
        questionType: questionType,
        priority: 'high' // Stays at top of lock screen
      }
    );
  }

  // 7. New symptom log notification (high priority)
  static async sendNewLogNotification() {
    await this.scheduleLocalNotification(
      'New Health Log Added',
      'Your symptom log has been recorded and analyzed.',
      { 
        type: 'new_log', 
        priority: 'high' // Stays at top of lock screen
      }
    );
  }

  // Helper method to schedule immediate notifications with priority
  static async scheduleLocalNotification(title: string, body: string, data?: any) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        // Set priority for iOS lock screen positioning
        ...(data?.priority === 'high' && Platform.OS === 'ios' && {
          priority: 'high',
          categoryIdentifier: 'high_priority'
        })
      },
      trigger: null, // null means show immediately
    });
  }

  // Helper method to cancel all scheduled notifications
  static async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Helper method to cancel specific notification types
  static async cancelNotification(identifier: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`Notification ${identifier} cancelled`);
    } catch (error) {
      console.error(`Error cancelling notification ${identifier}:`, error);
    }
  }
}

// Set up notification listeners
export const setupNotificationListeners = () => {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'recommendation') {
      console.log('Recommendation notification tapped:', data);
      // Navigate to recommendations screen
    } else if (data?.type === 'follow_up_question') {
      console.log('Follow-up question notification tapped:', data);
      // Navigate to follow-up questions screen
    } else if (data?.type === 'daily_reminder') {
      console.log('Log reminder notification tapped:', data);
      // Navigate to symptoms screen

    } else if (data?.type === 'new_log') {
      console.log('New log notification tapped:', data);
      // Navigate to symptoms screen
    }
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}; 