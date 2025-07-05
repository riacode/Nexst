import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function LogoV4({ size = 48, color = '#00b4d8' }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Unique "C" shape with medical cross integration */}
      <View style={[styles.logoShape, { borderColor: color }]}>
        {/* The main "C" curve */}
        <View style={[styles.cCurve, { borderColor: color }]} />
        {/* Medical cross element integrated into the C */}
        <View style={[styles.crossVertical, { backgroundColor: color }]} />
        <View style={[styles.crossHorizontal, { backgroundColor: color }]} />
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
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cCurve: {
    width: '80%',
    height: '80%',
    borderWidth: 4,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRadius: 50,
    position: 'absolute',
  },
  crossVertical: {
    position: 'absolute',
    width: 3,
    height: '60%',
    borderRadius: 1.5,
    top: '20%',
  },
  crossHorizontal: {
    position: 'absolute',
    width: '40%',
    height: 3,
    borderRadius: 1.5,
    top: '50%',
    left: '30%',
    transform: [{ translateY: -1.5 }],
  },
}); 