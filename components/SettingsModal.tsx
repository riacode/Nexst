import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Switch, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Updates from 'expo-updates';
import { useTutorial } from '../contexts/TutorialContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { clearAllStoredData } from '../utils/testUtils';
import { colors } from '../utils/colors';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearSymptomLogs: () => void;
  onClearAppointments: () => void;
  onClearRecommendations: () => void;
  onUpdateNotificationSettings: (newSettings: Partial<{
    enabled: boolean;
    dailyReminderEnabled: boolean;
    dailyReminderTime: Date;
    frequency: 'Daily' | 'Weekdays' | 'Weekly';
  }>) => Promise<void>;
  notificationEnabled: boolean;
  notificationTime: Date;
  notificationFrequency: 'Daily' | 'Weekdays' | 'Weekly';
}

const { height: screenHeight } = Dimensions.get('window');

export default function SettingsModal({ 
  visible, 
  onClose, 
  onClearSymptomLogs, 
  onClearAppointments, 
  onClearRecommendations,
  onUpdateNotificationSettings,
  notificationEnabled,
  notificationTime,
  notificationFrequency
}: SettingsModalProps) {
  const { resetTutorials } = useTutorial();
  const { resetOnboarding } = useOnboarding();
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;

  const handleRestartApp = () => {
    Alert.alert(
      'Restart App',
      'This will completely reset the app to its initial state and clear ALL data including symptoms, recommendations, appointments, and settings. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart App',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Starting complete app reset...');
              
              // Clear all stored data (symptoms, recommendations, appointments, settings, etc.)
              await clearAllStoredData();
              
              // Reset all tutorials
              await resetTutorials();
              
              // Reset onboarding state
              await resetOnboarding();
              
              // Clear all context data
              onClearSymptomLogs();
              onClearAppointments();
              onClearRecommendations();
              
              console.log('✅ App reset complete - all data cleared');
              
              // Close the settings modal
              handleClose();
              
              // Show success message
              Alert.alert(
                'App Reset Complete',
                'All data has been cleared and the app has been reset to its initial state. The app will now restart to complete the reset.',
                [
                  { 
                    text: 'OK',
                    onPress: async () => {
                      try {
                        // Force app restart to complete the reset
                        await Updates.reloadAsync();
                      } catch (error) {
                        console.error('❌ Error restarting app:', error);
                        // If Updates.reloadAsync fails, just close the modal
                        handleClose();
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('❌ Error restarting app:', error);
              Alert.alert(
                'Error',
                'Failed to restart the app. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };
  const backdropAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      // Animate backdrop first, then slide up
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Slide down first, then fade backdrop
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);



  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  const handleNotificationToggle = (value: boolean) => {
    onUpdateNotificationSettings({ 
      enabled: value, 
      dailyReminderEnabled: value 
    });
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      onUpdateNotificationSettings({ dailyReminderTime: selectedTime });
    }
  };

  const handleFrequencyChange = (frequency: 'Daily' | 'Weekdays' | 'Weekly') => {
    onUpdateNotificationSettings({ frequency });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={handleClose}
          />
        </Animated.View>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sections} showsVerticalScrollIndicator={false}>
            {/* Notification Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Reminders</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Enable Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Get reminded to record your symptoms
                  </Text>
                </View>
                <Switch
                  value={notificationEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: '#e2e8f0', true: '#00B39F' }}
                  thumbColor={notificationEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              {notificationEnabled && (
                <>
                  <View style={styles.settingRow}>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>Reminder Time</Text>
                      <Text style={styles.settingDescription}>
                        When to send reminders
                      </Text>
                    </View>
                    <DateTimePicker
                      value={notificationTime}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                      style={styles.inlineTimePicker}
                      textColor="#1e293b"
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>Frequency</Text>
                      <Text style={styles.settingDescription}>
                        How often to send reminders
                      </Text>
                    </View>
                    <View style={styles.frequencyButtons}>
                      {([
                        { display: 'Daily', value: 'Daily' as const },
                        { display: 'Weekdays', value: 'Weekdays' as const },
                        { display: 'Weekly', value: 'Weekly' as const }
                      ] as const).map(({ display, value }) => (
                        <TouchableOpacity
                          key={display}
                          style={[
                            styles.frequencyButton,
                            notificationFrequency === display && styles.frequencyButtonActive
                          ]}
                          onPress={() => handleFrequencyChange(value)}
                        >
                          <Text style={[
                            styles.frequencyText,
                            notificationFrequency === display && styles.frequencyTextActive
                          ]}>
                            {display}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* App Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Settings</Text>
              
              <TouchableOpacity 
                style={styles.option} 
                onPress={handleRestartApp}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="refresh-circle" size={24} color="#00B39F" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Restart App</Text>
                  <Text style={styles.optionDescription}>
                    Reset everything and start fresh with onboarding
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Delete Data */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delete Data</Text>
              <Text style={styles.sectionDescription}>
                These actions cannot be undone
              </Text>
              
              <TouchableOpacity 
                style={styles.option} 
                onPress={onClearSymptomLogs}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="pulse" size={24} color="#ef4444" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Clear All Symptom Logs</Text>
                  <Text style={styles.optionDescription}>
                    Delete all recordings, summaries, and logs
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.option} 
                onPress={onClearRecommendations}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="bulb" size={24} color="#ef4444" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Clear All Recommendations</Text>
                  <Text style={styles.optionDescription}>
                    Delete all health recommendations
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.option} 
                onPress={onClearAppointments}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="calendar" size={24} color="#ef4444" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Clear All Appointments</Text>
                  <Text style={styles.optionDescription}>
                    Delete all upcoming and past appointments
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </ScrollView>


        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: screenHeight * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  sections: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  inlineTimePicker: {
    width: 120,
    height: 40,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  frequencyButtonActive: {
    backgroundColor: '#00B39F',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  frequencyTextActive: {
    color: '#ffffff',
  },
  options: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
}); 