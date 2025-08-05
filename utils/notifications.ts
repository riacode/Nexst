import * as Notifications from 'expo-notifications';

// ============================================================================
// NOTIFICATION UTILS - Handle app notifications
// ============================================================================

/**
 * Configure notification behavior
 */
export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
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
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
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

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Health Recommendation',
        body: `${recommendationTitle}${symptomsText ? `\n${symptomsText}` : ''}`,
        data: { type: 'recommendation' },
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ Recommendation notification sent');
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

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Follow-up Questions',
        body,
        data: { type: 'follow_up_questions' },
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ Follow-up question notification sent');
  } catch (error) {
    console.error('Error sending follow-up question notification:', error);
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

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ Health notification sent');
  } catch (error) {
    console.error('Error sending health notification:', error);
  }
}; 