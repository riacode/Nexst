import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AIService, AutonomousHealthResponse } from '../utils/aiService';
import { SymptomLog, MedicalRecommendation } from '../types/recommendations';

// ============================================================================
// AUTONOMOUS HEALTH MANAGEMENT CONTEXT - 3-Agent Framework Integration
// ============================================================================

/**
 * Cost tracking for AI operations
 * Tracks both legacy single-agent calls and new 3-agent autonomous calls
 */
interface AICostTracking {
  // Legacy single-agent costs
  transcriptionCost: number;
  analysisCost: number;
  recommendationCost: number;
  questionCost: number;
  
  // New 3-agent autonomous costs
  autonomousCost: number;
  
  // Usage tracking
  transcriptionCalls: number;
  analysisCalls: number;
  recommendationCalls: number;
  questionCalls: number;
  autonomousCalls: number;
}

/**
 * Context state for autonomous health management
 */
interface SmartAIContextState {
  // AI Service instance
  aiService: AIService | null;
  
  // Cost and usage tracking
  costs: AICostTracking;
  
  // Proactive monitoring
  isProactiveActive: boolean;
  
  // Loading states
  isProcessing: boolean;
  isAnalyzing: boolean;
}

/**
 * Context actions for autonomous health management
 */
interface SmartAIContextActions {
  // Initialize AI service
  initializeAI: (userId: string) => void;
  
  // Process symptoms using 3-agent framework
  processSymptomAutonomously: (
    audioUri: string, 
    allSymptoms: SymptomLog[], 
    existingRecommendations: MedicalRecommendation[]
  ) => Promise<AutonomousHealthResponse>;
  
  // Legacy single-agent processing (for backward compatibility)
  processSymptomLog: (audioUri: string) => Promise<{
    transcript: string;
    summary: string;
    quickRecommendations: MedicalRecommendation[];
    healthDomain: string;
    severity: string;
    impact: string;
  }>;
  
  // Generate personalized recommendations
  getPersonalizedRecommendations: (symptoms: SymptomLog[]) => Promise<MedicalRecommendation[]>;
  
  // Generate appointment questions
  generateAppointmentQuestions: (title: string, date: Date) => Promise<string[]>;
  
  // Proactive monitoring
  startProactiveMonitoring: () => void;
  stopProactiveMonitoring: () => void;
  
  // Cost and usage tracking
  getCostBreakdown: () => AICostTracking;
  getUsageStats: () => { totalCalls: number; totalCost: number; };
  resetCosts: () => void;
}

/**
 * Complete context type combining state and actions
 */
type SmartAIContextType = SmartAIContextState & SmartAIContextActions;

/**
 * Provider props
 */
interface SmartAIProviderProps {
  children: ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const SmartAIContext = createContext<SmartAIContextType | undefined>(undefined);

/**
 * Smart AI Provider - Manages autonomous health management system
 * 
 * Features:
 * - 3-agent autonomous health management framework
 * - Cost tracking for all AI operations
 * - Proactive health monitoring
 * - Legacy single-agent support for backward compatibility
 */
export const SmartAIProvider: React.FC<SmartAIProviderProps> = ({ children }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [isProactiveActive, setIsProactiveActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Cost tracking state
  const [costs, setCosts] = useState<AICostTracking>({
    transcriptionCost: 0,
    analysisCost: 0,
    recommendationCost: 0,
    questionCost: 0,
    autonomousCost: 0,
    transcriptionCalls: 0,
    analysisCalls: 0,
    recommendationCalls: 0,
    questionCalls: 0,
    autonomousCalls: 0
  });

  // ============================================================================
  // AI SERVICE INITIALIZATION
  // ============================================================================

  /**
   * Initialize AI service with user ID
   * 
   * @param userId - Unique user identifier
   */
  const initializeAI = (userId: string) => {
    console.log('🤖 SmartAIContext: Initializing AI service for user:', userId);
    const service = new AIService(userId);
    setAiService(service);
  };

  // ============================================================================
  // AUTONOMOUS HEALTH MANAGEMENT (Primary Function)
  // ============================================================================

  /**
   * Process symptom using 3-agent autonomous health management framework
   * 
   * Workflow:
   * 1. HealthMemoryAgent: Analyzes patterns and provides historical context
   * 2. DecisionEngineAgent: Makes autonomous decision based on context
   * 3. ActionCoordinatorAgent: Creates strategy and communication plan
   * 
   * @param audioUri - URI of the recorded symptom audio
   * @param allSymptoms - All user's symptom history for context
   * @param existingRecommendations - Current recommendations to avoid duplicates
   * @returns Complete autonomous health response with decision, strategy, and context
   * 
   * COST: $0.15 per call (3 agents working together)
   */
  const processSymptomAutonomously = async (
    audioUri: string, 
    allSymptoms: SymptomLog[], 
    existingRecommendations: MedicalRecommendation[]
  ): Promise<AutonomousHealthResponse> => {
    if (!aiService) {
      throw new Error('AI service not initialized');
    }

    console.log('🤖 SmartAIContext: Processing symptom autonomously');
    setIsProcessing(true);
    
    try {
      const response = await aiService.processSymptomAutonomously(audioUri, allSymptoms, existingRecommendations);
      
      // Track autonomous processing cost
      setCosts(prev => ({
        ...prev,
        autonomousCost: prev.autonomousCost + 0.15,
        autonomousCalls: prev.autonomousCalls + 1
      }));
      
      return response;
    } catch (error) {
      console.error('Autonomous processing error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // LEGACY FUNCTIONS (Backward Compatibility)
  // ============================================================================

  /**
   * Process symptom using legacy single-agent approach
   * 
   * @param audioUri - URI of the recorded symptom audio
   * @returns Basic symptom analysis with quick recommendations
   * 
   * COST: $0.05 per call
   */
  const processSymptomLog = async (audioUri: string) => {
    if (!aiService) {
      throw new Error('AI service not initialized');
    }

    console.log('🤖 SmartAIContext: Processing symptom (Legacy)');
    setIsProcessing(true);
    
    try {
      const result = await aiService.processSymptom(audioUri);
      
      // Track legacy processing costs
      setCosts(prev => ({
        ...prev,
        transcriptionCost: prev.transcriptionCost + 0.01,
        analysisCost: prev.analysisCost + 0.02,
        recommendationCost: prev.recommendationCost + 0.02,
        transcriptionCalls: prev.transcriptionCalls + 1,
        analysisCalls: prev.analysisCalls + 1,
        recommendationCalls: prev.recommendationCalls + 1
      }));
      
      return result;
    } catch (error) {
      console.error('Legacy processing error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generate personalized recommendations using legacy approach
   * 
   * @param symptoms - Array of symptom logs to analyze
   * @returns Array of personalized health recommendations
   * 
   * COST: $0.03 per call
   */
  const getPersonalizedRecommendations = async (symptoms: SymptomLog[]): Promise<MedicalRecommendation[]> => {
    if (!aiService) {
      throw new Error('AI service not initialized');
    }

    console.log('🤖 SmartAIContext: Generating personalized recommendations (Legacy)');
    setIsAnalyzing(true);
    
    try {
      const recommendations = await aiService.getPersonalizedRecommendations(symptoms);
      
      // Track recommendation cost
      setCosts(prev => ({
        ...prev,
        recommendationCost: prev.recommendationCost + 0.03,
        recommendationCalls: prev.recommendationCalls + 1
      }));
      
      return recommendations;
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Generate appointment questions using legacy approach
   * 
   * @param title - Appointment title/type
   * @param date - Appointment date
   * @returns Array of questions to ask the healthcare provider
   * 
   * COST: $0.05 per call
   */
  const generateAppointmentQuestions = async (title: string, date: Date): Promise<string[]> => {
    if (!aiService) {
      throw new Error('AI service not initialized');
    }

    console.log('🤖 SmartAIContext: Generating appointment questions (Legacy)');
    
    try {
      const questions = await aiService.generateAppointmentQuestions(title, date);
      
      // Track question generation cost
      setCosts(prev => ({
        ...prev,
        questionCost: prev.questionCost + 0.05,
        questionCalls: prev.questionCalls + 1
      }));
      
      return questions;
    } catch (error) {
      console.error('Question generation error:', error);
      return [];
    }
  };

  // ============================================================================
  // PROACTIVE MONITORING
  // ============================================================================

  /**
   * Start proactive health monitoring
   * Runs background health checks 1-2 times per day
   */
  const startProactiveMonitoring = () => {
    console.log('🤖 SmartAIContext: Starting proactive health monitoring');
    setIsProactiveActive(true);
  };

  /**
   * Stop proactive health monitoring
   */
  const stopProactiveMonitoring = () => {
    console.log('🤖 SmartAIContext: Stopping proactive health monitoring');
    setIsProactiveActive(false);
  };

  /**
   * Execute background health monitoring task
   * Called 1-2 times per day to check for follow-up needs and reassess recommendations
   */
  const executeBackgroundTask = async () => {
    if (!aiService || !isProactiveActive) return;

    console.log('🤖 SmartAIContext: Executing background health monitoring');
    
    try {
      // Background health monitoring logic would go here
      // This would check for:
      // - Missing symptom updates (3+ days)
      // - Overdue recommendations
      // - Pattern changes requiring follow-up
      // - Weekly/monthly health reassessment
      
      // Track background monitoring cost
      setCosts(prev => ({
        ...prev,
        autonomousCost: prev.autonomousCost + 0.10,
        autonomousCalls: prev.autonomousCalls + 1
      }));
    } catch (error) {
      console.error('Background monitoring error:', error);
    }
  };

  // ============================================================================
  // COST AND USAGE TRACKING
  // ============================================================================

  /**
   * Get detailed cost breakdown
   * 
   * @returns Complete cost tracking information
   */
  const getCostBreakdown = (): AICostTracking => {
    return costs;
  };

  /**
   * Get usage statistics
   * 
   * @returns Total calls and costs
   */
  const getUsageStats = (): { totalCalls: number; totalCost: number; } => {
    const totalCalls = costs.transcriptionCalls + costs.analysisCalls + 
                      costs.recommendationCalls + costs.questionCalls + costs.autonomousCalls;
    const totalCost = costs.transcriptionCost + costs.analysisCost + 
                     costs.recommendationCost + costs.questionCost + costs.autonomousCost;
    
    return { totalCalls, totalCost };
  };

  /**
   * Reset all cost tracking
   */
  const resetCosts = () => {
    setCosts({
      transcriptionCost: 0,
      analysisCost: 0,
      recommendationCost: 0,
      questionCost: 0,
      autonomousCost: 0,
      transcriptionCalls: 0,
      analysisCalls: 0,
      recommendationCalls: 0,
      questionCalls: 0,
      autonomousCalls: 0
    });
  };

  // ============================================================================
  // BACKGROUND MONITORING SCHEDULING
  // ============================================================================

  /**
   * Schedule background health monitoring when proactive monitoring is active
   * Runs every 12 hours (8 AM and 8 PM) for health monitoring
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isProactiveActive) {
      // Execute immediately
      executeBackgroundTask();
      
      // Schedule to run every 12 hours (43,200,000 milliseconds)
      intervalId = setInterval(executeBackgroundTask, 12 * 60 * 60 * 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isProactiveActive]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: SmartAIContextType = {
    // State
    aiService,
    costs,
    isProactiveActive,
    isProcessing,
    isAnalyzing,
    
    // Actions
    initializeAI,
    processSymptomAutonomously,
    processSymptomLog,
    getPersonalizedRecommendations,
    generateAppointmentQuestions,
    startProactiveMonitoring,
    stopProactiveMonitoring,
    getCostBreakdown,
    getUsageStats,
    resetCosts
  };

  return (
    <SmartAIContext.Provider value={contextValue}>
      {children}
    </SmartAIContext.Provider>
  );
};

// ============================================================================
// CONTEXT HOOK
// ============================================================================

/**
 * Hook to use the Smart AI context
 * 
 * @returns Smart AI context with state and actions
 * @throws Error if used outside of SmartAIProvider
 */
export const useSmartAI = (): SmartAIContextType => {
  const context = useContext(SmartAIContext);
  if (context === undefined) {
    throw new Error('useSmartAI must be used within a SmartAIProvider');
  }
  return context;
}; 