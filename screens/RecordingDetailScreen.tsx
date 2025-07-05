import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { fontStyles } from '../utils/fonts';

export default function RecordingDetailScreen({ route, navigation }: any) {
  const { log } = route.params;
  
  // Early return if no log data
  if (!log) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recording Details</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>No recording data available</Text>
        </View>
      </View>
    );
  }
  
  // Convert timestamp string back to Date object
  const logWithDate = {
    ...log,
    timestamp: new Date(log.timestamp)
  };
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load audio when component mounts
  useEffect(() => {
    loadAudio();
    return () => {
      unloadAudio();
    };
  }, []);

  // Stop audio when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        stopAudio();
      };
    }, [])
  );

  const loadAudio = async () => {
    try {
      if (!logWithDate.audioURI) {
        setAudioError('No audio file available');
        return;
      }

      // Configure audio mode for maximum volume
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      setAudioError(null);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: logWithDate.audioURI },
        { 
          shouldPlay: false,
          volume: 1.0, // Maximum volume
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load audio:', error);
      setAudioError('Failed to load audio file');
    }
  };

  const unloadAudio = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis / 1000);
      setDuration(status.durationMillis / 1000);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const playSound = async () => {
    if (!sound) {
      Alert.alert('Error', 'Audio not loaded');
      return;
    }

    try {
      setAudioError(null);
      
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        if (position >= duration && duration > 0) {
          // If at the end, restart from beginning
          await sound.setPositionAsync(0);
          setPosition(0);
        }
        // Set maximum volume before playing
        await sound.setVolumeAsync(1.0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setAudioError('Failed to play audio');
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  };

  const restartPlayback = async () => {
    if (!sound) {
      Alert.alert('Error', 'Audio not loaded');
      return;
    }

    try {
      setAudioError(null);
      setPosition(0);
      await sound.setPositionAsync(0);
      // Set maximum volume before playing
      await sound.setVolumeAsync(1.0);
      await sound.playAsync();
    } catch (error) {
      console.error('Restart error:', error);
      setAudioError('Failed to restart audio');
      Alert.alert('Error', 'Failed to restart audio. Please try again.');
    }
  };

  const stopAudio = async () => {
    if (sound && isPlaying) {
      try {
        await sound.stopAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Stop audio error:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            stopAudio();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recording Details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appointment Info */}
        <View style={styles.recordingCard}>
          <View style={styles.recordingHeader}>
            <Ionicons name="mic" size={32} color="#00b4d8" />
            <Text style={styles.recordingTitle}>Symptom Recording</Text>
          </View>
          
          <Text style={styles.timestamp}>
            {logWithDate.timestamp.toLocaleString()}
          </Text>
          
          <Text style={styles.transcript}>
            "{logWithDate.transcript}"
          </Text>

          {logWithDate.audioURI && (
            <View style={styles.audioPlayer}>
              {audioError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="warning" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{audioError}</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={audioError ? loadAudio : playSound}
                disabled={!isLoaded && !audioError}
              >
                <Ionicons 
                  name={audioError ? 'refresh' : isPlaying ? 'pause' : 'play'} 
                  size={32} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
              
              <View style={styles.audioInfo}>
                <Text style={styles.audioStatus}>
                  {audioError ? 'Audio Error' : !isLoaded ? 'Loading...' : isPlaying ? 'Playing...' : 'Tap to play'}
                </Text>
                
                <Text style={styles.audioDuration}>
                  {formatTime(position)} / {formatTime(duration)}
                </Text>
              </View>
              
              {isLoaded && !isPlaying && position > 0 && !audioError && (
                <TouchableOpacity 
                  style={styles.restartButton} 
                  onPress={restartPlayback}
                >
                  <Ionicons name="refresh" size={20} color="#00b4d8" />
                </TouchableOpacity>
              )}
            </View>
          )}
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
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  recordingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginLeft: 12,
  },
  timestamp: {
    ...fontStyles.caption,
    color: '#64748b',
    marginBottom: 16,
  },
  transcript: {
    ...fontStyles.body,
    color: '#1e293b',
    marginBottom: 24,
    lineHeight: 24,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00b4d8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioStatus: {
    ...fontStyles.bodyMedium,
    color: '#1e293b',
    marginBottom: 4,
  },
  audioDuration: {
    ...fontStyles.caption,
    color: '#64748b',
  },
  restartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  errorText: {
    ...fontStyles.caption,
    color: '#ef4444',
    marginLeft: 6,
    flex: 1,
  },
}); 