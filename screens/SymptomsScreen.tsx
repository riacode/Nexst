import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { transcribeAudio, generateSummary, generateRecommendations, generateFollowUpQuestions, checkForMissedPeriod } from '../utils/openai';
import { SymptomLog, MedicalRecommendation, RecommendationAlert } from '../types/recommendations';
import { useRecommendations } from '../contexts/RecommendationsContext';
import { useSymptomLogs } from '../contexts/SymptomLogsContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useTutorial } from '../contexts/TutorialContext';
import { NotificationService } from '../utils/notifications';
import NotificationPermission from '../components/NotificationPermission';
import FeatureTutorial from '../components/FeatureTutorial';
import { featureTutorials } from '../utils/onboardingContent';
import SharedBackground from '../components/SharedBackground';

export default function SymptomScreen({ navigation }: any) {
    const [audioURI, setAudioURI] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [alertVisible, setAlertVisible] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [activeAlert, setActiveAlert] = useState<RecommendationAlert | null>(null);
    const [hasRecordedToday, setHasRecordedToday] = useState<boolean>(false);
    const [status, setStatus] = useState('Tap to record your daily check-in');
    const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
    const [missedPeriodQuestion, setMissedPeriodQuestion] = useState<string | null>(null);
    
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    // Use the global recommendations context
    const { recommendations, addRecommendations } = useRecommendations();
    const { symptomLogs, addSymptomLog } = useSymptomLogs();
    const { markOnboardingComplete } = useOnboarding();
    const { tutorialState, completeSymptomTutorial } = useTutorial();

    // Audio recording state
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    // Check if user has recorded today
    const checkIfRecordedToday = () => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        
        return symptomLogs.some(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= todayStart && logDate < todayEnd;
        });
    };

    // Update hasRecordedToday when symptomLogs change
    useEffect(() => {
        setHasRecordedToday(checkIfRecordedToday());
    }, [symptomLogs]);

    // Update status text based on whether user has recorded today
    useEffect(() => {
        if (!isProcessing && !isRecording) {
            setStatus(hasRecordedToday ? 'Tap to record another check-in' : 'Tap to record your daily check-in');
        }
    }, [hasRecordedToday, isProcessing, isRecording]);



    // generate recommendations and follow-up questions when symptoms are added
    useEffect(() => {
        const checkForRecommendations = async () => {
            try {
                // Only generate recommendations if we have symptom logs
                if (symptomLogs.length >= 1) {
                    const symptomRecommendations = await generateRecommendations(symptomLogs, recommendations);
                    
                    if (symptomRecommendations.length > 0) {
                        // Add to global recommendations context
                        addRecommendations(symptomRecommendations);
                        
                        // Send notifications for new recommendations
                        for (const recommendation of symptomRecommendations) {
                            if (recommendation.priority === 'HIGH') {
                                await NotificationService.sendHighPriorityNotification(recommendation);
                            } else {
                                await NotificationService.sendRecommendationNotification(recommendation);
                            }
                        }
                        
                        // Create alert for highest priority recommendation
                        const highPriorityRec = symptomRecommendations.find(rec => rec.priority === 'HIGH');
                        if (highPriorityRec) {
                            setActiveAlert({
                                id: Date.now().toString(),
                                recommendation: highPriorityRec,
                                isRead: false,
                                createdAt: new Date()
                            });
                            setAlertVisible(true);
                        }
                    }
                }
                
                // Check for follow-up questions for unresolved symptoms
                if (symptomLogs.length >= 2) {
                    const followUpQuestions = await generateFollowUpQuestions(symptomLogs);
                    if (followUpQuestions.length > 0) {
                        setFollowUpQuestion(followUpQuestions[0]);
                    }
                    
                    // Check for missed period
                    const missedPeriodQ = await checkForMissedPeriod(symptomLogs);
                    if (missedPeriodQ) {
                        setMissedPeriodQuestion(missedPeriodQ);
                    }
                }
            } catch (error) {
                console.error('Error generating recommendations:', error);
            }
        };
        
        checkForRecommendations();
    }, [symptomLogs, addRecommendations, recommendations]);

    // pulsating animation for first recording of the day
    useEffect(() => {
        if (!hasRecordedToday) {
            const pulseAnimation = Animated.loop(
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
            );
            pulseAnimation.start();
            
            return () => pulseAnimation.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [hasRecordedToday, pulseAnim]);

    // spinning animation for processing
    useEffect(() => {
        if (isProcessing) {
            const spinAnimation = Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            );
            spinAnimation.start();
            
            return () => spinAnimation.stop();
        } else {
            spinAnim.setValue(0);
        }
    }, [isProcessing, spinAnim]);



    const handleRecord = async () => {
        if (isRecording) { // Stop recording
            try {
                console.log('Stopping recording...');
                if (recording) {
                    await recording.stopAndUnloadAsync();
                    const uri = recording.getURI();
                    if (uri) {
                        setAudioURI(uri);
                        setIsProcessing(true);
                        setStatus("Processing audio...");
                        
                        try {
                            // Transcribe audio
                            const transcript = await transcribeAudio(uri);
                            console.log("Transcript:", transcript);
                            
                            // Generate summary
                            const summary = await generateSummary(transcript);
                            console.log("Summary:", summary);
                            
                            // Add to global symptom logs
                            const now = new Date();
                            const newLog = { 
                                id: now.toISOString(), 
                                timestamp: now, 
                                summary, 
                                transcript,
                                audioURI: uri 
                            };
                            addSymptomLog(newLog);
                            
                            setStatus("Recording saved!");
                        } catch (error) {
                            console.error("OpenAI processing error:", error);
                            setStatus("Failed to process audio.");
                            Alert.alert("Error", "Failed to process audio. Please try again.");
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                    console.log("Audio saved at: ", uri);
                }
                setRecording(null);
                setIsRecording(false);
            } catch (error) {
                setStatus("Failed to stop recording.");
                console.error("Error saving audio: ", error);
                setIsProcessing(false);
                setIsRecording(false);
            }
        } else { // Start recording
            try {
                console.log('Requesting permissions...');
                const permission = await Audio.requestPermissionsAsync();
                if (!permission.granted) {
                    setStatus("Microphone permission required.");
                    console.log("Permission for recording was denied.");
                    return;
                }
                
                console.log('Starting recording...');
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                
                const { recording: newRecording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                
                setRecording(newRecording);
                setIsRecording(true);
                setStatus("Recording...");
            } catch (error) {
                setStatus("Failed to start recording.");
                console.error("Error starting recording: ", error);
            }
        }
    };

    const renderLog = (log: SymptomLog) => (
        <TouchableOpacity key={log.id} style={styles.logCard} onPress={() => navigation.navigate('RecordingDetail', { 
          log: {
            ...log,
            timestamp: log.timestamp.toISOString() // Convert Date to string for navigation
          }
        })}>
          <Text style={styles.logTitle}>{log.summary}</Text>
          <View style={styles.logHeader}>
            <Text style={styles.logDate}>{log.timestamp.toLocaleString()}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
        </TouchableOpacity>
      );

        return (
    <SharedBackground>
      <View style={styles.container}>
          
          <NotificationPermission />
          
          <FeatureTutorial
            visible={!tutorialState.hasSeenSymptomTutorial && symptomLogs.length === 0}
            title={featureTutorials.symptoms.title}
            description={featureTutorials.symptoms.description}
            position="center"
            onComplete={completeSymptomTutorial}
            showSkip={false}
          />
          
          {activeAlert && alertVisible && (
            <TouchableOpacity 
              style={[
                styles.alert, 
                activeAlert.recommendation.priority === 'HIGH' && styles.alertHigh
              ]} 
              onPress={() => {
                setAlertVisible(false);
                setActiveAlert(null); // Remove the alert completely
                navigation.navigate('Recommendations');
              }}
            >
              <Text style={styles.alertText}>
                {activeAlert.recommendation.priority === 'HIGH' ? '🚨 ' : '💡 '}
                {activeAlert.recommendation.title}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#00b4d8" />
            </TouchableOpacity>
          )}
          
          {followUpQuestion && (
            <TouchableOpacity 
              style={styles.followUpAlert} 
              onPress={() => setFollowUpQuestion(null)}
            >
              <Text style={styles.followUpText}>
                🤔 {followUpQuestion}
              </Text>
              <Ionicons name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          )}
          
          {missedPeriodQuestion && (
            <TouchableOpacity 
              style={styles.followUpAlert} 
              onPress={() => setMissedPeriodQuestion(null)}
            >
              <Text style={styles.followUpText}>
                📅 {missedPeriodQuestion}
              </Text>
              <Ionicons name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          )}
          <ScrollView contentContainerStyle={styles.logsContainer}>
            {symptomLogs.map(renderLog)}
          </ScrollView>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <Animated.View 
                style={[
                  styles.processingSpinner,
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
                <Ionicons name="sync" size={32} color="#00b4d8" />
              </Animated.View>
              <Text style={styles.processingText}>Processing your recording...</Text>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.recordButton, 
                symptomLogs.length > 0 && styles.recordButtonSmall,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <LinearGradient
                colors={['#00b4d8', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.recordButtonInner, { borderRadius: symptomLogs.length > 0 ? 35 : 50 }]}
              >
                <TouchableOpacity
                  style={styles.recordButtonInner}
                  onPress={handleRecord}
                  disabled={isProcessing}
                >
                  <Ionicons 
                    name={isRecording ? 'stop' : 'mic'} 
                    size={symptomLogs.length === 0 ? 48 : 32} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
              </View>
    </SharedBackground>
  );
}


    const styles = StyleSheet.create({
      container: { flex: 1 },
      alert: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#e0f7ff', padding: 12, margin: 12, borderRadius: 8,
        borderColor: '#00b4d8', borderWidth: 1,
      },
      alertText: { flex: 1, color: '#00b4d8' },
      logsContainer: { padding: 12, paddingBottom: 140 },
      logCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 16, borderRadius: 12, marginBottom: 12,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
        borderLeftWidth: 4, borderLeftColor: '#00b4d8',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
      logDate: { color: '#64748b', fontSize: 12, fontWeight: '500' },
      logTitle: { fontSize: 18, color: '#ffffff', fontWeight: '600' },
      recordButton: {
        position: 'absolute', bottom: 24, alignSelf: 'center',
        backgroundColor: '#00b4d8', width: 100, height: 100, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
      },
      recordButtonSmall: {
        width: 70, height: 70, borderRadius: 35, bottom: 20,
      },
      recordButtonInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
      processingContainer: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      processingSpinner: {
        marginBottom: 8,
      },
      processingText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
      },
      alertHigh: {
        backgroundColor: '#fff5f5',
        borderColor: '#ef4444',
      },
      followUpAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: 12,
        margin: 16,
        borderRadius: 8,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
      followUpText: {
        flex: 1,
        color: '#475569',
        marginRight: 8,
        fontSize: 14,
        lineHeight: 20,
      },
    });
    