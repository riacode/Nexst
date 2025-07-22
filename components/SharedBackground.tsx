import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SharedBackgroundProps {
  children: React.ReactNode;
}

export default function SharedBackground({ children }: SharedBackgroundProps) {
  return (
    <View style={{ flex: 1 }}>
      {/* Clean Light Background */}
      <LinearGradient
        colors={['#FAFBFC', '#F7FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Content */}
      {children}
    </View>
  );
} 