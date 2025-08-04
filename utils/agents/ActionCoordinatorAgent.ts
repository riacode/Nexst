import { makeOpenAIRequest } from '../openai';
import { SymptomLog, MedicalRecommendation, HealthDomain } from '../../types/recommendations';
import { HealthDecision } from './DecisionEngineAgent';

// ============================================================================
// ACTION COORDINATOR AGENT - Health Strategy Execution and Communication Optimization
// ============================================================================

/**
 * Complete health strategy with timeline, provider recommendations, and communication plan
 * Used for complex health scenarios requiring comprehensive planning
 */
export interface HealthStrategy {
  primaryStrategy: string;
  subStrategies: string[];
  timeline: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  providerRecommendations: {
    type: string;
    reason: string;
    urgency: 'urgent' | 'high' | 'medium' | 'low';
  }[];
  communicationPlan: {
    providerQuestions: string[];
    medicalSummary: string;
    followUpPlan: string;
  };
}

/**
 * Context for creating health strategies
 */
export interface ActionContext {
  decision: HealthDecision;
  currentSymptoms: SymptomLog[];
  existingRecommendations: MedicalRecommendation[];
  userInput: string;
}

/**
 * Action Coordinator Agent - Handles health strategy execution and communication optimization
 * 
 * Responsibilities:
 * 1. Create recommendations from health decisions (daily symptom processing)
 * 2. Generate appointment questions (only when user adds appointment)
 * 3. Create follow-up questions (background processing when needed)
 * 4. Develop comprehensive health strategies (complex scenarios)
 */
export class ActionCoordinatorAgent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ============================================================================
  // RECOMMENDATION GENERATION (Daily symptom processing)
  // ============================================================================

  /**
   * Create health recommendations from autonomous decisions
   * Called during daily symptom processing to convert decisions into actionable recommendations
   * 
   * @param decision - Health decision from DecisionEngineAgent
   * @param existingRecommendations - Current recommendations to avoid duplicates
   * @returns Array of new health recommendations
   */
  async createRecommendations(decision: HealthDecision, existingRecommendations: MedicalRecommendation[]): Promise<MedicalRecommendation[]> {
    console.log('🎯 ActionCoordinatorAgent: Creating recommendations from health decision');
    
    try {
      const newRecommendations: MedicalRecommendation[] = [];
      
      // Convert each resolved action into a recommendation
      for (const action of decision.resolvedActions) {
        // Check if this recommendation already exists to avoid duplicates
        const isDuplicate = await this.checkForDuplicates(action, existingRecommendations);
        
        if (!isDuplicate) {
          const recommendation = this.createRecommendationFromAction(action, decision);
          newRecommendations.push(recommendation);
        }
      }
      
      return newRecommendations;
    } catch (error) {
      console.error('ActionCoordinatorAgent recommendation error:', error);
      return [];
    }
  }

  // ============================================================================
  // APPOINTMENT QUESTIONS (Only when user adds appointment)
  // ============================================================================

  /**
   * Generate provider-specific questions for medical appointments
   * Called only when user creates a new appointment
   * 
   * @param appointmentTitle - Type/title of the appointment
   * @param symptoms - Relevant symptoms for context
   * @returns Array of questions to ask the healthcare provider
   */
  async createAppointmentQuestions(appointmentTitle: string, symptoms: SymptomLog[]): Promise<string[]> {
    console.log('🎯 ActionCoordinatorAgent: Generating appointment questions');
    
    try {
      const response = await makeOpenAIRequest({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Generate 5 relevant questions for a medical appointment about "${appointmentTitle}". 
            Focus on symptoms, concerns, and preparation. Return as JSON array.`
          },
          { 
            role: 'user', 
            content: `Generate questions for appointment: ${appointmentTitle}
            Relevant symptoms: ${symptoms.map(s => s.summary).join(', ')}`
          }
        ],
        max_tokens: 400,
        temperature: 0.2
      });
      
      const content = response.choices[0]?.message?.content || '[]';
      return this.parseQuestions(content);
    } catch (error) {
      console.error('Appointment question generation error:', error);
      // Fallback questions if AI fails
      return [
        "What is causing my symptoms?",
        "What tests do I need?",
        "What are my treatment options?",
        "When should I follow up?",
        "Are there any red flags to watch for?"
      ];
    }
  }

  // ============================================================================
  // FOLLOW-UP QUESTIONS (Background processing when needed)
  // ============================================================================

  /**
   * Generate follow-up questions based on missing updates or overdue recommendations
   * Called during background processing (1-2 times per day) when follow-up is needed
   * 
   * @param missingUpdates - Array of missing updates or overdue items
   * @returns Array of follow-up questions
   */
  async createFollowUpQuestions(missingUpdates: {
    type: 'missing_update' | 'overdue_recommendation' | 'pattern_change';
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[]): Promise<string[]> {
    console.log('🎯 ActionCoordinatorAgent: Generating follow-up questions');
    
    try {
      const questions: string[] = [];
      
      for (const update of missingUpdates) {
        const question = await this.generateFollowUpQuestion(update);
        if (question) {
          questions.push(question);
        }
      }
      
      return questions;
    } catch (error) {
      console.error('Follow-up question generation error:', error);
      return [];
    }
  }

  // ============================================================================
  // COMPREHENSIVE STRATEGY (Complex health scenarios)
  // ============================================================================

  /**
   * Create comprehensive health strategy and communication plan
   * Used for complex health scenarios requiring detailed planning
   * 
   * @param context - Action context with decision and symptoms
   * @returns Complete health strategy with timeline and communication plan
   */
  async createHealthStrategy(context: ActionContext): Promise<HealthStrategy> {
    console.log('🎯 ActionCoordinatorAgent: Creating comprehensive health strategy');
    
    try {
      // Create primary strategy
      const primaryStrategy = await this.createPrimaryStrategy(context);
      
      // Create sub-strategies
      const subStrategies = await this.createSubStrategies(context);
      
      // Create timeline
      const timeline = await this.createTimeline(context);
      
      // Create provider recommendations
      const providerRecommendations = await this.createProviderRecommendations(context);
      
      // Create communication plan
      const communicationPlan = await this.createCommunicationPlan(context);
      
      return {
        primaryStrategy,
        subStrategies,
        timeline,
        providerRecommendations,
        communicationPlan
      };
    } catch (error) {
      console.error('ActionCoordinatorAgent strategy error:', error);
      return this.getFallbackStrategy(context);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Check if a recommendation already exists to avoid duplicates
   * 
   * @param action - Action to check
   * @param existingRecommendations - Current recommendations
   * @returns True if duplicate exists
   */
  private async checkForDuplicates(action: string, existingRecommendations: MedicalRecommendation[]): Promise<boolean> {
    return existingRecommendations.some(existing => 
      existing.title.toLowerCase() === action.toLowerCase() ||
      existing.medicalRationale.toLowerCase().includes(action.toLowerCase())
    );
  }

  /**
   * Create a recommendation from a health decision action
   * 
   * @param action - Action from health decision
   * @param decision - Complete health decision
   * @returns Medical recommendation
   */
  private createRecommendationFromAction(action: string, decision: HealthDecision): MedicalRecommendation {
    return {
      id: `rec-${Date.now()}-${Math.random()}`,
      title: action,
      description: decision.reasoning,
      category: 'lifestyle' as any,
      priority: (decision.priority === 'urgent' ? 'HIGH' : decision.priority === 'high' ? 'HIGH' : decision.priority === 'medium' ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
      actionItems: [],
      urgency: (decision.priority === 'urgent' ? 'immediate' : decision.priority === 'high' ? 'within days' : 'within weeks') as 'immediate' | 'within days' | 'within weeks',
      healthDomain: 'general_wellness' as HealthDomain,
      medicalRationale: decision.reasoning,
      symptomsTriggering: [],
      severityIndicators: [],
      followUpRequired: false,
      riskLevel: decision.riskAssessment.level,
      interventionType: 'self_care' as 'self_care' | 'professional_care' | 'emergency_care',
      createdAt: new Date(),
      isCompleted: false,
      isCancelled: false
    };
  }

  /**
   * Generate a follow-up question for a specific missing update
   * 
   * @param update - Missing update information
   * @returns Follow-up question
   */
  private async generateFollowUpQuestion(update: {
    type: 'missing_update' | 'overdue_recommendation' | 'pattern_change';
    description: string;
    priority: 'high' | 'medium' | 'low';
  }): Promise<string> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate a follow-up question based on the missing update. 
          Make it conversational and specific to the situation.`
        },
        { 
          role: 'user', 
          content: `Generate follow-up question for: ${update.description} (${update.type})`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });
    
    return response.choices[0]?.message?.content || `Can you provide an update on ${update.description}?`;
  }

  /**
   * Parse questions from AI response
   * 
   * @param content - JSON string from AI response
   * @returns Array of questions
   */
  private parseQuestions(content: string): string[] {
    try {
      const questions = JSON.parse(content);
      return Array.isArray(questions) ? questions : [];
    } catch (error) {
      console.error('Error parsing questions:', error);
      return [];
    }
  }

  // ============================================================================
  // COMPREHENSIVE STRATEGY HELPER METHODS
  // ============================================================================

  /**
   * Create primary health strategy
   */
  private async createPrimaryStrategy(context: ActionContext): Promise<string> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create a primary health strategy based on the decision and return as a single sentence`
        },
        { 
          role: 'user', 
          content: `Create strategy for:
          Decision: ${context.decision.primaryAction}
          Reasoning: ${context.decision.reasoning}
          User input: ${context.userInput}
          Priority: ${context.decision.priority}`
        }
      ],
      max_tokens: 100,
      temperature: 0.2
    });
    
    return response.choices[0]?.message?.content || 'Monitor symptoms and consult healthcare provider if needed';
  }

  /**
   * Create sub-strategies
   */
  private async createSubStrategies(context: ActionContext): Promise<string[]> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create 3-5 sub-strategies and return as JSON array of strings`
        },
        { 
          role: 'user', 
          content: `Create sub-strategies for:
          Primary action: ${context.decision.primaryAction}
          Resolved actions: ${context.decision.resolvedActions.join(', ')}
          User input: ${context.userInput}`
        }
      ],
      max_tokens: 300,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '[]';
    return this.parseQuestions(content);
  }

  /**
   * Create timeline for actions
   */
  private async createTimeline(context: ActionContext): Promise<{
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  }> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create timeline and return JSON with:
          - immediate: array of actions to take within 24 hours
          - shortTerm: array of actions to take within 1 week
          - longTerm: array of actions to take within 1 month`
        },
        { 
          role: 'user', 
          content: `Create timeline for:
          Decision: ${context.decision.primaryAction}
          Timeline: ${context.decision.timeline}
          Priority: ${context.decision.priority}
          Resolved actions: ${context.decision.resolvedActions.join(', ')}`
        }
      ],
      max_tokens: 400,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseTimeline(content);
  }

  /**
   * Create provider recommendations
   */
  private async createProviderRecommendations(context: ActionContext): Promise<{
    type: string;
    reason: string;
    urgency: 'urgent' | 'high' | 'medium' | 'low';
  }[]> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create provider recommendations and return JSON array with:
          - type: type of healthcare provider
          - reason: why this provider is recommended
          - urgency: one of [urgent, high, medium, low]`
        },
        { 
          role: 'user', 
          content: `Create provider recommendations for:
          Decision: ${context.decision.primaryAction}
          Priority: ${context.decision.priority}
          Risk assessment: ${JSON.stringify(context.decision.riskAssessment)}
          Current symptoms: ${context.currentSymptoms.map(s => s.summary).join(', ')}`
        }
      ],
      max_tokens: 400,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '[]';
    return this.parseProviderRecommendations(content);
  }

  /**
   * Create communication plan
   */
  private async createCommunicationPlan(context: ActionContext): Promise<{
    providerQuestions: string[];
    medicalSummary: string;
    followUpPlan: string;
  }> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create communication plan and return JSON with:
          - providerQuestions: array of 5 questions to ask healthcare provider
          - medicalSummary: brief medical summary for provider
          - followUpPlan: plan for follow-up care`
        },
        { 
          role: 'user', 
          content: `Create communication plan for:
          Decision: ${context.decision.primaryAction}
          Current symptoms: ${context.currentSymptoms.map(s => s.summary).join(', ')}
          Priority: ${context.decision.priority}
          Provider recommendations: ${context.decision.resolvedActions.join(', ')}`
        }
      ],
      max_tokens: 600,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseCommunicationPlan(content);
  }

  // ============================================================================
  // PARSING METHODS
  // ============================================================================

  /**
   * Parse timeline response
   */
  private parseTimeline(content: string): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    try {
      const data = JSON.parse(content);
      return {
        immediate: data.immediate || [],
        shortTerm: data.shortTerm || [],
        longTerm: data.longTerm || []
      };
    } catch (error) {
      console.error('Error parsing timeline:', error);
      return {
        immediate: [],
        shortTerm: [],
        longTerm: []
      };
    }
  }

  /**
   * Parse provider recommendations response
   */
  private parseProviderRecommendations(content: string): {
    type: string;
    reason: string;
    urgency: 'urgent' | 'high' | 'medium' | 'low';
  }[] {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error parsing provider recommendations:', error);
      return [];
    }
  }

  /**
   * Parse communication plan response
   */
  private parseCommunicationPlan(content: string): {
    providerQuestions: string[];
    medicalSummary: string;
    followUpPlan: string;
  } {
    try {
      const data = JSON.parse(content);
      return {
        providerQuestions: data.providerQuestions || [],
        medicalSummary: data.medicalSummary || 'General health consultation needed',
        followUpPlan: data.followUpPlan || 'Monitor symptoms and follow up as needed'
      };
    } catch (error) {
      console.error('Error parsing communication plan:', error);
      return {
        providerQuestions: [],
        medicalSummary: 'General health consultation needed',
        followUpPlan: 'Monitor symptoms and follow up as needed'
      };
    }
  }

  /**
   * Get fallback strategy when AI fails
   */
  private getFallbackStrategy(context: ActionContext): HealthStrategy {
    return {
      primaryStrategy: 'Monitor symptoms and consult healthcare provider if needed',
      subStrategies: [
        'Track symptoms daily',
        'Maintain current medications',
        'Follow up with healthcare provider'
      ],
      timeline: {
        immediate: ['Monitor symptoms'],
        shortTerm: ['Schedule healthcare appointment'],
        longTerm: ['Follow up care plan']
      },
      providerRecommendations: [
        {
          type: 'Primary Care Physician',
          reason: 'General health assessment',
          urgency: 'medium'
        }
      ],
      communicationPlan: {
        providerQuestions: [
          'What is causing my symptoms?',
          'What tests do I need?',
          'What are my treatment options?',
          'When should I follow up?',
          'Are there any red flags to watch for?'
        ],
        medicalSummary: 'Patient reporting symptoms requiring medical evaluation',
        followUpPlan: 'Schedule follow-up appointment based on provider recommendations'
      }
    };
  }
} 