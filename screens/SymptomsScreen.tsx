import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSmartAI } from '../contexts/SmartAIContext';
import { SymptomLog, MedicalRecommendation, RecommendationAlert, HealthDomain } from '../types/recommendations';
import { useRecommendations } from '../contexts/RecommendationsContext';
import { useSymptomLogs } from '../contexts/SymptomLogsContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useTutorial } from '../contexts/TutorialContext';
import FeatureTutorial from '../components/FeatureTutorial';
import { featureTutorials } from '../utils/onboardingContent';
import SharedBackground from '../components/SharedBackground';
import { colors, gradients } from '../utils/colors';

// ============================================================================
// SYMPTOMS SCREEN - Daily Health Check-in and Autonomous Health Management
// ============================================================================

/**
 * Main symptoms screen for daily health check-ins
 * 
 * Features:
 * - Audio recording for symptom descriptions
 * - 3-agent autonomous health management system
 * - Legacy fallback processing
 * - Proactive health monitoring
 * - Tutorial and onboarding integration
 */
export default function SymptomScreen({ navigation }: any) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Audio recording state
  const [audioURI, setAudioURI] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UI state
  const [status, setStatus] = useState('Tap to record your daily check-in');
  const [hasRecordedToday, setHasRecordedToday] = useState(false);
  
  // Alert and notification state
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVisible, setAlertVisible] = useState(true);
  const [activeAlert, setActiveAlert] = useState<RecommendationAlert | null>(null);
  
  // Follow-up questions state
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [missedPeriodQuestion, setMissedPeriodQuestion] = useState<string | null>(null);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // ============================================================================
  // CONTEXT HOOKS
  // ============================================================================
  
  const { recommendations, addRecommendations } = useRecommendations();
  const { symptomLogs, addSymptomLog } = useSymptomLogs();
  const { markOnboardingComplete } = useOnboarding();
  const { tutorialState, completeSymptomTutorial } = useTutorial();
  const { 
    processSymptomLog, 
    processSymptomAutonomously,
    startProactiveMonitoring, 
    isProactiveActive,
    getPersonalizedRecommendations,
    initializeAI
  } = useSmartAI();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize AI service when component mounts
   */
  useEffect(() => {
    initializeAI('user-123'); // TODO: Get actual user ID
  }, []);

  /**
   * Start proactive monitoring when component mounts
   */
  useEffect(() => {
    if (!isProactiveActive) {
      startProactiveMonitoring();
    }
  }, [isProactiveActive, startProactiveMonitoring]);

  // ============================================================================
  // DAILY RECORDING TRACKING
  // ============================================================================

  /**
   * Check if user has already recorded today
   * 
   * @returns True if user has recorded today, false otherwise
   */
  const checkIfRecordedToday = (): boolean => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    return symptomLogs.some(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= todayStart && logDate < todayEnd;
    });
  };

  /**
   * Update hasRecordedToday when symptomLogs change
   */
  useEffect(() => {
    setHasRecordedToday(checkIfRecordedToday());
  }, [symptomLogs]);

  /**
   * Update status text based on recording state
   */
  useEffect(() => {
    if (!isProcessing && !isRecording) {
      setStatus(hasRecordedToday ? 'Tap to record another check-in' : 'Tap to record your daily check-in');
    }
  }, [hasRecordedToday, isProcessing, isRecording]);

  // ============================================================================
  // RECOMMENDATION GENERATION
  // ============================================================================

  /**
   * Generate recommendations and follow-up questions when symptoms are added
   * Called when symptomLogs array changes
   */
  useEffect(() => {
    const checkForRecommendations = async () => {
      try {
        // Only generate recommendations if we have symptom logs
        if (symptomLogs.length >= 1) {
          // Use SmartHealthAI for personalized recommendations
          const recommendations = await getPersonalizedRecommendations(symptomLogs);
          
          if (recommendations.length > 0) {
            // Process recommendations
            addRecommendations(recommendations);
            
            // Create alert for highest priority recommendation
            const highPriorityRec = recommendations.find((rec: MedicalRecommendation) => rec.priority === 'HIGH');
            if (highPriorityRec) {
                           setActiveAlert({
               id: Date.now().toString(),
               recommendation: highPriorityRec,
               isRead: false,
               createdAt: new Date()
             });
            }
          }
        }
      } catch (error) {
        console.error('Error generating recommendations:', error);
      }
    };

    checkForRecommendations();
  }, [symptomLogs, getPersonalizedRecommendations, addRecommendations]);

  // ============================================================================
  // AUDIO RECORDING HANDLERS
  // ============================================================================

  /**
   * Handle recording button press
   * Starts or stops audio recording and processes the result
   */
  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  /**
   * Start audio recording
   */
  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant audio recording permissions to use this feature.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setStatus('Recording... Tap to stop');
      
      // Start pulse animation
      startPulseAnimation();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatus('Failed to start recording');
    }
  };

  /**
   * Stop audio recording and process the result
   */
  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
          setAudioURI(uri);
          setIsProcessing(true);
          setStatus("Processing audio...");
          
          // Process with autonomous health management system
          await processRecording(uri);
        }
      }
      
      setRecording(null);
      setIsRecording(false);
      stopPulseAnimation();
      
    } catch (error) {
      setStatus("Failed to stop recording.");
      console.error("Error stopping recording: ", error);
      setIsProcessing(false);
    }
  };

  /**
   * Process recorded audio using autonomous health management system
   * 
   * @param uri - URI of the recorded audio file
   */
  const processRecording = async (uri: string) => {
    try {
      // Use autonomous health management system (3-agent framework)
      console.log("🤖 AUTONOMOUS HEALTH AI: Processing with 3-agent framework");
      const autonomousResponse = await processSymptomAutonomously(uri, symptomLogs, recommendations);
      
      // Create symptom log from autonomous analysis
      const newLog: SymptomLog = {
        id: new Date().toISOString(),
        timestamp: new Date(),
        summary: autonomousResponse.decision.primaryAction,
        transcript: autonomousResponse.decision.reasoning,
        audioURI: uri,
        healthDomain: 'general_wellness' as HealthDomain,
        severity: autonomousResponse.decision.riskAssessment.level === 'high' ? 'severe' : 
                 autonomousResponse.decision.riskAssessment.level === 'medium' ? 'moderate' : 'mild',
        impact: autonomousResponse.decision.priority === 'urgent' || autonomousResponse.decision.priority === 'high' ? 'high' : 
                autonomousResponse.decision.priority === 'medium' ? 'medium' : 'low'
      };
      
      // Add to global symptom logs
      addSymptomLog(newLog);
      
      // Create recommendations from autonomous system
      const autonomousRecommendations = autonomousResponse.strategy.subStrategies.map((strategy, index) => ({
        id: `autonomous-${Date.now()}-${index}`,
        title: strategy,
        description: autonomousResponse.decision.reasoning,
        category: 'lifestyle' as any,
        priority: (autonomousResponse.decision.priority === 'urgent' ? 'HIGH' : 
                  autonomousResponse.decision.priority === 'high' ? 'HIGH' : 
                  autonomousResponse.decision.priority === 'medium' ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
        actionItems: [],
        urgency: (autonomousResponse.decision.priority === 'urgent' ? 'immediate' : 
                 autonomousResponse.decision.priority === 'high' ? 'within days' : 'within weeks') as 'immediate' | 'within days' | 'within weeks',
        healthDomain: 'general_wellness' as HealthDomain,
        medicalRationale: autonomousResponse.decision.reasoning,
        symptomsTriggering: [newLog.summary],
        severityIndicators: [],
        followUpRequired: false,
        riskLevel: autonomousResponse.decision.riskAssessment.level,
        interventionType: 'self_care' as 'self_care' | 'professional_care' | 'emergency_care',
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false
      }));
      
      if (autonomousRecommendations.length > 0) {
        addRecommendations(autonomousRecommendations);
      }
      
      setStatus("Autonomous health analysis complete!");
      
      // Show autonomous decision alert
      Alert.alert(
        'Health Decision Made',
        `I've analyzed your symptoms and made the following decision:\n\n${autonomousResponse.decision.primaryAction}\n\nReasoning: ${autonomousResponse.decision.reasoning}\n\nPriority: ${autonomousResponse.decision.priority}`,
        [{ text: 'OK' }]
      );
      
    } catch (autonomousError) {
      console.error("Autonomous processing failed, falling back to legacy:", autonomousError);
      
      // Fallback to legacy processing
      await processLegacyRecording(uri);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Process recording using legacy single-agent system
   * 
   * @param uri - URI of the recorded audio file
   */
  const processLegacyRecording = async (uri: string) => {
    try {
      const processedLog = await processSymptomLog(uri);
      
      // Create symptom log
      const newLog: SymptomLog = {
        id: new Date().toISOString(),
        timestamp: new Date(),
        summary: processedLog.summary,
        transcript: processedLog.transcript,
        audioURI: uri,
        healthDomain: processedLog.healthDomain as HealthDomain,
        severity: processedLog.severity as 'mild' | 'moderate' | 'severe',
        impact: processedLog.impact as 'low' | 'medium' | 'high'
      };
      
      // Add to global symptom logs
      addSymptomLog(newLog);
      
      setStatus("Recording saved!");
      
    } catch (error) {
      console.error("Legacy processing failed:", error);
      setStatus("Failed to process recording");
    }
  };

  // ============================================================================
  // ANIMATION HANDLERS
  // ============================================================================

  /**
   * Start pulse animation for recording button
   */
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Stop pulse animation
   */
  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  /**
   * Start spin animation for processing
   */
  const startSpinAnimation = () => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  /**
   * Render individual symptom log entry
   * 
   * @param log - Symptom log to render
   * @returns JSX element for the log entry
   */
  const renderLog = (log: SymptomLog) => (
    <TouchableOpacity
      key={log.id}
      style={styles.logItem}
      onPress={() => navigation.navigate('RecordingDetail', { logId: log.id })}
    >
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>{log.summary}</Text>
        <Text style={styles.logTime}>
          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.logDomain}>{log.healthDomain}</Text>
      <View style={styles.logIndicators}>
        <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(log.severity) }]}>
          <Text style={styles.indicatorText}>{log.severity}</Text>
        </View>
        <View style={[styles.impactIndicator, { backgroundColor: getImpactColor(log.impact) }]}>
          <Text style={styles.indicatorText}>{log.impact}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get color for severity level
   * 
   * @param severity - Severity level
   * @returns Color string
   */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return colors.error;
      case 'moderate': return colors.warning;
      case 'mild': return colors.success;
      default: return colors.textSecondary;
    }
  };

  /**
   * Get color for impact level
   * 
   * @param impact - Impact level
   * @returns Color string
   */
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SharedBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Health Check-in</Text>
          <Text style={styles.subtitle}>
            {hasRecordedToday ? 'You\'ve recorded today' : 'Record your daily symptoms'}
          </Text>
        </View>

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={handleRecord}
            disabled={isProcessing}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                             <Ionicons
                 name={isRecording ? 'stop' : 'mic'}
                 size={40}
                 color="#FFFFFF"
               />
            </Animated.View>
          </TouchableOpacity>
          
          <Text style={styles.statusText}>{status}</Text>
          
          {isProcessing && (
            <View style={styles.processingContainer}>
              <Animated.View style={{ transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
              </Animated.View>
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>

        {/* Symptom Logs */}
        <View style={styles.logsSection}>
          <Text style={styles.sectionTitle}>Recent Check-ins</Text>
          <ScrollView style={styles.logsList} showsVerticalScrollIndicator={false}>
            {symptomLogs.length === 0 ? (
              <Text style={styles.emptyText}>No check-ins yet. Record your first one above!</Text>
            ) : (
              symptomLogs.slice().reverse().map(renderLog)
            )}
          </ScrollView>
        </View>

                 {/* Tutorial */}
         {!tutorialState.hasSeenSymptomTutorial && (
           <FeatureTutorial
             visible={!tutorialState.hasSeenSymptomTutorial}
             title={featureTutorials.symptoms.title}
             description={featureTutorials.symptoms.description}
             position="center"
             onComplete={completeSymptomTutorial}
             showSkip={false}
           />
         )}
      </View>
    </SharedBackground>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingButton: {
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  logsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  logsList: {
    flex: 1,
  },
     logItem: {
     backgroundColor: '#FFFFFF',
     padding: 15,
     borderRadius: 12,
     marginBottom: 10,
     elevation: 2,
     shadowColor: '#000000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
   },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  logTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logDomain: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  logIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  severityIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
     indicatorText: {
     fontSize: 12,
     color: '#FFFFFF',
     fontWeight: '500',
   },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 50,
  },
});
    