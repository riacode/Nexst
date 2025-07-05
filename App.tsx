import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import SymptomsScreen from './screens/SymptomsScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import RecommendationsScreen from './screens/RecommendationsScreen';
import RecordingDetailScreen from './screens/RecordingDetailScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import Header from './components/Header';
import CustomTabBar from './components/CustomTabBar';
import { RecommendationsProvider, useRecommendations } from './contexts/RecommendationsContext';
import { SymptomLogsProvider, useSymptomLogs } from './contexts/SymptomLogsContext';
import { AppointmentsProvider, useAppointments } from './contexts/AppointmentsContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator() {
  const { clearAllSymptomLogs } = useSymptomLogs();
  const { clearAllRecommendations } = useRecommendations();
  const { clearAllAppointments } = useAppointments();

  const handleSettingsPress = () => {
    Alert.alert(
      'Settings',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All Symptom Logs', 
          style: 'destructive',
          onPress: () => {
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
          }
        },
        { 
          text: 'Clear All Appointments', 
          style: 'destructive',
          onPress: () => {
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
          }
        },
        { 
          text: 'Clear All Recommendations', 
          style: 'destructive',
          onPress: () => {
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
          }
        }
      ]
    );
  };

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        header: ({ route }) => (
          <Header
            title={route.name}
            onSettingsPress={handleSettingsPress}
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
  );
}

function AppContent() {
  const { hasSeenOnboarding } = useOnboarding();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={hasSeenOnboarding ? "MainTabs" : "Onboarding"}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <OnboardingProvider>
      <SymptomLogsProvider>
        <RecommendationsProvider>
          <AppointmentsProvider>
            <AppContent />
          </AppointmentsProvider>
        </RecommendationsProvider>
      </SymptomLogsProvider>
    </OnboardingProvider>
  );
}