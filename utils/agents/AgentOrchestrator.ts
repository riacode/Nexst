// ============================================================================
// AGENT ORCHESTRATOR - Manages Micro-Agents with iOS Optimization
// ============================================================================

import { MicroAgentManager } from './MicroAgentManager';
import { SymptomAnalysisAgent } from './SymptomAnalysisAgent';
import { PatternDetectionAgent } from './PatternDetectionAgent';
import { SymptomLog, MedicalRecommendation, HealthDomain } from '../../types/recommendations';

export class AgentOrchestrator {
  private userId: string;
  private isInitialized: boolean = false;
  private agents: {
    symptomAnalysis: SymptomAnalysisAgent;
    patternDetection: PatternDetectionAgent;
  };

  constructor(userId: string) {
    this.userId = userId;
    
    // Initialize micro-agents
    this.agents = {
      symptomAnalysis: new SymptomAnalysisAgent(userId),
      patternDetection: new PatternDetectionAgent(userId)
    };
  }

  // ============================================================================
  // AGENT LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Initialize and register all micro-agents
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🤖 AgentOrchestrator: Already initialized');
      return;
    }

    console.log('🤖 AgentOrchestrator: Initializing micro-agents');

    // Initialize the micro-agent manager
    await MicroAgentManager.initialize();

    // Register all agents with the manager
    MicroAgentManager.registerAgent(this.agents.symptomAnalysis, [
      'new_symptom_log',
      'symptom_analysis_requested'
    ]);

    MicroAgentManager.registerAgent(this.agents.patternDetection, [
      'pattern_analysis_requested',
      'background_analysis'
    ]);
    
    this.isInitialized = true;
    console.log('🤖 AgentOrchestrator: All micro-agents initialized and registered');
  }

  /**
   * Stop all agents
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.log('🤖 AgentOrchestrator: Not initialized');
      return;
    }

    console.log('🤖 AgentOrchestrator: Shutting down micro-agents');
    await MicroAgentManager.shutdown();
    this.isInitialized = false;
  }

  // ============================================================================
  // REACTIVE AI FUNCTIONS (User-triggered)
  // ============================================================================

  /**
   * Process new symptom log (reactive)
   */
  async processSymptomLog(symptomLog: SymptomLog): Promise<{
    transcript: string;
    summary: string;
    quickRecommendations: MedicalRecommendation[];
    healthDomain: string;
    severity: string;
    impact: string;
  }> {
    console.log('🔄 REACTIVE AI: Processing symptom log');

    // Trigger symptom analysis agent
    await MicroAgentManager.triggerEvent({
      id: `symptom-${Date.now()}`,
      type: 'new_symptom_log',
      data: { symptomLog },
      timestamp: new Date(),
      priority: 'high'
    });

    // Execute the agent immediately
    const result = await MicroAgentManager.executeAgent(this.agents.symptomAnalysis.getAgentId());
    
    if (result?.success && result.data) {
      // Convert the analysis result to the expected format
      return {
        transcript: result.data.transcript,
        summary: result.data.summary,
        quickRecommendations: this.convertToRecommendations(result.data.recommendations),
        healthDomain: result.data.healthDomain,
        severity: result.data.severity,
        impact: result.data.impact
      };
    } else {
      // Fallback if agent fails
      return {
        transcript: 'Processing failed',
        summary: symptomLog.summary || 'Symptom recorded',
        quickRecommendations: [],
        healthDomain: 'general_wellness',
        severity: 'mild',
        impact: 'low'
      };
    }
  }

  /**
   * Generate personalized appointment questions (reactive)
   */
  async generatePersonalizedAppointmentQuestions(
    appointmentTitle: string,
    appointmentDate: Date
  ): Promise<string[]> {
    console.log('🔄 REACTIVE AI: Generating appointment questions');

    const recentSymptoms = await this.getRecentSymptoms(30); // Get last 30 days for better context
    
    const prompt = `
    Generate specific questions that the PATIENT should ask their doctor during this appointment:
    Appointment: ${appointmentTitle} on ${appointmentDate.toLocaleDateString()}
    
    Patient's Symptom History (last 30 days):
    ${recentSymptoms.map(log => `- ${log.summary} (${log.timestamp.toLocaleDateString()})`).join('\n')}
    
    Generate 1-6 specific questions that the PATIENT should ask their doctor. These should be:
    1. Questions about their specific symptoms and health concerns
    2. Questions seeking medical advice, diagnosis, or treatment options
    3. Questions about their health patterns and what they mean
    4. Questions relevant to the appointment type and their symptom history
    5. Questions that will help the patient understand their health better
    
    Focus on questions like:
    - "What could be causing my [specific symptom]?"
    - "Should I be concerned about [symptom pattern]?"
    - "What tests or treatments do you recommend for [symptom]?"
    - "How can I manage [symptom] better?"
    - "Is [symptom] related to [other symptom]?"
    
    The number of questions should be realistic (1-6) based on the complexity of their symptoms and appointment type.
    
    Return as JSON array of question strings.
    `;

    try {
      const { makeOpenAIRequest } = await import('../openai');
      const response = await makeOpenAIRequest({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a health assistant. Generate personalized appointment questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3,
      });
      const questions = response.choices[0]?.message?.content || '';
      
      return this.parseQuestions(questions);
    } catch (error) {
      console.error('Error generating appointment questions:', error);
      return [
        "How have you been feeling since your last visit?",
        "Have you noticed any new symptoms?",
        "Are there any concerns you'd like to discuss?",
        "How are your current medications working?",
        "Have you made any lifestyle changes recently?"
      ];
    }
  }

  /**
   * Get personalized recommendations (reactive)
   */
  async getPersonalizedRecommendations(): Promise<MedicalRecommendation[]> {
    console.log('🔄 REACTIVE AI: Getting personalized recommendations');
    
    // Trigger pattern analysis to get latest insights
    await MicroAgentManager.triggerEvent({
      id: `recommendations-${Date.now()}`,
      type: 'pattern_analysis_requested',
      data: {},
      timestamp: new Date(),
      priority: 'medium'
    });

    // Execute pattern detection agent
    const result = await MicroAgentManager.executeAgent(this.agents.patternDetection.getAgentId());
    
    if (result?.success && result.data) {
      return this.convertPatternsToRecommendations(result.data.patterns);
    } else {
      return [];
    }
  }

  // ============================================================================
  // PROACTIVE AI FUNCTIONS (Background monitoring)
  // ============================================================================

  /**
   * Start proactive monitoring (uses iOS Background App Refresh)
   */
  async startProactiveMonitoring(): Promise<void> {
    console.log('🤖 PROACTIVE AI: Starting proactive monitoring');
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Trigger background analysis
    await MicroAgentManager.triggerEvent({
      id: `background-${Date.now()}`,
      type: 'background_analysis',
      data: {},
      timestamp: new Date(),
      priority: 'low'
    });
  }

  /**
   * Stop proactive monitoring
   */
  async stopProactiveMonitoring(): Promise<void> {
    console.log('🤖 PROACTIVE AI: Stopping proactive monitoring');
    await this.shutdown();
  }

  /**
   * Check if proactive monitoring is active
   */
  isProactiveActive(): boolean {
    return this.isInitialized;
  }

  // ============================================================================
  // BACKGROUND TASK SUPPORT
  // ============================================================================

  /**
   * Execute background task (called by iOS Background App Refresh)
   */
  async executeBackgroundTask(): Promise<void> {
    console.log('🤖 AgentOrchestrator: Executing background task');
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    MicroAgentManager.startBackgroundTask();
    await MicroAgentManager.executeBackgroundTask();
  }

  // ============================================================================
  // NOTIFICATION FUNCTIONS
  // ============================================================================



  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  private async getRecentSymptoms(days: number): Promise<SymptomLog[]> {
    try {
      const key = `symptom_logs_${this.userId}`;
      const logsJson = await import('@react-native-async-storage/async-storage').then(AsyncStorage => 
        AsyncStorage.default.getItem(key)
      );
      
      if (!logsJson) return [];
      
      const logs: SymptomLog[] = JSON.parse(logsJson);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      return logs.filter(log => new Date(log.timestamp) >= cutoffDate);
    } catch (error) {
      console.error('Error getting recent symptoms:', error);
      return [];
    }
  }

  private parseQuestions(content: string): string[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing questions:', error);
      return [];
    }
  }

  private convertToRecommendations(recommendations: string[]): MedicalRecommendation[] {
    return recommendations.map((rec, index) => ({
      id: `rec-${Date.now()}-${index}`,
      priority: 'MEDIUM' as const,
      title: rec,
      description: rec,
      actionItems: [],
      urgency: 'within days' as const,
      category: 'lifestyle' as const,
      healthDomain: 'general_wellness' as HealthDomain,
      medicalRationale: 'AI-generated recommendation based on symptom analysis',
      symptomsTriggering: [],
      severityIndicators: [],
      followUpRequired: false,
      riskLevel: 'low' as const,
      interventionType: 'self_care' as const,
      createdAt: new Date()
    }));
  }

  private convertPatternsToRecommendations(patterns: any[]): MedicalRecommendation[] {
    return patterns.map((pattern, index) => ({
      id: `pattern-rec-${Date.now()}-${index}`,
      priority: pattern.severity === 'severe' ? 'HIGH' : 'MEDIUM',
      title: `Address ${pattern.symptom} pattern`,
      description: `Consider addressing the recurring ${pattern.symptom} pattern`,
      actionItems: [],
      urgency: 'within weeks' as const,
      category: 'monitoring' as const,
      healthDomain: pattern.healthDomain || 'general_wellness',
      medicalRationale: 'Pattern analysis identified recurring symptom',
      symptomsTriggering: [pattern.symptom],
      severityIndicators: [pattern.severity],
      followUpRequired: pattern.trend === 'worsening',
      riskLevel: pattern.severity === 'severe' ? 'high' : 'medium',
      interventionType: 'professional_care' as const,
      createdAt: new Date()
    }));
  }

  // ============================================================================
  // STATUS & METRICS
  // ============================================================================

  /**
   * Get system status
   */
  getSystemStatus(): any {
    return {
      isInitialized: this.isInitialized,
      agentStatus: MicroAgentManager.getAllAgentStatus(),
      systemStatus: MicroAgentManager.getSystemStatus()
    };
  }

  /**
   * Get cost breakdown
   */
  getCostBreakdown(): {
    reactive: number;
    proactive: number;
    total: number;
  } {
    const totalCost = MicroAgentManager.getTotalCost();
    
    return {
      reactive: totalCost * 0.7, // Estimate 70% reactive, 30% proactive
      proactive: totalCost * 0.3,
      total: totalCost
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalAgents: number;
    runningAgents: number;
    totalRuns: number;
    pendingEvents: number;
  } {
    const systemStatus = MicroAgentManager.getSystemStatus();
    const agentStatuses = MicroAgentManager.getAllAgentStatus();
    const totalRuns = agentStatuses.reduce((sum, agent) => sum + agent.runCount, 0);
    
    return {
      totalAgents: systemStatus.totalAgents,
      runningAgents: systemStatus.processingAgents,
      totalRuns,
      pendingEvents: systemStatus.pendingEvents
    };
  }
} 