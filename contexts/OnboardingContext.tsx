import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageManager } from '../utils/storage';
import { ValidationUtils } from '../utils/validation';

interface OnboardingContextType {
  hasSeenOnboarding: boolean;
  markOnboardingComplete: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load onboarding status from encrypted storage
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        const onboardingComplete = await StorageManager.load<string>('onboardingComplete');
        if (onboardingComplete) {
          // Validate onboarding status
          const validation = ValidationUtils.validateRequired(onboardingComplete, 'onboardingComplete');
          if (validation.isValid) {
            setHasSeenOnboarding(true);
          } else {
            console.warn('Invalid onboarding status found:', validation.error);
            setHasSeenOnboarding(false);
          }
        }
      } catch (error) {
        console.error('Error loading encrypted onboarding status:', error);
        setHasSeenOnboarding(false);
      }
    };

    loadOnboardingStatus();
  }, []);

  const completeOnboarding = async () => {
    try {
      setHasSeenOnboarding(true);
      
      // Save to encrypted storage
      await StorageManager.save('onboardingComplete', 'true');
    } catch (error) {
      console.error('Error saving encrypted onboarding status:', error);
      throw error;
    }
  };

  const resetOnboarding = async () => {
    try {
      setHasSeenOnboarding(false);
      
      // Remove from encrypted storage
      await StorageManager.remove('onboardingComplete');
    } catch (error) {
      console.error('Error removing encrypted onboarding status:', error);
      throw error;
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <OnboardingContext.Provider value={{ hasSeenOnboarding, markOnboardingComplete: completeOnboarding, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}; 