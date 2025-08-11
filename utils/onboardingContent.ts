export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  illustration?: React.ReactNode;
}

export interface FeatureTutorialContent {
  title: string;
  description: string;
}

// Main onboarding tutorial steps
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Nexst',
    description: 'Your personal AI health companion. I\'ll help you track symptoms, get insights, and prepare for doctor visits.',
    icon: 'heart',
    color: '#00b4d8',
  },
  {
    id: 'symptoms',
    title: 'Record Your Symptoms',
    description: 'Speak for 30 seconds or less about how you feel. I\'ll transcribe your words and create a clear summary for your health records.',
    icon: 'mic',
    color: '#10b981',
  },
  {
    id: 'recommendations',
    title: 'Get Smart Insights',
    description: 'I\'ll analyze your symptoms and suggest next steps - whether it\'s home care tips, when to see a doctor, or questions to ask.',
    icon: 'bulb',
    color: '#f59e0b',
  },
  {
    id: 'appointments',
    title: 'Prepare for Doctor Visits',
    description: 'Tell me about upcoming appointments and I\'ll generate relevant questions based on your symptom history.',
    icon: 'calendar',
    color: '#8b5cf6',
  },
  {
    id: 'ready',
    title: "You're All Set!",
    description: 'Ready to start? Tap the mic button to record your first symptom check-in.',
    icon: 'checkmark-circle',
    color: '#00b4d8',
  },
];

// Feature-specific tutorial content
export const featureTutorials: Record<string, FeatureTutorialContent> = {
  symptoms: {
    title: 'Start Recording',
    description: 'Tap the mic button below and speak for 30 seconds or less about your symptoms – Nexst will transcribe and summarize everything for you.',
  },
  recommendations: {
    title: 'Nexst Steps',
    description: 'Here you\'ll see personalized recommendations based on your symptoms to help you understand what to do nexst.',
  },
  appointments: {
    title: 'Add Appointments',
    description: 'Tap the + button below to schedule appointments – Nexst will generate relevant questions based on your symptom history to help you prepare.',
  },
}; 