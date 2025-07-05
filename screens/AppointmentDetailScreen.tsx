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
    
    // Define questions to ask the DOCTOR based on appointment type
    const questionTemplates: { [key: string]: string[] } = {
      'headache': [
        "What could be causing these headaches?",
        "Are there any tests I should have to rule out serious conditions?",
        "What treatment options are available?",
        "How long should I wait before seeking emergency care?",
        "Are there any lifestyle changes that could help prevent headaches?"
      ],
      'cardiology': [
        "What tests do I need to determine the cause of my symptoms?",
        "Are my symptoms serious enough to require immediate attention?",
        "What medications might help, and what are the side effects?",
        "Should I make any lifestyle changes to protect my heart?",
        "How often should I follow up with you?"
      ],
      'gastroenterology': [
        "What could be causing my digestive symptoms?",
        "Do I need any imaging tests or procedures?",
        "What diet changes should I make?",
        "Are there medications that could help?",
        "When should I be concerned enough to seek emergency care?"
      ],
      'dermatology': [
        "What is this skin condition and what caused it?",
        "Is it contagious or could it spread?",
        "What treatment will be most effective?",
        "How long will it take to improve?",
        "Are there any complications I should watch for?"
      ],
      'orthopedics': [
        "What's causing my pain and is it serious?",
        "Do I need any imaging tests (X-ray, MRI)?",
        "What treatment options are available?",
        "How long will recovery take?",
        "What activities should I avoid or modify?"
      ],
      'neurology': [
        "What could be causing these neurological symptoms?",
        "Do I need any brain imaging or other tests?",
        "Are these symptoms serious or could they be temporary?",
        "What treatments are available?",
        "Should I be concerned about any warning signs?"
      ],
      'psychiatry': [
        "What type of condition might I have?",
        "What treatment options are available?",
        "How long might it take to see improvement?",
        "Are there any medications that could help?",
        "What should I do if my symptoms get worse?"
      ],
      'gynecology': [
        "What could be causing these symptoms?",
        "Do I need any tests or procedures?",
        "What treatment options are available?",
        "Are these symptoms serious or normal?",
        "How often should I follow up?"
      ],
      'endocrinology': [
        "What could be causing my symptoms?",
        "Do I need blood tests or other diagnostic tests?",
        "What treatment options are available?",
        "Are there lifestyle changes that could help?",
        "How often should I have follow-up appointments?"
      ],
      'pulmonology': [
        "What's causing my breathing problems?",
        "Do I need any breathing tests or imaging?",
        "What treatments are available?",
        "Are there triggers I should avoid?",
        "When should I seek emergency care?"
      ]
    };

    // Find relevant questions based on appointment title
    let questions: string[] = [];
    for (const [specialty, specialtyQuestions] of Object.entries(questionTemplates)) {
      if (title.includes(specialty)) {
        questions = [...questions, ...specialtyQuestions];
        break;
      }
    }

    // If no specific questions found, use general questions to ask the doctor
    if (questions.length === 0) {
      questions = [
        "What could be causing my symptoms?",
        "Do I need any tests to diagnose the problem?",
        "What treatment options are available?",
        "How long will it take to see improvement?",
        "Are there any lifestyle changes I should make?",
        "When should I follow up with you?",
        "Are there any warning signs I should watch for?",
        "What should I do if my symptoms get worse?"
      ];
    }

    // Add symptom-specific questions based on the user's actual symptoms
    if (symptoms.length > 0) {
      const symptomText = symptoms.map(s => s.summary).join(' ');
      if (symptomText.toLowerCase().includes('pain')) {
        questions.push("What's causing my pain and how can I manage it?");
        questions.push("Are there any pain management options available?");
      }
      if (symptomText.toLowerCase().includes('fever')) {
        questions.push("What could be causing my fever?");
        questions.push("When should I be concerned about my temperature?");
      }
      if (symptomText.toLowerCase().includes('fatigue')) {
        questions.push("What could be causing my fatigue?");
        questions.push("Are there any treatments that could help with my energy?");
      }
    }

    setImportantQuestions(questions.slice(0, 8)); // Limit to 8 questions
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
                    {symptom.timestamp.toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.symptomSummary}>{symptom.summary}</Text>
                <Text style={styles.symptomDetails}>{symptom.transcript}</Text>
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
    padding: 16,
    paddingTop: 50,
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