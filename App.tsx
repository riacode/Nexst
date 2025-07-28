import React, { useState, useEffect, useRef } from 'react';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { setupNotificationListeners } from './utils/notifications';
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
import { NotificationSettingsProvider, useNotificationSettings } from './contexts/NotificationSettingsContext';
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
  const { settings, updateSettings } = useNotificationSettings();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { navigationRef } = useNavigationContext();

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

  const handleUpdateNotificationSettings = async (enabled: boolean, time: Date, frequency: string) => {
    await updateSettings(enabled, time, frequency);
  };

  const handleFollowUpPress = () => {
    navigationRef.current?.navigate('FollowUpQuestions');
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
        onUpdateNotificationSettings={handleUpdateNotificationSettings}
        notificationEnabled={settings.enabled}
        notificationTime={settings.time}
        notificationFrequency={settings.frequency}
      />
    </>
  );
}

function AppContent() {
  const { hasSeenOnboarding, markOnboardingComplete } = useOnboarding();
  const { tutorialState, completeOnboarding, hideOnboardingTutorial } = useTutorial();
  const { navigationRef } = useNavigationContext();
  const { clearNotificationBadge } = useNotificationSettings();

  console.log('AppContent - hasSeenOnboarding:', hasSeenOnboarding);

  useEffect(() => {
    // Set up notification listeners when the app starts
    const cleanup = setupNotificationListeners();
    
    // Clear notification badge when app opens
    clearNotificationBadge();
    
    return cleanup;
  }, [clearNotificationBadge]);

  const handleTutorialComplete = async () => {
    await completeOnboarding();
    await markOnboardingComplete();
  };

  const handleTutorialSkip = async () => {
    await hideOnboardingTutorial();
  };

  return (
    <>
      <NavigationContainer ref={navigationRef}>
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
  return (
    <NavigationProvider>
      <OnboardingProvider>
        <SymptomLogsProvider>
          <RecommendationsProvider>
            <AppointmentsProvider>
              <NotificationSettingsProvider>
                <FollowUpQuestionsProvider>
                  <SmartAIProvider userId="default-user">
                    <PrivacyProvider>
                      <TutorialProvider>
                        <AppContent />
                      </TutorialProvider>
                    </PrivacyProvider>
                  </SmartAIProvider>
                </FollowUpQuestionsProvider>
              </NotificationSettingsProvider>
            </AppointmentsProvider>
          </RecommendationsProvider>
        </SymptomLogsProvider>
      </OnboardingProvider>
    </NavigationProvider>
  );
}