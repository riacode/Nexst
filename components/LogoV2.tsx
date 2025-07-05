import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function LogoV2({ size = 48, color = '#00b4d8' }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Stylized "C" that looks like a medical cross and phone */}
      <View style={[styles.logoShape, { borderColor: color }]}>
        {/* The "C" shape with medical cross elements */}
        <View style={[styles.crossTop, { backgroundColor: color }]} />
        <View style={[styles.crossSide, { backgroundColor: color }]} />
        <View style={[styles.crossBottom, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShape: {
    width: '80%',
    height: '80%',
    borderWidth: 4,
    borderRadius: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossTop: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    width: 4,
    height: '25%',
    borderRadius: 2,
    transform: [{ translateX: -2 }],
  },
  crossSide: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    width: '25%',
    height: 4,
    borderRadius: 2,
    transform: [{ translateY: -2 }],
  },
  crossBottom: {
    position: 'absolute',
    bottom: '15%',
    left: '50%',
    width: 4,
    height: '25%',
    borderRadius: 2,
    transform: [{ translateX: -2 }],
  },
}); 