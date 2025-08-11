import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FollowUpQuestion } from '../types/recommendations';
import { StorageManager } from '../utils/storage';
import { ValidationUtils } from '../utils/validation';
import { sendFollowUpQuestionNotification } from '../utils/notifications';

interface FollowUpQuestionsContextType {
  followUpQuestions: FollowUpQuestion[];
  addFollowUpQuestion: (question: FollowUpQuestion) => void;
  removeFollowUpQuestion: (id: string) => void;
  markAsAnswered: (id: string) => void;
  getUnansweredCount: () => number;
  clearAllQuestions: () => void;
}

const FollowUpQuestionsContext = createContext<FollowUpQuestionsContextType | undefined>(undefined);

const STORAGE_KEY = 'follow_up_questions';

export function FollowUpQuestionsProvider({ children }: { children: React.ReactNode }) {
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);

  // Load follow-up questions from encrypted storage
  useEffect(() => {
    const loadFollowUpQuestions = async () => {
      try {
        const stored = await StorageManager.load<FollowUpQuestion[]>(STORAGE_KEY);
        if (stored && Array.isArray(stored)) {
          // Validate each question before setting state
          const validQuestions = stored.filter(question => {
            const validation = ValidationUtils.validateFollowUpQuestion(question);
            if (!validation.isValid) {
              console.warn('Invalid follow-up question found:', validation.errors);
            }
            return validation.isValid;
          });
          
          setFollowUpQuestions(validQuestions);
        }
      } catch (error) {
        console.error('Error loading encrypted follow-up questions:', error);
      }
    };

    loadFollowUpQuestions();
  }, []);

  useEffect(() => {
    saveFollowUpQuestions();
  }, [followUpQuestions]);

  const saveFollowUpQuestions = async () => {
    try {
      await StorageManager.save(STORAGE_KEY, followUpQuestions);
    } catch (error) {
      console.error('Error saving follow-up questions:', error);
    }
  };

  const addFollowUpQuestion = async (question: FollowUpQuestion) => {
    try {
      // Validate question before storage
      const validation = ValidationUtils.validateFollowUpQuestion(question);
      if (!validation.isValid) {
        throw new Error(`Invalid follow-up question: ${validation.errors.join(', ')}`);
      }

      const updatedQuestions = [...followUpQuestions, question];
      setFollowUpQuestions(updatedQuestions);
      
      // Save to encrypted storage
      await StorageManager.save(STORAGE_KEY, updatedQuestions);
      
      // Send notification for new follow-up questions
      const unansweredCount = updatedQuestions.filter(q => !q.isAnswered).length;
      if (unansweredCount > 0) {
        sendFollowUpQuestionNotification(unansweredCount);
      }
    } catch (error) {
      console.error('Error saving encrypted follow-up question:', error);
      throw error;
    }
  };

  const removeFollowUpQuestion = (id: string) => {
    setFollowUpQuestions(prev => prev.filter(q => q.id !== id));
  };

  const markAsAnswered = (id: string) => {
    setFollowUpQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, isAnswered: true } : q)
    );
  };

  const getUnansweredCount = () => {
    return followUpQuestions.filter(q => !q.isAnswered).length;
  };

  const clearAllQuestions = () => {
    setFollowUpQuestions([]);
  };

  return (
    <FollowUpQuestionsContext.Provider
      value={{
        followUpQuestions,
        addFollowUpQuestion,
        removeFollowUpQuestion,
        markAsAnswered,
        getUnansweredCount,
        clearAllQuestions,
      }}
    >
      {children}
    </FollowUpQuestionsContext.Provider>
  );
}

export function useFollowUpQuestions() {
  const context = useContext(FollowUpQuestionsContext);
  if (context === undefined) {
    throw new Error('useFollowUpQuestions must be used within a FollowUpQuestionsProvider');
  }
  return context;
} 