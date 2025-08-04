import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationSettings } from './NotificationSettingsContext';
import { scheduleAppointmentReminder, cancelAppointmentReminder } from '../utils/notifications';

// ============================================================================
// APPOINTMENTS CONTEXT - Manages Medical Appointments
// ============================================================================

export interface Appointment {
  id: string;
  title: string;
  date: Date;
  provider: string;
  location?: string;
  notes?: string;
  questions: string[];
  createdAt: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  markAsCompleted: (id: string) => void;
  clearAppointments: () => void;
  isLoading: boolean;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

interface AppointmentsProviderProps {
  children: ReactNode;
}

export const AppointmentsProvider: React.FC<AppointmentsProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useNotificationSettings();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadAppointments();
  }, []);

  /**
   * Load appointments from AsyncStorage
   */
  const loadAppointments = async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem('appointments_default-user');
      if (storedAppointments) {
        const parsedAppointments = JSON.parse(storedAppointments);
        setAppointments(parsedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save appointments to AsyncStorage
   */
  const saveAppointments = async (newAppointments: Appointment[]) => {
    try {
      await AsyncStorage.setItem('appointments_default-user', JSON.stringify(newAppointments));
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  };

  // ============================================================================
  // APPOINTMENT MANAGEMENT
  // ============================================================================

  /**
   * Add new appointment and schedule reminder
   */
  const addAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `appointment-${Date.now()}`,
      createdAt: new Date(),
    };

    setAppointments(prev => {
      const updatedAppointments = [...prev, newAppointment];
      saveAppointments(updatedAppointments);
      return updatedAppointments;
    });

    // Schedule appointment reminder if enabled
    if (settings.enabled && settings.appointmentReminders) {
      scheduleAppointmentReminder(
        newAppointment.id,
        newAppointment.title,
        newAppointment.date
      );
    }
  };

  /**
   * Update a specific appointment
   */
  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => {
      const updatedAppointments = prev.map(appt =>
        appt.id === id ? { ...appt, ...updates } : appt
      );
      saveAppointments(updatedAppointments);
      return updatedAppointments;
    });
  };

  /**
   * Delete an appointment and cancel its reminder
   */
  const deleteAppointment = (id: string) => {
    // Cancel the appointment reminder
    cancelAppointmentReminder(id);

    setAppointments(prev => {
      const updatedAppointments = prev.filter(appt => appt.id !== id);
      saveAppointments(updatedAppointments);
      return updatedAppointments;
    });
  };

  /**
   * Mark an appointment as completed
   */
  const markAsCompleted = (id: string) => {
    updateAppointment(id, { 
      isCompleted: true, 
      completedAt: new Date() 
    });
  };

  /**
   * Clear all appointments
   */
  const clearAppointments = async () => {
    try {
      // Cancel all appointment reminders
      appointments.forEach(appt => {
        cancelAppointmentReminder(appt.id);
      });

      await AsyncStorage.removeItem('appointments_default-user');
      setAppointments([]);
    } catch (error) {
      console.error('Error clearing appointments:', error);
    }
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AppointmentsContextType = {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    markAsCompleted,
    clearAppointments,
    isLoading,
  };

  return (
    <AppointmentsContext.Provider value={contextValue}>
      {children}
    </AppointmentsContext.Provider>
  );
};

/**
 * Hook to use appointments context
 */
export const useAppointments = (): AppointmentsContextType => {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
}; 