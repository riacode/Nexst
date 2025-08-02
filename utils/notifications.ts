import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior for iOS
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
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission denied');
        return false;
      }
      
      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // ============================================================================
  // SIMPLIFIED NOTIFICATION SYSTEM
  // ============================================================================

  // 1. Schedule daily log reminders at exact time
  static async scheduleLogReminders(time: Date, frequency: string = 'Daily') {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ No notification permission for scheduling reminders');
        return;
      }

      // Cancel any existing reminders
      await this.cancelNotification('daily_reminder');

      const triggerTime = new Date(time);
      
      // Create proper trigger based on frequency
      let trigger: any;
      
      if (frequency === 'Daily') {
        trigger = {
          hour: triggerTime.getHours(),
          minute: triggerTime.getMinutes(),
          repeats: true,
        };
      } else if (frequency === 'Weekdays') {
        // For weekdays, schedule Monday through Friday
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

      console.log('📅 Scheduling daily reminder with trigger:', trigger);

      // Schedule daily reminder
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to Log Your Symptoms",
          body: "Tap to quickly record how you're feeling today.",
          data: { type: 'daily_reminder' },
          sound: 'default',
          // iOS-specific configuration for lock screen pinning
          ...(Platform.OS === 'ios' && {
            priority: 'high',
            categoryIdentifier: 'high_priority'
          })
        },
        trigger,
        identifier: 'daily_reminder',
      });

      console.log(`✅ ${frequency} reminders scheduled for: ${triggerTime.toLocaleTimeString()}`);
      console.log(`📱 Notification ID: ${notificationId}`);
      
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling log reminders:', error);
      throw error;
    }
  }

  // 2. New recommendation notification
  static async sendRecommendationNotification(recommendation: any) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ No notification permission for recommendation');
        return;
      }

      console.log('📱 Sending recommendation notification:', recommendation.title);
      
      await this.scheduleLocalNotification(
        'New Health Recommendation',
        `You have a new ${recommendation.priority.toLowerCase()} priority recommendation: ${recommendation.title}`,
        { 
          type: 'recommendation', 
          recommendationId: recommendation.id
        }
      );
    } catch (error) {
      console.error('❌ Error sending recommendation notification:', error);
    }
  }

  // 3. Follow-up question notification
  static async sendFollowUpQuestion(question: string, questionType: string) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ No notification permission for follow-up question');
        return;
      }

      console.log('📱 Sending follow-up question notification:', question);
      
      await this.scheduleLocalNotification(
        'Health Follow-up',
        question,
        { 
          type: 'follow_up_question', 
          questionType: questionType
        }
      );
    } catch (error) {
      console.error('❌ Error sending follow-up question notification:', error);
    }
  }



  // 6. Helper method to schedule immediate notifications
  static async scheduleLocalNotification(title: string, body: string, data?: any) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ No notification permission for local notification');
        return;
      }

      console.log('📱 Scheduling local notification:', title);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          // iOS-specific configuration for lock screen pinning
          ...(Platform.OS === 'ios' && {
            priority: 'high',
            categoryIdentifier: 'high_priority'
          })
        },
        trigger: null, // null means show immediately
      });

      console.log(`✅ Local notification scheduled with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling local notification:', error);
      throw error;
    }
  }

  // 7. Helper method to cancel all scheduled notifications
  static async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All scheduled notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

  // 8. Helper method to cancel specific notification types
  static async cancelNotification(identifier: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`✅ Notification ${identifier} cancelled`);
    } catch (error) {
      console.error(`❌ Error cancelling notification ${identifier}:`, error);
    }
  }

  // 9. Helper method to get all scheduled notifications (for debugging)
  static async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📱 All scheduled notifications:', notifications);
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  // 10. Helper method to test notification immediately
  static async testNotification() {
    try {
      console.log('🧪 Testing notification...');
      await this.scheduleLocalNotification(
        'Test Notification',
        'This is a test notification to verify the system is working.',
        { type: 'test' }
      );
      console.log('✅ Test notification sent successfully');
    } catch (error) {
      console.error('❌ Test notification failed:', error);
    }
  }
}

// Set up notification listeners
export const setupNotificationListeners = () => {
  console.log('🔔 Setting up notification listeners...');

  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notification received:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification response received:', response);
    
    const data = response.notification.request.content.data;
    
    if (data?.type === 'recommendation') {
      console.log('📋 Recommendation notification tapped:', data);
      // Navigate to recommendations screen
    } else if (data?.type === 'follow_up_question') {
      console.log('❓ Follow-up question notification tapped:', data);
      // Navigate to follow-up questions screen
    } else if (data?.type === 'daily_reminder') {
      console.log('📅 Log reminder notification tapped:', data);
      // Navigate to symptoms screen

    } else if (data?.type === 'test') {
      console.log('🧪 Test notification tapped:', data);
    }
  });

  console.log('✅ Notification listeners set up successfully');

  return () => {
    console.log('🧹 Cleaning up notification listeners...');
    notificationListener.remove();
    responseListener.remove();
  };
}; 