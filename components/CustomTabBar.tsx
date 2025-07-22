import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : 
                     typeof options.title === 'string' ? options.title : route.name;
        const isFocused = state.index === index;
        const isRecommendations = route.name === 'Recommendations';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let iconName: keyof typeof Ionicons.glyphMap;
        if (route.name === 'Symptoms') {
          iconName = isFocused ? 'pulse' : 'pulse-outline';
        } else if (route.name === 'Recommendations') {
          iconName = isFocused ? 'bulb' : 'bulb-outline';
        } else if (route.name === 'Appointments') {
          iconName = isFocused ? 'calendar' : 'calendar-outline';
        } else {
          iconName = 'help-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
              styles.tab,
              isRecommendations && styles.recommendationsTab,
              isRecommendations && isFocused && styles.recommendationsTabActive
            ]}
          >
            <View>
              <Ionicons 
                name={iconName} 
                size={28} 
                color={isFocused ? (isRecommendations ? 'rgb(231, 151, 110)' : '#00B39F') : '#64748b'} 
              />
            </View>

          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 20,
    paddingTop: 12,
    height: 100,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recommendationsTab: {
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recommendationsTabActive: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: 'rgb(231, 151, 110)',
  },

}); 