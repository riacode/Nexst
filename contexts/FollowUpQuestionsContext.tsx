import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendFollowUpQuestionNotification } from '../utils/notifications';

interface FollowUpQuestion {
  id: string;
  question: string;
  questionType: string;
  timestamp: Date;
  isAnswered: boolean;
}

interface FollowUpQuestionsContextType {
  followUpQuestions: FollowUpQuestion[];
  addFollowUpQuestion: (question: string, questionType: string) => void;
  removeFollowUpQuestion: (id: string) => void;
  markAsAnswered: (id: string) => void;
  getUnansweredCount: () => number;
  clearAllQuestions: () => void;
}

const FollowUpQuestionsContext = createContext<FollowUpQuestionsContextType | undefined>(undefined);

const STORAGE_KEY = 'follow_up_questions';

export function FollowUpQuestionsProvider({ children }: { children: React.ReactNode }) {
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);

  useEffect(() => {
    loadFollowUpQuestions();
  }, []);

  useEffect(() => {
    saveFollowUpQuestions();
  }, [followUpQuestions]);

  const loadFollowUpQuestions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const questionsWithDates = parsed.map((q: any) => ({
          ...q,
          timestamp: new Date(q.timestamp)
        }));
        setFollowUpQuestions(questionsWithDates);
      }
    } catch (error) {
      console.error('Error loading follow-up questions:', error);
    }
  };

  const saveFollowUpQuestions = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(followUpQuestions));
    } catch (error) {
      console.error('Error saving follow-up questions:', error);
    }
  };

  const addFollowUpQuestion = (question: string, questionType: string) => {
    const newQuestion: FollowUpQuestion = {
      id: Date.now().toString(),
      question,
      questionType,
      timestamp: new Date(),
      isAnswered: false,
    };
    
    setFollowUpQuestions(prev => {
      const updatedQuestions = [newQuestion, ...prev];
      
      // Send notification for new follow-up questions
      const unansweredCount = updatedQuestions.filter(q => !q.isAnswered).length;
      if (unansweredCount > 0) {
        sendFollowUpQuestionNotification(unansweredCount);
      }
      
      return updatedQuestions;
    });
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