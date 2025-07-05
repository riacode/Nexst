import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, TouchableOpacity, TextInput, Alert, Modal} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';

interface Appointment {
    id: string;
    title: string;
    date: Date;
    timestamp: Date;
}

export default function AppointmentsScreen({ navigation }: any) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');


  const addAppointment = () => {
    if (!titleInput.trim()) {
      Alert.alert('Error', 'Please enter an appointment name');
      return;
    }
    
    const now = new Date();
    setAppointments([
      { id: now.toISOString(), title: titleInput, date: selectedDate, timestamp: now },
      ...appointments,
    ]);
    setShowPicker(false);
    setTitleInput('');
    setSelectedDate(new Date());
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      setSelectedDate(newDateTime);
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setShowTimePicker(true);
  };

  // Organize appointments into upcoming and past
  const now = new Date();
  const upcomingAppointments = appointments.filter(app => app.date > now);
  const pastAppointments = appointments.filter(app => app.date <= now);

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
        <Text style={styles.appDate}>{item.date.toLocaleDateString()}</Text>
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                {sortedUpcoming.map((item) => (
                  <View key={item.id}>
                    {renderItem({ item })}
                  </View>
                ))}
              </View>
            )}

            {/* Past Appointments */}
            {sortedPast.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Appointments</Text>
                {sortedPast.map((item) => (
                  <View key={item.id}>
                    {renderItem({ item })}
                  </View>
                ))}
              </View>
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
      
      {showPicker && (
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Add New Appointment</Text>
          
          <TextInput
            style={styles.titleInput}
            placeholder="Appointment name"
            value={titleInput}
            onChangeText={setTitleInput}
            placeholderTextColor="#64748b"
            textAlign="center"
          />

          <View style={styles.dateTimeContainer}>
            <TouchableOpacity style={styles.dateTimeButton} onPress={openDatePicker}>
              <Ionicons name="calendar" size={20} color="#00b4d8" />
              <Text style={styles.dateTimeText}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dateTimeButton} onPress={openTimePicker}>
              <Ionicons name="time" size={20} color="#00b4d8" />
              <Text style={styles.dateTimeText}>
                {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPicker(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButtonStyle} onPress={addAppointment}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
      
      <TouchableOpacity
        style={[styles.recordButton, appointments.length > 0 && styles.recordButtonSmall]}
        onPress={() => setShowPicker(true)}
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
  pickerContainer: {
    position: 'absolute',
    top: '20%',
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  pickerTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...fontStyles.body,
    textAlign: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  dateTimeText: {
    ...fontStyles.body,
    color: '#1e293b',
  },



  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
