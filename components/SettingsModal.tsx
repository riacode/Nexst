import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, ScrollView, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTutorial } from '../contexts/TutorialContext';
import { useNotificationSettings } from '../contexts/NotificationSettingsContext';
import { clearOnboardingData } from '../utils/testUtils';
import { colors } from '../utils/colors';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearSymptomLogs: () => void;
  onClearAppointments: () => void;
  onClearRecommendations: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function SettingsModal({ 
  visible, 
  onClose, 
  onClearSymptomLogs, 
  onClearAppointments, 
  onClearRecommendations,
}: SettingsModalProps) {
  const { resetTutorials } = useTutorial();
  const { settings, updateSettings } = useNotificationSettings();
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = React.useRef(new Animated.Value(0)).current;

  // Notification settings state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const handleRestartApp = () => {
    Alert.alert(
      'Restart App',
      'This will reset the app to its initial state and clear all data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset all tutorials
              await resetTutorials();
              
              // Clear all data
              await clearOnboardingData();
              
              // Close the settings modal
              handleClose();
            } catch (error) {
              console.error('Error restarting app:', error);
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

  // ============================================================================
  // NOTIFICATION SETTINGS HANDLERS
  // ============================================================================

  const handleToggleNotifications = async (enabled: boolean) => {
    await updateSettings({ enabled });
  };

  const handleToggleDailyReminder = async (enabled: boolean) => {
    await updateSettings({ dailyReminderEnabled: enabled });
  };

  const handleToggleRecommendationAlerts = async (enabled: boolean) => {
    await updateSettings({ recommendationAlerts: enabled });
  };

  const handleToggleFollowUpAlerts = async (enabled: boolean) => {
    await updateSettings({ followUpAlerts: enabled });
  };

  const handleToggleAppointmentReminders = async (enabled: boolean) => {
    await updateSettings({ appointmentReminders: enabled });
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      setTempTime(selectedTime);
      const newTime = {
        hour: selectedTime.getHours(),
        minute: selectedTime.getMinutes()
      };
      updateSettings({ dailyReminderTime: newTime });
    }
  };

  const openTimePicker = () => {
    const currentTime = new Date();
    currentTime.setHours(settings.dailyReminderTime.hour, settings.dailyReminderTime.minute, 0, 0);
    setTempTime(currentTime);
    setShowTimePicker(true);
  };

  const formatTime = (time: { hour: number; minute: number }) => {
    const hour = time.hour % 12 || 12;
    const minute = time.minute.toString().padStart(2, '0');
    const ampm = time.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:${minute} ${ampm}`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={styles.backdropTouchable} onPress={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Settings</Text>

          {/* Notification Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            {/* Global Notification Toggle */}
                         <View style={styles.settingRow}>
               <View style={styles.settingInfo}>
                 <Ionicons name="notifications" size={20} color={colors.text} />
                 <Text style={styles.settingLabel}>Enable Notifications</Text>
               </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Daily Reminder Settings */}
            {settings.enabled && (
              <>
                                 <View style={styles.settingRow}>
                   <View style={styles.settingInfo}>
                     <Ionicons name="time" size={20} color={colors.text} />
                     <Text style={styles.settingLabel}>Daily Health Check-in</Text>
                   </View>
                  <Switch
                    value={settings.dailyReminderEnabled}
                    onValueChange={handleToggleDailyReminder}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {settings.dailyReminderEnabled && (
                                     <TouchableOpacity style={styles.timePickerRow} onPress={openTimePicker}>
                     <View style={styles.settingInfo}>
                       <Ionicons name="time" size={20} color={colors.text} />
                       <Text style={styles.settingLabel}>Reminder Time</Text>
                     </View>
                    <Text style={styles.timeText}>{formatTime(settings.dailyReminderTime)}</Text>
                  </TouchableOpacity>
                )}

                {/* Alert Type Toggles */}
                                 <View style={styles.settingRow}>
                   <View style={styles.settingInfo}>
                     <Ionicons name="medical" size={20} color={colors.text} />
                     <Text style={styles.settingLabel}>New Recommendations</Text>
                   </View>
                  <Switch
                    value={settings.recommendationAlerts}
                    onValueChange={handleToggleRecommendationAlerts}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                                 <View style={styles.settingRow}>
                   <View style={styles.settingInfo}>
                     <Ionicons name="help-circle" size={20} color={colors.text} />
                     <Text style={styles.settingLabel}>Follow-up Questions</Text>
                   </View>
                  <Switch
                    value={settings.followUpAlerts}
                    onValueChange={handleToggleFollowUpAlerts}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                                 <View style={styles.settingRow}>
                   <View style={styles.settingInfo}>
                     <Ionicons name="calendar" size={20} color={colors.text} />
                     <Text style={styles.settingLabel}>Appointment Reminders</Text>
                   </View>
                  <Switch
                    value={settings.appointmentReminders}
                    onValueChange={handleToggleAppointmentReminders}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            )}
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={onClearSymptomLogs}>
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={styles.actionButtonText}>Clear Symptom Logs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onClearRecommendations}>
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={styles.actionButtonText}>Clear Recommendations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onClearAppointments}>
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={styles.actionButtonText}>Clear Appointments</Text>
            </TouchableOpacity>
          </View>

          {/* App Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Management</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleRestartApp}>
              <Ionicons name="refresh" size={20} color={colors.warning} />
              <Text style={styles.actionButtonText}>Restart App</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeText: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
}); 