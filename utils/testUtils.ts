import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllStoredData = async () => {
  try {
    // Clear all AsyncStorage data
    await AsyncStorage.clear();
    console.log('✅ All stored data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing stored data:', error);
  }
};

export const clearOnboardingData = async () => {
  try {
    // Clear only onboarding and tutorial data
    await AsyncStorage.multiRemove([
      'onboardingComplete',
      'tutorialState',
      'symptomLogs',
      'recommendations',
      'appointments',
      'notificationSettings',
      'privacySettings'
    ]);
    console.log('✅ Onboarding and tutorial data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing onboarding data:', error);
  }
};

export const logStoredData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const data: { [key: string]: any } = {};
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      data[key] = value;
    }
    
    console.log('📱 Current stored data:', data);
  } catch (error) {
    console.error('❌ Error reading stored data:', error);
  }
}; 