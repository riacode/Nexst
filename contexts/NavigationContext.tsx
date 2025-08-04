import React, { createContext, useContext, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

interface NavigationContextType {
  navigationRef: React.RefObject<NavigationContainerRef<any> | null>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <NavigationContext.Provider value={{ navigationRef }}>
      {children}
    </NavigationContext.Provider>
  );
}; 