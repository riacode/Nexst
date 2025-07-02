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
import Header from './components/Header';
import CustomTabBar from './components/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginPress = () => {
    if (isLoggedIn) {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => setIsLoggedIn(false) }
        ]
      );
    } else {
      Alert.alert(
        'Login',
        'Please log in to maintain confidentiality of your health information.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => setIsLoggedIn(true) }
        ]
      );
    }
  };

  const handleSettingsPress = () => {
    Alert.alert('Settings', 'Settings menu will be implemented here.');
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
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
      </Stack.Navigator>
    </NavigationContainer>
  );

  function MainTabNavigator() {
    return (
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={({ route }) => ({
          header: ({ route }) => (
            <Header
              title={route.name}
              isLoggedIn={isLoggedIn}
              onLoginPress={handleLoginPress}
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
}