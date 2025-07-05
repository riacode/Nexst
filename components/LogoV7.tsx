import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function LogoV7({ size = 48, color = '#00b4d8' }: LogoProps) {
  const fontSize = size * 0.6;
  
  return (
    <View style={[styles.container, { width: size * 3, height: size }]}>
      <Text style={[styles.logoText, { fontSize, color }]}>
        <Text style={styles.cLetter}>C</Text>
        <Text style={styles.lynicText}>lynic</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cLetter: {
    // Make the "C" stand out
    fontWeight: '900',
    color: '#1e293b',
  },
  lynicText: {
    // Subtle gradient effect with different weight
    fontWeight: '600',
    color: '#64748b',
  },
}); 