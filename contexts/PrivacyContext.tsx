import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySettings {
  aiProcessingEnabled: boolean;
  dataSharingEnabled: boolean;
  analyticsEnabled: boolean;
  lastPrivacyUpdate: Date | null;
  dataRetentionDays: number;
  encryptionEnabled: boolean;
}

interface PrivacyContextType {
  privacySettings: PrivacySettings;
  toggleAIProcessing: () => Promise<void>;
  toggleDataSharing: () => Promise<void>;
  toggleAnalytics: () => Promise<void>;
  updateDataRetention: (days: number) => Promise<void>;
  exportUserData: () => Promise<string>;
  deleteAllData: () => Promise<void>;
  resetPrivacySettings: () => Promise<void>;
}

const defaultPrivacySettings: PrivacySettings = {
  aiProcessingEnabled: true,
  dataSharingEnabled: false,
  analyticsEnabled: false,
  lastPrivacyUpdate: null,
  dataRetentionDays: 365, // 1 year
  encryptionEnabled: true,
};

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};

interface PrivacyProviderProps {
  children: ReactNode;
}

export const PrivacyProvider: React.FC<PrivacyProviderProps> = ({ children }) => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(defaultPrivacySettings);

  // Load privacy settings from storage
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const stored = await AsyncStorage.getItem('privacySettings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setPrivacySettings({
            ...parsed,
            lastPrivacyUpdate: parsed.lastPrivacyUpdate ? new Date(parsed.lastPrivacyUpdate) : null,
          });
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      }
    };

    loadPrivacySettings();
  }, []);

  // Save privacy settings to storage
  const savePrivacySettings = async (settings: PrivacySettings) => {
    try {
      await AsyncStorage.setItem('privacySettings', JSON.stringify(settings));
      setPrivacySettings(settings);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };



  const toggleAIProcessing = async () => {
    const updated = {
      ...privacySettings,
      aiProcessingEnabled: !privacySettings.aiProcessingEnabled,
    };
    await savePrivacySettings(updated);
  };

  const toggleDataSharing = async () => {
    const updated = {
      ...privacySettings,
      dataSharingEnabled: !privacySettings.dataSharingEnabled,
    };
    await savePrivacySettings(updated);
  };

  const toggleAnalytics = async () => {
    const updated = {
      ...privacySettings,
      analyticsEnabled: !privacySettings.analyticsEnabled,
    };
    await savePrivacySettings(updated);
  };

  const updateDataRetention = async (days: number) => {
    const updated = {
      ...privacySettings,
      dataRetentionDays: days,
    };
    await savePrivacySettings(updated);
  };

  const exportUserData = async (): Promise<string> => {
    try {
      // Get all user data from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const data: Record<string, any> = {};
      
      for (const key of keys) {
        if (key !== 'privacySettings') { // Don't include privacy settings in export
          const value = await AsyncStorage.getItem(key);
          if (value) {
            data[key] = JSON.parse(value);
          }
        }
      }

      // Add export metadata
      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        dataTypes: Object.keys(data),
        userData: data,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  };

  const deleteAllData = async () => {
    try {
      // Get all keys except privacy settings
      const keys = await AsyncStorage.getAllKeys();
      const keysToDelete = keys.filter(key => key !== 'privacySettings');
      
      // Delete all user data
      await AsyncStorage.multiRemove(keysToDelete);
      
      // Reset privacy settings to defaults
      await savePrivacySettings(defaultPrivacySettings);
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Failed to delete user data');
    }
  };

  const resetPrivacySettings = async () => {
    await savePrivacySettings(defaultPrivacySettings);
  };

  return (
    <PrivacyContext.Provider value={{
      privacySettings,
      toggleAIProcessing,
      toggleDataSharing,
      toggleAnalytics,
      updateDataRetention,
      exportUserData,
      deleteAllData,
      resetPrivacySettings,
    }}>
      {children}
    </PrivacyContext.Provider>
  );
}; 