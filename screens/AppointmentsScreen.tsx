import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, TouchableOpacity, TextInput, Alert, Modal} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fontStyles } from '../utils/fonts';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useSmartAI } from '../contexts/SmartAIContext';
import { useTutorial } from '../contexts/TutorialContext';
import FeatureTutorial from '../components/FeatureTutorial';
import { featureTutorials } from '../utils/onboardingContent';
import SharedBackground from '../components/SharedBackground';
import { colors, gradients } from '../utils/colors';

interface Appointment {
    id: string;
    title: string;
    date: Date;
    timestamp: Date;
}

export default function AppointmentsScreen({ navigation }: any) {
  const { appointments, addAppointment: addAppointmentToContext } = useAppointments();
  const { tutorialState, completeAppointmentTutorial } = useTutorial();
  const { generateAppointmentQuestions } = useSmartAI();
  const [showModal, setShowModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [pastCollapsed, setPastCollapsed] = useState(false);

  const addAppointment = async () => {
    if (!titleInput.trim()) {
      Alert.alert('Error', 'Please enter an appointment name');
      return;
    }
    
    const now = new Date();
    
    // Generate questions for the appointment
    let questions: string[] = [];
    try {
      questions = await generateAppointmentQuestions(titleInput, selectedDate);
    } catch (error) {
      console.error('Error generating appointment questions:', error);
      // Fallback questions if AI fails
      questions = [
        "How have you been feeling since your last visit?",
        "Have you noticed any new symptoms?",
        "Are there any concerns you'd like to discuss?",
        "How are your current medications working?",
        "Have you made any lifestyle changes recently?"
      ];
    }
    
    const newAppointment = {
      id: now.toISOString(),
      title: titleInput,
      date: selectedDate,
      timestamp: now,
      questions: questions,
      recentSymptomsLastUpdated: now
    };
    
    addAppointmentToContext(newAppointment);
    
    
    
    setShowModal(false);
    setTitleInput('');
    setSelectedDate(new Date());
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (time) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      setSelectedDate(newDateTime);
    }
  };

  const resetForm = () => {
    setTitleInput('');
    setSelectedDate(new Date());
    setShowModal(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const CollapsibleSection = ({ 
    title, 
    isCollapsed, 
    onToggle, 
    children, 
    count 
  }: { 
    title: string; 
    isCollapsed: boolean; 
    onToggle: () => void; 
    children: React.ReactNode;
    count: number;
  }) => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader} 
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons 
            name={isCollapsed ? 'chevron-down' : 'chevron-up'} 
            size={20} 
            color="#64748b" 
            style={{ marginRight: 8 }}
          />
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
          <Text style={styles.sectionCount}>({count})</Text>
        </View>
      </TouchableOpacity>
      {!isCollapsed && children}
    </View>
  );

  // Organize appointments into upcoming and past (checking both date and time)
  const now = new Date();
  const upcomingAppointments = appointments.filter(app => {
    const appointmentDateTime = new Date(app.date);
    return appointmentDateTime > now;
  });
  const pastAppointments = appointments.filter(app => {
    const appointmentDateTime = new Date(app.date);
    return appointmentDateTime <= now;
  });

  // Sort appointments
  const sortedUpcoming = upcomingAppointments.sort((a, b) => a.date.getTime() - b.date.getTime());
  const sortedPast = pastAppointments.sort((a, b) => b.date.getTime() - a.date.getTime());







  const renderItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appItem}
      onPress={() => navigation.navigate('AppointmentDetail', { 
        appointment: {
          ...item,
          date: item.date.toISOString(),
          timestamp: item.timestamp.toISOString()
        }
      })}
    >
      <View style={styles.appHeader}>
        <Text style={styles.appDate}>{formatDate(item.date)}</Text>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </View>
      <Text numberOfLines={1} style={styles.appTitle}>{item.title}</Text>
      <Text style={styles.appScheduledDate}>
        {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SharedBackground>
      <View style={styles.container}>
      <FeatureTutorial
        visible={!tutorialState.hasSeenAppointmentTutorial && appointments.length === 0}
        title={featureTutorials.appointments.title}
        description={featureTutorials.appointments.description}
        position="center"
        onComplete={completeAppointmentTutorial}
        showSkip={false}
      />
      
      <FlatList
        data={[]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <View>
            {/* Upcoming Appointments */}
            {sortedUpcoming.length > 0 && (
              <CollapsibleSection
                title="Upcoming Appointments"
                isCollapsed={upcomingCollapsed}
                onToggle={() => setUpcomingCollapsed(!upcomingCollapsed)}
                count={sortedUpcoming.length}
              >
                {sortedUpcoming.map((item) => (
                  <View key={item.id}>
                    {renderItem({ item })}
                  </View>
                ))}
              </CollapsibleSection>
            )}

            {/* Past Appointments */}
            {sortedPast.length > 0 && (
              <CollapsibleSection
                title="Past Appointments"
                isCollapsed={pastCollapsed}
                onToggle={() => setPastCollapsed(!pastCollapsed)}
                count={sortedPast.length}
              >
                {sortedPast.map((item) => (
                  <View key={item.id}>
                    {renderItem({ item })}
                  </View>
                ))}
              </CollapsibleSection>
            )}


          </View>
        )}
      />
      
      {showModal && (
        <Modal
          visible={showModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Appointment</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.titleInput}
                placeholder="Appointment name"
                value={titleInput}
                onChangeText={setTitleInput}
                placeholderTextColor="#64748b"
                textAlign="center"
              />

              <View style={styles.dateTimeContainer}>
                <View style={styles.dateTimeSection}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <View style={styles.pickerWrapper}>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                      style={styles.inlinePicker}
                      textColor="#1e293b"
                    />
                  </View>
                </View>
                
                <View style={styles.dateTimeSection}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <View style={styles.pickerWrapper}>
                    <DateTimePicker
                      value={selectedDate}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                      style={styles.inlinePicker}
                      textColor="#1e293b"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.pickerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButtonStyle} onPress={addAppointment}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Date/Time Pickers */}
      {/* These are now handled inline within the modal */}
      
      <TouchableOpacity
        style={[styles.recordButton, appointments.length > 0 && styles.recordButtonSmall, { borderRadius: appointments.length > 0 ? 35 : 50, backgroundColor: colors.accent }]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons 
          name="add" 
          size={appointments.length === 0 ? 48 : 32} 
          color="#fff" 
        />
      </TouchableOpacity>
      </View>
    </SharedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12, paddingTop: 16, paddingBottom: 140 },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 12,
    paddingHorizontal: 4,
    marginRight: 8,
  },
  sectionHeaderTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionCount: {
    ...fontStyles.h3,
    color: '#94a3b8',
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    ...fontStyles.h3,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...fontStyles.body,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  appItem: { 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2,
    borderLeftWidth: 4, 
            borderLeftColor: colors.accent,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8,
  },
  appDate: { 
    ...fontStyles.small,
    color: '#64748b', 
  },
  appTitle: { 
    ...fontStyles.bodyMedium,
    color: '#1e293b',
    marginBottom: 4,
  },
  appScheduledDate: {
    ...fontStyles.caption,
    color: '#64748b',
  },

  titleInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    ...fontStyles.body,
    textAlign: 'center',
    color: '#1e293b',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },

  dateTimeSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  dateTimeLabel: {
    ...fontStyles.caption,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  pickerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlinePicker: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1e293b',
  },



  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
  },
  modalClose: {
    ...fontStyles.button,
            color: colors.accent,
  },

  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
  },
  cancelButtonText: {
    ...fontStyles.button,
    color: '#64748b',
    textAlign: 'center',
  },
  addButtonStyle: {
    flex: 1,
    padding: 16,
    marginLeft: 8,
    borderRadius: 12,
            backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    ...fontStyles.button,
    color: '#ffffff',
    textAlign: 'center',
  },
  recordButton: {
    position: 'absolute', 
    bottom: 24, 
    alignSelf: 'center',
            backgroundColor: colors.accentMint, 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 5,
  },
  recordButtonSmall: {
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    bottom: 20,
  },
  recordButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
