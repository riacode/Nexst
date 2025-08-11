import * as Notifications from 'expo-notifications';

// ============================================================================
// NOTIFICATION UTILS - Handle app notifications
// ============================================================================

/**
 * Configure notification behavior
 */
export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Handle different notification types
      const { data } = notification.request.content;
      
      if (data?.type === 'daily_reminder') {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false, // Daily reminders should NOT affect badge count
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }
      
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }
    
    console.log('Notification permission status:', finalStatus);
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Get current badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * Increment badge count
 */
export const incrementBadgeCount = async (): Promise<void> => {
  try {
    const currentCount = await getBadgeCount();
    const newCount = currentCount + 1;
    await setBadgeCount(newCount);
    console.log('✅ Badge count incremented from', currentCount, 'to', newCount);
  } catch (error) {
    console.error('Error incrementing badge count:', error);
  }
};

/**
 * Clear badge count
 */
export const clearBadgeCount = async (): Promise<void> => {
  try {
    await setBadgeCount(0);
  } catch (error) {
    console.error('Error clearing badge count:', error);
  }
};

/**
 * Send notification for new recommendations
 */
export const sendRecommendationNotification = async (recommendationTitle: string, symptomsAddressed: string[]) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    const symptomsText = symptomsAddressed.length > 0 
      ? `Addresses: ${symptomsAddressed.join(', ')}`
      : '';

    // Get current badge count and increment it
    const currentBadgeCount = await getBadgeCount();
    const newBadgeCount = currentBadgeCount + 1;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Health Recommendation',
        body: `${recommendationTitle}${symptomsText ? `\n${symptomsText}` : ''}`,
        data: { type: 'recommendation' },
        badge: newBadgeCount, // Set the new badge count
      },
      trigger: null, // Send immediately
    });
    
    // Update the badge count to ensure consistency
    await setBadgeCount(newBadgeCount);
    console.log('✅ Recommendation notification sent with badge count:', newBadgeCount);
  } catch (error) {
    console.error('Error sending recommendation notification:', error);
  }
};

/**
 * Send notification for new follow-up questions
 */
export const sendFollowUpQuestionNotification = async (questionCount: number) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    const body = questionCount === 1 
      ? 'You have a new follow-up question about your health.'
      : `You have ${questionCount} new follow-up questions about your health.`;

    // Get current badge count and increment it
    const currentBadgeCount = await getBadgeCount();
    const newBadgeCount = currentBadgeCount + 1;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Follow-up Questions',
        body,
        data: { type: 'follow_up_questions' },
        badge: newBadgeCount, // Set the new badge count
      },
      trigger: null, // Send immediately
    });
    
    // Update the badge count to ensure consistency
    await setBadgeCount(newBadgeCount);
    console.log('✅ Follow-up question notification sent with badge count:', newBadgeCount);
  } catch (error) {
    console.error('Error sending follow-up question notification:', error);
  }
};

/**
 * Send daily reminder notification
 */
export const sendDailyReminderNotification = async (time: Date, enabled: boolean) => {
  try {
    if (!enabled) {
      // Cancel existing daily reminder if disabled
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Daily reminder notifications disabled');
      return;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    // Cancel existing daily reminders
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Calculate next occurrence of the specified time
    const now = new Date();
    let nextReminder = new Date();
    nextReminder.setHours(time.getHours(), time.getMinutes(), 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }
    
    console.log('Current time:', now.toLocaleTimeString());
    console.log('Next reminder scheduled for:', nextReminder.toLocaleTimeString());

    // Use only the recurring trigger for better precision and to prevent duplicates
    const recurringTrigger = {
      hour: time.getHours(),
      minute: time.getMinutes(),
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Health Check-in',
        body: 'Time to record your daily symptom log. Tap to open Nexst.',
        data: { type: 'daily_reminder' },
        badge: 0, // No badge increment for reminders
      },
      trigger: recurringTrigger,
    });
    
    console.log('✅ Daily reminder notifications scheduled:');
    console.log('  - Recurring reminders:', notificationId, 'starting daily at', time.toLocaleTimeString());
    console.log('  - Next reminder will be at:', nextReminder.toLocaleTimeString());
  } catch (error) {
    console.error('Error scheduling daily reminder notification:', error);
  }
};

/**
 * Send general health notification
 */
export const sendHealthNotification = async (title: string, body: string, data?: any) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    // Get current badge count and increment it
    const currentBadgeCount = await getBadgeCount();
    const newBadgeCount = currentBadgeCount + 1;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        badge: newBadgeCount,
      },
      trigger: null, // Send immediately
    });
    
    // Update the badge count
    await setBadgeCount(newBadgeCount);
    console.log('✅ Health notification sent with badge count:', newBadgeCount);
  } catch (error) {
    console.error('Error sending health notification:', error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Cancel specific notification by ID
 */
export const cancelNotification = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('✅ Notification cancelled:', notificationId);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All scheduled notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

/**
 * Synchronize badge count with actual notification count
 * This ensures the badge count accurately reflects the number of actionable notifications
 */
export const synchronizeBadgeCount = async (): Promise<void> => {
  try {
    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Count only actionable notifications (exclude daily reminders)
    const actionableCount = scheduledNotifications.filter(notification => {
      const { data } = notification.content;
      return data?.type !== 'daily_reminder';
    }).length;
    
    // Update badge count to match
    await setBadgeCount(actionableCount);
    console.log('✅ Badge count synchronized:', actionableCount);
  } catch (error) {
    console.error('Error synchronizing badge count:', error);
  }
};

/**
 * Get notification permissions status
 */
export const getNotificationPermissionsStatus = async () => {
  try {
    return await Notifications.getPermissionsAsync();
  } catch (error) {
    console.error('Error getting notification permissions status:', error);
    return { status: 'undetermined' as const };
  }
}; 