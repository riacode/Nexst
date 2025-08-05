import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AIService } from '../utils/aiService';
import { SymptomLog, MedicalRecommendation } from '../types/recommendations';
import { useSymptomLogs } from './SymptomLogsContext';
import { useRecommendations } from './RecommendationsContext';

// ============================================================================
// SMART HEALTH AI CONTEXT
// ============================================================================
// 
// PURPOSE: Manages the SmartHealthAI system and provides easy access to AI features
// COST TRACKING: Monitors API usage and costs
// FREQUENCY CONTROL: Ensures background tasks run at optimal intervals

interface SmartAIContextType {
  // Reactive AI functions (user-triggered)
  transcribeAndSummarize: (audioUri: string) => Promise<{
    transcript: string;
    summary: string;
    healthDomain: string;
    severity: string;
    impact: string;
  }>;
  analyzeForRecommendations: (symptomLog: SymptomLog) => Promise<MedicalRecommendation[]>;
  generateAppointmentQuestions: (title: string, date: Date) => Promise<string[]>;
  getPersonalizedRecommendations: () => Promise<MedicalRecommendation[]>;
  
  // Proactive AI control
  startProactiveMonitoring: () => Promise<void>;
  stopProactiveMonitoring: () => void;
  isProactiveActive: boolean;
  
  // Background task support
  executeBackgroundTask: () => Promise<void>;
  

  
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
  const [smartAI, setSmartAI] = useState(new AIService(userId));
  const [isProactiveActive, setIsProactiveActive] = useState(false);
  
  // Get data from other contexts
  const { symptomLogs } = useSymptomLogs();
  const { recommendations } = useRecommendations();
  
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
   * REACTIVE: Transcribe and summarize audio recording
   * COST: $0.02 per call (transcription + optimized analysis)
   * FREQUENCY: Every time user records a symptom
   */
  const transcribeAndSummarize = async (audioUri: string) => {
    console.log('💰 REACTIVE AI COST: $0.02 (transcription + optimized analysis)');
    
    // Use the legacy processSymptom method which does transcription and basic analysis
    const result = await smartAI.processSymptom(audioUri);
    
    // Update cost tracking
    setReactiveCost(prev => prev + 0.02);
    setReactiveCalls(prev => prev + 1);
    setLastCall(new Date());
    
    return {
      transcript: result.transcript,
      summary: result.summary, // This is the actual summary of what user said
      healthDomain: result.healthDomain,
      severity: result.severity,
      impact: result.impact
    };
  };

  /**
   * REACTIVE: Analyze symptom log for recommendations (quality-focused)
   * COST: $0.08 per call (1-2 high-quality recommendations)
   * FREQUENCY: Background analysis after log is created
   */
  const analyzeForRecommendations = async (symptomLog: SymptomLog) => {
    console.log('💰 REACTIVE AI COST: $0.08 (quality-focused recommendations)');
    
    // Get all symptom logs and recommendations for context
    const allSymptoms: SymptomLog[] = symptomLogs || [];
    const existingRecommendations: MedicalRecommendation[] = recommendations || [];
    
    // Use simplified recommendation generation (no duplication)
    const newRecommendations = await smartAI.generateRecommendationsFromSymptom(
      symptomLog, 
      allSymptoms, 
      existingRecommendations
    );
    
    // Update cost tracking
    setReactiveCost(prev => prev + 0.08);
    setReactiveCalls(prev => prev + 1);
    setLastCall(new Date());
    
    return newRecommendations;
  };

  /**
   * REACTIVE: Generate personalized appointment questions
   * COST: $0.02 per call (GPT-3.5-turbo)
   * FREQUENCY: When user opens appointment detail
   */
  const generateAppointmentQuestions = async (title: string, date: Date) => {
    console.log('💰 REACTIVE AI COST: $0.02 (context analysis + questions with GPT-3.5-turbo)');
    
    const questions = await smartAI.generateAppointmentQuestions(title, date);
    
    // Update cost tracking
    setReactiveCost(prev => prev + 0.02);
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
    
    const recommendations = await smartAI.getPersonalizedRecommendations([]);
    
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

    setIsProactiveActive(false);
  };

  /**
   * BACKGROUND: Execute background task (iOS Background App Refresh)
   * COST: Varies based on tasks executed
   */
  const executeBackgroundTask = async () => {
    console.log('🤖 BACKGROUND AI: Executing background task');
    // Background task logic can be added here
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
    transcribeAndSummarize,
    analyzeForRecommendations,
    generateAppointmentQuestions,
    getPersonalizedRecommendations,
    
    // Proactive AI control
    startProactiveMonitoring,
    stopProactiveMonitoring,
    isProactiveActive,
    
    // Background task support
    executeBackgroundTask,
    
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