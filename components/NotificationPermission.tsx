import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NotificationService } from '../utils/notifications';

interface NotificationPermissionProps {
  onPermissionGranted?: () => void;
}

export default function NotificationPermission({ onPermissionGranted }: NotificationPermissionProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await NotificationService.requestPermissions();
    setHasPermission(granted);
    if (granted && onPermissionGranted) {
      onPermissionGranted();
    }
  };

  const requestPermission = async () => {
    const granted = await NotificationService.requestPermissions();
    setHasPermission(granted);
    
    if (granted) {
      Alert.alert(
        'Notifications Enabled',
        'You\'ll now receive notifications for new health recommendations.',
        [{ text: 'OK' }]
      );
      if (onPermissionGranted) {
        onPermissionGranted();
      }
    } else {
      Alert.alert(
        'Notifications Disabled',
        'You can enable notifications in your device settings to stay updated on your health recommendations.',
        [{ text: 'OK' }]
      );
    }
  };

  if (hasPermission === null) {
    return null; // Still checking permission
  }

  if (hasPermission) {
    return null; // Permission already granted
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="notifications" size={32} color="#00B39F" />
        <Text style={styles.title}>Stay Updated</Text>
        <Text style={styles.description}>
          Enable notifications to receive important health recommendations and updates.
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <LinearGradient
            colors={['#00B39F', '#00B39F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Enable Notifications</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f9ff',
    borderColor: '#00B39F',
    borderWidth: 1,
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 