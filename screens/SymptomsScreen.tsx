import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface SymptomLog {
    id: string;
    timestamp: Date;
    summary: string;
    audioURI?: string;
}

export default function SymptomScreen({ navigation }: any) {
    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [status, setStatus] = useState('Tap to record your check-in');
    const [audioURI, setAudioURI] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [alertVisible, setAlertVisible] = useState<boolean>(true);
    
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // generate alert
    useEffect(() => {
        if (logs.length >= 3) {
            setAlertMessage('You\'ve logged similar symptoms 3 times in a row. Consider booking an appointment.');
        } else {
            setAlertMessage('');
        }
    }, [logs]);

    // pulsating animation for first recording
    useEffect(() => {
        if (logs.length === 0) {
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
    }, [logs.length, pulseAnim]);

    const handleRecord = async () => {
        if (recording) { // and they press the button to stop
            try {
                console.log('Stopping recording...');
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                if (uri) {
                    setAudioURI(uri);
                }
                const now = new Date();
                const summary = "Summary";
                setLogs(prevLogs => [{ id: now.toISOString(), timestamp: now, summary, audioURI: uri || undefined }, ...prevLogs]);
                setRecording(null);
                console.log("Audio saved at: ", uri);
            } catch (error) {
                setStatus("Failed to stop recording.");
                console.error("Error saving audio: ", error);
            }
        } else { // and they press the button to start
            try {
                console.log('Requesting permissions...');
                const permission = await Audio.requestPermissionsAsync();
                if (permission.status !== 'granted') {
                    setStatus("Microphone permission required.");
                    console.log("Permission for recording was denied.");
                    return;
                }
                console.log('Starting recording...');
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY,
                );
                setRecording(recording);
                setStatus("Recording...");
            } catch (error) {
                setStatus("Failed to start recording.");
                console.error("Error starting recording: ", error);
            }
        }
    };

    const renderLog = (log: SymptomLog) => (
        <TouchableOpacity key={log.id} style={styles.logCard} onPress={() => navigation.navigate('RecordingDetail', { log })}>
          <View style={styles.logHeader}>
            <Text style={styles.logDate}>{log.timestamp.toLocaleString()}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
          <Text numberOfLines={1} style={styles.logSummary}>"{log.summary}"</Text>
        </TouchableOpacity>
      );

      return (
        <View style={styles.container}>
          {alertMessage && alertVisible && (
            <TouchableOpacity 
              style={styles.alert} 
              onPress={() => {
                setAlertVisible(false);
                navigation.navigate('Recommendations');
              }}
            >
              <Text style={styles.alertText}>💡 {alertMessage}</Text>
              <Ionicons name="arrow-forward" size={16} color="#01579b" />
            </TouchableOpacity>
          )}
          <ScrollView contentContainerStyle={styles.logsContainer}>
            {logs.map(renderLog)}
          </ScrollView>
          <Animated.View
            style={[
              styles.recordButton, 
              logs.length > 0 && styles.recordButtonSmall,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <TouchableOpacity
              style={styles.recordButtonInner}
              onPress={handleRecord}
            >
              <Ionicons 
                name={recording ? 'stop' : 'mic'} 
                size={logs.length === 0 ? 48 : 32} 
                color="#fff" 
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }


    const styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: '#f8fafc' },
      alert: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#e0f7ff', padding: 12, margin: 12, borderRadius: 8,
        borderColor: '#00b4d8', borderWidth: 1,
      },
      alertText: { flex: 1, color: '#0077b6' },
      logsContainer: { padding: 12, paddingBottom: 140 },
      logCard: {
        backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
        borderLeftWidth: 4, borderLeftColor: '#00b4d8',
      },
      logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      logDate: { color: '#64748b', fontSize: 12, fontWeight: '500' },
      logSummary: { marginTop: 6, fontSize: 16, color: '#1e293b', fontWeight: '500' },
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
    });
    