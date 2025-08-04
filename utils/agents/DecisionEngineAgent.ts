import { makeOpenAIRequest } from '../openai';
import { SymptomLog, MedicalRecommendation, HealthDomain } from '../../types/recommendations';
import { HealthMemoryContext } from './HealthMemoryAgent';

// ============================================================================
// DECISION ENGINE AGENT - Autonomous Health Decision-Making and Conflict Resolution
// ============================================================================

/**
 * Complete health decision made by the DecisionEngineAgent
 * Includes primary action, reasoning, conflicts, and risk assessment
 */
export interface HealthDecision {
  primaryAction: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reasoning: string;
  conflicts: string[];
  resolvedActions: string[];
  timeline: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

/**
 * Context for making health decisions
 * Includes current symptoms, existing recommendations, memory context, and user input
 */
export interface DecisionContext {
  currentSymptoms: SymptomLog[];
  existingRecommendations: MedicalRecommendation[];
  memoryContext: HealthMemoryContext;
  userInput: string;
}

/**
 * Decision Engine Agent - Makes autonomous health decisions and resolves conflicts
 * 
 * Responsibilities:
 * 1. Analyze current health situation and assess urgency
 * 2. Identify conflicts between existing recommendations
 * 3. Make autonomous decisions based on health context
 * 4. Resolve conflicts and prioritize actions
 * 5. Assess whether action is actually needed
 * 
 * Called during:
 * - Daily symptom processing (every time user records a symptom)
 * - Background processing (1-2 times per day for reassessment)
 */
export class DecisionEngineAgent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Make autonomous health decisions and resolve conflicts
   * 
   * Workflow:
   * 1. Analyze current situation (urgency, primary concern, risk level)
   * 2. Identify conflicts between existing recommendations
   * 3. Assess whether action is actually needed
   * 4. Make autonomous decision if action is needed
   * 5. Resolve conflicts and create action plan
   * 
   * @param context - Decision context with symptoms, recommendations, and memory
   * @returns Complete health decision with reasoning and action plan
   */
  async makeHealthDecision(context: DecisionContext): Promise<HealthDecision> {
    console.log('🧠 DecisionEngineAgent: Making autonomous health decision');
    
    try {
      // Step 1: Analyze current health situation
      const situationAnalysis = await this.analyzeCurrentSituation(context);
      
      // Step 2: Identify conflicts between recommendations
      const conflicts = await this.identifyConflicts(context);
      
      // Step 3: Assess whether action is actually needed
      const actionNeeded = await this.assessActionNeeded(situationAnalysis, context.existingRecommendations);
      
      // Step 4: Make autonomous decision if action is needed
      if (actionNeeded) {
        const decision = await this.makeAutonomousDecision(situationAnalysis, conflicts, context);
        
        // Step 5: Resolve conflicts and create action plan
        const resolvedActions = await this.resolveConflicts(decision, conflicts, context);
        
        return {
          ...decision,
          conflicts: conflicts.map(c => c.description),
          resolvedActions
        };
      } else {
        // No action needed - return monitoring decision
        return this.getMonitoringDecision(context);
      }
    } catch (error) {
      console.error('DecisionEngineAgent error:', error);
      return this.getFallbackDecision(context);
    }
  }

  // ============================================================================
  // SITUATION ANALYSIS
  // ============================================================================

  /**
   * Analyze current health situation to determine urgency and primary concerns
   * 
   * @param context - Decision context
   * @returns Analysis of current situation including urgency and risk level
   */
  private async analyzeCurrentSituation(context: DecisionContext): Promise<{
    urgency: 'urgent' | 'high' | 'medium' | 'low';
    primaryConcern: string;
    contributingFactors: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze current health situation and return JSON with:
          - urgency: one of [urgent, high, medium, low]
          - primaryConcern: main health issue to address
          - contributingFactors: array of contributing factors
          - riskLevel: one of [low, medium, high]`
        },
        { 
          role: 'user', 
          content: `Analyze current situation:
          User input: ${context.userInput}
          Current symptoms: ${context.currentSymptoms.map(s => s.summary).join(', ')}
          Memory context: ${JSON.stringify(context.memoryContext.trends)}`
        }
      ],
      max_tokens: 400,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseSituationAnalysis(content);
  }

  // ============================================================================
  // CONFLICT IDENTIFICATION
  // ============================================================================

  /**
   * Identify conflicts between existing health recommendations
   * 
   * @param context - Decision context
   * @returns Array of identified conflicts with descriptions and resolutions
   */
  private async identifyConflicts(context: DecisionContext): Promise<{
    description: string;
    priority1: string;
    priority2: string;
    resolution: string;
  }[]> {
    // No conflicts if less than 2 recommendations
    if (context.existingRecommendations.length < 2) {
      return [];
    }

    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Identify conflicts between health recommendations and return JSON array with:
          - description: description of the conflict
          - priority1: first conflicting recommendation
          - priority2: second conflicting recommendation
          - resolution: how to resolve the conflict`
        },
        { 
          role: 'user', 
          content: `Identify conflicts between:
          User input: ${context.userInput}
          Existing recommendations: ${context.existingRecommendations.map(r => r.title).join(', ')}`
        }
      ],
      max_tokens: 600,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '[]';
    return this.parseConflicts(content);
  }

  // ============================================================================
  // ACTION ASSESSMENT
  // ============================================================================

  /**
   * Assess whether action is actually needed based on current situation
   * 
   * @param situationAnalysis - Analysis of current health situation
   * @param existingRecommendations - Current recommendations
   * @returns True if action is needed, false if monitoring is sufficient
   */
  private async assessActionNeeded(
    situationAnalysis: any, 
    existingRecommendations: MedicalRecommendation[]
  ): Promise<boolean> {
    // Check if this is a new issue requiring action
    const isNewIssue = !existingRecommendations.some(rec => 
      rec.title.toLowerCase().includes(situationAnalysis.primaryConcern.toLowerCase())
    );
    
    // Check if existing recommendations are being followed
    const hasUncompletedActions = existingRecommendations.some(rec => !rec.isCompleted);
    
    // Check if symptoms are worsening
    const isWorsening = situationAnalysis.urgency === 'urgent' || situationAnalysis.urgency === 'high';
    
    // Only recommend action if:
    // 1. It's a new issue, OR
    // 2. Symptoms are worsening, OR  
    // 3. Existing recommendations aren't being followed
    return isNewIssue || isWorsening || hasUncompletedActions;
  }

  // ============================================================================
  // AUTONOMOUS DECISION MAKING
  // ============================================================================

  /**
   * Make autonomous decision based on situation analysis and conflicts
   * 
   * @param situationAnalysis - Analysis of current health situation
   * @param conflicts - Identified conflicts between recommendations
   * @param context - Decision context
   * @returns Autonomous health decision
   */
  private async makeAutonomousDecision(
    situationAnalysis: any, 
    conflicts: any[], 
    context: DecisionContext
  ): Promise<{
    primaryAction: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    reasoning: string;
    timeline: string;
    riskAssessment: { level: 'low' | 'medium' | 'high'; factors: string[]; };
  }> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Make autonomous health decision and return JSON with:
          - primaryAction: main action to take
          - priority: one of [urgent, high, medium, low]
          - reasoning: explanation for the decision
          - timeline: when to take action
          - riskAssessment: object with level (low/medium/high) and factors (array)`
        },
        { 
          role: 'user', 
          content: `Make decision based on:
          Situation: ${JSON.stringify(situationAnalysis)}
          Conflicts: ${JSON.stringify(conflicts)}
          User input: ${context.userInput}
          Memory context: ${JSON.stringify(context.memoryContext.historicalContext)}`
        }
      ],
      max_tokens: 500,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseDecision(content);
  }

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  /**
   * Resolve conflicts and create action plan
   * 
   * @param decision - Autonomous health decision
   * @param conflicts - Identified conflicts
   * @param context - Decision context
   * @returns Array of resolved actions
   */
  private async resolveConflicts(
    decision: any, 
    conflicts: any[], 
    context: DecisionContext
  ): Promise<string[]> {
    // No conflicts to resolve
    if (conflicts.length === 0) {
      return [decision.primaryAction];
    }

    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Resolve health conflicts and return JSON array of resolved actions`
        },
        { 
          role: 'user', 
          content: `Resolve conflicts:
          Decision: ${JSON.stringify(decision)}
          Conflicts: ${JSON.stringify(conflicts)}
          User input: ${context.userInput}`
        }
      ],
      max_tokens: 400,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '[]';
    return this.parseResolvedActions(content);
  }

  // ============================================================================
  // DECISION TYPES
  // ============================================================================

  /**
   * Get monitoring decision when no action is needed
   * 
   * @param context - Decision context
   * @returns Decision to continue monitoring
   */
  private getMonitoringDecision(context: DecisionContext): HealthDecision {
    return {
      primaryAction: 'Continue monitoring current health patterns',
      priority: 'low',
      reasoning: 'No new action required at this time - current patterns are stable',
      conflicts: [],
      resolvedActions: ['Continue monitoring'],
      timeline: 'Continue current routine',
      riskAssessment: { 
        level: 'low', 
        factors: ['Stable health patterns', 'No new concerns identified'] 
      }
    };
  }

  /**
   * Get fallback decision when AI fails
   * 
   * @param context - Decision context
   * @returns Conservative fallback decision
   */
  private getFallbackDecision(context: DecisionContext): HealthDecision {
    return {
      primaryAction: 'Monitor symptoms and consult healthcare provider if needed',
      priority: 'medium',
      reasoning: 'Conservative approach based on available information',
      conflicts: [],
      resolvedActions: ['Monitor symptoms'],
      timeline: 'Within 24 hours',
      riskAssessment: {
        level: 'low',
        factors: ['Limited information available']
      }
    };
  }

  // ============================================================================
  // PARSING METHODS
  // ============================================================================

  /**
   * Parse situation analysis response
   * 
   * @param content - JSON string from AI response
   * @returns Parsed situation analysis
   */
  private parseSituationAnalysis(content: string): {
    urgency: 'urgent' | 'high' | 'medium' | 'low';
    primaryConcern: string;
    contributingFactors: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    try {
      const data = JSON.parse(content);
      return {
        urgency: data.urgency || 'medium',
        primaryConcern: data.primaryConcern || 'General health concern',
        contributingFactors: data.contributingFactors || [],
        riskLevel: data.riskLevel || 'low'
      };
    } catch (error) {
      console.error('Error parsing situation analysis:', error);
      return {
        urgency: 'medium',
        primaryConcern: 'General health concern',
        contributingFactors: [],
        riskLevel: 'low'
      };
    }
  }

  /**
   * Parse conflicts response
   * 
   * @param content - JSON string from AI response
   * @returns Array of parsed conflicts
   */
  private parseConflicts(content: string): {
    description: string;
    priority1: string;
    priority2: string;
    resolution: string;
  }[] {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error parsing conflicts:', error);
      return [];
    }
  }

  /**
   * Parse decision response
   * 
   * @param content - JSON string from AI response
   * @returns Parsed health decision
   */
  private parseDecision(content: string): {
    primaryAction: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    reasoning: string;
    timeline: string;
    riskAssessment: { level: 'low' | 'medium' | 'high'; factors: string[]; };
  } {
    try {
      const data = JSON.parse(content);
      return {
        primaryAction: data.primaryAction || 'Monitor symptoms',
        priority: data.priority || 'medium',
        reasoning: data.reasoning || 'Based on current symptoms',
        timeline: data.timeline || 'Within 24 hours',
        riskAssessment: {
          level: data.riskAssessment?.level || 'low',
          factors: data.riskAssessment?.factors || []
        }
      };
    } catch (error) {
      console.error('Error parsing decision:', error);
      return {
        primaryAction: 'Monitor symptoms',
        priority: 'medium',
        reasoning: 'Based on current symptoms',
        timeline: 'Within 24 hours',
        riskAssessment: { level: 'low', factors: [] }
      };
    }
  }

  /**
   * Parse resolved actions response
   * 
   * @param content - JSON string from AI response
   * @returns Array of resolved actions
   */
  private parseResolvedActions(content: string): string[] {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error parsing resolved actions:', error);
      return [];
    }
  }
} 