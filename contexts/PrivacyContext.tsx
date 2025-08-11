import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageManager } from '../utils/storage';
import { ValidationUtils } from '../utils/validation';

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

  // Load privacy settings from encrypted storage
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const stored = await StorageManager.load<PrivacySettings>('privacySettings');
        if (stored) {
          // Fix any corrupted data first
          const fixedSettings = ValidationUtils.fixCorruptedDates(stored);
          
          // Validate privacy settings before setting state
          const validation = ValidationUtils.validatePrivacySettings(fixedSettings);
          if (validation.isValid) {
            setPrivacySettings(fixedSettings);
          } else {
            console.warn('Invalid privacy settings found:', validation.errors);
            setPrivacySettings(defaultPrivacySettings);
          }
        }
      } catch (error) {
        console.error('Error loading encrypted privacy settings:', error);
        setPrivacySettings(defaultPrivacySettings);
      }
    };

    loadPrivacySettings();
  }, []);

  const updatePrivacySettings = async (newSettings: Partial<PrivacySettings>) => {
    try {
      const updatedSettings = { ...privacySettings, ...newSettings };
      
      // Validate settings before storage
      const validation = ValidationUtils.validatePrivacySettings(updatedSettings);
      if (!validation.isValid) {
        throw new Error(`Invalid privacy settings: ${validation.errors.join(', ')}`);
      }

      setPrivacySettings(updatedSettings);
      
      // Save to encrypted storage
      await StorageManager.save('privacySettings', updatedSettings);
    } catch (error) {
      console.error('Error saving encrypted privacy settings:', error);
      throw error;
    }
  };

  // Get all user data from encrypted storage
  const getAllUserData = async () => {
    try {
      const keys = await StorageManager.getAllKeys();
      const data: { [key: string]: any } = {};
      
      for (const key of keys) {
        const value = await StorageManager.load(key);
        data[key] = value;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading encrypted user data:', error);
      return {};
    }
  };

  // Delete all user data from encrypted storage
  const deleteAllUserData = async () => {
    try {
      const keys = await StorageManager.getAllKeys();
      const keysToDelete = keys.filter(key => 
        key !== 'privacySettings' && 
        key !== 'onboardingComplete'
      );
      
      await StorageManager.multiRemove(keysToDelete);
      console.log('✅ All user data deleted from encrypted storage');
    } catch (error) {
      console.error('Error deleting encrypted user data:', error);
      throw error;
    }
  };

  const toggleAIProcessing = async () => {
    const updated = {
      ...privacySettings,
      aiProcessingEnabled: !privacySettings.aiProcessingEnabled,
    };
    await updatePrivacySettings(updated);
  };

  const toggleDataSharing = async () => {
    const updated = {
      ...privacySettings,
      dataSharingEnabled: !privacySettings.dataSharingEnabled,
    };
    await updatePrivacySettings(updated);
  };

  const toggleAnalytics = async () => {
    const updated = {
      ...privacySettings,
      analyticsEnabled: !privacySettings.analyticsEnabled,
    };
    await updatePrivacySettings(updated);
  };

  const updateDataRetention = async (days: number) => {
    const updated = {
      ...privacySettings,
      dataRetentionDays: days,
    };
    await updatePrivacySettings(updated);
  };

  const exportUserData = async (): Promise<string> => {
    try {
      // Get all user data from encrypted storage
      const data = await getAllUserData();

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
      await deleteAllUserData();
      // Reset privacy settings to defaults
      await updatePrivacySettings(defaultPrivacySettings);
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Failed to delete user data');
    }
  };

  const resetPrivacySettings = async () => {
    await updatePrivacySettings(defaultPrivacySettings);
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