import React, { useState, useEffect, useRef } from 'react';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { configureNotifications, clearBadgeCount, getNotificationPermissionsStatus } from './utils/notifications';
import * as Notifications from 'expo-notifications';
import { NotificationSettingsProvider, useNotificationSettings } from './contexts/NotificationSettingsContext';

import SymptomsScreen from './screens/SymptomsScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import RecommendationsScreen from './screens/RecommendationsScreen';
import RecordingDetailScreen from './screens/RecordingDetailScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import FollowUpQuestionsScreen from './screens/FollowUpQuestionsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import Header from './components/Header';
import CustomTabBar from './components/CustomTabBar';
import SettingsModal from './components/SettingsModal';
import { RecommendationsProvider, useRecommendations } from './contexts/RecommendationsContext';
import { SymptomLogsProvider, useSymptomLogs } from './contexts/SymptomLogsContext';
import { AppointmentsProvider, useAppointments } from './contexts/AppointmentsContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';

import { SmartAIProvider } from './contexts/SmartAIContext';
import { PrivacyProvider, usePrivacy } from './contexts/PrivacyContext';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import { NavigationProvider, useNavigationContext } from './contexts/NavigationContext';
import { FollowUpQuestionsProvider } from './contexts/FollowUpQuestionsContext';
import OnboardingTutorial from './components/OnboardingTutorial';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator() {
  const { clearAllSymptomLogs } = useSymptomLogs();
  const { clearAllRecommendations } = useRecommendations();
  const { clearAllAppointments } = useAppointments();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { settings, updateSettings, clearAllNotifications } = useNotificationSettings();

  const handleSettingsPress = () => {
    setSettingsVisible(true);
  };

  const handleClearSymptomLogs = () => {
    Alert.alert(
      'Clear All Symptom Logs',
      'Are you sure you want to delete all your symptom recordings, summaries, transcripts, and logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            clearAllSymptomLogs();
          }
        }
      ]
    );
  };

  const handleClearAppointments = () => {
    Alert.alert(
      'Clear All Appointments',
      'Are you sure you want to delete all your upcoming and previous appointments and their recommended questions? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            clearAllAppointments();
          }
        }
      ]
    );
  };

  const handleClearRecommendations = () => {
    Alert.alert(
      'Clear All Recommendations',
      'Are you sure you want to delete all your completed, current, and canceled recommendations? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            clearAllRecommendations();
          }
        }
      ]
    );
  };

  const handleFollowUpPress = () => {
    // Navigate to follow-up questions
  };

  return (
    <>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={({ route }) => ({
          header: ({ route }) => (
            <Header
              title={route.name}
              onSettingsPress={handleSettingsPress}
              onFollowUpPress={handleFollowUpPress}
            />
          ),
        })}
      >
        <Tab.Screen 
          name="Symptoms" 
          component={SymptomsScreen}
          options={{ tabBarLabel: 'Symptoms' }}
        />
        <Tab.Screen 
          name="Recommendations" 
          component={RecommendationsScreen}
          options={{ tabBarLabel: 'Recommendations' }}
        />
        <Tab.Screen 
          name="Appointments" 
          component={AppointmentsScreen}
          options={{ tabBarLabel: 'Appointments' }}
        />
      </Tab.Navigator>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onClearSymptomLogs={handleClearSymptomLogs}
        onClearAppointments={handleClearAppointments}
        onClearRecommendations={handleClearRecommendations}
        onUpdateNotificationSettings={updateSettings}
        notificationEnabled={settings.enabled}
        notificationTime={settings.dailyReminderTime}
        notificationFrequency={settings.frequency}
      />
    </>
  );
}

function AppContent() {
  const { hasSeenOnboarding, markOnboardingComplete } = useOnboarding();
  const { tutorialState, completeOnboarding, hideOnboardingTutorial } = useTutorial();
  console.log('AppContent - hasSeenOnboarding:', hasSeenOnboarding);

  useEffect(() => {
    // App initialization
    return () => {
      // cleanup
    };
  }, []);

  const handleTutorialComplete = async () => {
    await completeOnboarding();
    await markOnboardingComplete();
  };

  const handleTutorialSkip = async () => {
    await hideOnboardingTutorial();
  };

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          {!hasSeenOnboarding ? (
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="RecordingDetail"
                component={RecordingDetailScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AppointmentDetail"
                component={AppointmentDetailScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PrivacySettings"
                component={PrivacySettingsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="FollowUpQuestions"
                component={FollowUpQuestionsScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <OnboardingTutorial
        visible={tutorialState.showOnboardingTutorial}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Configure notifications on app start
    configureNotifications();
    
    // Clear badge count when app opens
    clearBadgeCount();
    
    // Check notification permissions status
    const checkPermissions = async () => {
      try {
        const status = await getNotificationPermissionsStatus();
        console.log('Notification permissions status:', status);
      } catch (error) {
        console.error('Error checking notification permissions:', error);
      }
    };
    
    checkPermissions();
    
    // Set up notification response listener
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      console.log('Notification response received:', data);
      
      // Handle different notification types
      if (data?.type === 'daily_reminder') {
        // Navigate to symptoms screen for daily check-in
        console.log('Daily reminder tapped - should navigate to symptoms screen');
      } else if (data?.type === 'recommendation') {
        // Navigate to recommendations screen
        console.log('Recommendation notification tapped - should navigate to recommendations screen');
      } else if (data?.type === 'follow_up_questions') {
        // Navigate to follow-up questions screen
        console.log('Follow-up question notification tapped - should navigate to follow-up questions screen');
      }
    });
    
    // Cleanup subscription
    return () => subscription.remove();
  }, []);

  return (
    <OnboardingProvider>
      <SymptomLogsProvider>
        <RecommendationsProvider>
          <AppointmentsProvider>
            <FollowUpQuestionsProvider>
              <NotificationSettingsProvider>
                <SmartAIProvider userId="default-user">
                  <PrivacyProvider>
                    <TutorialProvider>
                      <AppContent />
                    </TutorialProvider>
                  </PrivacyProvider>
                </SmartAIProvider>
              </NotificationSettingsProvider>
            </FollowUpQuestionsProvider>
          </AppointmentsProvider>
        </RecommendationsProvider>
      </SymptomLogsProvider>
    </OnboardingProvider>
  );
}