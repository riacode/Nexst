import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export default function RecommendationsScreen({ navigation }: any) {
  // This will be populated by LLM based on symptoms
  const recommendations: Recommendation[] = [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'Low Priority';
      default: return 'Priority';
    }
  };

  const handleAction = (recommendation: Recommendation) => {
    switch (recommendation.action) {
      case 'Book Appointment':
        navigation.navigate('Appointments');
        break;
      case 'Log Symptoms':
        navigation.navigate('Symptoms');
        break;
      case 'Contact Provider':
        // Could open phone dialer or messaging
        console.log('Contact provider');
        break;
      case 'View Tips':
        // Could navigate to tips screen
        console.log('View tips');
        break;
      case 'Call Emergency':
        // Could open phone dialer
        console.log('Call emergency');
        break;
    }
  };

  const renderRecommendation = (recommendation: Recommendation) => (
    <View key={recommendation.id} style={styles.recommendationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={recommendation.icon as any} size={24} color="#00b4d8" />
        </View>
        <View style={styles.priorityBadge}>
          <Text style={[styles.priorityText, { color: getPriorityColor(recommendation.priority) }]}>
            {getPriorityLabel(recommendation.priority)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
      <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
      
      {recommendation.action && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleAction(recommendation)}
        >
          <Text style={styles.actionButtonText}>{recommendation.action}</Text>
          <Ionicons name="arrow-forward" size={16} color="#00b4d8" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {recommendations.length > 0 ? (
          recommendations.map(renderRecommendation)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Recommendations Yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  content: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 140,
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  priorityText: {
    ...fontStyles.small,
    fontWeight: '600',
  },
  recommendationTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 8,
  },
  recommendationDescription: {
    ...fontStyles.caption,
    color: '#64748b',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    ...fontStyles.captionMedium,
    color: '#00b4d8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...fontStyles.h3,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },

}); 