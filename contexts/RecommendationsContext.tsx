import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MedicalRecommendation } from '../types/recommendations';

interface RecommendationsContextType {
  recommendations: MedicalRecommendation[];
  addRecommendations: (newRecommendations: MedicalRecommendation[]) => void;
  updateRecommendation: (id: string, updates: Partial<MedicalRecommendation>) => void;
  completeRecommendation: (id: string) => void;
  cancelRecommendation: (id: string, reason: string) => void;
  toggleActionItem: (recommendationId: string, actionId: string) => void;
  clearAllRecommendations: () => void;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

const STORAGE_KEY = 'recommendations_default-user';

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
};

interface RecommendationsProviderProps {
  children: ReactNode;
}

export const RecommendationsProvider: React.FC<RecommendationsProviderProps> = ({ children }) => {
  const [recommendations, setRecommendations] = useState<MedicalRecommendation[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load recommendations from AsyncStorage on mount
  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      console.log('📱 Loading recommendations...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedRecommendations = parsed.map((rec: any) => ({
          ...rec,
          createdAt: new Date(rec.createdAt),
          completedAt: rec.completedAt ? new Date(rec.completedAt) : undefined,
          cancelledAt: rec.cancelledAt ? new Date(rec.cancelledAt) : undefined,
          actionItems: rec.actionItems.map((item: any) => ({
            ...item,
            completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined
          }))
        }));
        setRecommendations(loadedRecommendations);
        console.log('✅ Recommendations loaded:', loadedRecommendations.length);
      } else {
        console.log('📱 No stored recommendations, starting fresh');
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Error loading recommendations:', error);
      setIsInitialized(true);
    }
  };

  const saveRecommendations = async (newRecommendations: MedicalRecommendation[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRecommendations));
      console.log('✅ Recommendations saved:', newRecommendations.length);
    } catch (error) {
      console.error('❌ Error saving recommendations:', error);
    }
  };

  const addRecommendations = (newRecommendations: MedicalRecommendation[]) => {
    setRecommendations(prev => {
      // Filter out duplicates based on title and recent creation
      const existingTitles = prev.map(rec => rec.title);
      const uniqueNewRecommendations = newRecommendations.filter(
        newRec => !existingTitles.includes(newRec.title)
      );
      const updatedRecommendations = [...prev, ...uniqueNewRecommendations];
      saveRecommendations(updatedRecommendations);
      return updatedRecommendations;
    });
  };

  const updateRecommendation = (id: string, updates: Partial<MedicalRecommendation>) => {
    setRecommendations(prev => {
      const updatedRecommendations = prev.map(rec => rec.id === id ? { ...rec, ...updates } : rec);
      saveRecommendations(updatedRecommendations);
      return updatedRecommendations;
    });
  };

  const completeRecommendation = (id: string) => {
    setRecommendations(prev => {
      // Remove the recommendation entirely when completed
      const updatedRecommendations = prev.filter(rec => rec.id !== id);
      saveRecommendations(updatedRecommendations);
      console.log('✅ Recommendation completed and deleted:', id);
      return updatedRecommendations;
    });
  };

  const cancelRecommendation = (id: string, reason: string) => {
    setRecommendations(prev => {
      // Remove the recommendation entirely when cancelled
      const updatedRecommendations = prev.filter(rec => rec.id !== id);
      saveRecommendations(updatedRecommendations);
      console.log('✅ Recommendation cancelled and deleted:', id, 'Reason:', reason);
      return updatedRecommendations;
    });
  };

  const toggleActionItem = (recommendationId: string, actionId: string) => {
    setRecommendations(prev => {
      const updatedRecommendations = prev.map(rec => 
        rec.id === recommendationId 
          ? {
              ...rec,
              actionItems: rec.actionItems.map(item => 
                item.id === actionId 
                  ? { 
                      ...item, 
                      isCompleted: !item.isCompleted,
                      completedAt: !item.isCompleted ? new Date() : undefined
                    }
                  : item
              )
            }
          : rec
      );
      saveRecommendations(updatedRecommendations);
      return updatedRecommendations;
    });
  };

  const clearAllRecommendations = () => {
    setRecommendations([]);
    saveRecommendations([]);
    console.log('✅ All recommendations cleared');
  };

  const value: RecommendationsContextType = {
    recommendations,
    addRecommendations,
    updateRecommendation,
    completeRecommendation,
    cancelRecommendation,
    toggleActionItem,
    clearAllRecommendations,
  };

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
}; 