import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearSymptomLogs: () => void;
  onClearAppointments: () => void;
  onClearRecommendations: () => void;
  onUpdateNotificationSettings: (enabled: boolean, time: Date, frequency: string) => void;
  notificationEnabled: boolean;
  notificationTime: Date;
  notificationFrequency: string;
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
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = React.useRef(new Animated.Value(0)).current;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [localNotificationEnabled, setLocalNotificationEnabled] = useState(notificationEnabled);
  const [localNotificationTime, setLocalNotificationTime] = useState(notificationTime);
  const [localNotificationFrequency, setLocalNotificationFrequency] = useState(notificationFrequency);

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

  React.useEffect(() => {
    setLocalNotificationEnabled(notificationEnabled);
    setLocalNotificationTime(notificationTime);
    setLocalNotificationFrequency(notificationFrequency);
  }, [notificationEnabled, notificationTime, notificationFrequency]);

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
    setLocalNotificationEnabled(value);
    onUpdateNotificationSettings(value, localNotificationTime, localNotificationFrequency);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setLocalNotificationTime(selectedTime);
      onUpdateNotificationSettings(localNotificationEnabled, selectedTime, localNotificationFrequency);
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    setLocalNotificationFrequency(frequency);
    onUpdateNotificationSettings(localNotificationEnabled, localNotificationTime, frequency);
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

          <View style={styles.sections}>
            {/* Notification Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Reminders</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Enable Daily Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Get reminded to record your symptoms daily
                  </Text>
                </View>
                <Switch
                  value={localNotificationEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: '#e2e8f0', true: '#00b4d8' }}
                  thumbColor={localNotificationEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              {localNotificationEnabled && (
                <>
                  <View style={styles.settingRow}>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>Reminder Time</Text>
                      <Text style={styles.settingDescription}>
                        When to send daily reminders
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.timeText}>{formatTime(localNotificationTime)}</Text>
                      <Ionicons name="time" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.settingRow}>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>Frequency</Text>
                      <Text style={styles.settingDescription}>
                        How often to send reminders
                      </Text>
                    </View>
                    <View style={styles.frequencyButtons}>
                      {['Daily', 'Weekdays', 'Weekly'].map((freq) => (
                        <TouchableOpacity
                          key={freq}
                          style={[
                            styles.frequencyButton,
                            localNotificationFrequency === freq && styles.frequencyButtonActive
                          ]}
                          onPress={() => handleFrequencyChange(freq)}
                        >
                          <Text style={[
                            styles.frequencyText,
                            localNotificationFrequency === freq && styles.frequencyTextActive
                          ]}>
                            {freq}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Data Management */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Management</Text>
              
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
            </View>
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={localNotificationTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleTimeChange}
            />
          )}
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
    backgroundColor: '#00b4d8',
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