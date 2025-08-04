import { transcribeAudio, generateSummary, makeOpenAIRequest } from '../openai';
import { SymptomLog, MedicalRecommendation, HealthDomain } from '../../types/recommendations';

// ============================================================================
// SYMPTOM ANALYZER - Individual Symptom Recording Analysis
// ============================================================================

/**
 * Result of analyzing a single symptom recording
 * Includes transcription, summary, recommendations, and health classification
 */
export interface SymptomAnalysisResult {
  transcript: string;
  summary: string;
  recommendations: MedicalRecommendation[];
  healthDomain: HealthDomain;
  severity: 'mild' | 'moderate' | 'severe';
  impact: 'low' | 'medium' | 'high';
}

/**
 * Symptom Analyzer - Analyzes individual symptom recordings
 * 
 * Responsibilities:
 * 1. Transcribe audio recordings to text
 * 2. Generate concise summaries of symptoms
 * 3. Classify health domains and severity levels
 * 4. Generate immediate recommendations for the specific symptom
 * 5. Assess impact on daily life
 * 
 * Called during:
 * - Daily symptom processing (every time user records a symptom)
 * - As part of the 3-agent autonomous health management workflow
 */
export class SymptomAnalyzer {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Analyze a single symptom recording
   * 
   * Workflow:
   * 1. Transcribe audio to text
   * 2. Generate symptom summary
   * 3. Classify health domain and severity
   * 4. Generate immediate recommendations
   * 5. Assess impact on daily life
   * 
   * @param audioUri - URI of the recorded symptom audio
   * @returns Complete analysis of the symptom recording
   */
  async analyzeSymptom(audioUri: string): Promise<SymptomAnalysisResult> {
    console.log('🔍 SymptomAnalyzer: Analyzing symptom recording');
    
    try {
      // Step 1: Transcribe audio to text
      const transcript = await this.transcribeAudio(audioUri);
      
      // Step 2: Generate symptom summary
      const summary = await this.generateSummary(transcript);
      
      // Step 3: Classify health domain and severity
      const classification = await this.classifySymptom(transcript, summary);
      
      // Step 4: Generate immediate recommendations
      const recommendations = await this.generateImmediateRecommendations(transcript, summary, classification);
      
      // Step 5: Assess impact on daily life
      const impact = await this.assessImpact(transcript, summary, classification);
      
      return {
        transcript,
        summary,
        recommendations,
        healthDomain: classification.healthDomain,
        severity: classification.severity,
        impact
      };
    } catch (error) {
      console.error('SymptomAnalyzer error:', error);
      return this.getFallbackResult(audioUri);
    }
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
  // SUMMARY GENERATION
  // ============================================================================

  /**
   * Generate concise summary of the symptom
   * 
   * @param transcript - Transcribed audio text
   * @returns Concise symptom summary
   */
  private async generateSummary(transcript: string): Promise<string> {
    try {
      const summary = await generateSummary(transcript);
      return summary || 'General health concern';
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'General health concern';
    }
  }

  // ============================================================================
  // SYMPTOM CLASSIFICATION
  // ============================================================================

  /**
   * Classify symptom by health domain and severity
   * 
   * @param transcript - Transcribed audio text
   * @param summary - Symptom summary
   * @returns Health domain and severity classification
   */
  private async classifySymptom(transcript: string, summary: string): Promise<{
    healthDomain: HealthDomain;
    severity: 'mild' | 'moderate' | 'severe';
  }> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Classify symptom and return JSON with:
          - healthDomain: one of [general_wellness, cardiovascular, respiratory, digestive, musculoskeletal, neurological, mental_health, skin, sleep, energy, pain_management, stress_management]
          - severity: one of [mild, moderate, severe]`
        },
        { 
          role: 'user', 
          content: `Classify symptom:
          Transcript: ${transcript}
          Summary: ${summary}`
        }
      ],
      max_tokens: 100,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseClassification(content);
  }

  // ============================================================================
  // IMMEDIATE RECOMMENDATIONS
  // ============================================================================

  /**
   * Generate immediate recommendations for the specific symptom
   * 
   * @param transcript - Transcribed audio text
   * @param summary - Symptom summary
   * @param classification - Health domain and severity classification
   * @returns Array of immediate recommendations
   */
  private async generateImmediateRecommendations(
    transcript: string, 
    summary: string, 
    classification: { healthDomain: HealthDomain; severity: 'mild' | 'moderate' | 'severe'; }
  ): Promise<MedicalRecommendation[]> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate 2-3 immediate recommendations and return JSON array with:
          - title: recommendation title
          - description: brief description
          - priority: one of [HIGH, MEDIUM, LOW]
          - urgency: one of [immediate, within days, within weeks]`
        },
        { 
          role: 'user', 
          content: `Generate recommendations for:
          Symptom: ${summary}
          Health domain: ${classification.healthDomain}
          Severity: ${classification.severity}
          Transcript: ${transcript}`
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    });
    
    const content = response.choices[0]?.message?.content || '[]';
    return this.parseRecommendations(content);
  }

  // ============================================================================
  // IMPACT ASSESSMENT
  // ============================================================================

  /**
   * Assess impact of symptom on daily life
   * 
   * @param transcript - Transcribed audio text
   * @param summary - Symptom summary
   * @param classification - Health domain and severity classification
   * @returns Impact level on daily life
   */
  private async assessImpact(
    transcript: string, 
    summary: string, 
    classification: { healthDomain: HealthDomain; severity: 'mild' | 'moderate' | 'severe'; }
  ): Promise<'low' | 'medium' | 'high'> {
    const response = await makeOpenAIRequest({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Assess impact on daily life and return JSON with:
          - impact: one of [low, medium, high]`
        },
        { 
          role: 'user', 
          content: `Assess impact for:
          Symptom: ${summary}
          Severity: ${classification.severity}
          Transcript: ${transcript}`
        }
      ],
      max_tokens: 50,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return this.parseImpact(content);
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

  // ============================================================================
  // PARSING METHODS
  // ============================================================================

  /**
   * Parse classification from AI response
   * 
   * @param content - JSON string from AI response
   * @returns Parsed health domain and severity
   */
  private parseClassification(content: string): {
    healthDomain: HealthDomain;
    severity: 'mild' | 'moderate' | 'severe';
  } {
    try {
      const data = JSON.parse(content);
      return {
        healthDomain: data.healthDomain || 'general_wellness',
        severity: data.severity || 'mild'
      };
    } catch (error) {
      console.error('Error parsing classification:', error);
      return {
        healthDomain: 'general_wellness',
        severity: 'mild'
      };
    }
  }

  /**
   * Parse recommendations from AI response
   * 
   * @param content - JSON string from AI response
   * @returns Array of parsed recommendations
   */
  private parseRecommendations(content: string): MedicalRecommendation[] {
    try {
      const data = JSON.parse(content);
      if (!Array.isArray(data)) return [];
      
      return data.map((rec: any, index: number) => ({
        id: `rec-${Date.now()}-${index}`,
        title: rec.title || 'General recommendation',
        description: rec.description || 'Monitor your health',
        category: 'lifestyle' as any,
        priority: (rec.priority || 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
        actionItems: [],
        urgency: (rec.urgency || 'within days') as 'immediate' | 'within days' | 'within weeks',
        healthDomain: 'general_wellness' as HealthDomain,
        medicalRationale: rec.description || 'Based on symptom analysis',
        symptomsTriggering: [],
        severityIndicators: [],
        followUpRequired: false,
        riskLevel: 'low',
        interventionType: 'self_care' as 'self_care' | 'professional_care' | 'emergency_care',
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false
      }));
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return [];
    }
  }

  /**
   * Parse impact assessment from AI response
   * 
   * @param content - JSON string from AI response
   * @returns Parsed impact level
   */
  private parseImpact(content: string): 'low' | 'medium' | 'high' {
    try {
      const data = JSON.parse(content);
      return data.impact || 'low';
    } catch (error) {
      console.error('Error parsing impact:', error);
      return 'low';
    }
  }
} 