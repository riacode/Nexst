import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { useSymptomLogs } from '../contexts/SymptomLogsContext';
import { generateAppointmentQuestions } from '../utils/openai';

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
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

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
    generateImportantQuestions(appointmentWithDates.title, symptoms, appointmentWithDates.date);
  }, [appointmentWithDates.title, getRelevantSymptoms]);

  // Start spinning animation when loading
  useEffect(() => {
    if (isGeneratingQuestions) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      spinAnim.setValue(0);
    }
  }, [isGeneratingQuestions, spinAnim]);

  const generateImportantQuestions = async (appointmentTitle: string, symptoms: any[], appointmentDate: Date) => {
    setIsGeneratingQuestions(true);
    try {
      // Use AI to generate personalized questions
      const aiQuestions = await generateAppointmentQuestions(appointmentTitle, symptoms, appointmentDate);
      
      if (aiQuestions.length > 0) {
        setImportantQuestions(aiQuestions);
      } else {
        // Fallback to basic questions if AI fails
        const fallbackQuestions = symptoms.length === 0 ? [
          "Regarding my blood pressure and lab results, are these normal and/or better from my last visit?",
          "What vaccinations am I due for?",
          "Are my current prescriptions or supplements still necessary and at the right dose?",
          "What preventive screenings should I consider based on my age and risk factors?",
          "Are there any lifestyle changes I should make to improve my health?"
        ] : [
          "Could this affect my work or daily activities, and for how long?",
          "What side effects should I watch for with any treatments?",
          "What exactly is causing my symptoms?",
          "What should I do if I miss a dose of any medication?",
          "When should I follow up if I'm not improving?",
          "Are there any red flags that would require immediate medical attention?"
        ];
        setImportantQuestions(fallbackQuestions);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to basic questions
      const fallbackQuestions = symptoms.length === 0 ? [
        "Regarding my blood pressure and lab results, are these normal and/or better from my last visit?",
        "What vaccinations am I due for?",
        "Are my current prescriptions or supplements still necessary and at the right dose?",
        "What preventive screenings should I consider based on my age and risk factors?",
        "Are there any lifestyle changes I should make to improve my health?"
      ] : [
        "Could this affect my work or daily activities, and for how long?",
        "What side effects should I watch for with any treatments?",
        "What exactly is causing my symptoms?",
        "What should I do if I miss a dose of any medication?",
        "When should I follow up if I'm not improving?",
        "Are there any red flags that would require immediate medical attention?"
      ];
      setImportantQuestions(fallbackQuestions);
    } finally {
      setIsGeneratingQuestions(false);
    }
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
            {isGeneratingQuestions ? (
              <View style={styles.loadingContainer}>
                <Animated.View 
                  style={[
                    styles.loadingSpinner,
                    {
                      transform: [{
                        rotate: spinAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]}
                >
                  <Ionicons name="sync" size={24} color="#00b4d8" />
                </Animated.View>
                <Text style={styles.loadingText}>Generating personalized questions...</Text>
                <Text style={styles.loadingSubtext}>Analyzing your symptoms and appointment details</Text>
              </View>
            ) : (
              importantQuestions.map((question, index) => (
                <View key={index} style={styles.questionItem}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.questionText}>{question}</Text>
                </View>
              ))
            )}
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
              <Text style={styles.tipText}>Know your current medications and allergies</Text>
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
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingSpinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingText: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...fontStyles.body,
    color: '#64748b',
    textAlign: 'center',
  },
}); 