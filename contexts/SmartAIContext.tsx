import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AgentOrchestrator } from '../utils/agents/AgentOrchestrator';
import { SymptomLog, MedicalRecommendation } from '../types/recommendations';

// ============================================================================
// SMART HEALTH AI CONTEXT
// ============================================================================
// 
// PURPOSE: Manages the SmartHealthAI system and provides easy access to AI features
// COST TRACKING: Monitors API usage and costs
// FREQUENCY CONTROL: Ensures background tasks run at optimal intervals

interface SmartAIContextType {
  // Reactive AI functions (user-triggered)
  processSymptomLog: (symptomLog: SymptomLog) => Promise<{
    transcript: string;
    summary: string;
    quickRecommendations: MedicalRecommendation[];
    healthDomain: string;
    severity: string;
    impact: string;
  }>;
  generateAppointmentQuestions: (title: string, date: Date) => Promise<string[]>;
  getPersonalizedRecommendations: () => Promise<MedicalRecommendation[]>;
  
  // Proactive AI control
  startProactiveMonitoring: () => Promise<void>;
  stopProactiveMonitoring: () => void;
  isProactiveActive: boolean;
  
  // Notification functions
  scheduleAppointmentReminders: (appointment: any) => Promise<void>;
  cancelAppointmentReminders: (appointmentId: string) => Promise<void>;
  sendFollowUpQuestion: (question: string, questionType: string) => Promise<void>;
  sendMissedLogSpotlight: () => Promise<void>;
  
  // Cost and usage tracking
  getCostBreakdown: () => {
    reactiveCost: number;
    proactiveCost: number;
    totalCost: number;
    lastUpdated: Date;
  };
  getUsageStats: () => {
    reactiveCalls: number;
    proactiveCalls: number;
    totalCalls: number;
    lastCall: Date;
  };
}

const SmartAIContext = createContext<SmartAIContextType | undefined>(undefined);

interface SmartAIProviderProps {
  children: ReactNode;
  userId: string;
}

export const SmartAIProvider: React.FC<SmartAIProviderProps> = ({ 
  children, 
  userId 
}) => {
  const [smartAI, setSmartAI] = useState(new AgentOrchestrator(userId));
  const [isProactiveActive, setIsProactiveActive] = useState(false);
  
  // Cost tracking
  const [reactiveCost, setReactiveCost] = useState(0);
  const [proactiveCost, setProactiveCost] = useState(0);
  const [reactiveCalls, setReactiveCalls] = useState(0);
  const [proactiveCalls, setProactiveCalls] = useState(0);
  const [lastCall, setLastCall] = useState(new Date());

  // ============================================================================
  // REACTIVE AI FUNCTIONS (User-triggered)
  // ============================================================================

  /**
   * REACTIVE: Process symptom log with cost tracking
   * COST: $0.05 per call
   * FREQUENCY: Every time user logs a symptom
   */
  const processSymptomLog = async (symptomLog: SymptomLog) => {
    console.log('💰 REACTIVE AI COST: $0.05 (transcription + analysis)');
    
    const result = await smartAI.processSymptomLog(symptomLog);
    
    // Update cost tracking
    setReactiveCost(prev => prev + 0.05);
    setReactiveCalls(prev => prev + 1);
    setLastCall(new Date());
    
    return result;
  };

  /**
   * REACTIVE: Generate personalized appointment questions
   * COST: $0.05 per call
   * FREQUENCY: When user opens appointment detail
   */
  const generateAppointmentQuestions = async (title: string, date: Date) => {
    console.log('💰 REACTIVE AI COST: $0.05 (context analysis + questions)');
    
    const questions = await smartAI.generatePersonalizedAppointmentQuestions(title, date);
    
    // Update cost tracking
    setReactiveCost(prev => prev + 0.05);
    setReactiveCalls(prev => prev + 1);
    setLastCall(new Date());
    
    return questions;
  };

  /**
   * REACTIVE: Get personalized recommendations
   * COST: $0.03 per call
   * FREQUENCY: When user views recommendations
   */
  const getPersonalizedRecommendations = async () => {
    console.log('💰 REACTIVE AI COST: $0.03 (pattern matching + personalization)');
    
    const recommendations = await smartAI.getPersonalizedRecommendations();
    
    // Update cost tracking
    setReactiveCost(prev => prev + 0.03);
    setReactiveCalls(prev => prev + 1);
    setLastCall(new Date());
    
    return recommendations;
  };

  // ============================================================================
  // PROACTIVE AI CONTROL
  // ============================================================================

  /**
   * PROACTIVE: Start background monitoring
   * COST: $0.25/day (distributed across background tasks)
   * FREQUENCY: Every 6 hours (not continuous)
   */
  const startProactiveMonitoring = async () => {
    console.log('🤖 PROACTIVE AI: Starting background monitoring ($0.25/day)');
    
    await smartAI.initialize();
    setIsProactiveActive(true);
    
    // Schedule cost updates for proactive monitoring
    const updateProactiveCost = () => {
      setProactiveCost(prev => prev + 0.04); // $0.04 every 6 hours = $0.16/day
      setProactiveCalls(prev => prev + 1);
      setLastCall(new Date());
    };
    
    // Update cost every 6 hours
    setInterval(updateProactiveCost, 6 * 60 * 60 * 1000);
  };

  /**
   * PROACTIVE: Stop background monitoring
   * COST: $0 (no API calls)
   */
  const stopProactiveMonitoring = async () => {
    console.log('🤖 PROACTIVE AI: Stopping background monitoring');
    await smartAI.shutdown();
    setIsProactiveActive(false);
  };

  // ============================================================================
  // NOTIFICATION FUNCTIONS
  // ============================================================================

  /**
   * NOTIFICATION: Schedule appointment reminders
   * COST: $0 (no API calls)
   */
  const scheduleAppointmentReminders = async (appointment: any) => {
    await smartAI.scheduleAppointmentReminders(appointment);
  };

  /**
   * NOTIFICATION: Cancel appointment reminders
   * COST: $0 (no API calls)
   */
  const cancelAppointmentReminders = async (appointmentId: string) => {
    await smartAI.cancelAppointmentReminders(appointmentId);
  };

  /**
   * NOTIFICATION: Send follow-up question
   * COST: $0 (no API calls)
   */
  const sendFollowUpQuestion = async (question: string, questionType: string) => {
    const { NotificationService } = await import('../utils/notifications');
    await NotificationService.sendFollowUpQuestion(question, questionType);
  };

  /**
   * NOTIFICATION: Send missed log spotlight
   * COST: $0 (no API calls)
   */
  const sendMissedLogSpotlight = async () => {
    const { NotificationService } = await import('../utils/notifications');
    await NotificationService.sendMissedLogSpotlight();
  };

  // ============================================================================
  // COST AND USAGE TRACKING
  // ============================================================================

  const getCostBreakdown = () => {
    return {
      reactiveCost: Math.round(reactiveCost * 100) / 100,
      proactiveCost: Math.round(proactiveCost * 100) / 100,
      totalCost: Math.round((reactiveCost + proactiveCost) * 100) / 100,
      lastUpdated: lastCall
    };
  };

  const getUsageStats = () => {
    return {
      reactiveCalls,
      proactiveCalls,
      totalCalls: reactiveCalls + proactiveCalls,
      lastCall
    };
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: SmartAIContextType = {
    // Reactive AI functions
    processSymptomLog,
    generateAppointmentQuestions,
    getPersonalizedRecommendations,
    
    // Proactive AI control
    startProactiveMonitoring,
    stopProactiveMonitoring,
    isProactiveActive,
    
    // Notification functions
    scheduleAppointmentReminders,
    cancelAppointmentReminders,
    sendFollowUpQuestion,
    sendMissedLogSpotlight,
    
    // Cost and usage tracking
    getCostBreakdown,
    getUsageStats,
  };

  return (
    <SmartAIContext.Provider value={value}>
      {children}
    </SmartAIContext.Provider>
  );
};

// ============================================================================
// HOOK FOR USING SMART HEALTH AI
// ============================================================================

export const useSmartAI = () => {
  const context = useContext(SmartAIContext);
  if (context === undefined) {
    throw new Error('useSmartAI must be used within a SmartAIProvider');
  }
  return context;
}; 