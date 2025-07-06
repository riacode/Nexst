import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  onClearRecommendations 
}: SettingsModalProps) {
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
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

          <View style={styles.options}>
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
    maxHeight: screenHeight * 0.7,
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