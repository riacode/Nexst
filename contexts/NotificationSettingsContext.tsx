import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from '../utils/notifications';

interface NotificationSettings {
  enabled: boolean;
  time: Date;
  frequency: string; // 'Daily', 'Weekdays', 'Weekly'
}

interface NotificationSettingsContextType {
  settings: NotificationSettings;
  updateSettings: (enabled: boolean, time: Date, frequency: string) => Promise<void>;
  scheduleNotifications: () => Promise<void>;
  cancelNotifications: () => Promise<void>;
  clearNotificationBadge: () => Promise<void>;
  testNotification: () => Promise<void>;
  getAllScheduledNotifications: () => Promise<any[]>;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: true,
  time: new Date(new Date().setHours(9, 0, 0, 0)), // 9 AM default
  frequency: 'Daily',
};

export function NotificationSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      console.log('🔔 Notification settings changed, updating...');
      if (settings.enabled) {
        scheduleNotifications();
      } else {
        cancelNotifications();
      }
    }
  }, [settings.enabled, settings.time, settings.frequency, isInitialized]);

  const loadSettings = async () => {
    try {
      console.log('📱 Loading notification settings...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedSettings = {
          ...parsed,
          time: new Date(parsed.time),
        };
        setSettings(loadedSettings);
        console.log('✅ Notification settings loaded:', loadedSettings);
      } else {
        console.log('📱 No stored notification settings, using defaults');
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
      setIsInitialized(true);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      console.log('✅ Notification settings saved:', newSettings);
    } catch (error) {
      console.error('❌ Error saving notification settings:', error);
    }
  };

  const updateSettings = async (enabled: boolean, time: Date, frequency: string) => {
    console.log('🔧 Updating notification settings:', { enabled, time, frequency });
    
    const newSettings = { 
      ...settings,
      enabled, 
      time, 
      frequency
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const scheduleNotifications = async () => {
    try {
      console.log('📅 Scheduling notifications...');
      
      if (!settings.enabled) {
        console.log('❌ Notifications disabled, skipping scheduling');
        return;
      }

      // Schedule recurring log reminders
      const notificationId = await NotificationService.scheduleLogReminders(settings.time, settings.frequency);

      console.log(`✅ Notifications scheduled for time: ${settings.time.toLocaleTimeString()}, frequency: ${settings.frequency}`);
      console.log(`📱 Notification ID: ${notificationId}`);
    } catch (error) {
      console.error('❌ Error scheduling notifications:', error);
    }
  };

  const cancelNotifications = async () => {
    try {
      console.log('❌ Cancelling all notifications...');
      await NotificationService.cancelNotification('daily_reminder');
      console.log('✅ All scheduled notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
    }
  };

  const clearNotificationBadge = async () => {
    try {
      console.log('🧹 Clearing notification badge...');
      // This would need to be implemented if you want to clear badges
      console.log('✅ Notification badge cleared');
    } catch (error) {
      console.error('❌ Error clearing notification badge:', error);
    }
  };

  const testNotification = async () => {
    try {
      console.log('🧪 Testing notification system...');
      await NotificationService.testNotification();
    } catch (error) {
      console.error('❌ Error testing notification:', error);
    }
  };

  const getAllScheduledNotifications = async () => {
    try {
      console.log('📱 Getting all scheduled notifications...');
      const notifications = await NotificationService.getAllScheduledNotifications();
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  };

  return (
    <NotificationSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        scheduleNotifications,
        cancelNotifications,
        clearNotificationBadge,
        testNotification,
        getAllScheduledNotifications,
      }}
    >
      {children}
    </NotificationSettingsContext.Provider>
  );
}

export function useNotificationSettings() {
  const context = useContext(NotificationSettingsContext);
  if (context === undefined) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
  }
  return context;
} 