import { makeOpenAIRequest } from '../openai';
import { SymptomLog, SymptomPattern, HealthDomain } from '../../types/recommendations';

// ============================================================================
// HEALTH MEMORY AGENT - Long-term Pattern Recognition and Context Management
// ============================================================================

/**
 * Complete health memory context with patterns, trends, and historical insights
 * Used by other agents to make informed decisions
 */
export interface HealthMemoryContext {
  patterns: SymptomPattern[];
  trends: {
    overall: 'improving' | 'stable' | 'worsening';
    frequency: number;
    severity: 'mild' | 'moderate' | 'severe';
  };
  historicalContext: {
    recurringIssues: string[];
    seasonalPatterns: string[];
    lifestyleFactors: string[];
    triggerPatterns: string[];
  };
  healthSummary: {
    primaryConcerns: string[];
    improvementAreas: string[];
    stableAreas: string[];
  };
}

/**
 * Health Memory Agent - Analyzes long-term health patterns and provides historical context
 * 
 * Responsibilities:
 * 1. Detect complex patterns in symptom history over time
 * 2. Identify recurring health issues and seasonal patterns
 * 3. Analyze lifestyle factors and trigger patterns
 * 4. Provide historical context for decision-making
 * 5. Track health trends and improvements
 * 
 * Called during:
 * - Daily symptom processing (provides context for decisions)
 * - Background processing (weekly/monthly pattern analysis)
 * - Complex health scenario analysis
 */
export class HealthMemoryAgent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Analyze health memory and provide comprehensive context
   * 
   * Workflow:
   * 1. Detect patterns in symptom history
   * 2. Analyze health trends over time
   * 3. Identify recurring issues and seasonal patterns
   * 4. Analyze lifestyle factors and triggers
   * 5. Create health summary and context
   * 
   * @param symptoms - Complete symptom history to analyze
   * @returns Comprehensive health memory context for other agents
   */
  async analyzeHealthMemory(symptoms: SymptomLog[]): Promise<HealthMemoryContext> {
    console.log('🧠 HealthMemoryAgent: Analyzing health memory and patterns');
    
    try {
      // Step 1: Detect patterns in symptom history
      const patterns = await this.detectPatterns(symptoms);
      
      // Step 2: Analyze health trends over time
      const trends = await this.analyzeTrends(symptoms);
      
      // Step 3: Identify recurring issues and seasonal patterns
      const historicalContext = await this.analyzeHistoricalContext(symptoms);
      
      // Step 4: Create health summary
      const healthSummary = await this.createHealthSummary(symptoms, patterns, trends);
      
      return {
        patterns,
        trends,
        historicalContext,
        healthSummary
      };
    } catch (error) {
      console.error('HealthMemoryAgent error:', error);
      return this.getFallbackContext(symptoms);
    }
  }

  // ============================================================================
  // PATTERN DETECTION
  // ============================================================================

  /**
   * Detect complex patterns in symptom history
   * 
   * @param symptoms - Array of symptom logs to analyze
   * @returns Array of detected symptom patterns
   */
  private async detectPatterns(symptoms: SymptomLog[]): Promise<SymptomPattern[]> {
    // Need at least 3 symptoms to detect patterns
    if (symptoms.length < 3) {
      return [];
    }

    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze symptom patterns and return JSON array with:
          - symptom: symptom name
          - healthDomain: health domain
          - frequency: how often it occurs
          - averageDuration: typical duration
          - severity: typical severity level
          - trend: improving/stable/worsening
          - triggers: potential triggers
          - impact: impact on daily life`
        },
        { 
          role: 'user', 
          content: `Detect patterns in symptoms:
          ${symptoms.map(s => `${s.summary}: ${s.transcript} (${s.severity} severity, ${s.healthDomain})`).join('\n')}`
        }
      ],
      max_tokens: 800,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '[]';
    return this.parsePatterns(content);
  }

  // ============================================================================
  // TREND ANALYSIS
  // ============================================================================

  /**
   * Analyze health trends over time
   * 
   * @param symptoms - Array of symptom logs to analyze
   * @returns Health trends including overall direction, frequency, and severity
   */
  private async analyzeTrends(symptoms: SymptomLog[]): Promise<{
    overall: 'improving' | 'stable' | 'worsening';
    frequency: number;
    severity: 'mild' | 'moderate' | 'severe';
  }> {
    // Need at least 2 symptoms to analyze trends
    if (symptoms.length < 2) {
      return { overall: 'stable', frequency: 0, severity: 'mild' };
    }

    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze health trends and return JSON with:
          - overall: one of [improving, stable, worsening]
          - frequency: number of symptoms per week (average)
          - severity: one of [mild, moderate, severe]`
        },
        { 
          role: 'user', 
          content: `Analyze trends in symptoms:
          ${symptoms.map(s => `${s.summary} (${s.severity})`).join('\n')}`
        }
      ],
      max_tokens: 200,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseTrends(content);
  }

  // ============================================================================
  // HISTORICAL CONTEXT ANALYSIS
  // ============================================================================

  /**
   * Analyze historical context including recurring issues and seasonal patterns
   * 
   * @param symptoms - Array of symptom logs to analyze
   * @returns Historical context with recurring issues, seasonal patterns, and lifestyle factors
   */
  private async analyzeHistoricalContext(symptoms: SymptomLog[]): Promise<{
    recurringIssues: string[];
    seasonalPatterns: string[];
    lifestyleFactors: string[];
    triggerPatterns: string[];
  }> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze historical context and return JSON with:
          - recurringIssues: array of recurring health issues
          - seasonalPatterns: array of seasonal patterns
          - lifestyleFactors: array of lifestyle factors affecting health
          - triggerPatterns: array of trigger patterns`
        },
        { 
          role: 'user', 
          content: `Analyze historical context:
          ${symptoms.map(s => `${s.summary}: ${s.transcript}`).join('\n')}`
        }
      ],
      max_tokens: 600,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseHistoricalContext(content);
  }

  // ============================================================================
  // HEALTH SUMMARY
  // ============================================================================

  /**
   * Create comprehensive health summary
   * 
   * @param symptoms - Array of symptom logs
   * @param patterns - Detected symptom patterns
   * @param trends - Health trends
   * @returns Health summary with primary concerns and improvement areas
   */
  private async createHealthSummary(
    symptoms: SymptomLog[], 
    patterns: SymptomPattern[], 
    trends: any
  ): Promise<{
    primaryConcerns: string[];
    improvementAreas: string[];
    stableAreas: string[];
  }> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create health summary and return JSON with:
          - primaryConcerns: array of main health concerns
          - improvementAreas: array of areas showing improvement
          - stableAreas: array of stable health areas`
        },
        { 
          role: 'user', 
          content: `Create health summary:
          Symptoms: ${symptoms.map(s => s.summary).join(', ')}
          Patterns: ${patterns.map(p => p.symptom).join(', ')}
          Trends: ${JSON.stringify(trends)}`
        }
      ],
      max_tokens: 400,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseHealthSummary(content);
  }

  // ============================================================================
  // FALLBACK METHODS
  // ============================================================================

  /**
   * Get fallback context when AI analysis fails
   * 
   * @param symptoms - Array of symptom logs
   * @returns Basic fallback health memory context
   */
  private getFallbackContext(symptoms: SymptomLog[]): HealthMemoryContext {
    return {
      patterns: [],
      trends: { overall: 'stable', frequency: 0, severity: 'mild' },
      historicalContext: {
        recurringIssues: [],
        seasonalPatterns: [],
        lifestyleFactors: [],
        triggerPatterns: []
      },
      healthSummary: {
        primaryConcerns: symptoms.length > 0 ? [symptoms[symptoms.length - 1].summary] : [],
        improvementAreas: [],
        stableAreas: []
      }
    };
  }

  // ============================================================================
  // PARSING METHODS
  // ============================================================================

  /**
   * Parse patterns from AI response
   * 
   * @param content - JSON string from AI response
   * @returns Array of parsed symptom patterns
   */
  private parsePatterns(content: string): SymptomPattern[] {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error parsing patterns:', error);
      return [];
    }
  }

  /**
   * Parse trends from AI response
   * 
   * @param content - JSON string from AI response
   * @returns Parsed health trends
   */
  private parseTrends(content: string): {
    overall: 'improving' | 'stable' | 'worsening';
    frequency: number;
    severity: 'mild' | 'moderate' | 'severe';
  } {
    try {
      const data = JSON.parse(content);
      return {
        overall: data.overall || 'stable',
        frequency: data.frequency || 0,
        severity: data.severity || 'mild'
      };
    } catch (error) {
      console.error('Error parsing trends:', error);
      return { overall: 'stable', frequency: 0, severity: 'mild' };
    }
  }

  /**
   * Parse historical context from AI response
   * 
   * @param content - JSON string from AI response
   * @returns Parsed historical context
   */
  private parseHistoricalContext(content: string): {
    recurringIssues: string[];
    seasonalPatterns: string[];
    lifestyleFactors: string[];
    triggerPatterns: string[];
  } {
    try {
      const data = JSON.parse(content);
      return {
        recurringIssues: data.recurringIssues || [],
        seasonalPatterns: data.seasonalPatterns || [],
        lifestyleFactors: data.lifestyleFactors || [],
        triggerPatterns: data.triggerPatterns || []
      };
    } catch (error) {
      console.error('Error parsing historical context:', error);
      return {
        recurringIssues: [],
        seasonalPatterns: [],
        lifestyleFactors: [],
        triggerPatterns: []
      };
    }
  }

  /**
   * Parse health summary from AI response
   * 
   * @param content - JSON string from AI response
   * @returns Parsed health summary
   */
  private parseHealthSummary(content: string): {
    primaryConcerns: string[];
    improvementAreas: string[];
    stableAreas: string[];
  } {
    try {
      const data = JSON.parse(content);
      return {
        primaryConcerns: data.primaryConcerns || [],
        improvementAreas: data.improvementAreas || [],
        stableAreas: data.stableAreas || []
      };
    } catch (error) {
      console.error('Error parsing health summary:', error);
      return {
        primaryConcerns: [],
        improvementAreas: [],
        stableAreas: []
      };
    }
  }
} 