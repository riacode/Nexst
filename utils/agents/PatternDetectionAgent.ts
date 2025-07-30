// ============================================================================
// PATTERN DETECTION AGENT - Analyzes Symptom Patterns and Trends
// ============================================================================

import { MicroAgent, AgentConfig, AgentResult } from './MicroAgent';
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
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    highRiskDomains: string[];
    warningSigns: string[];
    recommendedActions: string[];
  };
}

export class PatternDetectionAgent extends MicroAgent {
  private userId: string;
  private lastAnalysisDate: Date | null = null;

  constructor(userId: string) {
    const config: AgentConfig = {
      id: `pattern-detection-${userId}`,
      name: 'Pattern Detection Agent',
      description: 'Analyzes symptom patterns and identifies health trends',
      maxRuntime: 15000, // 15 seconds (iOS background task limit)
      costPerRun: 0.02, // $0.02 per analysis
      isActive: true
    };
    
    super(config);
    this.userId = userId;
  }

  protected async executeTask(): Promise<AgentResult> {
    this.log('Starting pattern analysis');
    
    try {
      // Check if we should run analysis (once per day)
      if (this.shouldSkipAnalysis()) {
        this.log('Skipping analysis - already completed today');
        return {
          success: true,
          data: null,
          cost: 0,
          runtime: 0
        };
      }

      // Get recent symptom logs
      const recentLogs = await this.getRecentSymptoms(30);
      
      if (recentLogs.length < 3) {
        this.log('Insufficient data for pattern analysis (need at least 3 logs)');
        return {
          success: true,
          data: null,
          cost: 0,
          runtime: 0
        };
      }

      // Check cache first
      const cachedResult = await this.getCachedAnalysis(recentLogs);
      if (cachedResult) {
        this.log('Using cached pattern analysis');
        this.lastAnalysisDate = new Date();
        return {
          success: true,
          data: cachedResult,
          cost: 0, // No cost for cached results
          runtime: 0
        };
      }

      // Perform pattern analysis
      const analysis = await this.analyzePatterns(recentLogs);
      
      // Cache the result
      await this.cacheAnalysis(recentLogs, analysis);
      
      // Store results
      await this.storeAnalysisResults(analysis);
      
      // Check for significant patterns that require action
      await this.checkForSignificantPatterns(analysis);
      
      this.lastAnalysisDate = new Date();
      this.log('Pattern analysis completed successfully');
      
      return {
        success: true,
        data: analysis,
        cost: this.config.costPerRun,
        runtime: 0
      };

    } catch (error) {
      this.log(`Error in pattern analysis: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0,
        runtime: 0
      };
    }
  }

  // ============================================================================
  // ANALYSIS LOGIC
  // ============================================================================

  private shouldSkipAnalysis(): boolean {
    if (!this.lastAnalysisDate) return false;
    
    const now = new Date();
    const lastAnalysis = this.lastAnalysisDate;
    const hoursSinceLastAnalysis = (now.getTime() - lastAnalysis.getTime()) / (1000 * 60 * 60);
    
    // Only run once per day
    return hoursSinceLastAnalysis < 24;
  }

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
    - riskAssessment: Overall health risk factors
    `;

    try {
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
    } catch (error) {
      this.log(`Pattern analysis error: ${error}`);
      return this.getFallbackAnalysis();
    }
  }

  private parseAnalysisResult(analysis: string): PatternAnalysisResult {
    try {
      const parsed = JSON.parse(analysis);
      return {
        patterns: parsed.patterns || [],
        insights: parsed.insights || {},
        recommendations: parsed.recommendations || {},
        riskAssessment: parsed.riskAssessment || {
          overallRisk: 'low',
          highRiskDomains: [],
          warningSigns: [],
          recommendedActions: []
        }
      };
    } catch (error) {
      this.log('Failed to parse analysis result, using fallback');
      return this.getFallbackAnalysis();
    }
  }

  private getFallbackAnalysis(): PatternAnalysisResult {
    return {
      patterns: [],
      insights: {},
      recommendations: {},
      riskAssessment: {
        overallRisk: 'low',
        highRiskDomains: [],
        warningSigns: [],
        recommendedActions: []
      }
    };
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
      
      // Store significant patterns for other agents to use
      await this.storeSignificantPatterns(significantPatterns);
      
      // Trigger follow-up agent if needed
      await this.triggerFollowUpAgent(significantPatterns);
    }
  }

  private async triggerFollowUpAgent(patterns: SymptomPattern[]): Promise<void> {
    try {
      const { MicroAgentManager } = await import('./MicroAgentManager');
      await MicroAgentManager.triggerEvent({
        id: `followup-${Date.now()}`,
        type: 'significant_patterns_detected',
        data: { patterns },
        timestamp: new Date(),
        priority: 'high'
      });
      this.log(`Triggered follow-up event for ${patterns.length} significant patterns`);
    } catch (error) {
      this.log(`Error triggering follow-up event: ${error}`);
    }
  }

  // ============================================================================
  // CACHING SYSTEM
  // ============================================================================

  private async getCachedAnalysis(logs: SymptomLog[]): Promise<PatternAnalysisResult | null> {
    try {
      // Create a hash of the logs for caching
      const logsHash = this.createLogsHash(logs);
      const cacheKey = `pattern_cache_${this.userId}_${logsHash}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const cacheAge = Date.now() - data.timestamp;
      
      // Cache expires after 12 hours
      if (cacheAge > 12 * 60 * 60 * 1000) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return data.analysis;
    } catch (error) {
      this.log(`Cache retrieval error: ${error}`);
      return null;
    }
  }

  private async cacheAnalysis(logs: SymptomLog[], analysis: PatternAnalysisResult): Promise<void> {
    try {
      const logsHash = this.createLogsHash(logs);
      const cacheKey = `pattern_cache_${this.userId}_${logsHash}`;
      const data = {
        analysis,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      this.log(`Cache storage error: ${error}`);
    }
  }

  private createLogsHash(logs: SymptomLog[]): string {
    // Create a simple hash based on log IDs and timestamps
    const hashData = logs.map(log => `${log.id}-${log.timestamp.getTime()}`).join('|');
    return hashData.length.toString(); // Simple hash for now
  }

  // ============================================================================
  // DATA STORAGE
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

  private async storeAnalysisResults(analysis: PatternAnalysisResult): Promise<void> {
    try {
      const key = `pattern_analysis_${this.userId}`;
      const data = {
        analysis,
        timestamp: new Date().toISOString(),
        userId: this.userId
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      this.log(`Error storing analysis results: ${error}`);
    }
  }

  private async storeSignificantPatterns(patterns: SymptomPattern[]): Promise<void> {
    try {
      const key = `significant_patterns_${this.userId}`;
      const data = {
        patterns,
        timestamp: new Date().toISOString(),
        userId: this.userId
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      this.log(`Error storing significant patterns: ${error}`);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

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

  async getSignificantPatterns(): Promise<SymptomPattern[]> {
    try {
      const key = `significant_patterns_${this.userId}`;
      const dataJson = await AsyncStorage.getItem(key);
      
      if (!dataJson) return [];
      
      const data = JSON.parse(dataJson);
      return data.patterns || [];
    } catch (error) {
      this.log(`Error getting significant patterns: ${error}`);
      return [];
    }
  }

  async forceAnalysis(): Promise<void> {
    this.log('Forcing immediate pattern analysis');
    this.lastAnalysisDate = null; // Reset to force analysis
    await this.execute();
  }
} 