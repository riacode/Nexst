import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function LogoV8({ size = 48, color = '#00b4d8' }: LogoProps) {
  const fontSize = size * 0.6;
  
  return (
    <View style={[styles.container, { width: size * 3, height: size }]}>
      <Text style={[styles.logoText, { fontSize, color }]}>
        CLYNIC
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
    fontWeight: '900',
    letterSpacing: -1,
  },
}); 