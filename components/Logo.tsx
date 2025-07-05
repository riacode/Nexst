import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
}

export default function Logo({ size = 48, showText = true, color = '#00b4d8' }: LogoProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { width: size, height: size }]}>
        {/* Main icon - medical cross with phone/pocket element */}
        <View style={styles.iconContainer}>
          {/* Phone/pocket outline */}
          <View style={[styles.phoneOutline, { borderColor: color }]}>
            {/* Medical cross inside */}
            <View style={[styles.cross, { backgroundColor: color }]}>
              <View style={[styles.crossVertical, { backgroundColor: color }]} />
              <View style={[styles.crossHorizontal, { backgroundColor: color }]} />
            </View>
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
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
    position: 'relative',
  },
  cross: {
    width: '60%',
    height: '60%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crossVertical: {
    position: 'absolute',
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  crossHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
}); 