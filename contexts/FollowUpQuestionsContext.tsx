import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationSettings } from './NotificationSettingsContext';
import { sendFollowUpQuestionAlert } from '../utils/notifications';

// ============================================================================
// FOLLOW-UP QUESTIONS CONTEXT - Manages AI-Generated Follow-up Questions
// ============================================================================

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'missing_update' | 'overdue_recommendation' | 'pattern_change';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  isAnswered: boolean;
  answeredAt?: Date;
  answer?: string;
}

interface FollowUpQuestionsContextType {
  questions: FollowUpQuestion[];
  addFollowUpQuestions: (newQuestions: FollowUpQuestion[]) => void;
  updateQuestion: (id: string, updates: Partial<FollowUpQuestion>) => void;
  markAsAnswered: (id: string, answer?: string) => void;
  clearQuestions: () => void;
  isLoading: boolean;
}

const FollowUpQuestionsContext = createContext<FollowUpQuestionsContextType | undefined>(undefined);

interface FollowUpQuestionsProviderProps {
  children: ReactNode;
}

export const FollowUpQuestionsProvider: React.FC<FollowUpQuestionsProviderProps> = ({ children }) => {
  const [questions, setQuestions] = useState<FollowUpQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useNotificationSettings();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadQuestions();
  }, []);

  /**
   * Load follow-up questions from AsyncStorage
   */
  const loadQuestions = async () => {
    try {
      const storedQuestions = await AsyncStorage.getItem('followUpQuestions_default-user');
      if (storedQuestions) {
        const parsedQuestions = JSON.parse(storedQuestions);
        setQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error('Error loading follow-up questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save follow-up questions to AsyncStorage
   */
  const saveQuestions = async (newQuestions: FollowUpQuestion[]) => {
    try {
      await AsyncStorage.setItem('followUpQuestions_default-user', JSON.stringify(newQuestions));
    } catch (error) {
      console.error('Error saving follow-up questions:', error);
    }
  };

  // ============================================================================
  // QUESTION MANAGEMENT
  // ============================================================================

  /**
   * Add new follow-up questions and send notifications
   */
  const addFollowUpQuestions = (newQuestions: FollowUpQuestion[]) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev, ...newQuestions];
      saveQuestions(updatedQuestions);
      return updatedQuestions;
    });

    // Send notification alerts for new follow-up questions
    if (settings.enabled && settings.followUpAlerts) {
      newQuestions.forEach(question => {
        sendFollowUpQuestionAlert(question.question);
      });
    }
  };

  /**
   * Update a specific follow-up question
   */
  const updateQuestion = (id: string, updates: Partial<FollowUpQuestion>) => {
    setQuestions(prev => {
      const updatedQuestions = prev.map(q =>
        q.id === id ? { ...q, ...updates } : q
      );
      saveQuestions(updatedQuestions);
      return updatedQuestions;
    });
  };

  /**
   * Mark a follow-up question as answered
   */
  const markAsAnswered = (id: string, answer?: string) => {
    updateQuestion(id, { 
      isAnswered: true, 
      answeredAt: new Date(),
      answer 
    });
  };

  /**
   * Clear all follow-up questions
   */
  const clearQuestions = async () => {
    try {
      await AsyncStorage.removeItem('followUpQuestions_default-user');
      setQuestions([]);
    } catch (error) {
      console.error('Error clearing follow-up questions:', error);
    }
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: FollowUpQuestionsContextType = {
    questions,
    addFollowUpQuestions,
    updateQuestion,
    markAsAnswered,
    clearQuestions,
    isLoading,
  };

  return (
    <FollowUpQuestionsContext.Provider value={contextValue}>
      {children}
    </FollowUpQuestionsContext.Provider>
  );
};

/**
 * Hook to use follow-up questions context
 */
export const useFollowUpQuestions = (): FollowUpQuestionsContextType => {
  const context = useContext(FollowUpQuestionsContext);
  if (context === undefined) {
    throw new Error('useFollowUpQuestions must be used within a FollowUpQuestionsProvider');
  }
  return context;
}; 