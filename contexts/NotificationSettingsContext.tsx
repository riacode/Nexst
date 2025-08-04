import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NotificationSettings, 
  defaultNotificationSettings,
  scheduleDailyReminder,
  cancelAllNotifications,
  requestNotificationPermissions
} from '../utils/notifications';

// ============================================================================
// NOTIFICATION SETTINGS CONTEXT - Manages Notification Preferences
// ============================================================================

interface NotificationSettingsContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  isInitialized: boolean;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

interface NotificationSettingsProviderProps {
  children: ReactNode;
}

export const NotificationSettingsProvider: React.FC<NotificationSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load notification settings from AsyncStorage
   */
  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('notificationSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...defaultNotificationSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  /**
   * Save notification settings to AsyncStorage
   */
  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  /**
   * Update notification settings
   */
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    
    // Save to storage
    await saveSettings(updatedSettings);
    
    // Handle daily reminder scheduling
    if (newSettings.dailyReminderTime !== undefined || newSettings.dailyReminderEnabled !== undefined) {
      if (updatedSettings.enabled && updatedSettings.dailyReminderEnabled) {
        await scheduleDailyReminder(updatedSettings.dailyReminderTime, true);
      } else {
        await scheduleDailyReminder(updatedSettings.dailyReminderTime, false);
      }
    }
    
    // Handle global enable/disable
    if (newSettings.enabled !== undefined) {
      if (!updatedSettings.enabled) {
        await cancelAllNotifications();
      } else if (updatedSettings.dailyReminderEnabled) {
        await scheduleDailyReminder(updatedSettings.dailyReminderTime, true);
      }
    }
  };

  /**
   * Reset notification settings to defaults
   */
  const resetSettings = async () => {
    await saveSettings(defaultNotificationSettings);
    await scheduleDailyReminder(defaultNotificationSettings.dailyReminderTime, true);
  };

  /**
   * Request notification permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    if (granted && settings.enabled && settings.dailyReminderEnabled) {
      await scheduleDailyReminder(settings.dailyReminderTime, true);
    }
    return granted;
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: NotificationSettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    requestPermissions,
    isInitialized,
  };

  return (
    <NotificationSettingsContext.Provider value={contextValue}>
      {children}
    </NotificationSettingsContext.Provider>
  );
};

/**
 * Hook to use notification settings
 */
export const useNotificationSettings = (): NotificationSettingsContextType => {
  const context = useContext(NotificationSettingsContext);
  if (context === undefined) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
  }
  return context;
}; 