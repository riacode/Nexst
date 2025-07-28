import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from '../utils/notifications';

interface NotificationSettings {
  enabled: boolean;
  time: Date;
  frequency: string; // 'Daily', 'Weekdays', 'Weekly'
  isNewUser: boolean; // Track if this is a new user
}

interface NotificationSettingsContextType {
  settings: NotificationSettings;
  updateSettings: (enabled: boolean, time: Date, frequency: string) => Promise<void>;
  scheduleNotifications: () => Promise<void>;
  cancelNotifications: () => Promise<void>;
  clearNotificationBadge: () => Promise<void>;
  handleNewUserSetup: () => Promise<void>;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: false,
  time: new Date(new Date().setHours(9, 0, 0, 0)), // 9 AM default
  frequency: 'Daily',
  isNewUser: true,
};

export function NotificationSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.enabled) {
      if (settings.isNewUser) {
        handleNewUserSetup();
      } else {
        scheduleNotifications();
      }
    } else {
      cancelNotifications();
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          ...parsed,
          time: new Date(parsed.time),
          isNewUser: parsed.isNewUser !== false // Default to true if not set
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const updateSettings = async (enabled: boolean, time: Date, frequency: string) => {
    const newSettings = { 
      ...settings,
      enabled, 
      time, 
      frequency,
      isNewUser: false // User has now configured settings
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleNewUserSetup = async () => {
    try {
      if (!settings.enabled) return;

      // Handle smart initial notification for new users
      await NotificationService.handleNewUserNotification(settings.time);
      
      // Mark user as no longer new
      const updatedSettings = { ...settings, isNewUser: false };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
      
      console.log('New user notification setup completed');
    } catch (error) {
      console.error('Error setting up new user notifications:', error);
    }
  };

  const scheduleNotifications = async () => {
    try {
      if (!settings.enabled) return;

      // Schedule recurring log reminders
      await NotificationService.scheduleLogReminders(settings.time, settings.frequency);

      console.log('Notifications scheduled for time:', settings.time.toLocaleString(), 'frequency:', settings.frequency);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const cancelNotifications = async () => {
    try {
      await NotificationService.cancelNotification('daily_reminder');
      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  };

  const clearNotificationBadge = async () => {
    try {
      // This would need to be implemented if you want to clear badges
      console.log('Notification badge cleared');
    } catch (error) {
      console.error('Error clearing notification badge:', error);
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
        handleNewUserSetup,
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