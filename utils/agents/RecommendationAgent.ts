// ============================================================================
// RECOMMENDATION AGENT - Autonomous personalized recommendation generation
// ============================================================================

import { BaseAgent, AgentMessage } from './BaseAgent';
import { SymptomLog, MedicalRecommendation } from '../../types/recommendations';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RecommendationContext {
  userProfile: any;
  recentSymptoms: SymptomLog[];
  patterns: any[];
  insights: any;
}

export class RecommendationAgent extends BaseAgent {
  private userId: string;
  private lastRecommendationDate: Date | null = null;
  private recommendationHistory: MedicalRecommendation[] = [];

  constructor(userId: string) {
    super({
      id: `recommendation-${userId}`,
      name: 'Recommendation Agent',
      description: 'Autonomously generates personalized health recommendations',
      frequency: 12 * 60 * 60 * 1000, // 12 hours
      isActive: true,
      costPerRun: 0.02
    });
    
    this.userId = userId;
  }

  // ============================================================================
  // AUTONOMOUS TASK EXECUTION
  // ============================================================================

  protected async executeTask(): Promise<void> {
    this.log('Starting autonomous recommendation generation');
    this.runCount++;

    try {
      // Gather context for recommendations
      const context = await this.gatherRecommendationContext();
      
      if (!context.recentSymptoms.length) {
        this.log('No recent symptoms for recommendations');
        return;
      }

      // Generate personalized recommendations
      const recommendations = await this.generateRecommendations(context);
      
      // Filter and prioritize recommendations
      const filteredRecommendations = await this.filterRecommendations(recommendations);
      
      // Store recommendations
      await this.storeRecommendations(filteredRecommendations);
      
      // Notify user if there are new recommendations
      if (filteredRecommendations.length > 0) {
        await this.notifyUserOfRecommendations(filteredRecommendations);
      }
      
      this.lastRecommendationDate = new Date();
      this.logCost(this.config.costPerRun);
      this.log('Recommendation generation completed successfully');
      
    } catch (error) {
      this.log(`Error in recommendation generation: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // CONTEXT GATHERING
  // ============================================================================

  private async gatherRecommendationContext(): Promise<RecommendationContext> {
    const [userProfile, recentSymptoms, patterns, insights] = await Promise.all([
      this.getUserProfile(),
      this.getRecentSymptoms(7), // Last 7 days
      this.getLatestPatterns(),
      this.getLatestInsights()
    ]);

    return {
      userProfile,
      recentSymptoms,
      patterns,
      insights
    };
  }

  // ============================================================================
  // RECOMMENDATION GENERATION
  // ============================================================================

  private async generateRecommendations(context: RecommendationContext): Promise<MedicalRecommendation[]> {
    const prompt = `
    Generate comprehensive health recommendations across ALL health domains based on this context:
    
    User Profile:
    - Common symptoms: ${context.userProfile?.learningInsights?.commonSymptoms?.join(', ') || 'None'}
    - Triggers: ${context.userProfile?.learningInsights?.triggers?.join(', ') || 'None'}
    - Effective remedies: ${context.userProfile?.learningInsights?.effectiveRemedies?.join(', ') || 'None'}
    - Behavior: ${context.userProfile?.behaviorPatterns?.loggingFrequency || 'medium'} logging frequency
    
    Recent Health Logs (last 7 days):
    ${context.recentSymptoms.map(log => `- ${log.healthDomain}: ${log.summary} (${log.severity}, ${log.impact} impact)`).join('\n')}
    
    Patterns by Domain:
    ${context.patterns?.map(p => `- ${p.healthDomain}: ${p.symptom} (${p.frequency} times, ${p.trend})`).join('\n') || 'None'}
    
    Generate 5-8 personalized recommendations covering ALL health domains:
    
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
    
    Consider:
    1. Cross-domain interactions (e.g., stress affecting sleep)
    2. Risk levels and urgency for each domain
    3. User's current health status and patterns
    4. Seasonal and lifestyle factors
    5. Preventive measures for each domain
    
    Return as JSON array with:
    - title: Short recommendation title
    - description: Detailed explanation
    - category: 'appointment' | 'medication' | 'lifestyle' | 'monitoring' | 'emergency' | 'preventive'
    - healthDomain: Specific health domain
    - priority: 'HIGH' | 'MEDIUM' | 'LOW'
    - actionItems: Array of specific actions
    - urgency: 'immediate' | 'within days' | 'within weeks'
    - medicalRationale: Medical reasoning
    - symptomsTriggering: Array of triggering symptoms
    - severityIndicators: Array of severity indicators
    - followUpRequired: boolean
    - riskLevel: 'low' | 'medium' | 'high' | 'critical'
    - interventionType: 'self_care' | 'professional_care' | 'emergency_care'
    `;

    try {
      const { makeOpenAIRequest } = await import('../openai');
      const response = await makeOpenAIRequest({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a health recommendation specialist. Generate personalized recommendations and return structured JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.4,
      });
      const recommendations = response.choices[0]?.message?.content || '';
      
      return this.parseRecommendations(recommendations);
    } catch (error) {
      this.log(`Error generating recommendations: ${error}`);
      return [];
    }
  }

  private parseRecommendations(recommendations: string): MedicalRecommendation[] {
    try {
      const parsed = JSON.parse(recommendations);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.log('Failed to parse recommendations, using fallback');
      return [];
    }
  }

  // ============================================================================
  // RECOMMENDATION FILTERING
  // ============================================================================

  private async filterRecommendations(recommendations: MedicalRecommendation[]): Promise<MedicalRecommendation[]> {
    // Remove duplicates with existing recommendations
    const existingRecommendations = await this.getExistingRecommendations();
    const existingTitles = existingRecommendations.map(r => r.title.toLowerCase());
    
    const uniqueRecommendations = recommendations.filter(rec => 
      !existingTitles.includes(rec.title.toLowerCase())
    );

    // Prioritize based on user behavior and patterns
    const prioritizedRecommendations = uniqueRecommendations
      .map(rec => ({
        ...rec,
        score: this.calculateRecommendationScore(rec)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Keep top 3
      .map(({ score, ...rec }) => rec);

    return prioritizedRecommendations;
  }

  private calculateRecommendationScore(recommendation: MedicalRecommendation): number {
    let score = 0;
    
    // Priority scoring
    switch (recommendation.priority) {
      case 'HIGH': score += 10; break;
      case 'MEDIUM': score += 5; break;
      case 'LOW': score += 1; break;
    }
    
    // Category scoring
    switch (recommendation.category) {
      case 'emergency': score += 10; break;
      case 'appointment': score += 8; break;
      case 'medication': score += 7; break;
      case 'preventive': score += 6; break;
      case 'lifestyle': score += 4; break;
      case 'monitoring': score += 2; break;
    }
    
    // Action items scoring
    if (recommendation.actionItems && recommendation.actionItems.length > 0) {
      score += recommendation.actionItems.length * 2;
    }
    
    return score;
  }

  // ============================================================================
  // RECOMMENDATION STORAGE
  // ============================================================================

  private async storeRecommendations(recommendations: MedicalRecommendation[]): Promise<void> {
    try {
      const key = `recommendations_${this.userId}`;
      const existingJson = await AsyncStorage.getItem(key);
      const existing: MedicalRecommendation[] = existingJson ? JSON.parse(existingJson) : [];
      
      // Add new recommendations with metadata
      const newRecommendations = recommendations.map(rec => ({
        ...rec,
        id: `rec-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        isCompleted: false
      }));
      
      // Combine and keep only recent recommendations (last 30 days)
      const allRecommendations = [...existing, ...newRecommendations];
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentRecommendations = allRecommendations.filter(rec => 
        rec.createdAt && new Date(rec.createdAt) >= cutoffDate
      );
      
      await AsyncStorage.setItem(key, JSON.stringify(recentRecommendations));
      this.recommendationHistory = recentRecommendations;
      
    } catch (error) {
      this.log(`Error storing recommendations: ${error}`);
    }
  }

  // ============================================================================
  // USER NOTIFICATION
  // ============================================================================

  private async notifyUserOfRecommendations(recommendations: MedicalRecommendation[]): Promise<void> {
    try {
      const { NotificationService } = await import('../notifications');
      
      const title = `💡 New Health Recommendations (${recommendations.length})`;
      const body = `We've generated ${recommendations.length} personalized recommendations based on your health patterns.`;
      
      await NotificationService.sendFollowUpQuestion(body, 'new_recommendations');
      
      this.log(`Notified user of ${recommendations.length} new recommendations`);
      
    } catch (error) {
      this.log(`Error notifying user: ${error}`);
    }
  }

  // ============================================================================
  // INTER-AGENT COMMUNICATION
  // ============================================================================

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'new_patterns_available':
        this.log('Received new patterns from pattern analysis agent');
        await this.handleNewPatterns(message.data);
        break;
        
      case 'user_profile_updated':
        this.log('User profile updated, considering new recommendations');
        await this.handleProfileUpdate(message.data);
        break;
        
      case 'symptom_log_added':
        this.log('New symptom log added, considering immediate recommendations');
        // If we haven't recommended recently, do a quick check
        if (!this.lastRecommendationDate || 
            Date.now() - this.lastRecommendationDate.getTime() > 6 * 60 * 60 * 1000) {
          await this.executeTask();
        }
        break;
        
      default:
        this.log(`Received unknown message type: ${message.type}`);
    }
  }

  private async handleNewPatterns(data: any): Promise<void> {
    if (data.patterns && data.patterns.length > 0) {
      this.log('New patterns detected, generating recommendations');
      await this.executeTask();
    }
  }

  private async handleProfileUpdate(data: any): Promise<void> {
    if (data.profile) {
      this.log('User profile updated, generating new recommendations');
      await this.executeTask();
    }
  }

  // ============================================================================
  // DATA ACCESS
  // ============================================================================

  private async getUserProfile(): Promise<any> {
    try {
      const key = `user_profile_${this.userId}`;
      const profileJson = await AsyncStorage.getItem(key);
      
      if (!profileJson) return null;
      
      return JSON.parse(profileJson);
    } catch (error) {
      this.log(`Error getting user profile: ${error}`);
      return null;
    }
  }

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

  private async getLatestPatterns(): Promise<any[]> {
    try {
      const key = `pattern_analysis_${this.userId}`;
      const dataJson = await AsyncStorage.getItem(key);
      
      if (!dataJson) return [];
      
      const data = JSON.parse(dataJson);
      return data.analysis?.patterns || [];
    } catch (error) {
      this.log(`Error getting patterns: ${error}`);
      return [];
    }
  }

  private async getLatestInsights(): Promise<any> {
    try {
      const key = `user_profile_${this.userId}`;
      const profileJson = await AsyncStorage.getItem(key);
      
      if (!profileJson) return {};
      
      const profile = JSON.parse(profileJson);
      return profile.learningInsights || {};
    } catch (error) {
      this.log(`Error getting insights: ${error}`);
      return {};
    }
  }

  private async getExistingRecommendations(): Promise<MedicalRecommendation[]> {
    try {
      const key = `recommendations_${this.userId}`;
      const recommendationsJson = await AsyncStorage.getItem(key);
      
      if (!recommendationsJson) return [];
      
      return JSON.parse(recommendationsJson);
    } catch (error) {
      this.log(`Error getting existing recommendations: ${error}`);
      return [];
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get current recommendations
   */
  async getCurrentRecommendations(): Promise<MedicalRecommendation[]> {
    return await this.getExistingRecommendations();
  }

  /**
   * Force immediate recommendation generation
   */
  async forceRecommendationGeneration(): Promise<void> {
    this.log('Forcing immediate recommendation generation');
    await this.executeTask();
  }

  /**
   * Mark recommendation as read
   */
  async markRecommendationAsRead(recommendationId: string): Promise<void> {
    try {
      const recommendations = await this.getExistingRecommendations();
      const updatedRecommendations = recommendations.map(rec => 
        rec.id === recommendationId ? { ...rec, isRead: true } : rec
      );
      
      const key = `recommendations_${this.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedRecommendations));
      
    } catch (error) {
      this.log(`Error marking recommendation as read: ${error}`);
    }
  }
} 