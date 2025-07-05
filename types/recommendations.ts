export interface SymptomLog {
  id: string;
  timestamp: Date;
  summary: string;
  transcript: string;
  audioURI?: string;
}

export interface MedicalRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionItems: ActionItem[];
  urgency: 'immediate' | 'within days' | 'within weeks';
  category: 'appointment' | 'medication' | 'lifestyle' | 'monitoring' | 'emergency' | 'preventive';
  medicalRationale: string;
  symptomsTriggering: string[];
  durationThreshold?: number; // in days
  frequencyThreshold?: number; // occurrences
  severityIndicators: string[];
  followUpRequired: boolean;
  followUpTimeline?: string;
  id?: string;
  createdAt?: Date;
  isCompleted?: boolean;
  completedAt?: Date;
  isCancelled?: boolean;
  cancelledAt?: Date;
  cancelledReason?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'appointment' | 'medication' | 'exercise' | 'diet' | 'rest' | 'monitoring' | 'consultation' | 'test';
  isCompleted: boolean;
  completedAt?: Date;
  dueDate?: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RecommendationAlert {
  id: string;
  recommendation: MedicalRecommendation;
  isRead: boolean;
  createdAt: Date;
  isCompleted?: boolean;
  isCancelled?: boolean;
}

export interface SymptomPattern {
  symptom: string;
  frequency: number;
  averageDuration: number;
  severity: 'mild' | 'moderate' | 'severe';
  trend: 'improving' | 'stable' | 'worsening';
  lastOccurrence: Date;
  firstOccurrence: Date;
} 