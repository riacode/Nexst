import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageManager } from '../utils/storage';
import { ValidationUtils } from '../utils/validation';
import { 
  sendDailyReminderNotification, 
  clearBadgeCount, 
  getScheduledNotifications as getScheduledNotificationsUtil,
  cancelAllNotifications,
  getNotificationPermissionsStatus,
  synchronizeBadgeCount
} from '../utils/notifications';

// ============================================================================
// NOTIFICATION SETTINGS CONTEXT - Manage notification preferences
// ============================================================================

interface NotificationSettings {
  enabled: boolean;
  time: Date;
  frequency: 'Daily' | 'Weekdays' | 'Weekly';
  dailyReminderEnabled: boolean;
  dailyReminderTime: Date;
}

interface NotificationSettingsContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  updateDailyReminder: (enabled: boolean, time: Date) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getScheduledNotifications: () => Promise<any[]>;
  cancelAllScheduledNotifications: () => Promise<void>;
  checkPermissionsStatus: () => Promise<any>;
  synchronizeBadgeCount: () => Promise<void>;
  clearAllScheduledNotificationsAndBadge: () => Promise<void>;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

const NOTIFICATION_SETTINGS_KEY = '@nexst:notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: true,
  time: new Date(),
  frequency: 'Daily',
  dailyReminderEnabled: false, // Start with daily reminders disabled to prevent badge count issues
  dailyReminderTime: new Date(2024, 0, 1, 9, 0, 0), // 9:00 AM default
};

export const useNotificationSettings = () => {
  const context = useContext(NotificationSettingsContext);
  if (!context) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
  }
  return context;
};

interface NotificationSettingsProviderProps {
  children: ReactNode;
}

export const NotificationSettingsProvider: React.FC<NotificationSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  // Load notification settings from encrypted storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await StorageManager.load<NotificationSettings>(NOTIFICATION_SETTINGS_KEY);
        if (stored) {
          // Fix any corrupted date data first
          const fixedSettings = ValidationUtils.fixCorruptedDates(stored);
          
          // Validate settings before setting state
          const validation = ValidationUtils.validateNotificationSettings(fixedSettings);
          if (validation.isValid) {
            setSettings(fixedSettings);
          } else {
            console.warn('Invalid notification settings found:', validation.errors);
            // Use default settings if stored ones are invalid
            setSettings(defaultSettings);
          }
        }
      } catch (error) {
        console.error('Error loading encrypted notification settings:', error);
        setSettings(defaultSettings);
      }
    };

    loadSettings();
  }, []);



  // Save notification settings to encrypted storage
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Validate settings before storage
      const validation = ValidationUtils.validateNotificationSettings(updatedSettings);
      if (!validation.isValid) {
        throw new Error(`Invalid notification settings: ${validation.errors.join(', ')}`);
      }

      setSettings(updatedSettings);
      
      // Save to encrypted storage
      await StorageManager.save(NOTIFICATION_SETTINGS_KEY, updatedSettings);
      
      // Handle daily reminder scheduling
      if (updatedSettings.dailyReminderEnabled) {
        // Add delay to prevent immediate scheduling on app startup
        // and ensure the settings are properly saved first
        setTimeout(() => {
          sendDailyReminderNotification(updatedSettings.dailyReminderTime, true);
        }, 1000);
      } else {
        // Disable daily reminders
        sendDailyReminderNotification(updatedSettings.dailyReminderTime, false);
      }
    } catch (error) {
      console.error('Error saving encrypted notification settings:', error);
      throw error;
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    await updateSettings({ enabled });
  };

  const updateDailyReminder = async (enabled: boolean, time: Date) => {
    await updateSettings({ dailyReminderEnabled: enabled, dailyReminderTime: time });
  };

  const clearAllNotifications = async () => {
    try {
      await clearBadgeCount();
      // Also synchronize badge count to ensure consistency
      await synchronizeBadgeCount();
      console.log('✅ All notification badges cleared and synchronized');
    } catch (error) {
      console.error('Error clearing notification badges:', error);
    }
  };

  const getScheduledNotifications = async () => {
    try {
      return await getScheduledNotificationsUtil();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  const cancelAllScheduledNotifications = async () => {
    try {
      await cancelAllNotifications();
      console.log('✅ All scheduled notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all scheduled notifications:', error);
    }
  };

  const checkPermissionsStatus = async () => {
    try {
      return await getNotificationPermissionsStatus();
    } catch (error) {
      console.error('Error checking notification permissions status:', error);
      return { status: 'undetermined' as const };
    }
  };

  const clearAllScheduledNotificationsAndBadge = async () => {
    try {
      await cancelAllNotifications();
      await clearBadgeCount();
      await synchronizeBadgeCount();
      console.log('✅ All scheduled notifications cancelled and badges cleared/synchronized');
    } catch (error) {
      console.error('Error clearing all scheduled notifications and badges:', error);
    }
  };

  const value: NotificationSettingsContextType = {
    settings,
    updateSettings,
    toggleNotifications,
    updateDailyReminder,
    clearAllNotifications,
    getScheduledNotifications,
    cancelAllScheduledNotifications,
    checkPermissionsStatus,
    synchronizeBadgeCount,
    clearAllScheduledNotificationsAndBadge,
  };

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
}; 