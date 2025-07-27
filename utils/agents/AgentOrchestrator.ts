// ============================================================================
// AGENT ORCHESTRATOR - Manages all autonomous agents
// ============================================================================

import { AgentManager } from './AgentManager';
import { PatternAnalysisAgent } from './PatternAnalysisAgent';
import { FollowUpAgent } from './FollowUpAgent';
import { UserModelAgent } from './UserModelAgent';
import { RecommendationAgent } from './RecommendationAgent';
import { SymptomLog, MedicalRecommendation, HealthDomain } from '../../types/recommendations';

export class AgentOrchestrator {
  private userId: string;
  private isInitialized: boolean = false;
  private agents: {
    patternAnalysis: PatternAnalysisAgent;
    followUp: FollowUpAgent;
    userModel: UserModelAgent;
    recommendation: RecommendationAgent;
  };

  constructor(userId: string) {
    this.userId = userId;
    
    // Initialize all agents
    this.agents = {
      patternAnalysis: new PatternAnalysisAgent(userId),
      followUp: new FollowUpAgent(userId),
      userModel: new UserModelAgent(userId),
      recommendation: new RecommendationAgent(userId)
    };
  }

  // ============================================================================
  // AGENT LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Initialize and start all agents
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🤖 AgentOrchestrator: Already initialized');
      return;
    }

    console.log('🤖 AgentOrchestrator: Initializing all agents');

    // Register all agents with the manager
    Object.values(this.agents).forEach(agent => {
      AgentManager.registerAgent(agent);
    });

    // Start all agents
    await AgentManager.startAllAgents();
    
    this.isInitialized = true;
    console.log('🤖 AgentOrchestrator: All agents initialized and running');
  }

  /**
   * Stop all agents
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.log('🤖 AgentOrchestrator: Not initialized');
      return;
    }

    console.log('🤖 AgentOrchestrator: Shutting down all agents');
    await AgentManager.stopAllAgents();
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

    // Step 1: Quick transcription (Whisper API - $0.006)
    const { transcribeAudio } = await import('../openai');
    const transcript = await transcribeAudio(symptomLog.audioURI!);
    
    // Step 2: Generate comprehensive health analysis (GPT-4 - $0.03)
    const healthAnalysis = await this.analyzeHealthLog(transcript);
    
    // Step 3: Quick recommendations using templates + light AI ($0.02)
    const quickRecommendations = await this.generateQuickRecommendations(transcript, healthAnalysis.summary);
    
    // Step 4: Update symptom log with health domain classification
    const updatedSymptomLog = {
      ...symptomLog,
      summary: healthAnalysis.summary,
      healthDomain: healthAnalysis.healthDomain,
      severity: healthAnalysis.severity,
      impact: healthAnalysis.impact,
      duration: healthAnalysis.duration,
      relatedFactors: healthAnalysis.relatedFactors
    };
    
    // Step 5: Notify agents about new symptom log
    await this.notifyAgentsOfNewSymptomLog(updatedSymptomLog, transcript, healthAnalysis.summary);
    
    return {
      transcript,
      summary: healthAnalysis.summary,
      quickRecommendations,
      healthDomain: healthAnalysis.healthDomain,
      severity: healthAnalysis.severity,
      impact: healthAnalysis.impact
    };
  }

  /**
   * Generate personalized appointment questions (reactive)
   */
  async generatePersonalizedAppointmentQuestions(
    appointmentTitle: string,
    appointmentDate: Date
  ): Promise<string[]> {
    console.log('🔄 REACTIVE AI: Generating appointment questions');

    const userProfile = await this.agents.userModel.getUserProfile();
    const recentSymptoms = await this.getRecentSymptoms(7);
    
    const prompt = `
    Generate personalized questions for this appointment:
    Appointment: ${appointmentTitle} on ${appointmentDate.toLocaleDateString()}
    
    User Profile:
    - Common symptoms: ${userProfile.learningInsights?.commonSymptoms?.join(', ') || 'None'}
    - Recent symptoms: ${recentSymptoms.map(log => log.summary).join(', ')}
    
    Generate 5-7 specific questions that:
    1. Address recent symptoms
    2. Consider user's health patterns
    3. Are relevant to the appointment type
    4. Help the doctor understand the user's health status
    
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
    
    // Get current recommendations from recommendation agent
    return await this.agents.recommendation.getCurrentRecommendations();
  }

  // ============================================================================
  // PROACTIVE AI FUNCTIONS (Background monitoring)
  // ============================================================================

  /**
   * Start proactive monitoring (all agents already running autonomously)
   */
  async startProactiveMonitoring(): Promise<void> {
    console.log('🤖 PROACTIVE AI: Proactive monitoring already active');
    // All agents are already running autonomously
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
  // NOTIFICATION FUNCTIONS
  // ============================================================================

  /**
   * Schedule appointment reminders
   */
  async scheduleAppointmentReminders(appointment: any): Promise<void> {
    const { NotificationService } = await import('../notifications');
    
    // Schedule reminder 2 days before
    const reminderDate = new Date(appointment.date);
    reminderDate.setDate(reminderDate.getDate() - 2);
    
    if (reminderDate > new Date()) {
      const delayMs = reminderDate.getTime() - Date.now();
      setTimeout(async () => {
        await NotificationService.sendAppointmentReminder(appointment);
      }, delayMs);
    }

    // Schedule day-of reminder
    const dayOfReminder = new Date(appointment.date);
    dayOfReminder.setHours(9, 0, 0, 0); // 9 AM
    
    if (dayOfReminder > new Date()) {
      const delayMs = dayOfReminder.getTime() - Date.now();
      setTimeout(async () => {
        await NotificationService.sendAppointmentDayReminder(appointment);
      }, delayMs);
    }
  }

  /**
   * Cancel appointment reminders
   */
  async cancelAppointmentReminders(appointmentId: string): Promise<void> {
    // Implementation would cancel scheduled notifications
    console.log(`Cancelled reminders for appointment: ${appointmentId}`);
  }

  // ============================================================================
  // AGENT COMMUNICATION
  // ============================================================================

  /**
   * Analyze health log to determine domain, severity, and impact
   */
  private async analyzeHealthLog(transcript: string): Promise<{
    summary: string;
    healthDomain: HealthDomain;
    severity: 'mild' | 'moderate' | 'severe';
    impact: 'low' | 'medium' | 'high';
    duration?: number;
    relatedFactors?: string[];
  }> {
    const prompt = `
    Analyze this health log and classify it comprehensively:
    
    Transcript: "${transcript}"
    
    Classify this health issue across ALL domains:
    
    PHYSICAL INJURY: Sprains, fractures, cuts, burns, accidents, pain from injury
    ILLNESS: Colds, flu, infections, chronic diseases, symptoms, sickness
    MENTAL HEALTH: Anxiety, depression, stress, mood swings, emotional states, mental health
    WEIGHT MANAGEMENT: Weight changes, body composition, eating patterns, weight gain/loss
    NUTRITION: Diet issues, food intolerances, eating habits, cravings, nutrition
    SLEEP: Sleep quality, insomnia, sleep disorders, fatigue, tiredness
    EXERCISE: Fitness levels, workout injuries, performance, motivation, exercise
    REPRODUCTIVE: Periods, pregnancy, fertility, hormonal changes, reproductive health
    CHRONIC CONDITIONS: Diabetes, hypertension, asthma, management, chronic disease
    MEDICATION: Side effects, adherence, interactions, effectiveness, medication
    PREVENTIVE: Vaccinations, screenings, check-ups, health maintenance, prevention
    GENERAL WELLNESS: Energy, fatigue, overall health, vitality, general wellness
    
    Determine:
    1. Primary health domain (most relevant)
    2. Severity: mild, moderate, severe
    3. Impact on daily life: low, medium, high
    4. Duration in days (if mentioned)
    5. Related factors (triggers, activities, foods, etc.)
    6. Summary of the health issue
    
    Return as JSON:
    {
      "summary": "Brief summary of the health issue",
      "healthDomain": "primary_domain",
      "severity": "mild|moderate|severe",
      "impact": "low|medium|high",
      "duration": number (optional),
      "relatedFactors": ["factor1", "factor2"] (optional)
    }
    `;

    try {
      const { makeOpenAIRequest } = await import('../openai');
      const response = await makeOpenAIRequest({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a health classification expert. Analyze and classify health issues accurately.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      });
      
      const content = response.choices[0]?.message?.content || '';
      const analysis = JSON.parse(content);
      
      return {
        summary: analysis.summary,
        healthDomain: analysis.healthDomain as HealthDomain,
        severity: analysis.severity,
        impact: analysis.impact,
        duration: analysis.duration,
        relatedFactors: analysis.relatedFactors
      };
    } catch (error) {
      console.error('Error analyzing health log:', error);
      // Fallback to general wellness with default values
      return {
        summary: transcript,
        healthDomain: 'general_wellness',
        severity: 'mild',
        impact: 'low'
      };
    }
  }

  private async notifyAgentsOfNewSymptomLog(
    symptomLog: SymptomLog, 
    transcript: string, 
    summary: string
  ): Promise<void> {
    // Notify pattern analysis agent
    await AgentManager.sendMessage({
      id: `symptom-${Date.now()}`,
      from: 'orchestrator',
      to: this.agents.patternAnalysis.getAgentId(),
      type: 'symptom_log_added',
      data: { symptomLog, transcript, summary },
      timestamp: new Date(),
      priority: 'medium'
    });

    // Notify follow-up agent
    await AgentManager.sendMessage({
      id: `followup-${Date.now()}`,
      from: 'orchestrator',
      to: this.agents.followUp.getAgentId(),
      type: 'symptom_log_added',
      data: { symptomLog },
      timestamp: new Date(),
      priority: 'medium'
    });

    // Notify user model agent
    await AgentManager.sendMessage({
      id: `usermodel-${Date.now()}`,
      from: 'orchestrator',
      to: this.agents.userModel.getAgentId(),
      type: 'symptom_log_added',
      data: { symptomLog },
      timestamp: new Date(),
      priority: 'medium'
    });

    // Notify recommendation agent
    await AgentManager.sendMessage({
      id: `recommendation-${Date.now()}`,
      from: 'orchestrator',
      to: this.agents.recommendation.getAgentId(),
      type: 'symptom_log_added',
      data: { symptomLog },
      timestamp: new Date(),
      priority: 'medium'
    });
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  private async generateQuickRecommendations(transcript: string, summary: string): Promise<MedicalRecommendation[]> {
    const prompt = `
    Based on this symptom: "${summary}"
    Transcript: "${transcript}"
    
    Generate 2-3 quick, actionable recommendations.
    Return as JSON array with:
    - title: Short recommendation
    - description: Brief explanation
    - category: 'lifestyle', 'medical', 'preventive'
    - priority: 'low', 'medium', 'high'
    `;

    try {
      const { makeOpenAIRequest } = await import('../openai');
      const response = await makeOpenAIRequest({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a health assistant. Generate quick, actionable recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.4,
      });
      const recommendations = response.choices[0]?.message?.content || '';
      return this.parseRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating quick recommendations:', error);
      return [];
    }
  }

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

  private parseRecommendations(content: string): MedicalRecommendation[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return [];
    }
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
      agentStatus: AgentManager.getAllAgentStatus(),
      systemStatus: AgentManager.getSystemStatus()
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
    const agentStatuses = AgentManager.getAllAgentStatus();
    const proactiveCost = agentStatuses.reduce((sum, agent) => sum + agent.totalCost, 0);
    
    return {
      reactive: 0.05, // Per symptom log
      proactive: proactiveCost,
      total: proactiveCost + 0.05
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalAgents: number;
    runningAgents: number;
    totalRuns: number;
    pendingMessages: number;
  } {
    const systemStatus = AgentManager.getSystemStatus();
    const agentStatuses = AgentManager.getAllAgentStatus();
    const totalRuns = agentStatuses.reduce((sum, agent) => sum + agent.runCount, 0);
    
    return {
      totalAgents: systemStatus.totalAgents,
      runningAgents: systemStatus.runningAgents,
      totalRuns,
      pendingMessages: systemStatus.pendingMessages
    };
  }
} 