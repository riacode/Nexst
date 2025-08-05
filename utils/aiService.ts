import { transcribeAudio, generateSummary, makeOpenAIRequest } from './openai';
import { SymptomLog, MedicalRecommendation, HealthDomain, SymptomPattern } from '../types/recommendations';
import { SymptomAnalyzer } from './agents/SymptomAnalyzer';
import { HealthMemoryAgent, HealthMemoryContext } from './agents/HealthMemoryAgent';
import { DecisionEngineAgent, HealthDecision, DecisionContext } from './agents/DecisionEngineAgent';
import { ActionCoordinatorAgent, HealthStrategy, ActionContext } from './agents/ActionCoordinatorAgent';

// ============================================================================
// AUTONOMOUS HEALTH MANAGEMENT SYSTEM - 3-Agent Framework
// ============================================================================

/**
 * Result of processing a single symptom recording
 */
export interface SymptomAnalysis {
  transcript: string;
  summary: string;
  quickRecommendations: MedicalRecommendation[];
  healthDomain: string;
  severity: string;
  impact: string;
}

/**
 * Complete response from autonomous health management system
 * Includes decision, strategy, and memory context from all 3 agents
 */
export interface AutonomousHealthResponse {
  decision: HealthDecision;
  strategy: HealthStrategy;
  memoryContext: HealthMemoryContext;
}

/**
 * Main AI Service that orchestrates the 3-agent autonomous health management system
 * 
 * Agent Responsibilities:
 * - HealthMemoryAgent: Long-term pattern recognition and context management
 * - DecisionEngineAgent: Autonomous health decision-making and conflict resolution  
 * - ActionCoordinatorAgent: Health strategy execution and communication optimization
 */
export class AIService {
  private userId: string;
  private symptomAnalyzer: SymptomAnalyzer;
  private healthMemoryAgent: HealthMemoryAgent;
  private decisionEngineAgent: DecisionEngineAgent;
  private actionCoordinatorAgent: ActionCoordinatorAgent;

  constructor(userId: string) {
    this.userId = userId;
    this.symptomAnalyzer = new SymptomAnalyzer(userId);
    this.healthMemoryAgent = new HealthMemoryAgent(userId);
    this.decisionEngineAgent = new DecisionEngineAgent(userId);
    this.actionCoordinatorAgent = new ActionCoordinatorAgent(userId);
  }

  // ============================================================================
  // AUTONOMOUS HEALTH MANAGEMENT (Primary Function)
  // ============================================================================

  /**
   * Process symptom and provide autonomous health management using 3-agent framework
   * 
   * Workflow:
   * 1. SymptomAnalyzer: Analyzes current symptom recording
   * 2. HealthMemoryAgent: Analyzes patterns and provides historical context
   * 3. DecisionEngineAgent: Makes autonomous decision based on context
   * 4. ActionCoordinatorAgent: Creates strategy and communication plan
   * 
   * @param audioUri - URI of the recorded symptom audio
   * @param allSymptoms - All user's symptom history for context
   * @param existingRecommendations - Current recommendations to avoid duplicates
   * @returns Complete autonomous health response with decision, strategy, and context
   * 
   * COST: $0.15 per call (3 agents working together)
   */
  async processSymptomAutonomously(
    audioUri: string, 
    allSymptoms: SymptomLog[], 
    existingRecommendations: MedicalRecommendation[]
  ): Promise<AutonomousHealthResponse> {
    console.log('🤖 AIService: Processing symptom autonomously with 3-agent framework');
    
    try {
      // Step 1: Analyze current symptom recording
      const symptomAnalysis = await this.symptomAnalyzer.analyzeSymptom(audioUri);
      
      // Step 2: Health Memory Agent - Analyze patterns and provide historical context
      const memoryContext = await this.healthMemoryAgent.analyzeHealthMemory(allSymptoms);
      
      // Step 3: Decision Engine Agent - Make autonomous decision based on context
      const decisionContext: DecisionContext = {
        currentSymptoms: allSymptoms,
        existingRecommendations,
        memoryContext,
        userInput: symptomAnalysis.summary
      };
      const decision = await this.decisionEngineAgent.makeHealthDecision(decisionContext);
      
      // Step 4: Action Coordinator Agent - Create strategy and communication plan
      const actionContext: ActionContext = {
        decision,
        currentSymptoms: allSymptoms,
        existingRecommendations,
        userInput: symptomAnalysis.summary
      };
      const strategy = await this.actionCoordinatorAgent.createHealthStrategy(actionContext);
      
      return {
        decision,
        strategy,
        memoryContext
      };
    } catch (error) {
      console.error('Autonomous health management error:', error);
      throw error;
    }
  }

  // ============================================================================
  // LEGACY FUNCTIONS (Maintained for backward compatibility)
  // ============================================================================

  /**
   * Process new symptom recording (Legacy - single agent approach)
   * 
   * @param audioUri - URI of the recorded symptom audio
   * @returns Basic symptom analysis with quick recommendations
   * 
   * COST: $0.05 per call
   */
  async processSymptom(audioUri: string): Promise<SymptomAnalysis> {
    console.log('🤖 AI: Processing symptom recording (Legacy)');
    
    try {
      const result = await this.symptomAnalyzer.analyzeSymptom(audioUri);
      
      return {
        transcript: result.transcript,
        summary: result.summary,
        quickRecommendations: result.recommendations,
        healthDomain: result.healthDomain,
        severity: result.severity,
        impact: result.impact
      };
    } catch (error) {
      console.error('AI processing error:', error);
      throw error;
    }
  }

  /**
   * Generate appointment questions (Legacy - used when user creates appointment)
   * 
   * @param title - Appointment title/type
   * @param date - Appointment date
   * @returns Array of questions to ask the healthcare provider
   * 
   * COST: $0.05 per call
   */
  async generateAppointmentQuestions(title: string, date: Date): Promise<string[]> {
    console.log('🤖 AI: Generating appointment questions (Legacy)');
    
    try {
      const prompt = `Generate 5 relevant questions for a medical appointment about "${title}" scheduled for ${date.toDateString()}. 
      Focus on symptoms, concerns, and preparation. Return as JSON array.`;
      
      const response = await makeOpenAIRequest({
        model: 'gpt-3.5-turbo', // Less critical - appointment questions
        messages: [
          { role: 'system', content: 'You are a health assistant helping patients prepare for doctor visits.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3
      });
      
      const content = response.choices[0]?.message?.content || '[]';
      return this.parseQuestions(content);
    } catch (error) {
      console.error('Question generation error:', error);
      // Fallback questions if AI fails
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
   * Analyze symptom patterns (Legacy - uses HealthMemoryAgent internally)
   * 
   * @param symptoms - Array of symptom logs to analyze
   * @returns Pattern analysis with trends and recommendations
   * 
   * COST: $0.03 per call
   */
  async analyzePatterns(symptoms: SymptomLog[]): Promise<{
    patterns: SymptomPattern[];
    recommendations: MedicalRecommendation[];
    trends: { overall: 'improving' | 'stable' | 'worsening'; frequency: number; severity: 'mild' | 'moderate' | 'severe'; };
  }> {
    console.log('🤖 AI: Analyzing symptom patterns (Legacy)');
    
    try {
      // Use HealthMemoryAgent for pattern analysis
      const memoryContext = await this.healthMemoryAgent.analyzeHealthMemory(symptoms);
      
      return {
        patterns: memoryContext.patterns,
        recommendations: [], // Will be generated by decision engine when needed
        trends: memoryContext.trends
      };
    } catch (error) {
      console.error('Pattern analysis error:', error);
      return {
        patterns: [],
        recommendations: [],
        trends: { overall: 'stable', frequency: 0, severity: 'mild' }
      };
    }
  }

  /**
   * Generate recommendations from symptom (Optimized - single AI call)
   * 
   * @param symptomLog - The symptom log to analyze
   * @param allSymptoms - All user's symptom history
   * @param existingRecommendations - Current recommendations to avoid duplicates
   * @returns Array of personalized health recommendations
   * 
   * COST: $0.08 per call (single GPT-4 call with comprehensive analysis)
   */
  async generateRecommendationsFromSymptom(
    symptomLog: SymptomLog, 
    allSymptoms: SymptomLog[], 
    existingRecommendations: MedicalRecommendation[]
  ): Promise<MedicalRecommendation[]> {
    console.log('🤖 AI: Generating optimized recommendations from symptom');
    
    try {
      // Single comprehensive AI call that analyzes everything at once
      const response = await makeOpenAIRequest({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a health AI assistant. Generate the RIGHT NUMBER of HIGH-QUALITY recommendations that are SPECIFICALLY tied to the new symptom.
            
            IMPORTANT: Generate exactly the right number of recommendations for this specific problem - not too few, not too many. Focus on the most important next steps that directly address the symptom.
            
            Return JSON array with:
            - title: specific recommendation title
            - description: clear, actionable description
            - priority: one of [HIGH, MEDIUM, LOW] (be conservative - only HIGH if urgent)
            - urgency: one of [immediate, within days, within weeks]
            - category: one of [lifestyle, medication, appointment, monitoring, emergency]
            - medicalRationale: specific explanation of how this addresses the symptom
            - riskLevel: one of [low, medium, high]
            - symptomCorrelation: specific symptom this addresses (use exact symptom summary)
            
            CRITERIA:
            - Must directly address the new symptom
            - Must be actionable and specific
            - Generate the appropriate number of recommendations for this specific problem
            - Include all important next steps, but avoid overwhelming the user
            - Avoid generic "general wellness" recommendations unless directly relevant
            - Only recommend if there's a clear, direct benefit for the specific symptom`
          },
          {
            role: 'user',
            content: `Generate recommendations for this SPECIFIC symptom:
            
            SYMPTOM TO ADDRESS:
            - Summary: "${symptomLog.summary}"
            - Details: ${symptomLog.transcript}
            - Health Domain: ${symptomLog.healthDomain}
            - Severity: ${symptomLog.severity}
            - Impact: ${symptomLog.impact}
            
            REQUIREMENTS:
            - Generate the RIGHT NUMBER of recommendations that DIRECTLY address this specific symptom
            - Each recommendation must have a clear, direct connection to the symptom
            - Focus on actionable steps that will help with this specific issue
            - Include all important next steps, but avoid overwhelming the user
            - Avoid generic wellness advice unless directly relevant to this symptom
            
            EXISTING RECOMMENDATIONS (avoid duplicates):
            ${existingRecommendations.map(r => `- ${r.title}`).join('\n')}`
          }
        ],
        max_tokens: 1200,
        temperature: 0.3
      });
      
      const content = response.choices[0]?.message?.content || '[]';
      const recommendationsData = JSON.parse(content);
      
      // Convert to MedicalRecommendation format
      const recommendations: MedicalRecommendation[] = recommendationsData.map((rec: any, index: number) => ({
        id: `rec-${Date.now()}-${index}`,
        title: rec.title,
        description: rec.description,
        category: rec.category || 'lifestyle',
        priority: rec.priority || 'MEDIUM',
        actionItems: [],
        urgency: rec.urgency || 'within days',
        healthDomain: symptomLog.healthDomain,
        medicalRationale: rec.medicalRationale || rec.description,
        symptomsTriggering: [rec.symptomCorrelation || symptomLog.summary], // Use specific symptom correlation
        severityIndicators: [],
        followUpRequired: false,
        riskLevel: rec.riskLevel || 'low',
        interventionType: rec.category === 'emergency' ? 'emergency_care' : 
                         rec.category === 'appointment' ? 'professional_care' : 'self_care',
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false
      }));
      
      return recommendations;
    } catch (error) {
      console.error('Optimized recommendations error:', error);
      return [];
    }
  }

  /**
   * Get personalized recommendations (Legacy - uses DecisionEngineAgent internally)
   * 
   * @param symptoms - Array of symptom logs to analyze
   * @returns Array of personalized health recommendations
   * 
   * COST: $0.03 per call
   */
  async getPersonalizedRecommendations(symptoms: SymptomLog[]): Promise<MedicalRecommendation[]> {
    console.log('🤖 AI: Generating personalized recommendations (Legacy)');
    
    try {
      // Use decision engine to generate recommendations
      const memoryContext = await this.healthMemoryAgent.analyzeHealthMemory(symptoms);
      
      const decisionContext: DecisionContext = {
        currentSymptoms: symptoms,
        existingRecommendations: [],
        memoryContext,
        userInput: 'Generate recommendations based on symptom history'
      };
      
      const decision = await this.decisionEngineAgent.makeHealthDecision(decisionContext);
      
      // Convert decision to recommendations format
      const recommendations: MedicalRecommendation[] = decision.resolvedActions.map((action, index) => ({
        id: `rec-${Date.now()}-${index}`,
        title: action,
        description: decision.reasoning,
        category: 'lifestyle' as any,
        priority: (decision.priority === 'urgent' ? 'HIGH' : decision.priority === 'high' ? 'HIGH' : decision.priority === 'medium' ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
        actionItems: [],
        urgency: (decision.priority === 'urgent' ? 'immediate' : decision.priority === 'high' ? 'within days' : 'within weeks') as 'immediate' | 'within days' | 'within weeks',
        healthDomain: 'general_wellness' as HealthDomain,
        medicalRationale: decision.reasoning,
        symptomsTriggering: symptoms.map(s => s.summary),
        severityIndicators: [],
        followUpRequired: false,
        riskLevel: decision.riskAssessment.level,
        interventionType: 'self_care' as 'self_care' | 'professional_care' | 'emergency_care',
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false
      }));
      
      return recommendations;
    } catch (error) {
      console.error('Personalized recommendations error:', error);
      return [];
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

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

  /**
   * Remove duplicate recommendations based on title
   * 
   * @param recommendations - Array of recommendations to deduplicate
   * @returns Array with duplicates removed
   */
  private deduplicateRecommendations(recommendations: MedicalRecommendation[]): MedicalRecommendation[] {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = rec.title.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
} 