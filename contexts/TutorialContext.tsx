import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const defaultTutorialState: TutorialState = {
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
  const [tutorialState, setTutorialState] = useState<TutorialState>(defaultTutorialState);

  // Load tutorial state from storage
  useEffect(() => {
    const loadTutorialState = async () => {
      try {
        const stored = await AsyncStorage.getItem('tutorialState');
        if (stored) {
          const parsed = JSON.parse(stored);
          setTutorialState({ ...defaultTutorialState, ...parsed });
        }
      } catch (error) {
        console.error('Error loading tutorial state:', error);
      }
    };

    loadTutorialState();
  }, []);

  // Save tutorial state to storage
  const saveTutorialState = async (state: TutorialState) => {
    try {
      await AsyncStorage.setItem('tutorialState', JSON.stringify(state));
      setTutorialState(state);
    } catch (error) {
      console.error('Error saving tutorial state:', error);
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
    await saveTutorialState(defaultTutorialState);
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