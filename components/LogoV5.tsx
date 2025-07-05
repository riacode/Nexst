import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function LogoV5({ size = 48, color = '#00b4d8' }: LogoProps) {
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
    letterSpacing: 1,
  },
  cLetter: {
    // The "C" is styled to look like a medical cross
    fontWeight: '900',
  },
  lynicText: {
    // The rest of the text flows naturally
    fontWeight: '600',
  },
}); 