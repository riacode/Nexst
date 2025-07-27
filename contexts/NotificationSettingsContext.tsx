import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface NotificationSettings {
  enabled: boolean;
  time: Date;
  frequency: string; // 'Daily', 'Weekdays', 'Weekly'
  priority: string; // 'normal', 'high'
  lockScreenProminent: boolean;
}

interface NotificationSettingsContextType {
  settings: NotificationSettings;
  updateSettings: (enabled: boolean, time: Date, frequency: string, priority?: string, lockScreenProminent?: boolean) => Promise<void>;
  scheduleDailyReminder: () => Promise<void>;
  cancelDailyReminder: () => Promise<void>;
  clearNotificationBadge: () => Promise<void>;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: false,
  time: new Date(new Date().setHours(18, 0, 0, 0)), // 6 PM default
  frequency: 'Daily',
  priority: 'high',
  lockScreenProminent: true
};

export function NotificationSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.enabled) {
      scheduleDailyReminder();
    } else {
      cancelDailyReminder();
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          ...parsed,
          time: new Date(parsed.time)
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

  const updateSettings = async (enabled: boolean, time: Date, frequency: string, priority?: string, lockScreenProminent?: boolean) => {
    const newSettings = { 
      enabled, 
      time, 
      frequency, 
      priority: priority || settings.priority,
      lockScreenProminent: lockScreenProminent !== undefined ? lockScreenProminent : settings.lockScreenProminent
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const scheduleDailyReminder = async () => {
    try {
      // Cancel existing reminders first
      await cancelDailyReminder();

      if (!settings.enabled) return;

      // Calculate trigger time
      const now = new Date();
      const triggerTime = new Date(settings.time);
      triggerTime.setDate(now.getDate());
      triggerTime.setMonth(now.getMonth());
      triggerTime.setFullYear(now.getFullYear());

      // If time has passed today, schedule for tomorrow
      if (triggerTime <= now) {
        triggerTime.setDate(triggerTime.getDate() + 1);
      }

      // Create trigger based on frequency
      let trigger: any;
      
      if (settings.frequency === 'Daily') {
        trigger = {
          hour: triggerTime.getHours(),
          minute: triggerTime.getMinutes(),
          repeats: true,
        };
      } else if (settings.frequency === 'Weekdays') {
        trigger = {
          hour: triggerTime.getHours(),
          minute: triggerTime.getMinutes(),
          weekday: 1, // Monday
          repeats: true,
        };
      } else if (settings.frequency === 'Weekly') {
        trigger = {
          hour: triggerTime.getHours(),
          minute: triggerTime.getMinutes(),
          weekday: 1, // Monday
          repeats: true,
        };
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📝 Time to Log Your Symptoms",
          body: "Tap to quickly record how you're feeling today. Your health insights matter!",
          data: { type: 'daily_reminder' },
          sound: 'default',
          priority: settings.priority as any,
          badge: 1,
          // iOS specific settings for lock screen prominence
          ...(Platform.OS === 'ios' && {
            categoryIdentifier: 'daily_reminder',
            threadIdentifier: 'health_logging',
          }),
        },
        trigger,
        identifier: 'daily_reminder',
      });

      console.log('Daily reminder scheduled for:', triggerTime.toLocaleString());
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  };

  const cancelDailyReminder = async () => {
    try {
      await Notifications.cancelScheduledNotificationAsync('daily_reminder');
      console.log('Daily reminder cancelled');
    } catch (error) {
      console.error('Error cancelling daily reminder:', error);
    }
  };

  const clearNotificationBadge = async () => {
    try {
      await Notifications.setBadgeCountAsync(0);
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
        scheduleDailyReminder,
        cancelDailyReminder,
        clearNotificationBadge,
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