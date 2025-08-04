import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Appointment {
  id: string;
  title: string;
  date: Date;
  timestamp: Date;
  questions?: string[];
  recentSymptomsLastUpdated?: Date;
}

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  clearAllAppointments: () => void;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
};

interface AppointmentsProviderProps {
  children: ReactNode;
}

export const AppointmentsProvider: React.FC<AppointmentsProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const addAppointment = (appointment: Appointment) => {
    setAppointments(prev => [appointment, ...prev]);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(app => app.id === id ? { ...app, ...updates } : app)
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(app => app.id !== id));
  };

  const clearAllAppointments = () => {
    setAppointments([]);
  };

  const value: AppointmentsContextType = {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    clearAllAppointments,
  };

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
}; 