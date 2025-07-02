import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';

interface HeaderProps {
  title: string;
  isLoggedIn: boolean;
  onLoginPress: () => void;
  onSettingsPress: () => void;
}

export default function Header({ title, isLoggedIn, onLoginPress, onSettingsPress }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onLoginPress}>
            <Ionicons 
              name={isLoggedIn ? 'person-circle' : 'log-in'} 
              size={24} 
              color={isLoggedIn ? '#10b981' : '#64748b'} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: 50, // Safe area for status bar
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    ...fontStyles.h3,
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 