// ============================================================================
// FOLLOW-UP AGENT - Autonomous follow-up monitoring and communication
// ============================================================================

import { BaseAgent, AgentMessage } from './BaseAgent';
import { SymptomLog } from '../../types/recommendations';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FollowUpTrigger {
  id: string;
  type: 'missed_logs' | 'missed_period' | 'unresolved_sickness' | 'significant_pattern' | 'medication_adherence' | 'appointment_reminder' | 'chronic_condition_check' | 'mental_health_check' | 'weight_tracking' | 'sleep_monitoring' | 'exercise_reminder' | 'preventive_care';
  healthDomain?: string;
  condition: string;
  lastChecked: Date;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class FollowUpAgent extends BaseAgent {
  private userId: string;
  private triggers: FollowUpTrigger[] = [];

  constructor(userId: string) {
    super({
      id: `follow-up-${userId}`,
      name: 'Follow-up Agent',
      description: 'Autonomously monitors for missed logs and sends follow-up questions',
      frequency: 6 * 60 * 60 * 1000, // 6 hours
      isActive: true,
      costPerRun: 0.01
    });
    
    this.userId = userId;
    this.setupTriggers();
  }

  // ============================================================================
  // AUTONOMOUS TASK EXECUTION
  // ============================================================================

  protected async executeTask(): Promise<void> {
    this.log('Starting autonomous follow-up monitoring');
    this.runCount++;

    try {
      // Check all triggers
      await this.checkAllTriggers();
      
      // Process any pending follow-ups
      await this.processPendingFollowUps();
      
      this.logCost(this.config.costPerRun);
      this.log('Follow-up monitoring completed successfully');
      
    } catch (error) {
      this.log(`Error in follow-up monitoring: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // TRIGGER SETUP
  // ============================================================================

  private setupTriggers(): void {
    this.triggers = [
      {
        id: 'missed_logs',
        type: 'missed_logs',
        condition: 'No health log for 3+ days',
        lastChecked: new Date(),
        isActive: true,
        priority: 'medium'
      },
      {
        id: 'missed_period',
        type: 'missed_period',
        healthDomain: 'reproductive',
        condition: 'No period log for 30+ days',
        lastChecked: new Date(),
        isActive: true,
        priority: 'high'
      },
      {
        id: 'unresolved_sickness',
        type: 'unresolved_sickness',
        healthDomain: 'illness',
        condition: 'Sickness logged but no resolution',
        lastChecked: new Date(),
        isActive: true,
        priority: 'high'
      },
      {
        id: 'medication_adherence',
        type: 'medication_adherence',
        healthDomain: 'medication',
        condition: 'Medication adherence check',
        lastChecked: new Date(),
        isActive: true,
        priority: 'high'
      },
      {
        id: 'mental_health_check',
        type: 'mental_health_check',
        healthDomain: 'mental_health',
        condition: 'Mental health check-in',
        lastChecked: new Date(),
        isActive: true,
        priority: 'high'
      },
      {
        id: 'chronic_condition_check',
        type: 'chronic_condition_check',
        healthDomain: 'chronic_conditions',
        condition: 'Chronic condition monitoring',
        lastChecked: new Date(),
        isActive: true,
        priority: 'high'
      },
      {
        id: 'weight_tracking',
        type: 'weight_tracking',
        healthDomain: 'weight_management',
        condition: 'Weight tracking reminder',
        lastChecked: new Date(),
        isActive: true,
        priority: 'medium'
      },
      {
        id: 'sleep_monitoring',
        type: 'sleep_monitoring',
        healthDomain: 'sleep',
        condition: 'Sleep quality check',
        lastChecked: new Date(),
        isActive: true,
        priority: 'medium'
      },
      {
        id: 'exercise_reminder',
        type: 'exercise_reminder',
        healthDomain: 'exercise',
        condition: 'Exercise routine check',
        lastChecked: new Date(),
        isActive: true,
        priority: 'medium'
      },
      {
        id: 'preventive_care',
        type: 'preventive_care',
        healthDomain: 'preventive',
        condition: 'Preventive care reminder',
        lastChecked: new Date(),
        isActive: true,
        priority: 'medium'
      },
      {
        id: 'significant_pattern',
        type: 'significant_pattern',
        condition: 'Significant pattern detected',
        lastChecked: new Date(),
        isActive: true,
        priority: 'urgent'
      }
    ];
  }

  // ============================================================================
  // TRIGGER EVALUATION
  // ============================================================================

  private async checkAllTriggers(): Promise<void> {
    for (const trigger of this.triggers) {
      if (!trigger.isActive) continue;

      const shouldActivate = await this.evaluateTrigger(trigger);
      
      if (shouldActivate) {
        this.log(`Trigger activated: ${trigger.type}`);
        await this.executeTriggerAction(trigger);
        trigger.lastChecked = new Date();
      }
    }
  }

  private async evaluateTrigger(trigger: FollowUpTrigger): Promise<boolean> {
    switch (trigger.type) {
      case 'missed_logs':
        return await this.checkMissedLogs();
        
      case 'missed_period':
        return await this.checkMissedPeriod();
        
      case 'unresolved_sickness':
        return await this.checkUnresolvedSickness();
        
      case 'medication_adherence':
        return await this.checkMedicationAdherence();
        
      case 'mental_health_check':
        return await this.checkMentalHealth();
        
      case 'chronic_condition_check':
        return await this.checkChronicConditions();
        
      case 'weight_tracking':
        return await this.checkWeightTracking();
        
      case 'sleep_monitoring':
        return await this.checkSleepMonitoring();
        
      case 'exercise_reminder':
        return await this.checkExerciseRoutine();
        
      case 'preventive_care':
        return await this.checkPreventiveCare();
        
      case 'significant_pattern':
        return false; // Handled by message from pattern agent
        
      default:
        return false;
    }
  }

  private async checkMissedLogs(): Promise<boolean> {
    const lastLog = await this.getLastSymptomLog();
    if (!lastLog) return true; // No logs at all
    
    const daysSinceLastLog = (Date.now() - lastLog.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastLog > 3;
  }

  private async checkMissedPeriod(): Promise<boolean> {
    const lastPeriodLog = await this.getLastPeriodLog();
    if (!lastPeriodLog) return false; // No period tracking
    
    const daysSincePeriod = (Date.now() - lastPeriodLog.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePeriod > 30;
  }

  private async checkUnresolvedSickness(): Promise<boolean> {
    const unresolvedSickness = await this.getUnresolvedSickness();
    return unresolvedSickness.length > 0;
  }

  // ============================================================================
  // TRIGGER ACTIONS
  // ============================================================================

  private async executeTriggerAction(trigger: FollowUpTrigger): Promise<void> {
    let question = '';
    let questionType = trigger.type;

    switch (trigger.type) {
      case 'missed_logs':
        question = "How are you feeling? We haven't heard from you in a few days. A quick health check-in helps us track your wellness journey.";
        break;
        
      case 'missed_period':
        question = "Have you had your period this month? It's been over 30 days since your last period log. This helps us track your cycle patterns.";
        break;
        
      case 'unresolved_sickness':
        question = "How is your recovery going? We'd love an update on your health status to provide better recommendations.";
        break;
        
      case 'significant_pattern':
        question = "We've noticed some patterns in your health data. Would you like to discuss these findings and get personalized recommendations?";
        break;
    }
    
    if (question) {
      await this.sendFollowUpQuestion(question, questionType, trigger.priority);
    }
  }

  private async sendFollowUpQuestion(question: string, questionType: string, priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<void> {
    try {
      const { NotificationService } = await import('../notifications');
      
      if (priority === 'urgent') {
        await NotificationService.sendMissedLogSpotlight();
      } else {
        await NotificationService.sendFollowUpQuestion(question, questionType);
      }
      
      this.log(`Sent follow-up question: ${questionType}`);
      
      // Notify user model agent about the follow-up
      await this.sendMessage(
        'user-model-agent',
        'follow_up_sent',
        { questionType, priority, timestamp: new Date() },
        'medium'
      );
      
    } catch (error) {
      this.log(`Error sending follow-up question: ${error}`);
    }
  }

  // ============================================================================
  // PENDING FOLLOW-UPS
  // ============================================================================

  private async processPendingFollowUps(): Promise<void> {
    // Check for any pending follow-ups that need escalation
    const pendingFollowUps = await this.getPendingFollowUps();
    
    for (const followUp of pendingFollowUps) {
      const daysSinceSent = (Date.now() - followUp.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSent > 2) {
        // Escalate to spotlight notification
        await this.escalateFollowUp(followUp);
      }
    }
  }

  private async escalateFollowUp(followUp: any): Promise<void> {
    try {
      const { NotificationService } = await import('../notifications');
      await NotificationService.sendMissedLogSpotlight();
      
      this.log(`Escalated follow-up: ${followUp.questionType}`);
    } catch (error) {
      this.log(`Error escalating follow-up: ${error}`);
    }
  }

  // ============================================================================
  // INTER-AGENT COMMUNICATION
  // ============================================================================

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'significant_patterns_detected':
        this.log('Received significant patterns from pattern analysis agent');
        await this.handleSignificantPatterns(message.data);
        break;
        
      case 'symptom_log_added':
        this.log('New symptom log added, resetting missed logs trigger');
        // Reset missed logs trigger since user just logged
        const missedLogsTrigger = this.triggers.find(t => t.type === 'missed_logs');
        if (missedLogsTrigger) {
          missedLogsTrigger.lastChecked = new Date();
        }
        break;
        
      case 'period_log_added':
        this.log('New period log added, resetting missed period trigger');
        // Reset missed period trigger
        const missedPeriodTrigger = this.triggers.find(t => t.type === 'missed_period');
        if (missedPeriodTrigger) {
          missedPeriodTrigger.lastChecked = new Date();
        }
        break;
        
      default:
        this.log(`Received unknown message type: ${message.type}`);
    }
  }

  private async handleSignificantPatterns(data: any): Promise<void> {
    const trigger = this.triggers.find(t => t.type === 'significant_pattern');
    if (trigger) {
      await this.executeTriggerAction(trigger);
    }
  }

  // ============================================================================
  // DATA ACCESS
  // ============================================================================

  private async getLastSymptomLog(): Promise<SymptomLog | null> {
    try {
      const key = `symptom_logs_${this.userId}`;
      const logsJson = await AsyncStorage.getItem(key);
      
      if (!logsJson) return null;
      
      const logs: SymptomLog[] = JSON.parse(logsJson);
      return logs.length > 0 ? logs[logs.length - 1] : null;
    } catch (error) {
      this.log(`Error getting last symptom log: ${error}`);
      return null;
    }
  }

  private async getLastPeriodLog(): Promise<SymptomLog | null> {
    try {
      const key = `symptom_logs_${this.userId}`;
      const logsJson = await AsyncStorage.getItem(key);
      
      if (!logsJson) return null;
      
      const logs: SymptomLog[] = JSON.parse(logsJson);
      const periodLogs = logs.filter(log => 
        log.summary.toLowerCase().includes('period') || 
        log.summary.toLowerCase().includes('menstrual')
      );
      
      return periodLogs.length > 0 ? periodLogs[periodLogs.length - 1] : null;
    } catch (error) {
      this.log(`Error getting last period log: ${error}`);
      return null;
    }
  }

  private async getUnresolvedSickness(): Promise<SymptomLog[]> {
    try {
      const key = `symptom_logs_${this.userId}`;
      const logsJson = await AsyncStorage.getItem(key);
      
      if (!logsJson) return [];
      
      const logs: SymptomLog[] = JSON.parse(logsJson);
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      
      return logs.filter(log => 
        new Date(log.timestamp) >= cutoffDate &&
        log.healthDomain === 'illness' &&
        log.severity !== 'mild'
      );
    } catch (error) {
      this.log(`Error getting unresolved sickness: ${error}`);
      return [];
    }
  }

  // ============================================================================
  // DOMAIN-SPECIFIC HEALTH CHECKS
  // ============================================================================

  private async checkMedicationAdherence(): Promise<boolean> {
    const recentLogs = await this.getRecentLogsByDomain('medication', 7);
    return recentLogs.length === 0; // No medication logs in 7 days
  }

  private async checkMentalHealth(): Promise<boolean> {
    const recentLogs = await this.getRecentLogsByDomain('mental_health', 14);
    return recentLogs.length === 0; // No mental health logs in 14 days
  }

  private async checkChronicConditions(): Promise<boolean> {
    const recentLogs = await this.getRecentLogsByDomain('chronic_conditions', 7);
    return recentLogs.length === 0; // No chronic condition logs in 7 days
  }

  private async checkWeightTracking(): Promise<boolean> {
    const recentLogs = await this.getRecentLogsByDomain('weight_management', 14);
    return recentLogs.length === 0; // No weight logs in 14 days
  }

  private async checkSleepMonitoring(): Promise<boolean> {
    const recentLogs = await this.getRecentLogsByDomain('sleep', 7);
    return recentLogs.length === 0; // No sleep logs in 7 days
  }

  private async checkExerciseRoutine(): Promise<boolean> {
    const recentLogs = await this.getRecentLogsByDomain('exercise', 7);
    return recentLogs.length === 0; // No exercise logs in 7 days
  }

  private async checkPreventiveCare(): Promise<boolean> {
    const recentLogs = await this.getRecentLogsByDomain('preventive', 30);
    return recentLogs.length === 0; // No preventive care logs in 30 days
  }

  private async getRecentLogsByDomain(domain: string, days: number): Promise<SymptomLog[]> {
    try {
      const key = `symptom_logs_${this.userId}`;
      const logsJson = await AsyncStorage.getItem(key);
      
      if (!logsJson) return [];
      
      const logs: SymptomLog[] = JSON.parse(logsJson);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      return logs.filter(log => 
        new Date(log.timestamp) >= cutoffDate &&
        log.healthDomain === domain
      );
    } catch (error) {
      this.log(`Error getting logs for domain ${domain}: ${error}`);
      return [];
    }
  }

  private async getPendingFollowUps(): Promise<any[]> {
    try {
      const key = `pending_followups_${this.userId}`;
      const followUpsJson = await AsyncStorage.getItem(key);
      
      if (!followUpsJson) return [];
      
      return JSON.parse(followUpsJson);
    } catch (error) {
      this.log(`Error getting pending follow-ups: ${error}`);
      return [];
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Force immediate follow-up check
   */
  async forceFollowUpCheck(): Promise<void> {
    this.log('Forcing immediate follow-up check');
    await this.executeTask();
  }

  /**
   * Add a custom trigger
   */
  addCustomTrigger(trigger: FollowUpTrigger): void {
    this.triggers.push(trigger);
    this.log(`Added custom trigger: ${trigger.type}`);
  }
} 