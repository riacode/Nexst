import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MedicalRecommendation } from '../types/recommendations';

interface RecommendationsContextType {
  recommendations: MedicalRecommendation[];
  addRecommendations: (newRecommendations: MedicalRecommendation[]) => void;
  updateRecommendation: (id: string, updates: Partial<MedicalRecommendation>) => void;
  completeRecommendation: (id: string) => void;
  cancelRecommendation: (id: string, reason: string) => void;
  toggleActionItem: (recommendationId: string, actionId: string) => void;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

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

  const addRecommendations = (newRecommendations: MedicalRecommendation[]) => {
    setRecommendations(prev => {
      // Filter out duplicates based on title and recent creation
      const existingTitles = prev.map(rec => rec.title);
      const uniqueNewRecommendations = newRecommendations.filter(
        newRec => !existingTitles.includes(newRec.title)
      );
      return [...prev, ...uniqueNewRecommendations];
    });
  };

  const updateRecommendation = (id: string, updates: Partial<MedicalRecommendation>) => {
    setRecommendations(prev => 
      prev.map(rec => rec.id === id ? { ...rec, ...updates } : rec)
    );
  };

  const completeRecommendation = (id: string) => {
    updateRecommendation(id, {
      isCompleted: true,
      completedAt: new Date()
    });
  };

  const cancelRecommendation = (id: string, reason: string) => {
    updateRecommendation(id, {
      isCancelled: true,
      cancelledAt: new Date(),
      cancelledReason: reason
    });
  };

  const toggleActionItem = (recommendationId: string, actionId: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
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
      )
    );
  };

  const value: RecommendationsContextType = {
    recommendations,
    addRecommendations,
    updateRecommendation,
    completeRecommendation,
    cancelRecommendation,
    toggleActionItem,
  };

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
}; 