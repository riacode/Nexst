import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  sendDailyReminderNotification, 
  clearBadgeCount, 
  getScheduledNotifications,
  cancelAllNotifications,
  getNotificationPermissionsStatus
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
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

const NOTIFICATION_SETTINGS_KEY = '@nexst:notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: true,
  time: new Date(),
  frequency: 'Daily',
  dailyReminderEnabled: true,
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

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Apply daily reminder when settings change
  useEffect(() => {
    if (settings.dailyReminderEnabled) {
      sendDailyReminderNotification(settings.dailyReminderTime, true);
    } else {
      sendDailyReminderNotification(settings.dailyReminderTime, false);
    }
  }, [settings.dailyReminderEnabled, settings.dailyReminderTime]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert time strings back to Date objects
        parsed.time = new Date(parsed.time);
        parsed.dailyReminderTime = new Date(parsed.dailyReminderTime);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
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
      console.log('✅ All notification badges cleared');
    } catch (error) {
      console.error('Error clearing notification badges:', error);
    }
  };

  const getScheduledNotifications = async () => {
    try {
      return await getScheduledNotifications();
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

  const value: NotificationSettingsContextType = {
    settings,
    updateSettings,
    toggleNotifications,
    updateDailyReminder,
    clearAllNotifications,
    getScheduledNotifications,
    cancelAllScheduledNotifications,
    checkPermissionsStatus,
  };

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
}; 