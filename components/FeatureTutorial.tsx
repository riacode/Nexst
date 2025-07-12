import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FeatureTutorialProps {
  visible: boolean;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'center';
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export default function FeatureTutorial({
  visible,
  title,
  description,
  position,
  onComplete,
  onSkip,
  showSkip = true,
}: FeatureTutorialProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const getPositionStyle = () => {
    const containerHeight = 140; // Updated height to account for minHeight
    
    switch (position) {
      case 'top':
        return {
          top: 80,
          left: 20,
          right: 20,
        };
      case 'bottom':
        return {
          bottom: 80,
          left: 20,
          right: 20,
        };
      case 'center':
        return {
          top: Math.max(20, screenHeight / 2 - containerHeight / 2 - 150),
          alignSelf: 'center' as const,
          width: screenWidth - 40,
        };
      default:
        return {
          top: Math.max(20, screenHeight / 2 - containerHeight / 2 - 150),
          alignSelf: 'center' as const,
          width: screenWidth - 40,
        };
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View
        style={[
          styles.container,
          getPositionStyle(),
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="bulb" size={24} color="#f59e0b" />
          </View>
          {showSkip && onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity style={styles.gotItButton} onPress={onComplete}>
          <Text style={styles.gotItButtonText}>Got it!</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 260,
    alignSelf: 'center',
    width: '90%',
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'left',
    width: '100%',
  },
  description: {
    ...fontStyles.body,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
    fontSize: 13,
    textAlign: 'left',
    width: '100%',
  },
  gotItButton: {
    backgroundColor: '#00b4d8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  gotItButtonText: {
    ...fontStyles.button,
    color: '#ffffff',
  },
}); 