import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MedicalRecommendation } from '../types/recommendations';
import { useNotificationSettings } from './NotificationSettingsContext';
import { sendRecommendationAlert } from '../utils/notifications';

// ============================================================================
// RECOMMENDATIONS CONTEXT - Manages AI-Generated Health Recommendations
// ============================================================================

interface RecommendationsContextType {
  recommendations: MedicalRecommendation[];
  addRecommendations: (newRecommendations: MedicalRecommendation[]) => void;
  updateRecommendation: (id: string, updates: Partial<MedicalRecommendation>) => void;
  completeRecommendation: (id: string) => void;
  cancelRecommendation: (id: string) => void;
  toggleActionItem: (recommendationId: string, actionItemIndex: number) => void;
  clearRecommendations: () => void;
  isLoading: boolean;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

interface RecommendationsProviderProps {
  children: ReactNode;
}

export const RecommendationsProvider: React.FC<RecommendationsProviderProps> = ({ children }) => {
  const [recommendations, setRecommendations] = useState<MedicalRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useNotificationSettings();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadRecommendations();
  }, []);

  /**
   * Load recommendations from AsyncStorage
   */
  const loadRecommendations = async () => {
    try {
      const storedRecommendations = await AsyncStorage.getItem('recommendations_default-user');
      if (storedRecommendations) {
        const parsedRecommendations = JSON.parse(storedRecommendations);
        setRecommendations(parsedRecommendations);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save recommendations to AsyncStorage
   */
  const saveRecommendations = async (newRecommendations: MedicalRecommendation[]) => {
    try {
      await AsyncStorage.setItem('recommendations_default-user', JSON.stringify(newRecommendations));
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  };

  // ============================================================================
  // RECOMMENDATION MANAGEMENT
  // ============================================================================

  /**
   * Add new recommendations and send notifications
   */
  const addRecommendations = (newRecommendations: MedicalRecommendation[]) => {
    setRecommendations(prev => {
      const updatedRecommendations = [...prev, ...newRecommendations];
      saveRecommendations(updatedRecommendations);
      return updatedRecommendations;
    });

    // Send notification alerts for new recommendations
    if (settings.enabled && settings.recommendationAlerts) {
      newRecommendations.forEach(recommendation => {
        sendRecommendationAlert(recommendation.title);
      });
    }
  };

  /**
   * Update a specific recommendation
   */
  const updateRecommendation = (id: string, updates: Partial<MedicalRecommendation>) => {
    setRecommendations(prev => {
      const updatedRecommendations = prev.map(rec =>
        rec.id === id ? { ...rec, ...updates } : rec
      );
      saveRecommendations(updatedRecommendations);
      return updatedRecommendations;
    });
  };

  /**
   * Mark a recommendation as completed
   */
  const completeRecommendation = (id: string) => {
    updateRecommendation(id, { isCompleted: true });
  };

  /**
   * Cancel a recommendation
   */
  const cancelRecommendation = (id: string) => {
    updateRecommendation(id, { isCancelled: true });
  };

  /**
   * Toggle an action item within a recommendation
   */
  const toggleActionItem = (recommendationId: string, actionItemIndex: number) => {
    setRecommendations(prev => {
      const updatedRecommendations = prev.map(rec => {
        if (rec.id === recommendationId) {
          const updatedActionItems = [...rec.actionItems];
                     updatedActionItems[actionItemIndex] = {
             ...updatedActionItems[actionItemIndex],
             isCompleted: !updatedActionItems[actionItemIndex].isCompleted
           };
          return { ...rec, actionItems: updatedActionItems };
        }
        return rec;
      });
      saveRecommendations(updatedRecommendations);
      return updatedRecommendations;
    });
  };

  /**
   * Clear all recommendations
   */
  const clearRecommendations = async () => {
    try {
      await AsyncStorage.removeItem('recommendations_default-user');
      setRecommendations([]);
    } catch (error) {
      console.error('Error clearing recommendations:', error);
    }
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: RecommendationsContextType = {
    recommendations,
    addRecommendations,
    updateRecommendation,
    completeRecommendation,
    cancelRecommendation,
    toggleActionItem,
    clearRecommendations,
    isLoading,
  };

  return (
    <RecommendationsContext.Provider value={contextValue}>
      {children}
    </RecommendationsContext.Provider>
  );
};

/**
 * Hook to use recommendations context
 */
export const useRecommendations = (): RecommendationsContextType => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
}; 