import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageManager } from '../utils/storage';
import { ValidationUtils } from '../utils/validation';
import { useOnboarding } from './OnboardingContext';

interface TutorialState {
  hasSeenOnboarding: boolean;
  hasSeenSymptomTutorial: boolean;
  hasSeenRecommendationTutorial: boolean;
  hasSeenAppointmentTutorial: boolean;
  showOnboardingTutorial: boolean;
}

interface TutorialContextType {
  tutorialState: TutorialState;
  completeOnboarding: () => Promise<void>;
  completeSymptomTutorial: () => Promise<void>;
  completeRecommendationTutorial: () => Promise<void>;
  completeAppointmentTutorial: () => Promise<void>;
  showOnboardingTutorial: () => Promise<void>;
  hideOnboardingTutorial: () => Promise<void>;
  resetTutorials: () => Promise<void>;
}

const DEFAULT_TUTORIAL_STATE: TutorialState = {
  hasSeenOnboarding: false,
  hasSeenSymptomTutorial: false,
  hasSeenRecommendationTutorial: false,
  hasSeenAppointmentTutorial: false,
  showOnboardingTutorial: false,
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [tutorialState, setTutorialState] = useState<TutorialState>(DEFAULT_TUTORIAL_STATE);
  const { resetOnboarding } = useOnboarding();

  // Load tutorial state from encrypted storage
  useEffect(() => {
    const loadTutorialState = async () => {
      try {
        const stored = await StorageManager.load<TutorialState>('tutorialState');
        if (stored) {
          // Validate tutorial state before setting
          const validation = ValidationUtils.validateTutorialState(stored);
          if (validation.isValid) {
            setTutorialState(stored);
          } else {
            console.warn('Invalid tutorial state found:', validation.errors);
            setTutorialState(DEFAULT_TUTORIAL_STATE);
          }
        }
      } catch (error) {
        console.error('Error loading encrypted tutorial state:', error);
        setTutorialState(DEFAULT_TUTORIAL_STATE);
      }
    };

    loadTutorialState();
  }, []);

  // Save tutorial state to encrypted storage
  const saveTutorialState = async (state: TutorialState) => {
    try {
      // Validate state before storage
      const validation = ValidationUtils.validateTutorialState(state);
      if (!validation.isValid) {
        throw new Error(`Invalid tutorial state: ${validation.errors.join(', ')}`);
      }

      setTutorialState(state);
      
      // Save to encrypted storage
      await StorageManager.save('tutorialState', state);
    } catch (error) {
      console.error('Error saving encrypted tutorial state:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    const updated = {
      ...tutorialState,
      hasSeenOnboarding: true,
      showOnboardingTutorial: false,
    };
    await saveTutorialState(updated);
  };

  const completeSymptomTutorial = async () => {
    const updated = {
      ...tutorialState,
      hasSeenSymptomTutorial: true,
    };
    await saveTutorialState(updated);
  };

  const completeRecommendationTutorial = async () => {
    const updated = {
      ...tutorialState,
      hasSeenRecommendationTutorial: true,
    };
    await saveTutorialState(updated);
  };

  const completeAppointmentTutorial = async () => {
    const updated = {
      ...tutorialState,
      hasSeenAppointmentTutorial: true,
    };
    await saveTutorialState(updated);
  };

  const showOnboardingTutorial = async () => {
    const updated = {
      ...tutorialState,
      showOnboardingTutorial: true,
    };
    await saveTutorialState(updated);
  };

  const hideOnboardingTutorial = async () => {
    const updated = {
      ...tutorialState,
      showOnboardingTutorial: false,
    };
    await saveTutorialState(updated);
  };

  const resetTutorials = async () => {
    await saveTutorialState(DEFAULT_TUTORIAL_STATE);
    await resetOnboarding();
  };

  return (
    <TutorialContext.Provider value={{
      tutorialState,
      completeOnboarding,
      completeSymptomTutorial,
      completeRecommendationTutorial,
      completeAppointmentTutorial,
      showOnboardingTutorial,
      hideOnboardingTutorial,
      resetTutorials,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}; 