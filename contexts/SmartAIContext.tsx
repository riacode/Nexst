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
   * REACTIVE: Process symptom log with 3-agent autonomous system
   * COST: $0.15 per call (3 agents working together)
   * FREQUENCY: Every time user logs a symptom
   */
  const processSymptomLog = async (symptomLog: SymptomLog) => {
    console.log('💰 REACTIVE AI COST: $0.15 (3-agent autonomous system)');
    
    // Get all symptom logs and recommendations for context
    const allSymptoms: SymptomLog[] = symptomLogs || [];
    const existingRecommendations: MedicalRecommendation[] = recommendations || [];
    
    const result = await smartAI.processSymptomAutonomously(
      symptomLog.audioURI || '', 
      allSymptoms, 
      existingRecommendations
    );
    
    // Get basic analysis from legacy method (includes transcript, domain, severity, impact)
    const basicAnalysis = await smartAI.processSymptom(symptomLog.audioURI || '');
    
    // Convert autonomous response to legacy format for compatibility
    const legacyResult = {
      transcript: basicAnalysis.transcript,
      summary: result.decision.reasoning,
      quickRecommendations: basicAnalysis.quickRecommendations, // Use basic recommendations for now
      healthDomain: basicAnalysis.healthDomain,
      severity: basicAnalysis.severity,
      impact: basicAnalysis.impact
    };
    
    // Update cost tracking
    setReactiveCost(prev => prev + 0.15);
    setReactiveCalls(prev => prev + 1);
    setLastCall(new Date());
    
    return legacyResult;
  };

  /**
   * REACTIVE: Generate personalized appointment questions
   * COST: $0.05 per call
   * FREQUENCY: When user opens appointment detail
   */
  const generateAppointmentQuestions = async (title: string, date: Date) => {
    console.log('💰 REACTIVE AI COST: $0.05 (context analysis + questions)');
    
    const questions = await smartAI.generateAppointmentQuestions(title, date);
    
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
    processSymptomLog,
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