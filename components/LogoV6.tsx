import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function LogoV6({ size = 48, color = '#00b4d8' }: LogoProps) {
  const fontSize = size * 0.5;
  
  return (
    <View style={[styles.container, { width: size * 4, height: size }]}>
      <View style={styles.logoContainer}>
        {/* The "C" with integrated medical cross */}
        <View style={[styles.cContainer, { borderColor: color }]}>
          <Text style={[styles.cText, { fontSize, color }]}>C</Text>
          <View style={[styles.crossVertical, { backgroundColor: color }]} />
          <View style={[styles.crossHorizontal, { backgroundColor: color }]} />
        </View>
        
        {/* The rest of "lynic" */}
        <Text style={[styles.lynicText, { fontSize, color }]}>lynic</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  cText: {
    fontWeight: 'bold',
    zIndex: 2,
  },
  crossVertical: {
    position: 'absolute',
    width: 2,
    height: '80%',
    borderRadius: 1,
    zIndex: 1,
  },
  crossHorizontal: {
    position: 'absolute',
    width: '60%',
    height: 2,
    borderRadius: 1,
    top: '50%',
    left: '20%',
    transform: [{ translateY: -1 }],
    zIndex: 1,
  },
  lynicText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
}); 