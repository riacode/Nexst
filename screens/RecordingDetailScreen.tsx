import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { fontStyles } from '../utils/fonts';

export default function RecordingDetailScreen({ route, navigation }: any) {
  const { log } = route.params;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadSound = async () => {
    if (!log.audioURI) {
      Alert.alert('Error', 'No audio recording found');
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: log.audioURI },
        { shouldPlay: false }
      );
      setSound(sound);
      
      // Get duration
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load audio recording');
    }
  };

  const playSound = async () => {
    if (!sound) {
      await loadSound();
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
        
        // Monitor playback position
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
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
        <Text style={styles.headerTitle}>Recording Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.recordingCard}>
          <View style={styles.recordingHeader}>
            <Ionicons name="mic" size={32} color="#0288d1" />
            <Text style={styles.recordingTitle}>Symptom Recording</Text>
          </View>
          
          <Text style={styles.timestamp}>
            {log.timestamp.toLocaleString()}
          </Text>
          
          <Text style={styles.summary}>
            "{log.summary}"
          </Text>

          {log.audioURI && (
            <View style={styles.audioPlayer}>
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={playSound}
              >
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={32} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
              
              <View style={styles.audioInfo}>
                <Text style={styles.audioStatus}>
                  {isPlaying ? 'Playing...' : 'Tap to play'}
                </Text>
                <Text style={styles.audioDuration}>
                  {formatTime(position)} / {formatTime(duration)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
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
  summary: {
    ...fontStyles.body,
    color: '#1e293b',
    fontStyle: 'italic',
    marginBottom: 24,
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
}); 