import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SharedBackgroundProps {
  children: React.ReactNode;
}

export default function SharedBackground({ children }: SharedBackgroundProps) {
  // Floating bubble animations
  const bubble1Anim = useRef(new Animated.Value(0)).current;
  const bubble2Anim = useRef(new Animated.Value(0)).current;
  const bubble3Anim = useRef(new Animated.Value(0)).current;

  // Floating bubble animations - matching website timing
  useEffect(() => {
    const bubbleAnimation = () => {
      // Bubble 1: 15s linear infinite with 0s delay
      Animated.loop(
        Animated.timing(bubble1Anim, {
          toValue: 1,
          duration: 15000,
          useNativeDriver: true,
        })
      ).start();

      // Bubble 2: 15s linear infinite with -5s delay
      setTimeout(() => {
        Animated.loop(
          Animated.timing(bubble2Anim, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
          })
        ).start();
      }, 5000);

      // Bubble 3: 15s linear infinite with -10s delay
      setTimeout(() => {
        Animated.loop(
          Animated.timing(bubble3Anim, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
          })
        ).start();
      }, 10000);
    };

    bubbleAnimation();
  }, [bubble1Anim, bubble2Anim, bubble3Anim]);

  return (
    <View style={{ flex: 1 }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
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
      
      {/* Floating Bubbles */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: 50,
            opacity: 0.1,
            zIndex: 1,
            top: '20%',
            left: '10%',
          },
          {
            transform: [
              {
                translateY: bubble1Anim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, -50, 100, 50, 0],
                }),
              },
              {
                translateX: bubble1Anim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, 100, 50, -50, 0],
                }),
              },
              {
                rotate: bubble1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#00b4d8', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 50,
          }}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: 50,
            opacity: 0.1,
            zIndex: 1,
            top: '60%',
            right: '15%',
          },
          {
            transform: [
              {
                translateY: bubble2Anim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, -50, 100, 50, 0],
                }),
              },
              {
                translateX: bubble2Anim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, 100, 50, -50, 0],
                }),
              },
              {
                rotate: bubble2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#00b4d8', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 50,
          }}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: 50,
            opacity: 0.1,
            zIndex: 1,
            bottom: '30%',
            left: '20%',
          },
          {
            transform: [
              {
                translateY: bubble3Anim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, -50, 100, 50, 0],
                }),
              },
              {
                translateX: bubble3Anim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, 100, 50, -50, 0],
                }),
              },
              {
                rotate: bubble3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#00b4d8', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 50,
          }}
        />
      </Animated.View>

      {/* Content */}
      {children}
    </View>
  );
} 