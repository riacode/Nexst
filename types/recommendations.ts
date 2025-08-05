export interface SymptomLog {
  id: string;
  timestamp: Date;
  summary: string;
  transcript: string;
  audioURI?: string;
  healthDomain: HealthDomain;
  severity: 'mild' | 'moderate' | 'severe';
  duration?: number; // in days
  impact: 'low' | 'medium' | 'high';
  relatedFactors?: string[]; // triggers, activities, foods, etc.
}

export type HealthDomain = 
  | 'physical_injury'      // Sprains, fractures, cuts, burns
  | 'illness'              // Colds, flu, infections, chronic diseases
  | 'mental_health'        // Anxiety, depression, stress, mood
  | 'weight_management'    // Weight gain, loss, body composition
  | 'nutrition'            // Diet, food intolerances, eating habits
  | 'sleep'                // Sleep quality, insomnia, sleep disorders
  | 'exercise'             // Fitness, injuries, performance
  | 'reproductive'         // Periods, pregnancy, fertility
  | 'chronic_conditions'   // Diabetes, hypertension, asthma
  | 'medication'           // Side effects, adherence, interactions
  | 'preventive'           // Vaccinations, screenings, check-ups
  | 'general_wellness';    // Energy, fatigue, general health

export interface CompletedRecommendation {
  id: string;
  title: string;
  symptomsTriggering: string[];
  completedAt: Date;
}

export interface MedicalRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionItems: ActionItem[];
  urgency: 'immediate' | 'within days' | 'within weeks';
  category: 'appointment' | 'medication' | 'lifestyle' | 'monitoring' | 'emergency' | 'preventive';
  healthDomain: HealthDomain;
  medicalRationale: string;
  symptomsTriggering: string[];
  durationThreshold?: number; // in days
  frequencyThreshold?: number; // occurrences
  severityIndicators: string[];
  followUpRequired: boolean;
  followUpTimeline?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  interventionType: 'self_care' | 'professional_care' | 'emergency_care';
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
  healthDomain: HealthDomain;
  frequency: number;
  averageDuration: number;
  severity: 'mild' | 'moderate' | 'severe';
  trend: 'improving' | 'stable' | 'worsening';
  lastOccurrence: Date;
  firstOccurrence: Date;
  triggers: string[];
  impact: 'low' | 'medium' | 'high';
  seasonalPattern?: boolean;
  timeOfDayPattern?: 'morning' | 'afternoon' | 'evening' | 'night';
} 