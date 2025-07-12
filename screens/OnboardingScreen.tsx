import React, { useEffect, useRef } from 'react';
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
import { useOnboarding } from '../contexts/OnboardingContext';


const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { markOnboardingComplete } = useOnboarding();
  const underlineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the underline animation after 1.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(underlineAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, 1500);

    return () => clearTimeout(timer);
  }, [underlineAnim]);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>CLYNIC</Text>
          </View>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>
              <Text style={styles.boldText}>Reimagining</Text> how you{'\n'}
              <Text style={styles.underlinedText}>manage your health</Text>.
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

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="mic" size={32} color="#10b981" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Voice Symptom Tracking</Text>
                              <Text style={styles.featureDescription}>
                  Record your symptoms effortlessly in just 30 seconds.
                </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="bulb" size={32} color="#f59e0b" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Personalized Action Items</Text>
              <Text style={styles.featureDescription}>
                Get immediate recommended next steps based on your symptoms.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="calendar" size={32} color="#8b5cf6" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Appointment Prep</Text>
              <Text style={styles.featureDescription}>
                Walk into appointments with tailored questions and symptom history.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.bottomText}>
            Your personal AI-powered clinic,{'\n'}always ready when you need it.
          </Text>
          
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#00b4d8',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  tagline: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
    color: '#1e293b',
  },
  taglineContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  underlinedText: {
    fontWeight: '600',
    color: '#1e293b',
  },
  cursiveUnderline: {
    height: 2,
    backgroundColor: '#00b4d8',
    borderRadius: 1,
    marginTop: 4,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
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
    backgroundColor: '#f8fafc',
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
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  bottomSection: {
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00b4d8',
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
}); 