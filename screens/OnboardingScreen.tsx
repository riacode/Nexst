import React, { useEffect, useRef, useState } from 'react';
import { Easing } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboarding } from '../contexts/OnboardingContext';
import SharedBackground from '../components/SharedBackground';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { markOnboardingComplete } = useOnboarding();
  const underlineAnim = useRef(new Animated.Value(0)).current;



  // Logo glow animation
  const logoGlowAnim = useRef(new Animated.Value(0)).current;

  // Animation states for 3 icons and their texts
  const iconScales = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];
  const iconTranslates = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const textOpacities = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  // Closing sentences
  const closing1Opacity = useRef(new Animated.Value(0)).current;
  const closing2Opacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const [showButton, setShowButton] = useState(false);

  // Animation sequence
  useEffect(() => {
    // Start underline animation after 0.5 seconds
    const underlineTimer = setTimeout(() => {
      Animated.timing(underlineAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, 500);

    // Helper for each icon step
    const animateIcon = async (i: number) => {
      // Pulsate
      await new Promise(res => {
        Animated.sequence([
          Animated.timing(iconScales[i], { toValue: 1.25, duration: 220, useNativeDriver: true }),
          Animated.timing(iconScales[i], { toValue: 1, duration: 220, useNativeDriver: true })
        ]).start(() => res(null));
      });
      // Glide to final position and fade in text together
      await new Promise(res => {
        Animated.parallel([
          Animated.timing(iconTranslates[i], { toValue: -130, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true }),
          Animated.timing(textOpacities[i], { toValue: 1, duration: 400, useNativeDriver: true })
        ]).start(() => res(null));
      });
    };
    
    // Sequence for all icons - start after underline
    const iconTimer = setTimeout(async () => {
      // Animate icons and text together
      for (let i = 0; i < 3; ++i) {
        await animateIcon(i);
        await new Promise(r => setTimeout(r, 180));
      }
      
      // Fade in closing sentences
      Animated.timing(closing1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
        setTimeout(() => {
          Animated.timing(closing2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
            setShowButton(true);
            setTimeout(() => {
              Animated.timing(buttonOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
            }, 100);
          });
        }, 400);
      });
    }, 1300); // Start icon animation after underline completes



    // Logo glow animation - matching website exactly
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(logoGlowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => {
      clearTimeout(underlineTimer);
      clearTimeout(iconTimer);
    };
  }, [underlineAnim, logoGlowAnim]);

  const handleGetStarted = async () => {
    try {
      console.log('Get Started button pressed');
      // Mark onboarding as complete - navigation will happen automatically
      await markOnboardingComplete();
      console.log('Onboarding marked as complete');
    } catch (error) {
      console.error('Error in handleGetStarted:', error);
    }
  };

  return (
    <SharedBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Animated.View
              style={[
                styles.logoGlowContainer,
                {
                  shadowColor: logoGlowAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['#00b4d8', '#10b981', '#00b4d8'],
                  }),
                  shadowOpacity: logoGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0.5],
                  }),
                  shadowRadius: logoGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 30],
                  }),
                },
              ]}
            >
              <Text style={styles.logoText}>
                <Text style={[styles.logoText, { color: '#00b4d8' }]}>N</Text>
                <Text style={[styles.logoText, { color: '#00b4d8' }]}>e</Text>
                <Text style={[styles.logoText, { color: '#00b4d8' }]}>x</Text>
                <Text style={[styles.logoText, { color: '#10b981' }]}>s</Text>
                <Text style={[styles.logoText, { color: '#10b981' }]}>t</Text>
              </Text>
            </Animated.View>
          </View>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>
              <Text style={styles.boldText}>Reimagining</Text> how you{'\n'}<Text style={styles.underlinedText}>manage your health</Text>.
            </Text>
            <Animated.View 
              style={[
                styles.cursiveUnderline,
                {
                  width: underlineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 180],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Features Container */}
        <View style={styles.featuresContainer}>
          {/* Feature 1 */}
          <View style={styles.featureItem}>
            <Animated.View
              style={{
                transform: [
                  { scale: iconScales[0] },
                  { translateX: iconTranslates[0] }
                ],
                zIndex: 10,
                opacity: 0, // Hide the original icon
              }}
            >
              <LinearGradient
                colors={['#00B39F', '#00B39F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureIcon}
              >
                <Ionicons name="mic" size={32} color="#ffffff" />
              </LinearGradient>
            </Animated.View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Voice Symptom Tracking</Text>
              <Text style={styles.featureDescription}>
                Record your symptoms effortlessly in just 30 seconds.
              </Text>
            </View>
          </View>

          {/* Feature 2 */}
          <View style={styles.featureItem}>
            <Animated.View
              style={{
                transform: [
                  { scale: iconScales[1] },
                  { translateX: iconTranslates[1] }
                ],
                zIndex: 10,
                opacity: 0, // Hide the original icon
              }}
            >
              <View style={[styles.featureIcon, { backgroundColor: 'rgb(231, 151, 110)' }]}>
                <Ionicons name="bulb" size={32} color="#ffffff" />
              </View>
            </Animated.View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Personalized Action Items</Text>
              <Text style={styles.featureDescription}>
                Get immediate recommended next steps based on your symptoms.
              </Text>
            </View>
          </View>

          {/* Feature 3 */}
          <View style={styles.featureItem}>
            <Animated.View
              style={{
                transform: [
                  { scale: iconScales[2] },
                  { translateX: iconTranslates[2] }
                ],
                zIndex: 10,
                opacity: 0, // Hide the original icon
              }}
            >
              <LinearGradient
                colors={['#00B39F', '#00B39F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureIcon}
              >
                <Ionicons name="calendar" size={32} color="#ffffff" />
              </LinearGradient>
            </Animated.View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Appointment Prep</Text>
              <Text style={styles.featureDescription}>
                Walk into appointments with tailored questions and symptom history.
              </Text>
            </View>
          </View>
        </View>

        {/* Independent Icons Section */}
        <View style={styles.independentIconsContainer}>
          <Animated.View
            style={{
              transform: [
                { scale: iconScales[0] },
                { translateX: iconTranslates[0] }
              ],
              zIndex: 10,
            }}
          >
            <LinearGradient
              colors={['#00B39F', '#00B39F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.independentIcon}
            >
              <Ionicons name="mic" size={32} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          <Animated.View
            style={{
              transform: [
                { scale: iconScales[1] },
                { translateX: iconTranslates[1] }
              ],
              zIndex: 10,
            }}
          >
            <View style={[styles.independentIcon, { backgroundColor: 'rgb(231, 151, 110)' }]}>
              <Ionicons name="bulb" size={32} color="#ffffff" />
            </View>
          </Animated.View>
          <Animated.View
            style={{
              transform: [
                { scale: iconScales[2] },
                { translateX: iconTranslates[2] }
              ],
              zIndex: 10,
            }}
          >
            <LinearGradient
              colors={['#00B39F', '#00B39F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.independentIcon}
            >
              <Ionicons name="calendar" size={32} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Independent Text Section */}
        <View style={styles.independentTextContainer}>
          <Animated.View style={[styles.independentTextItem, { opacity: textOpacities[0] }]}>
            <Text style={styles.featureTitle}>Voice Symptom Tracking</Text>
            <Text style={styles.featureDescription}>
              Record your symptoms effortlessly in just 30 seconds.
            </Text>
          </Animated.View>
          <Animated.View style={[styles.independentTextItem, { opacity: textOpacities[1] }]}>
            <Text style={styles.featureTitle}>Personalized Action Items</Text>
            <Text style={styles.featureDescription}>
              Get immediate next steps based on your symptoms.
            </Text>
          </Animated.View>
          <Animated.View style={[styles.independentTextItem, { opacity: textOpacities[2] }]}>
            <Text style={styles.featureTitle}>Appointment Prep</Text>
            <Text style={styles.featureDescription}>
              Walk into appointments with tailored questions and symptom history.
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Animated.View style={{ opacity: closing1Opacity }}>
            <Text style={styles.bottomText}>
              You tell us what's happening now.
            </Text>
          </Animated.View>
          <Animated.View style={{ opacity: closing2Opacity }}>
            <Text style={styles.bottomText}>
              We'll tell you what to do <Text style={{ fontWeight: 'bold' }}>nexst</Text>.
            </Text>
          </Animated.View>
        </View>

        {/* Get Started Button - positioned absolutely so it doesn't shift content */}
        {showButton && (
          <View style={styles.buttonContainer}>
            <Animated.View style={{ opacity: buttonOpacity }}>
              <TouchableOpacity onPress={handleGetStarted}>
                <LinearGradient
                  colors={['#00B39F', '#00B39F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.getStartedButton}
                >
                  <Text style={styles.getStartedText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
      </SafeAreaView>
    </SharedBackground>
  );
}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    color: '#102A43',
  },
  tagline: {
    fontSize: 18,
    color: '#102A43',
    textAlign: 'center',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
    color: '#00B39F',
  },
  taglineContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  underlinedText: {
    fontWeight: '600',
    color: '#102A43',
  },
  cursiveUnderline: {
    height: 2,
    backgroundColor: '#00B39F',
    borderRadius: 1,
    marginTop: 4,
    alignSelf: 'center',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#102A43',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#102A43',
    lineHeight: 20,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 80,
  },
  bottomText: {
    fontSize: 16,
    color: '#102A43',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 2,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#00b4d8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  independentIconsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 80,
    gap: 35,
  },
  independentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  independentTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -340,
    marginBottom: 80,
    gap: 35,
  },
  independentTextItem: {
    alignItems: 'flex-start',
    textAlign: 'left',
    paddingHorizontal: 51,
    marginLeft: 120,
    marginRight: 50,
    width: '100%',
  },

  logoGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradientContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoTextMask: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    color: 'transparent',
  },
  logoTextOverlay: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    color: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  logoGlowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b4d8',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradientText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextGradient: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    color: 'transparent',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
}); 