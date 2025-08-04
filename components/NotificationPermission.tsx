import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationSettings } from '../contexts/NotificationSettingsContext';
import { colors } from '../utils/colors';

// ============================================================================
// NOTIFICATION PERMISSION COMPONENT - Requests Notification Permissions
// ============================================================================

interface NotificationPermissionProps {
  onComplete: () => void;
}

export default function NotificationPermission({ onComplete }: NotificationPermissionProps) {
  const { requestPermissions, isInitialized } = useNotificationSettings();
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      // Auto-request permissions after a short delay
      const timer = setTimeout(() => {
        handleRequestPermissions();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await requestPermissions();
      
      if (granted) {
        console.log('Notification permissions granted');
        onComplete();
      } else {
        console.log('Notification permissions denied');
        // Still complete the flow even if permissions are denied
        onComplete();
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      onComplete();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleManualRequest = () => {
    Alert.alert(
      'Enable Notifications',
      'To receive health reminders and updates, please enable notifications in your device settings.',
      [
        { text: 'Skip', style: 'cancel', onPress: handleSkip },
        { text: 'Enable', onPress: handleRequestPermissions }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="notifications" size={64} color={colors.accent} />
      </View>
      
      <Text style={styles.title}>Stay Updated</Text>
      
      <Text style={styles.description}>
        Enable notifications to receive:
        {'\n'}• Daily health check-in reminders
        {'\n'}• New health recommendations
        {'\n'}• Follow-up questions
        {'\n'}• Appointment reminders
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleRequestPermissions}
          disabled={isRequesting}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {isRequesting ? 'Enabling...' : 'Enable Notifications'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleSkip}
          disabled={isRequesting}
        >
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
}); 