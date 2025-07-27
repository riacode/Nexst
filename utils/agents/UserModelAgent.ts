// ============================================================================
// USER MODEL AGENT - Autonomous user learning and profile building
// ============================================================================

import { BaseAgent, AgentMessage } from './BaseAgent';
import { SymptomLog, SymptomPattern } from '../../types/recommendations';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserHealthProfile {
  userId: string;
  lastActive: Date;
  symptomPatterns: SymptomPattern[];
  healthGoals: string[];
  preferences: {
    notificationFrequency: 'daily' | 'weekly' | 'monthly';
    followUpReminders: boolean;
    periodTracking: boolean;
  };
  learningInsights: {
    commonSymptoms: string[];
    triggers: string[];
    effectiveRemedies: string[];
    lastUpdated: Date;
  };
  behaviorPatterns: {
    loggingFrequency: 'low' | 'medium' | 'high';
    responseTime: 'immediate' | 'delayed' | 'never';
    symptomSeverity: 'mild' | 'moderate' | 'severe';
    lastUpdated: Date;
  };
}

export class UserModelAgent extends BaseAgent {
  private userId: string;
  private userProfile: UserHealthProfile;

  constructor(userId: string) {
    super({
      id: `user-model-${userId}`,
      name: 'User Model Agent',
      description: 'Autonomously learns from user data and builds personalized health profiles',
      frequency: 7 * 24 * 60 * 60 * 1000, // 7 days
      isActive: true,
      costPerRun: 0.01
    });
    
    this.userId = userId;
    this.userProfile = this.initializeUserProfile();
  }

  // ============================================================================
  // AUTONOMOUS TASK EXECUTION
  // ============================================================================

  protected async executeTask(): Promise<void> {
    this.log('Starting autonomous user model learning');
    this.runCount++;

    try {
      // Update user profile with latest data
      await this.updateUserProfile();
      
      // Analyze behavior patterns
      await this.analyzeBehaviorPatterns();
      
      // Generate learning insights
      await this.generateLearningInsights();
      
      // Save updated profile
      await this.saveUserProfile();
      
      // Notify other agents of profile updates
      await this.notifyOtherAgents();
      
      this.logCost(this.config.costPerRun);
      this.log('User model learning completed successfully');
      
    } catch (error) {
      this.log(`Error in user model learning: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================

  private initializeUserProfile(): UserHealthProfile {
    return {
      userId: this.userId,
      lastActive: new Date(),
      symptomPatterns: [],
      healthGoals: [],
      preferences: {
        notificationFrequency: 'daily',
        followUpReminders: true,
        periodTracking: true
      },
      learningInsights: {
        commonSymptoms: [],
        triggers: [],
        effectiveRemedies: [],
        lastUpdated: new Date()
      },
      behaviorPatterns: {
        loggingFrequency: 'medium',
        responseTime: 'delayed',
        symptomSeverity: 'moderate',
        lastUpdated: new Date()
      }
    };
  }

  private async updateUserProfile(): Promise<void> {
    // Update last active
    this.userProfile.lastActive = new Date();
    
    // Get latest symptom patterns from pattern analysis agent
    const patternAnalysis = await this.getLatestPatternAnalysis();
    if (patternAnalysis) {
      this.userProfile.symptomPatterns = patternAnalysis.patterns;
    }
    
    // Update preferences based on user behavior
    await this.updatePreferences();
  }

  private async updatePreferences(): Promise<void> {
    const recentLogs = await this.getRecentSymptoms(30);
    const recentNotifications = await this.getRecentNotifications();
    
    // Analyze notification response patterns
    const responseRate = this.calculateResponseRate(recentNotifications);
    
    if (responseRate < 0.3) {
      this.userProfile.preferences.notificationFrequency = 'weekly';
    } else if (responseRate > 0.7) {
      this.userProfile.preferences.notificationFrequency = 'daily';
    }
    
    // Analyze period tracking
    const periodLogs = recentLogs.filter(log => 
      log.summary.toLowerCase().includes('period') || 
      log.summary.toLowerCase().includes('menstrual')
    );
    
    this.userProfile.preferences.periodTracking = periodLogs.length > 0;
  }

  // ============================================================================
  // BEHAVIOR PATTERN ANALYSIS
  // ============================================================================

  private async analyzeBehaviorPatterns(): Promise<void> {
    const recentLogs = await this.getRecentSymptoms(30);
    
    // Analyze logging frequency
    const daysWithLogs = new Set(recentLogs.map(log => 
      new Date(log.timestamp).toDateString()
    )).size;
    
    const loggingFrequency = daysWithLogs / 30;
    
    if (loggingFrequency < 0.2) {
      this.userProfile.behaviorPatterns.loggingFrequency = 'low';
    } else if (loggingFrequency > 0.6) {
      this.userProfile.behaviorPatterns.loggingFrequency = 'high';
    } else {
      this.userProfile.behaviorPatterns.loggingFrequency = 'medium';
    }
    
    // Analyze response time to notifications
    const responseTime = await this.analyzeResponseTime();
    this.userProfile.behaviorPatterns.responseTime = responseTime;
    
    // Analyze symptom severity patterns
    const severityPattern = this.analyzeSymptomSeverity(recentLogs);
    this.userProfile.behaviorPatterns.symptomSeverity = severityPattern;
    
    this.userProfile.behaviorPatterns.lastUpdated = new Date();
  }

  private async analyzeResponseTime(): Promise<'immediate' | 'delayed' | 'never'> {
    const recentNotifications = await this.getRecentNotifications();
    const responseTimes = recentNotifications
      .filter(n => n.responseTime)
      .map(n => n.responseTime!);
    
    if (responseTimes.length === 0) return 'never';
    
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    if (avgResponseTime < 60 * 60 * 1000) { // Less than 1 hour
      return 'immediate';
    } else if (avgResponseTime < 24 * 60 * 60 * 1000) { // Less than 1 day
      return 'delayed';
    } else {
      return 'never';
    }
  }

  private analyzeSymptomSeverity(logs: SymptomLog[]): 'mild' | 'moderate' | 'severe' {
    const severityKeywords = {
      mild: ['mild', 'slight', 'minor', 'light'],
      moderate: ['moderate', 'medium', 'some'],
      severe: ['severe', 'bad', 'terrible', 'awful', 'extreme']
    };
    
    let severityCounts = { mild: 0, moderate: 0, severe: 0 };
    
    for (const log of logs) {
      const summary = log.summary.toLowerCase();
      
      for (const [severity, keywords] of Object.entries(severityKeywords)) {
        if (keywords.some(keyword => summary.includes(keyword))) {
          severityCounts[severity as keyof typeof severityCounts]++;
          break;
        }
      }
    }
    
    const maxSeverity = Object.entries(severityCounts)
      .reduce((max, [severity, count]) => count > max.count ? { severity, count } : max, 
        { severity: 'moderate', count: 0 });
    
    return maxSeverity.severity as 'mild' | 'moderate' | 'severe';
  }

  // ============================================================================
  // LEARNING INSIGHTS GENERATION
  // ============================================================================

  private async generateLearningInsights(): Promise<void> {
    const recentLogs = await this.getRecentSymptoms(90); // 3 months
    
    if (recentLogs.length === 0) return;
    
    const prompt = `
    Analyze these symptom logs to generate user insights:
    ${recentLogs.map(log => `- ${log.summary} (${log.timestamp.toLocaleDateString()})`).join('\n')}
    
    Extract:
    1. Common symptoms (top 5 most frequent)
    2. Potential triggers (activities, foods, times, etc.)
    3. Effective remedies that seem to help
    4. Patterns in symptom timing or frequency
    
    Return as JSON with:
    - commonSymptoms: Array of common symptoms
    - triggers: Array of potential triggers
    - effectiveRemedies: Array of remedies that help
    `;

    try {
      const { makeOpenAIRequest } = await import('../openai');
      const response = await makeOpenAIRequest({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a health insights analyst. Extract user patterns and return structured JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3,
      });
      const insights = response.choices[0]?.message?.content || '';
      
      const parsedInsights = this.parseInsights(insights);
      
      this.userProfile.learningInsights = {
        ...parsedInsights,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      this.log(`Error generating insights: ${error}`);
    }
  }

  private parseInsights(insights: string): {
    commonSymptoms: string[];
    triggers: string[];
    effectiveRemedies: string[];
  } {
    try {
      const parsed = JSON.parse(insights);
      return {
        commonSymptoms: parsed.commonSymptoms || [],
        triggers: parsed.triggers || [],
        effectiveRemedies: parsed.effectiveRemedies || []
      };
    } catch (error) {
      this.log('Failed to parse insights, using fallback');
      return {
        commonSymptoms: [],
        triggers: [],
        effectiveRemedies: []
      };
    }
  }

  // ============================================================================
  // INTER-AGENT COMMUNICATION
  // ============================================================================

  private async notifyOtherAgents(): Promise<void> {
    // Notify recommendation agent about updated user profile
    await this.sendMessage(
      'recommendation-agent',
      'user_profile_updated',
      { profile: this.userProfile },
      'medium'
    );
    
    // Notify follow-up agent about behavior patterns
    await this.sendMessage(
      'follow-up-agent',
      'behavior_patterns_updated',
      { patterns: this.userProfile.behaviorPatterns },
      'medium'
    );
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'pattern_insights_available':
        this.log('Received pattern insights from pattern analysis agent');
        await this.updateProfileWithPatterns(message.data);
        break;
        
      case 'follow_up_sent':
        this.log('Follow-up sent, updating user model');
        await this.updateProfileWithFollowUp(message.data);
        break;
        
      case 'symptom_log_added':
        this.log('New symptom log added, considering early learning');
        // If we haven't learned recently, do a quick update
        const daysSinceLastUpdate = (Date.now() - this.userProfile.learningInsights.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUpdate > 3) {
          await this.executeTask();
        }
        break;
        
      default:
        this.log(`Received unknown message type: ${message.type}`);
    }
  }

  private async updateProfileWithPatterns(data: any): Promise<void> {
    if (data.insights) {
      this.userProfile.learningInsights = {
        ...this.userProfile.learningInsights,
        ...data.insights,
        lastUpdated: new Date()
      };
    }
  }

  private async updateProfileWithFollowUp(data: any): Promise<void> {
    // Update behavior patterns based on follow-up response
    if (data.priority === 'urgent') {
      this.userProfile.behaviorPatterns.responseTime = 'immediate';
    }
  }

  // ============================================================================
  // DATA ACCESS
  // ============================================================================

  private async getLatestPatternAnalysis(): Promise<any> {
    try {
      const key = `pattern_analysis_${this.userId}`;
      const dataJson = await AsyncStorage.getItem(key);
      
      if (!dataJson) return null;
      
      const data = JSON.parse(dataJson);
      return data.analysis;
    } catch (error) {
      this.log(`Error getting pattern analysis: ${error}`);
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

  private async getRecentNotifications(): Promise<any[]> {
    try {
      const key = `notifications_${this.userId}`;
      const notificationsJson = await AsyncStorage.getItem(key);
      
      if (!notificationsJson) return [];
      
      const notifications = JSON.parse(notificationsJson);
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      
      return notifications.filter((n: any) => new Date(n.timestamp) >= cutoffDate);
    } catch (error) {
      this.log(`Error getting recent notifications: ${error}`);
      return [];
    }
  }

  private calculateResponseRate(notifications: any[]): number {
    if (notifications.length === 0) return 0;
    
    const respondedNotifications = notifications.filter(n => n.responded);
    return respondedNotifications.length / notifications.length;
  }

  private async saveUserProfile(): Promise<void> {
    try {
      const key = `user_profile_${this.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(this.userProfile));
    } catch (error) {
      this.log(`Error saving user profile: ${error}`);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get current user profile
   */
  getUserProfile(): UserHealthProfile {
    return { ...this.userProfile };
  }

  /**
   * Force immediate user model update
   */
  async forceUpdate(): Promise<void> {
    this.log('Forcing immediate user model update');
    await this.executeTask();
  }
} 