import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';

export default function SymptomScreen() {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [status, setStatus] = useState('Tap to record your check-in');
    const [audioURI, setAudioURI] = useState<string | null>(null);

    const handleRecord = async () => {
        if (recording) { // and they press the button to stop
            try {
                console.log('Stopping recording...');
                setRecording(null);
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                if (uri) {
                    setAudioURI(uri);
                }
                setStatus("Recording saved!");
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
                setStatus("Recording... tap again to stop.");
            } catch (error) {
                setStatus("Failed to start recording.");
                console.error("Error starting recording: ", error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}> Daily Check-In</Text>
            <Button title={recording ? 'Done' : 'Record Check-In'} onPress={handleRecord} />
            <Text style={styles.status}>{status}</Text>

            {audioURI && (
                <View style={styles.recordingInfo}>
                    <Text style={styles.label}>Recording saved:</Text>
                    <Text numberOfLines={1}>{audioURI}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
        textAlign: 'center',
    },
    status: {
        fontSize: 18,
        color: '#333',
        marginBottom: 12,
    },
    recordingInfo: {
        fontSize: 16,
        marginTop: 30
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold'
    },
});
