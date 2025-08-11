import { transcribeAudio, makeOpenAIRequest } from '../openai';
import { MedicalRecommendation, HealthDomain } from '../../types/recommendations';

// ============================================================================
// SYMPTOM ANALYZER AGENT
// ============================================================================
// 
// PURPOSE: Analyzes individual symptom recordings using AI
// RESPONSIBILITIES: 
// 1. Transcribe audio to text
// 2. Generate comprehensive analysis (summary, classification, severity, impact)
// 3. Provide fallback results if analysis fails
// 
// OPTIMIZATION: Single comprehensive AI call instead of multiple separate calls
// COST: $0.05 per symptom (1 Whisper + 1 GPT-3.5-turbo)

export interface SymptomAnalysisResult {
  transcript: string;
  summary: string;
  recommendations: MedicalRecommendation[];
  healthDomain: HealthDomain;
  severity: 'mild' | 'moderate' | 'severe';
  impact: 'low' | 'medium' | 'high';
}

export class SymptomAnalyzer {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ============================================================================
  // MAIN ANALYSIS METHOD
  // ============================================================================

  /**
   * Analyze symptom recording with comprehensive AI analysis
   * 
   * WORKFLOW:
   * 1. Transcribe audio to text
   * 2. Single comprehensive analysis call (combines summary, classification, severity, impact)
   * 
   * @param audioUri - URI of the recorded symptom audio
   * @returns Complete analysis of the symptom recording
   */
  async analyzeSymptom(audioUri: string): Promise<SymptomAnalysisResult> {
    console.log('🔍 SymptomAnalyzer: Analyzing symptom recording (optimized)');
    
    try {
      // Step 1: Transcribe audio to text
      const transcript = await this.transcribeAudio(audioUri);
      
      // Step 2: Single comprehensive analysis call (combines summary, classification, impact)
      const analysis = await this.comprehensiveAnalysis(transcript);
      
      return {
        transcript,
        summary: analysis.summary,
        recommendations: [], // Recommendations now generated separately
        healthDomain: analysis.healthDomain,
        severity: analysis.severity,
        impact: analysis.impact
      };
    } catch (error) {
      console.error('SymptomAnalyzer error:', error);
      return this.getFallbackResult(audioUri);
    }
  }

  // ============================================================================
  // COMPREHENSIVE ANALYSIS (Optimized - single call)
  // ============================================================================

  /**
   * Comprehensive analysis combining summary, classification, and impact assessment
   * 
   * @param transcript - Transcribed audio text
   * @returns Combined analysis result
   */
  private async comprehensiveAnalysis(transcript: string): Promise<{
    summary: string;
    healthDomain: HealthDomain;
    severity: 'mild' | 'moderate' | 'severe';
    impact: 'low' | 'medium' | 'high';
  }> {
    const response = await makeOpenAIRequest({
      model: 'gpt-3.5-turbo', // Less critical - basic analysis
      messages: [
        {
          role: 'system',
          content: `Analyze the symptom and return JSON with:
          - summary: 5-word summary of the health concern
          - healthDomain: one of [general_wellness, cardiovascular, respiratory, digestive, musculoskeletal, neurological, mental_health, skin, sleep, energy, pain_management, stress_management]
          - severity: one of [mild, moderate, severe]
          - impact: one of [low, medium, high] (impact on daily life)`
        },
        { 
          role: 'user', 
          content: `Analyze symptom: ${transcript}`
        }
      ],
      max_tokens: 200,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(content);
    
    return {
      summary: analysis.summary || 'General health concern',
      healthDomain: analysis.healthDomain || 'general_wellness',
      severity: analysis.severity || 'mild',
      impact: analysis.impact || 'low'
    };
  }

  // ============================================================================
  // AUDIO TRANSCRIPTION
  // ============================================================================

  /**
   * Transcribe audio recording to text
   * 
   * @param audioUri - URI of the recorded audio
   * @returns Transcribed text
   */
  private async transcribeAudio(audioUri: string): Promise<string> {
    try {
      const transcript = await transcribeAudio(audioUri);
      return transcript || 'Unable to transcribe audio';
    } catch (error) {
      console.error('Audio transcription error:', error);
      return 'Unable to transcribe audio';
    }
  }

  // ============================================================================
  // FALLBACK METHODS
  // ============================================================================

  /**
   * Get fallback result when analysis fails
   * 
   * @param audioUri - URI of the recorded audio
   * @returns Basic fallback analysis result
   */
  private getFallbackResult(audioUri: string): SymptomAnalysisResult {
    return {
      transcript: 'Unable to transcribe audio',
      summary: 'General health concern',
      recommendations: [
        {
          id: `rec-${Date.now()}`,
          title: 'Monitor symptoms',
          description: 'Keep track of your symptoms and consult a healthcare provider if they worsen',
          category: 'lifestyle' as any,
          priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
          actionItems: [],
          urgency: 'within days' as 'immediate' | 'within days' | 'within weeks',
          healthDomain: 'general_wellness' as HealthDomain,
          medicalRationale: 'Conservative approach for general health concern',
          symptomsTriggering: ['General health concern'],
          severityIndicators: [],
          followUpRequired: false,
          riskLevel: 'low',
          interventionType: 'self_care' as 'self_care' | 'professional_care' | 'emergency_care',
          createdAt: new Date(),
          isCompleted: false,
          isCancelled: false
        }
      ],
      healthDomain: 'general_wellness' as HealthDomain,
      severity: 'mild',
      impact: 'low'
    };
  }
} 