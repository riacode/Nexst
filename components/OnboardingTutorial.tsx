import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { colors } from '../utils/colors';
import { onboardingSteps, OnboardingStep } from '../utils/onboardingContent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate responsive dimensions
const isSmallScreen = screenWidth < 375; // iPhone SE, small Android phones
const isLargeScreen = screenWidth > 414; // iPhone Pro Max, large Android phones
const isTablet = screenWidth > 768;

// Responsive sizing
const containerMaxWidth = isTablet ? Math.min(screenWidth * 0.6, 500) : Math.min(screenWidth * 0.9, 400);
const stepContainerWidth = isSmallScreen ? screenWidth * 0.85 : Math.min(screenWidth * 0.8, 350);
const contentMaxWidth = stepContainerWidth * 0.9;
const iconSize = isSmallScreen ? 28 : isLargeScreen ? 36 : 32;
const iconContainerSize = isSmallScreen ? 50 : isLargeScreen ? 70 : 60;
const titleFontSize = isSmallScreen ? 20 : isLargeScreen ? 26 : 24;
const descriptionFontSize = isSmallScreen ? 12 : isLargeScreen ? 14 : 13;

interface OnboardingTutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

// Use centralized onboarding content
const tutorialSteps = onboardingSteps;

export default function OnboardingTutorial({ visible, onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: nextStep * stepContainerWidth,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({
        x: prevStep * stepContainerWidth,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const renderStep = (step: OnboardingStep, index: number) => (
    <View key={step.id} style={[styles.stepContainer, { width: stepContainerWidth }]}>
      <View style={[styles.stepContent, { maxWidth: contentMaxWidth }]}>
        <View style={[styles.iconContainer, { 
          backgroundColor: step.color + '20',
          width: iconContainerSize,
          height: iconContainerSize,
          borderRadius: iconContainerSize / 2,
        }]}>
          <Ionicons name={step.icon as any} size={iconSize} color={step.color} />
        </View>
        
        <Text style={[styles.stepTitle, { fontSize: titleFontSize }]}>{step.title}</Text>
        <Text style={[styles.stepDescription, { fontSize: descriptionFontSize }]}>{step.description}</Text>
        
        {step.illustration && (
          <View style={styles.illustrationContainer}>
            {step.illustration}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              {tutorialSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Content */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / stepContainerWidth);
              setCurrentStep(newIndex);
            }}
            scrollEnabled={false}
            style={styles.scrollView}
          >
            {tutorialSteps.map((step, index) => renderStep(step, index))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>
              {currentStep > 0 && (
                <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                  <Ionicons name="arrow-back" size={20} color="#64748b" />
                  <Text style={styles.previousButtonText}>Previous</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  currentStep === tutorialSteps.length - 1 && styles.completeButton
                ]} 
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                </Text>
                <Ionicons 
                  name={currentStep === tutorialSteps.length - 1 ? 'checkmark' : 'arrow-forward'} 
                  size={20} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingTop: screenHeight * 0.1,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: containerMaxWidth,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    ...fontStyles.body,
    color: '#64748b',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  progressDotActive: {
    backgroundColor: '#00B39F',
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    textAlign: 'left',
    marginBottom: 16,
    width: '100%',
  },
  stepDescription: {
    ...fontStyles.body,
    color: '#64748b',
    textAlign: 'left',
    width: '100%',
  },
  illustrationContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  previousButtonText: {
    ...fontStyles.body,
    color: '#64748b',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B39F',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  completeButton: {
            backgroundColor: colors.accentMint,
  },
  nextButtonText: {
    ...fontStyles.button,
    color: '#ffffff',
  },
}); 