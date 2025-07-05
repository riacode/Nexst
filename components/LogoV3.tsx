import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function LogoV3({ size = 48, color = '#00b4d8' }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Phone outline with heart inside */}
      <View style={[styles.phoneOutline, { borderColor: color }]}>
        <Ionicons name="heart" size={size * 0.4} color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneOutline: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 