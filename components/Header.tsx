import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { useFollowUpQuestions } from '../contexts/FollowUpQuestionsContext';
import { colors } from '../utils/colors';

interface HeaderProps {
  title: string;
  onSettingsPress: () => void;
  onFollowUpPress?: () => void;
}

export default function Header({ title, onSettingsPress, onFollowUpPress }: HeaderProps) {
  const { getUnansweredCount } = useFollowUpQuestions();
  const unansweredCount = getUnansweredCount();

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerActions}>
          {onFollowUpPress && (
            <TouchableOpacity style={styles.actionButton} onPress={onFollowUpPress}>
              <View style={styles.followUpButton}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#64748b" />
                {unansweredCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unansweredCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
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
    justifyContent: 'flex-end',
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
  followUpButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...fontStyles.caption,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
}); 