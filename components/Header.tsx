import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFollowUpQuestions } from '../contexts/FollowUpQuestionsContext';
import { colors } from '../utils/colors';

interface HeaderProps {
  title: string;
  onSettingsPress: () => void;
  onFollowUpPress: () => void;
}

export default function Header({ title, onSettingsPress, onFollowUpPress }: HeaderProps) {
  const { questions } = useFollowUpQuestions();
  const unansweredCount = questions.filter(q => !q.isAnswered).length;

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onFollowUpPress}
          disabled={unansweredCount === 0}
        >
          <Ionicons name="help-circle" size={24} color={colors.text} />
          {unansweredCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unansweredCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onSettingsPress}>
          <Ionicons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 