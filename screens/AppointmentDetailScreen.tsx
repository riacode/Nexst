import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { useSymptomLogs } from '../contexts/SymptomLogsContext';

interface AppointmentDetailScreenProps {
  route?: {
    params: {
      appointment: {
        id: string;
        title: string;
        date: string;
        timestamp: string; 
      };
    };
  };
  navigation?: any;
}

export default function AppointmentDetailScreen({ route, navigation }: AppointmentDetailScreenProps) {
  const { appointment } = route?.params || {};
  const { getRelevantSymptoms } = useSymptomLogs();
  const [relevantSymptoms, setRelevantSymptoms] = useState<any[]>([]);
  const [importantQuestions, setImportantQuestions] = useState<string[]>([]);

  // Convert string dates back to Date objects
  const appointmentWithDates = appointment ? {
    ...appointment,
    date: new Date(appointment.date),
    timestamp: new Date(appointment.timestamp)
  } : null;

  // Early return if no appointment data
  if (!appointmentWithDates) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Details</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>No appointment data available</Text>
        </View>
      </View>
    );
  }

  useEffect(() => {
    const symptoms = getRelevantSymptoms(appointmentWithDates.title);
    setRelevantSymptoms(symptoms);
    generateImportantQuestions(appointmentWithDates.title, symptoms);
  }, [appointmentWithDates.title, getRelevantSymptoms]);

  const generateImportantQuestions = (appointmentTitle: string, symptoms: any[]) => {
    const title = appointmentTitle.toLowerCase();
    
    // If no symptoms, provide general appointment questions
    if (symptoms.length === 0) {
      const generalQuestions = [
        "What are the most important things I should know about my current health status?",
        "Are there any preventive measures or screenings I should consider?",
        "What follow-up care or monitoring do you recommend?",
        "Are there any lifestyle changes that would benefit my health?",
        "When should I schedule my next appointment?"
      ];
      setImportantQuestions(generalQuestions);
      return;
    }
    
    // Analyze symptoms for specific patterns and details
    const symptomAnalysis = analyzeSymptomsForQuestions(symptoms);
    
    // Generate focused, specific questions based on actual symptoms
    let questions: string[] = [];
    
    // Add symptom-specific questions based on detailed analysis
    if (symptomAnalysis.hasPain) {
      questions.push(...generatePainQuestions(symptomAnalysis.painDetails));
    }
    
    if (symptomAnalysis.hasFever) {
      questions.push(...generateFeverQuestions(symptomAnalysis.feverDetails));
    }
    
    if (symptomAnalysis.hasFatigue) {
      questions.push(...generateFatigueQuestions(symptomAnalysis.fatigueDetails));
    }
    
    if (symptomAnalysis.hasDigestiveIssues) {
      questions.push(...generateDigestiveQuestions(symptomAnalysis.digestiveDetails));
    }
    
    if (symptomAnalysis.hasMentalHealthIssues) {
      questions.push(...generateMentalHealthQuestions(symptomAnalysis.mentalHealthDetails));
    }
    
    if (symptomAnalysis.hasRespiratoryIssues) {
      questions.push(...generateRespiratoryQuestions(symptomAnalysis.respiratoryDetails));
    }
    
    if (symptomAnalysis.hasSkinIssues) {
      questions.push(...generateSkinQuestions(symptomAnalysis.skinDetails));
    }
    
    if (symptomAnalysis.hasNeurologicalIssues) {
      questions.push(...generateNeurologicalQuestions(symptomAnalysis.neurologicalDetails));
    }
    
    // Add appointment-specific questions
    questions.push(...generateAppointmentSpecificQuestions(title, symptomAnalysis));
    
    // Add follow-up and monitoring questions
    questions.push(...generateFollowUpQuestions(symptomAnalysis));
    
    // Remove duplicates and limit to most important questions (quality over quantity)
    const uniqueQuestions = [...new Set(questions)];
    setImportantQuestions(uniqueQuestions.slice(0, 6)); // Reduced from 10 to 6 for better focus
  };

  const analyzeSymptomsForQuestions = (symptoms: any[]) => {
    const allText = symptoms.map(s => `${s.summary} ${s.transcript}`).join(' ').toLowerCase();
    const analysis = {
      hasPain: false,
      painDetails: { location: '', type: '', duration: '', triggers: '' },
      hasFever: false,
      feverDetails: { temperature: '', duration: '', associatedSymptoms: '' },
      hasFatigue: false,
      fatigueDetails: { severity: '', duration: '', impact: '' },
      hasDigestiveIssues: false,
      digestiveDetails: { symptoms: '', triggers: '', duration: '' },
      hasMentalHealthIssues: false,
      mentalHealthDetails: { symptoms: '', duration: '', triggers: '' },
      hasRespiratoryIssues: false,
      respiratoryDetails: { symptoms: '', triggers: '', severity: '' },
      hasSkinIssues: false,
      skinDetails: { symptoms: '', location: '', appearance: '' },
      hasNeurologicalIssues: false,
      neurologicalDetails: { symptoms: '', frequency: '', triggers: '' },
      symptomDates: symptoms.map(s => formatDate(new Date(s.timestamp)))
    };

    // Analyze pain patterns
    if (allText.includes('pain') || allText.includes('ache') || allText.includes('hurt')) {
      analysis.hasPain = true;
      if (allText.includes('head')) analysis.painDetails.location = 'head';
      if (allText.includes('chest')) analysis.painDetails.location = 'chest';
      if (allText.includes('back')) analysis.painDetails.location = 'back';
      if (allText.includes('joint')) analysis.painDetails.location = 'joint';
      if (allText.includes('sharp')) analysis.painDetails.type = 'sharp';
      if (allText.includes('dull')) analysis.painDetails.type = 'dull';
      if (allText.includes('throbbing')) analysis.painDetails.type = 'throbbing';
    }

    // Analyze fever patterns
    if (allText.includes('fever') || allText.includes('temperature')) {
      analysis.hasFever = true;
      if (allText.includes('high')) analysis.feverDetails.temperature = 'high';
      if (allText.includes('low grade')) analysis.feverDetails.temperature = 'low grade';
    }

    // Analyze fatigue patterns
    if (allText.includes('tired') || allText.includes('fatigue') || allText.includes('exhausted')) {
      analysis.hasFatigue = true;
      if (allText.includes('extreme')) analysis.fatigueDetails.severity = 'extreme';
      if (allText.includes('mild')) analysis.fatigueDetails.severity = 'mild';
    }

    // Analyze digestive issues
    if (allText.includes('nausea') || allText.includes('vomiting') || allText.includes('diarrhea') || 
        allText.includes('constipation') || allText.includes('stomach') || allText.includes('abdominal')) {
      analysis.hasDigestiveIssues = true;
    }

    // Analyze mental health issues
    if (allText.includes('anxiety') || allText.includes('depression') || allText.includes('stress') || 
        allText.includes('mood') || allText.includes('insomnia') || allText.includes('sad')) {
      analysis.hasMentalHealthIssues = true;
    }

    // Analyze respiratory issues
    if (allText.includes('cough') || allText.includes('breathing') || allText.includes('shortness') || 
        allText.includes('wheezing') || allText.includes('chest tightness')) {
      analysis.hasRespiratoryIssues = true;
    }

    // Analyze skin issues
    if (allText.includes('rash') || allText.includes('itching') || allText.includes('skin') || 
        allText.includes('acne') || allText.includes('mole')) {
      analysis.hasSkinIssues = true;
    }

    // Analyze neurological issues
    if (allText.includes('numbness') || allText.includes('tingling') || allText.includes('dizziness') || 
        allText.includes('seizure') || allText.includes('memory') || allText.includes('vision')) {
      analysis.hasNeurologicalIssues = true;
    }

    return analysis;
  };

  const generatePainQuestions = (painDetails: any) => {
    const questions = [];
    
    if (painDetails.location === 'head') {
      questions.push("What's the most likely cause of my headaches based on my symptoms and timing?");
      questions.push("Are there specific tests or imaging studies that would help identify the underlying cause?");
      questions.push("What treatment approach would be most effective for my specific headache pattern?");
    }
    
    if (painDetails.location === 'chest') {
      questions.push("How can I distinguish between heart-related chest pain and other causes like acid reflux?");
      questions.push("What specific tests would help determine if this is a cardiac issue?");
      questions.push("What are the warning signs that would require immediate medical attention?");
    }
    
    if (painDetails.location === 'back') {
      questions.push("Could this be related to my posture, work environment, or recent activities?");
      questions.push("What exercises or treatments would be most effective for my specific back pain?");
      questions.push("Are there any red flags that would indicate a more serious underlying condition?");
    }
    
    if (painDetails.type === 'sharp') {
      questions.push("What could be causing this sharp pain, and what tests would help identify the source?");
      questions.push("Are there any immediate treatments I can try to reduce the pain?");
      questions.push("What complications should I watch for if this pain continues?");
    }
    
    return questions;
  };

  const generateFeverQuestions = (feverDetails: any) => {
    const questions = [];
    
    questions.push("What's the most likely cause of my fever based on my symptoms and timing?");
    questions.push("What specific tests would help identify if this is viral or bacterial?");
    questions.push("What are the warning signs that would require immediate medical attention?");
    
    return questions;
  };

  const generateFatigueQuestions = (fatigueDetails: any) => {
    const questions = [];
    
    questions.push("What's the most likely cause of my fatigue based on my symptoms and timing?");
    questions.push("What specific tests would help identify if this is due to an underlying medical condition?");
    questions.push("What treatment approach would be most effective for improving my energy levels?");
    
    return questions;
  };

  const generateDigestiveQuestions = (digestiveDetails: any) => {
    const questions = [];
    
    questions.push("Could this be related to food intolerances, and how would we identify trigger foods?");
    questions.push("What's the difference between IBS, food poisoning, and other digestive conditions?");
    questions.push("Should I be keeping a food diary, and what specific information should I track?");
    questions.push("Are there any over-the-counter medications that would be safe and effective?");
    questions.push("What are the signs that would indicate I need immediate medical attention?");
    
    return questions;
  };

  const generateMentalHealthQuestions = (mentalHealthDetails: any) => {
    const questions = [];
    
    questions.push("How do I distinguish between normal stress and clinical anxiety or depression?");
    questions.push("What are the different treatment options available, and how do I choose the right approach?");
    questions.push("Should I consider therapy, and how do I find a qualified mental health professional?");
    questions.push("Are there any lifestyle changes or coping strategies that would be most effective?");
    questions.push("What are the warning signs that would indicate I need more intensive treatment?");
    
    return questions;
  };

  const generateRespiratoryQuestions = (respiratoryDetails: any) => {
    const questions = [];
    
    questions.push("Could this be related to allergies, asthma, or a respiratory infection?");
    questions.push("What's the difference between a dry cough and a productive cough, and how does that affect treatment?");
    questions.push("Should I be using a peak flow meter or other home monitoring devices?");
    questions.push("Are there any environmental factors or triggers I should be avoiding?");
    questions.push("What are the signs that would indicate I need emergency care for breathing difficulties?");
    
    return questions;
  };

  const generateSkinQuestions = (skinDetails: any) => {
    const questions = [];
    
    questions.push("Could this be related to allergies, infections, or underlying medical conditions?");
    questions.push("What's the difference between various skin conditions, and how does that affect treatment?");
    questions.push("Should I be concerned about any skin changes that could indicate skin cancer?");
    questions.push("Are there any specific skincare products or ingredients I should avoid?");
    questions.push("What are the signs that would indicate I need immediate medical attention?");
    
    return questions;
  };

  const generateNeurologicalQuestions = (neurologicalDetails: any) => {
    const questions = [];
    
    questions.push("Could these symptoms be related to stress, medication side effects, or underlying neurological conditions?");
    questions.push("What's the difference between various neurological symptoms, and how does that affect diagnosis?");
    questions.push("Should I be concerned about any symptoms that could indicate a stroke or other serious condition?");
    questions.push("Are there any specific tests or imaging studies that would be helpful?");
    questions.push("What are the warning signs that would require immediate medical attention?");
    
    return questions;
  };

  const generateAppointmentSpecificQuestions = (appointmentTitle: string, analysis: any) => {
    const questions = [];
    const title = appointmentTitle.toLowerCase();
    
    if (title.includes('cardiology') || analysis.hasPain && analysis.painDetails.location === 'chest') {
      questions.push("What specific heart tests would be most appropriate for my symptoms and risk factors?");
      questions.push("How do my symptoms compare to typical heart disease presentations?");
      questions.push("Should I be monitoring my heart rate, blood pressure, or other vital signs at home?");
      questions.push("What lifestyle changes would have the biggest impact on my heart health?");
    }
    
    if (title.includes('dermatology') || analysis.hasSkinIssues) {
      questions.push("What's the most effective treatment approach for my specific skin condition?");
      questions.push("Should I be concerned about any skin changes that could indicate skin cancer?");
      questions.push("Are there any specific skincare products or ingredients I should avoid?");
      questions.push("What are the signs that would indicate I need immediate medical attention?");
    }
    
    if (title.includes('gastroenterology') || analysis.hasDigestiveIssues) {
      questions.push("What specific digestive tests would be most appropriate for my symptoms?");
      questions.push("Could this be related to food intolerances, and how would we identify trigger foods?");
      questions.push("What's the difference between various digestive conditions, and how does that affect treatment?");
      questions.push("Should I be keeping a food diary, and what specific information should I track?");
    }
    
    return questions;
  };

  const generateFollowUpQuestions = (analysis: any) => {
    const questions = [];
    
    questions.push("What specific symptoms should I monitor, and when should I contact you if they change?");
    questions.push("Are there any red flags or warning signs that would require immediate medical attention?");
    questions.push("What's the expected timeline for improvement, and what should I do if I don't see progress?");
    questions.push("Should I schedule a follow-up appointment, and if so, when would be most appropriate?");
    questions.push("Are there any lifestyle changes or preventive measures I should implement to avoid future issues?");
    
    return questions;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appointment Info */}
        <View style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <Ionicons name="calendar" size={32} color="#00b4d8" />
                      <Text style={styles.appointmentTitle}>{appointmentWithDates.title}</Text>
        </View>
        <Text style={styles.appointmentDate}>
          {formatDate(appointmentWithDates.date)}
        </Text>
        <Text style={styles.appointmentTime}>
          Scheduled at {formatTime(appointmentWithDates.timestamp)}
        </Text>
        </View>

        {/* Relevant Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Recent Symptoms</Text>
          {relevantSymptoms.length > 0 ? (
            relevantSymptoms.map((symptom, index) => (
              <View key={symptom.id} style={styles.symptomCard}>
                <View style={styles.symptomHeader}>
                  <Ionicons name="pulse" size={20} color="#ef4444" />
                  <Text style={styles.symptomDate}>
                    {formatDate(symptom.timestamp)}
                  </Text>
                </View>
                <Text style={styles.symptomSummary}>{symptom.summary}</Text>
                <Text style={styles.symptomDetails}>
                  <Text style={styles.symptomDateInline}>Date: {formatDate(symptom.timestamp)}</Text>
                  {'\n'}{symptom.transcript}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medical" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>
                No recent symptoms recorded for this appointment type.
              </Text>
            </View>
          )}
        </View>

        {/* Important Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions to Ask Your Doctor</Text>
          <Text style={styles.sectionSubtitle}>
            Make sure to get these important answers before leaving your appointment
          </Text>
          <View style={styles.questionsCard}>
            {importantQuestions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <View style={styles.questionNumber}>
                  <Text style={styles.questionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="time" size={20} color="#f59e0b" />
              <Text style={styles.tipText}>Arrive 15 minutes early to complete any paperwork</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="list" size={20} color="#10b981" />
              <Text style={styles.tipText}>Bring a list of your current medications</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="document-text" size={20} color="#8b5cf6" />
              <Text style={styles.tipText}>Take notes during your appointment</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="help-circle" size={20} color="#ef4444" />
              <Text style={styles.tipText}>Don't hesitate to ask for clarification</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#00b4d8',
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginLeft: 12,
    flex: 1,
  },
  appointmentDate: {
    ...fontStyles.bodyMedium,
    color: '#374151',
    marginBottom: 4,
  },
  appointmentTime: {
    ...fontStyles.body,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...fontStyles.body,
    color: '#64748b',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  symptomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  symptomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomDate: {
    ...fontStyles.caption,
    color: '#64748b',
    marginLeft: 8,
  },
  symptomSummary: {
    ...fontStyles.bodyMedium,
    color: '#1e293b',
    marginBottom: 8,
    fontWeight: '600',
  },
  symptomDetails: {
    ...fontStyles.body,
    color: '#6b7280',
    lineHeight: 20,
  },
  symptomDateInline: {
    ...fontStyles.caption,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyStateText: {
    ...fontStyles.body,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
  },
  questionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00b4d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  questionNumberText: {
    ...fontStyles.caption,
    color: '#ffffff',
    fontWeight: '600',
  },
  questionText: {
    ...fontStyles.body,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    ...fontStyles.body,
    color: '#374151',
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  errorText: {
    ...fontStyles.body,
    color: '#ef4444',
    textAlign: 'center',
    padding: 20,
  },
}); 