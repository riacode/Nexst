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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const addAppointment = () => {
    if (!titleInput.trim()) {
      Alert.alert('Error', 'Please enter an appointment name');
      return;
    }
    
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    const now = new Date();
    setAppointments([
      { id: now.toISOString(), title: titleInput, date: selectedDate, timestamp: now },
      ...appointments,
    ]);
    setShowPicker(false);
    setTitleInput('');
    setSelectedDate(null);
  };

  const onDateChange = (_: any, date?: Date) => {
    if (date) setSelectedDate(date);
    setShowDatePicker(false);
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appItem}
      onPress={() => {/* navigate to details */}}
    >
      <View style={styles.appHeader}>
        <Text style={styles.appDate}>{item.timestamp.toLocaleString()}</Text>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </View>
      <Text numberOfLines={1} style={styles.appTitle}>{item.title}</Text>
      <Text style={styles.appScheduledDate}>Scheduled: {item.date.toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
          <TouchableOpacity 
            style={styles.datePickerContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateDisplay}>
              {selectedDate ? selectedDate.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
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
  datePickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    minHeight: 60,
  },


  dateDisplay: {
    ...fontStyles.body,
    color: '#1e293b',
    textAlign: 'center',
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
