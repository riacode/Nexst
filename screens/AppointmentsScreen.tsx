import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, TouchableOpacity, TextInput, Alert, Modal} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { useAppointments } from '../contexts/AppointmentsContext';

interface Appointment {
    id: string;
    title: string;
    date: Date;
    timestamp: Date;
}

export default function AppointmentsScreen({ navigation }: any) {
  const { appointments, addAppointment: addAppointmentToContext } = useAppointments();
  const [showModal, setShowModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [pastCollapsed, setPastCollapsed] = useState(false);

  const addAppointment = () => {
    if (!titleInput.trim()) {
      Alert.alert('Error', 'Please enter an appointment name');
      return;
    }
    
    const now = new Date();
    addAppointmentToContext({
      id: now.toISOString(),
      title: titleInput,
      date: selectedDate,
      timestamp: now
    });
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
          />
          <Text style={styles.sectionTitle}>{title}</Text>
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
    <View style={styles.container}>
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

            {/* Empty State */}
            {appointments.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar" size={64} color="#cbd5e1" />
                <Text style={styles.emptyStateTitle}>No Appointments Yet</Text>
                <Text style={styles.emptyStateText}>
                  Tap the + button to schedule your first appointment.
                </Text>
              </View>
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
        style={[styles.recordButton, appointments.length > 0 && styles.recordButtonSmall]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons 
          name="add" 
          size={appointments.length === 0 ? 48 : 32} 
          color="#fff" 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  list: { padding: 12, paddingTop: 16, paddingBottom: 140 },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 12,
    paddingHorizontal: 4,
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
    gap: 8,
  },
  sectionCount: {
    ...fontStyles.caption,
    color: '#64748b',
    fontWeight: '500',
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
    borderLeftColor: '#00b4d8',
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
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    ...fontStyles.body,
    textAlign: 'center',
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
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
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
    color: '#00b4d8',
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
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#00b4d8',
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
    backgroundColor: '#00b4d8', 
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
});
