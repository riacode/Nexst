// ============================================================================
// SYMPTOM ANALYSIS AGENT - Processes Audio and Generates Health Insights
// ============================================================================

import { MicroAgent, AgentConfig, AgentResult } from './MicroAgent';
import { SymptomLog, HealthDomain } from '../../types/recommendations';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalysisResult {
  transcript: string;
  summary: string;
  healthDomain: HealthDomain;
  severity: 'mild' | 'moderate' | 'severe';
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
  relatedFactors?: string[];
}

export class SymptomAnalysisAgent extends MicroAgent {
  private userId: string;

  constructor(userId: string) {
    const config: AgentConfig = {
      id: `symptom-analysis-${userId}`,
      name: 'Symptom Analysis Agent',
      description: 'Analyzes audio recordings and generates health insights',
      maxRuntime: 20000, // 20 seconds (iOS background task limit)
      costPerRun: 0.05, // $0.05 per analysis
      isActive: true
    };
    
    super(config);
    this.userId = userId;
  }

  protected async executeTask(): Promise<AgentResult> {
    this.log('Starting symptom analysis');
    
    try {
      // Get the latest symptom log that needs processing
      const symptomLog = await this.getLatestUnprocessedSymptom();
      
      if (!symptomLog) {
        this.log('No unprocessed symptoms found');
        return {
          success: true,
          data: null,
          cost: 0,
          runtime: 0
        };
      }

      // Check cache first
      const cachedResult = await this.getCachedAnalysis(symptomLog);
      if (cachedResult) {
        this.log('Using cached analysis result');
        return {
          success: true,
          data: cachedResult,
          cost: 0, // No cost for cached results
          runtime: 0
        };
      }

      // Process the symptom log
      const analysis = await this.analyzeSymptom(symptomLog);
      
      // Cache the result
      await this.cacheAnalysis(symptomLog, analysis);
      
      // Update the symptom log with analysis results
      await this.updateSymptomLog(symptomLog.id, analysis);
      
      this.log('Symptom analysis completed successfully');
      return {
        success: true,
        data: analysis,
        cost: this.config.costPerRun,
        runtime: 0
      };

    } catch (error) {
      this.log(`Error in symptom analysis: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0,
        runtime: 0
      };
    }
  }

  // ============================================================================
  // CORE ANALYSIS LOGIC
  // ============================================================================

  private async analyzeSymptom(symptomLog: SymptomLog): Promise<AnalysisResult> {
    if (!symptomLog.audioURI) {
      throw new Error('No audio URI provided for analysis');
    }

    // Step 1: Transcribe audio
    const transcript = await this.transcribeAudio(symptomLog.audioURI);
    
    // Step 2: Generate health analysis
    const healthAnalysis = await this.generateHealthAnalysis(transcript);
    
    // Step 3: Generate recommendations
    const recommendations = await this.generateRecommendations(transcript, healthAnalysis);
    
    return {
      transcript,
      summary: healthAnalysis.summary,
      healthDomain: healthAnalysis.healthDomain,
      severity: healthAnalysis.severity,
      impact: healthAnalysis.impact,
      recommendations,
      relatedFactors: healthAnalysis.relatedFactors
    };
  }

  private async transcribeAudio(audioUri: string): Promise<string> {
    try {
      const { transcribeAudio } = await import('../openai');
      return await transcribeAudio(audioUri);
    } catch (error) {
      this.log(`Transcription error: ${error}`);
      throw new Error('Failed to transcribe audio');
    }
  }

  private async generateHealthAnalysis(transcript: string): Promise<{
    summary: string;
    healthDomain: HealthDomain;
    severity: 'mild' | 'moderate' | 'severe';
    impact: 'low' | 'medium' | 'high';
    relatedFactors?: string[];
  }> {
    const prompt = `
    Analyze this health symptom and classify it comprehensively:
    
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
    4. Related factors (triggers, activities, foods, etc.)
    5. Summary of the health issue (5 words or less)
    
    Return as JSON:
    {
      "summary": "Brief summary of the health issue",
      "healthDomain": "primary_domain",
      "severity": "mild|moderate|severe",
      "impact": "low|medium|high",
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
        relatedFactors: analysis.relatedFactors
      };
    } catch (error) {
      this.log(`Health analysis error: ${error}`);
      // Fallback to general wellness with default values
      return {
        summary: transcript.substring(0, 50) + '...',
        healthDomain: 'general_wellness',
        severity: 'mild',
        impact: 'low'
      };
    }
  }

  private async generateRecommendations(transcript: string, healthAnalysis: any): Promise<string[]> {
    const prompt = `
    Based on this symptom: "${healthAnalysis.summary}"
    Transcript: "${transcript}"
    Health Domain: ${healthAnalysis.healthDomain}
    Severity: ${healthAnalysis.severity}
    Impact: ${healthAnalysis.impact}
    
    Generate 2-3 quick, actionable recommendations.
    Focus on immediate actions the user can take.
    
    Return as JSON array of recommendation strings.
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
        max_tokens: 200,
        temperature: 0.4,
      });
      const recommendations = response.choices[0]?.message?.content || '';
      return this.parseRecommendations(recommendations);
    } catch (error) {
      this.log(`Recommendation generation error: ${error}`);
      return [
        'Monitor your symptoms and track any changes',
        'Consider consulting with a healthcare provider if symptoms persist'
      ];
    }
  }

  // ============================================================================
  // CACHING SYSTEM
  // ============================================================================

  private async getCachedAnalysis(symptomLog: SymptomLog): Promise<AnalysisResult | null> {
    try {
      const cacheKey = `analysis_cache_${this.userId}_${symptomLog.id}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const cacheAge = Date.now() - data.timestamp;
      
      // Cache expires after 24 hours
      if (cacheAge > 24 * 60 * 60 * 1000) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return data.analysis;
    } catch (error) {
      this.log(`Cache retrieval error: ${error}`);
      return null;
    }
  }

  private async cacheAnalysis(symptomLog: SymptomLog, analysis: AnalysisResult): Promise<void> {
    try {
      const cacheKey = `analysis_cache_${this.userId}_${symptomLog.id}`;
      const data = {
        analysis,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      this.log(`Cache storage error: ${error}`);
    }
  }

  // ============================================================================
  // DATA ACCESS
  // ============================================================================

  private async getLatestUnprocessedSymptom(): Promise<SymptomLog | null> {
    try {
      const key = `symptom_logs_${this.userId}`;
      const logsJson = await AsyncStorage.getItem(key);
      
      if (!logsJson) return null;
      
      const logs: SymptomLog[] = JSON.parse(logsJson);
      
      // Find the most recent log that hasn't been processed
      const unprocessedLog = logs.find(log => 
        log.audioURI && (!log.transcript || log.transcript === '')
      );
      
      return unprocessedLog || null;
    } catch (error) {
      this.log(`Error getting unprocessed symptoms: ${error}`);
      return null;
    }
  }

  private async updateSymptomLog(logId: string, analysis: AnalysisResult): Promise<void> {
    try {
      const key = `symptom_logs_${this.userId}`;
      const logsJson = await AsyncStorage.getItem(key);
      
      if (!logsJson) return;
      
      const logs: SymptomLog[] = JSON.parse(logsJson);
      const updatedLogs = logs.map(log => {
        if (log.id === logId) {
          return {
            ...log,
            transcript: analysis.transcript,
            summary: analysis.summary,
            healthDomain: analysis.healthDomain,
            severity: analysis.severity,
            impact: analysis.impact,
            relatedFactors: analysis.relatedFactors
          };
        }
        return log;
      });
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedLogs));
    } catch (error) {
      this.log(`Error updating symptom log: ${error}`);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private parseRecommendations(content: string): string[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.log(`Error parsing recommendations: ${error}`);
      return [];
    }
  }
} 