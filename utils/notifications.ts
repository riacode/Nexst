import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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
    }
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}; 