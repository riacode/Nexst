import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SymptomLog } from '../types/recommendations';
import { StorageManager } from '../utils/storage';
import { ValidationUtils } from '../utils/validation';

interface SymptomLogsContextType {
  symptomLogs: SymptomLog[];
  addSymptomLog: (log: SymptomLog) => void;
  updateSymptomLog: (id: string, updates: Partial<SymptomLog>) => void;
  deleteSymptomLog: (id: string) => void;
  clearAllSymptomLogs: () => void;
  getRelevantSymptoms: (appointmentTitle: string) => SymptomLog[];
}

const SymptomLogsContext = createContext<SymptomLogsContextType | undefined>(undefined);

interface SymptomLogsProviderProps {
  children: ReactNode;
}

export const SymptomLogsProvider: React.FC<SymptomLogsProviderProps> = ({ children }) => {
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [userId, setUserId] = useState<string | null>(null); // Assuming userId is managed elsewhere

  // Load symptom logs from encrypted storage on mount
  useEffect(() => {
    const loadSymptomLogs = async () => {
      try {
        const key = `symptomLogs_${userId}`;
        const logsJson = await StorageManager.load<SymptomLog[]>(key);
        
        if (logsJson && Array.isArray(logsJson)) {
          // Validate each log before setting state
          const validLogs = logsJson.filter(log => {
            const validation = ValidationUtils.validateSymptomLog(log);
            if (!validation.isValid) {
              console.warn('Invalid symptom log found:', validation.errors);
            }
            return validation.isValid;
          });
          
          setSymptomLogs(validLogs);
        }
      } catch (error) {
        console.error('Error loading encrypted symptom logs:', error);
      }
    };

    if (userId) {
      loadSymptomLogs();
    }
  }, [userId]);

  const saveSymptomLogs = async (logs: SymptomLog[]) => {
    try {
      // Validate all logs before storage
      const validLogs = logs.filter(log => {
        const validation = ValidationUtils.validateSymptomLog(log);
        if (!validation.isValid) {
          console.warn('Invalid symptom log found:', validation.errors);
        }
        return validation.isValid;
      });

      // Save to encrypted storage
      const key = `symptomLogs_${userId}`;
      await StorageManager.save(key, validLogs);
    } catch (error) {
      console.error('Error saving encrypted symptom logs:', error);
    }
  };

  const addSymptomLog = async (log: SymptomLog) => {
    try {
      // Validate symptom log before storage
      const validation = ValidationUtils.validateSymptomLog(log);
      if (!validation.isValid) {
        throw new Error(`Invalid symptom log: ${validation.errors.join(', ')}`);
      }

      const updatedLogs = [...symptomLogs, log];
      setSymptomLogs(updatedLogs);
      
      // Save to encrypted storage
      const key = `symptomLogs_${userId}`;
      await StorageManager.save(key, updatedLogs);
    } catch (error) {
      console.error('Error saving encrypted symptom log:', error);
      throw error;
    }
  };

  const updateSymptomLog = (id: string, updates: Partial<SymptomLog>) => {
    setSymptomLogs(prev => 
      prev.map(log => log.id === id ? { ...log, ...updates } : log)
    );
  };

  const deleteSymptomLog = (id: string) => {
    setSymptomLogs(prev => prev.filter(log => log.id !== id));
  };

  const clearAllSymptomLogs = () => {
    setSymptomLogs([]);
  };

  const getRelevantSymptoms = (appointmentTitle: string): SymptomLog[] => {
    const title = appointmentTitle.toLowerCase();
    
    // Define keywords for different types of appointments
    const appointmentKeywords: { [key: string]: string[] } = {
      'headache': ['headache', 'head pain', 'migraine', 'tension'],
      'cardiology': ['chest pain', 'heart', 'palpitation', 'shortness of breath', 'dizziness'],
      'gastroenterology': ['stomach', 'abdominal', 'nausea', 'vomiting', 'diarrhea', 'constipation'],
      'dermatology': ['rash', 'skin', 'itching', 'acne', 'mole'],
      'orthopedics': ['joint', 'bone', 'muscle', 'back pain', 'knee', 'shoulder'],
      'neurology': ['numbness', 'tingling', 'seizure', 'memory', 'vision', 'hearing'],
      'psychiatry': ['anxiety', 'depression', 'stress', 'mood', 'insomnia'],
      'gynecology': ['period', 'menstrual', 'pregnancy', 'breast'],
      'endocrinology': ['diabetes', 'thyroid', 'weight', 'fatigue', 'thirst'],
      'pulmonology': ['cough', 'breathing', 'asthma', 'chest'],
      'general': ['fever', 'fatigue', 'pain', 'weakness', 'appetite']
    };

    // Find relevant keywords for the appointment
    let relevantKeywords: string[] = [];
    for (const [specialty, keywords] of Object.entries(appointmentKeywords)) {
      if (title.includes(specialty) || keywords.some(keyword => title.includes(keyword))) {
        relevantKeywords = [...relevantKeywords, ...keywords];
      }
    }

    // If no specific keywords found, include all recent symptoms (last 30 days)
    if (relevantKeywords.length === 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return symptomLogs.filter(log => log.timestamp > thirtyDaysAgo);
    }

    // Filter logs that contain relevant keywords
    return symptomLogs.filter(log => {
      const logText = `${log.summary} ${log.transcript}`.toLowerCase();
      return relevantKeywords.some(keyword => logText.includes(keyword));
    });
  };

  const value: SymptomLogsContextType = {
    symptomLogs,
    addSymptomLog,
    updateSymptomLog,
    deleteSymptomLog,
    clearAllSymptomLogs,
    getRelevantSymptoms,
  };

  return (
    <SymptomLogsContext.Provider value={value}>
      {children}
    </SymptomLogsContext.Provider>
  );
};

export const useSymptomLogs = () => {
  const context = useContext(SymptomLogsContext);
  if (context === undefined) {
    throw new Error('useSymptomLogs must be used within a SymptomLogsProvider');
  }
  return context;
}; 