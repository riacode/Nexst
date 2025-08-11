import { StorageManager } from './storage';

export const clearAllStoredData = async () => {
  try {
    // Clear all encrypted data through StorageManager
    await StorageManager.clear();
    console.log('✅ All encrypted stored data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing encrypted stored data:', error);
  }
};

export const clearOnboardingData = async () => {
  try {
    // Clear specific onboarding keys through StorageManager
    const keysToRemove = [
      'hasSeenOnboarding',
      'tutorialState',
      'symptomLogs',
      'recommendations',
      'appointments',
      'followUpQuestions',
      'privacySettings',
      'smartAIContext',
    ];
    await StorageManager.multiRemove(keysToRemove);
    console.log('✅ Onboarding encrypted data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing onboarding encrypted data:', error);
  }
};

export const logStoredData = async () => {
  try {
    const keys = await StorageManager.getAllKeys();
    const data: { [key: string]: any } = {};
    
    for (const key of keys) {
      const value = await StorageManager.load(key);
      data[key] = value;
    }
    
    console.log('📱 Current encrypted stored data:', data);
  } catch (error) {
    console.error('❌ Error reading encrypted stored data:', error);
  }
}; 