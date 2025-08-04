import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

// Contexts
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { SymptomLogsProvider } from './contexts/SymptomLogsContext';
import { RecommendationsProvider } from './contexts/RecommendationsContext';
import { AppointmentsProvider } from './contexts/AppointmentsContext';
import { FollowUpQuestionsProvider } from './contexts/FollowUpQuestionsContext';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { SmartAIProvider } from './contexts/SmartAIContext';
import { NotificationSettingsProvider } from './contexts/NotificationSettingsContext';

// Screens
import OnboardingScreen from './screens/OnboardingScreen';
import SymptomsScreen from './screens/SymptomsScreen';
import RecommendationsScreen from './screens/RecommendationsScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import FollowUpQuestionsScreen from './screens/FollowUpQuestionsScreen';
import RecordingDetailScreen from './screens/RecordingDetailScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';

// Components
import CustomTabBar from './components/CustomTabBar';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import NotificationPermission from './components/NotificationPermission';

// Utils
import { configureNotifications, addNotificationResponseReceivedListener } from './utils/notifications';
import { colors } from './utils/colors';

// ============================================================================
// NAVIGATION SETUP
// ============================================================================

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function MainApp() {
  const { hasSeenOnboarding } = useOnboarding();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showNotificationPermission, setShowNotificationPermission] = useState(false);

  // ============================================================================
  // NOTIFICATION SETUP
  // ============================================================================

  useEffect(() => {
    // Configure notifications
    configureNotifications();

    // Set up notification response listener
    const subscription = addNotificationResponseReceivedListener((response) => {
      const { type } = response.notification.request.content.data as any;
      
      // Handle different notification types
      switch (type) {
        case 'daily_symptom_log':
          // Navigate to symptoms screen
          console.log('Daily symptom log notification tapped');
          break;
        case 'new_recommendation':
          // Navigate to recommendations screen
          console.log('New recommendation notification tapped');
          break;
        case 'follow_up_question':
          // Navigate to follow-up questions screen
          console.log('Follow-up question notification tapped');
          break;
        case 'appointment_reminder':
          // Navigate to appointments screen
          console.log('Appointment reminder notification tapped');
          break;
      }
    });

    // Show notification permission request after onboarding
    if (hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setShowNotificationPermission(true);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        subscription.remove();
      };
    }

    return () => subscription.remove();
  }, [hasSeenOnboarding]);

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleSettingsPress = () => {
    setSettingsVisible(true);
  };

  const handleFollowUpPress = () => {
    // Navigation will be handled by the tab navigator
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!hasSeenOnboarding) {
    return <OnboardingScreen navigation={{} as any} />;
  }

  if (showNotificationPermission) {
    return (
      <NotificationPermission 
        onComplete={() => setShowNotificationPermission(false)} 
      />
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={colors.background} />
      
      <NavigationContainer>
        <Tab.Navigator
          tabBar={props => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="Symptoms"
            component={SymptomsStack}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons 
                  name={focused ? 'pulse' : 'pulse-outline'} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
          
          <Tab.Screen
            name="Recommendations"
            component={RecommendationsStack}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons 
                  name={focused ? 'bulb' : 'bulb-outline'} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
          
          <Tab.Screen
            name="Appointments"
            component={AppointmentsStack}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons 
                  name={focused ? 'calendar' : 'calendar-outline'} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onClearSymptomLogs={() => {
          // Clear symptom logs logic
          setSettingsVisible(false);
        }}
        onClearRecommendations={() => {
          // Clear recommendations logic
          setSettingsVisible(false);
        }}
        onClearAppointments={() => {
          // Clear appointments logic
          setSettingsVisible(false);
        }}
      />
    </>
  );
}

// ============================================================================
// STACK NAVIGATORS
// ============================================================================

function SymptomsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ route }) => (
          <Header
            title={route.name}
            onSettingsPress={() => {
              // Settings will be handled by the main app
            }}
            onFollowUpPress={() => {
              // Follow-up will be handled by the tab navigator
            }}
          />
        ),
      }}
    >
      <Stack.Screen name="Symptoms" component={SymptomsScreen} />
      <Stack.Screen name="RecordingDetail" component={RecordingDetailScreen} />
    </Stack.Navigator>
  );
}

function RecommendationsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ route }) => (
          <Header
            title={route.name}
            onSettingsPress={() => {
              // Settings will be handled by the main app
            }}
            onFollowUpPress={() => {
              // Follow-up will be handled by the tab navigator
            }}
          />
        ),
      }}
    >
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ route }) => (
          <Header
            title={route.name}
            onSettingsPress={() => {
              // Settings will be handled by the main app
            }}
            onFollowUpPress={() => {
              // Follow-up will be handled by the tab navigator
            }}
          />
        ),
      }}
    >
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen name="FollowUpQuestions" component={FollowUpQuestionsScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
    </Stack.Navigator>
  );
}

// ============================================================================
// APP PROVIDER WRAPPER
// ============================================================================

export default function App() {
  return (
    <OnboardingProvider>
      <TutorialProvider>
        <PrivacyProvider>
          <NotificationSettingsProvider>
            <SymptomLogsProvider>
              <RecommendationsProvider>
                <AppointmentsProvider>
                  <FollowUpQuestionsProvider>
                    <SmartAIProvider>
                      <MainApp />
                    </SmartAIProvider>
                  </FollowUpQuestionsProvider>
                </AppointmentsProvider>
              </RecommendationsProvider>
            </SymptomLogsProvider>
          </NotificationSettingsProvider>
        </PrivacyProvider>
      </TutorialProvider>
    </OnboardingProvider>
  );
}