// ============================================================================
// PATTERN ANALYSIS AGENT - Autonomous symptom pattern analysis
// ============================================================================

import { BaseAgent, AgentMessage } from './BaseAgent';
import { SymptomLog, SymptomPattern } from '../../types/recommendations';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PatternAnalysisResult {
  patterns: SymptomPattern[];
  insights: {
    [key: string]: {
      recurringIssues: string[];
      frequencyPatterns: string[];
      severityTrends: string[];
      potentialTriggers: string[];
      timeBasedPatterns: string[];
      riskFactors: string[];
    };
  };
  recommendations: {
    [key: string]: string[];
  };
  crossDomainPatterns: {
    primaryDomain: string;
    secondaryDomain: string;
    interaction: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    highRiskDomains: string[];
    warningSigns: string[];
    recommendedActions: string[];
  };
}

export class PatternAnalysisAgent extends BaseAgent {
  private userId: string;
  private lastAnalysisDate: Date | null = null;

  constructor(userId: string) {
    super({
      id: `pattern-analysis-${userId}`,
      name: 'Pattern Analysis Agent',
      description: 'Autonomously analyzes symptom patterns and identifies trends',
      frequency: 24 * 60 * 60 * 1000, // 24 hours
      isActive: true,
      costPerRun: 0.02
    });
    
    this.userId = userId;
  }

  // ============================================================================
  // AUTONOMOUS TASK EXECUTION
  // ============================================================================

  protected async executeTask(): Promise<void> {
    this.log('Starting autonomous pattern analysis');
    this.runCount++;

    try {
      // Get recent symptom logs
      const recentLogs = await this.getRecentSymptoms(30);
      
      if (recentLogs.length === 0) {
        this.log('No recent symptoms to analyze');
        return;
      }

      // Perform pattern analysis
      const analysis = await this.analyzePatterns(recentLogs);
      
      // Store results
      await this.storeAnalysisResults(analysis);
      
      // Check for significant patterns that require action
      await this.checkForSignificantPatterns(analysis);
      
      // Notify other agents of findings
      await this.notifyOtherAgents(analysis);
      
      this.lastAnalysisDate = new Date();
      this.logCost(this.config.costPerRun);
      this.log('Pattern analysis completed successfully');
      
    } catch (error) {
      this.log(`Error in pattern analysis: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // PATTERN ANALYSIS LOGIC
  // ============================================================================

  private async analyzePatterns(logs: SymptomLog[]): Promise<PatternAnalysisResult> {
    const prompt = `
    Analyze these health logs for comprehensive patterns across ALL health domains:
    ${logs.map(log => `- ${log.healthDomain}: ${log.summary} (${log.severity}, ${log.impact} impact, ${log.timestamp.toLocaleDateString()})`).join('\n')}
    
    Analyze patterns for each health domain:
    
    PHYSICAL INJURY: Sprains, fractures, cuts, burns, accidents
    ILLNESS: Colds, flu, infections, chronic diseases, symptoms
    MENTAL HEALTH: Anxiety, depression, stress, mood swings, emotional states
    WEIGHT MANAGEMENT: Weight changes, body composition, eating patterns
    NUTRITION: Diet issues, food intolerances, eating habits, cravings
    SLEEP: Sleep quality, insomnia, sleep disorders, fatigue
    EXERCISE: Fitness levels, workout injuries, performance, motivation
    REPRODUCTIVE: Periods, pregnancy, fertility, hormonal changes
    CHRONIC CONDITIONS: Diabetes, hypertension, asthma, management
    MEDICATION: Side effects, adherence, interactions, effectiveness
    PREVENTIVE: Vaccinations, screenings, check-ups, health maintenance
    GENERAL WELLNESS: Energy, fatigue, overall health, vitality
    
    Identify for each domain:
    1. Recurring issues and frequency patterns
    2. Severity trends (improving, worsening, stable)
    3. Triggers and related factors
    4. Time-based patterns (daily, weekly, seasonal)
    5. Cross-domain interactions (e.g., stress affecting sleep)
    6. Risk factors and warning signs
    7. Seasonal or cyclical patterns
    
    Return as JSON with:
    - patterns: Array of symptom patterns with healthDomain
    - insights: Key findings for each health domain
    - recommendations: Domain-specific suggested actions
    - crossDomainPatterns: Interactions between different health areas
    - riskAssessment: Overall health risk factors
    `;

    const { makeOpenAIRequest } = await import('../openai');
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a health pattern analyst. Analyze symptom logs and return structured JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.2,
    });
    const analysis = response.choices[0]?.message?.content || '';
    
    return this.parseAnalysisResult(analysis);
  }

  private parseAnalysisResult(analysis: string): PatternAnalysisResult {
    try {
      const parsed = JSON.parse(analysis);
      return {
        patterns: parsed.patterns || [],
        insights: parsed.insights || {},
        recommendations: parsed.recommendations || {},
        crossDomainPatterns: parsed.crossDomainPatterns || [],
        riskAssessment: parsed.riskAssessment || {
          overallRisk: 'low',
          highRiskDomains: [],
          warningSigns: [],
          recommendedActions: []
        }
      };
    } catch (error) {
      this.log('Failed to parse analysis result, using fallback');
      return {
        patterns: [],
        insights: {},
        recommendations: {},
        crossDomainPatterns: [],
        riskAssessment: {
          overallRisk: 'low',
          highRiskDomains: [],
          warningSigns: [],
          recommendedActions: []
        }
      };
    }
  }

  private async storeAnalysisResults(analysis: PatternAnalysisResult): Promise<void> {
    const key = `pattern_analysis_${this.userId}`;
    const data = {
      analysis,
      timestamp: new Date().toISOString(),
      userId: this.userId
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  // ============================================================================
  // SIGNIFICANT PATTERN DETECTION
  // ============================================================================

  private async checkForSignificantPatterns(analysis: PatternAnalysisResult): Promise<void> {
    const significantPatterns = analysis.patterns.filter(pattern => 
      pattern.frequency > 3 || // Frequent symptoms
      pattern.trend === 'worsening' || // Worsening trends
      pattern.severity === 'severe' // High severity
    );

    if (significantPatterns.length > 0) {
      this.log(`Found ${significantPatterns.length} significant patterns`);
      
      // Notify follow-up agent about significant patterns
      await this.sendMessage(
        'follow-up-agent',
        'significant_patterns_detected',
        { patterns: significantPatterns, analysis },
        'high'
      );
    }
  }

  // ============================================================================
  // INTER-AGENT COMMUNICATION
  // ============================================================================

  private async notifyOtherAgents(analysis: PatternAnalysisResult): Promise<void> {
    // Notify user model agent about new insights
    await this.sendMessage(
      'user-model-agent',
      'pattern_insights_available',
      { insights: analysis.insights },
      'medium'
    );

    // Notify recommendation agent about new patterns
    await this.sendMessage(
      'recommendation-agent',
      'new_patterns_available',
      { patterns: analysis.patterns },
      'medium'
    );
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'request_pattern_analysis':
        this.log('Received request for pattern analysis');
        await this.executeTask();
        break;
        
      case 'symptom_log_added':
        this.log('New symptom log added, considering early analysis');
        // If we haven't analyzed recently, do a quick analysis
        if (!this.lastAnalysisDate || 
            Date.now() - this.lastAnalysisDate.getTime() > 6 * 60 * 60 * 1000) {
          await this.executeTask();
        }
        break;
        
      default:
        this.log(`Received unknown message type: ${message.type}`);
    }
  }

  // ============================================================================
  // DATA ACCESS
  // ============================================================================

  private async getRecentSymptoms(days: number): Promise<SymptomLog[]> {
    try {
      const key = `symptom_logs_${this.userId}`;
      const logsJson = await AsyncStorage.getItem(key);
      
      if (!logsJson) return [];
      
      const logs: SymptomLog[] = JSON.parse(logsJson);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      return logs.filter(log => new Date(log.timestamp) >= cutoffDate);
    } catch (error) {
      this.log(`Error getting recent symptoms: ${error}`);
      return [];
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get latest pattern analysis results
   */
  async getLatestAnalysis(): Promise<PatternAnalysisResult | null> {
    try {
      const key = `pattern_analysis_${this.userId}`;
      const dataJson = await AsyncStorage.getItem(key);
      
      if (!dataJson) return null;
      
      const data = JSON.parse(dataJson);
      return data.analysis;
    } catch (error) {
      this.log(`Error getting latest analysis: ${error}`);
      return null;
    }
  }

  /**
   * Force immediate pattern analysis
   */
  async forceAnalysis(): Promise<void> {
    this.log('Forcing immediate pattern analysis');
    await this.executeTask();
  }
} 