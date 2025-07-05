import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { MedicalRecommendation, ActionItem } from '../types/recommendations';
import { useRecommendations } from '../contexts/RecommendationsContext';

export default function RecommendationsScreen({ route, navigation }: any) {
  // Get recommendations from global context
  const { recommendations, completeRecommendation, cancelRecommendation, toggleActionItem } = useRecommendations();
  const activeAlert = route?.params?.activeAlert;
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [cancelledCollapsed, setCancelledCollapsed] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'Important';
      case 'MEDIUM': return 'Consider';
      case 'LOW': return 'Optional';
      default: return 'Priority';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appointment': return 'calendar';
      case 'medication': return 'medical';
      case 'lifestyle': return 'fitness';
      case 'monitoring': return 'eye';
      case 'emergency': return 'warning';
      case 'preventive': return 'shield-checkmark';
      default: return 'information-circle';
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return 'calendar';
      case 'medication': return 'medical';
      case 'exercise': return 'fitness';
      case 'diet': return 'nutrition';
      case 'rest': return 'bed';
      case 'monitoring': return 'eye';
      case 'consultation': return 'people';
      case 'test': return 'flask';
      default: return 'checkmark-circle';
    }
  };

  const handleCompleteRecommendation = (recommendationId: string) => {
    Alert.alert(
      'Complete Recommendation',
      'Mark this recommendation as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            completeRecommendation(recommendationId);
          }
        }
      ]
    );
  };

  const handleCancelRecommendation = (recommendationId: string) => {
    Alert.prompt(
      'Cancel Recommendation',
      'Why are you cancelling this recommendation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: (reason) => {
            cancelRecommendation(recommendationId, reason || 'No reason provided');
          }
        }
      ],
      'plain-text'
    );
  };

  const handleToggleActionItem = (recommendationId: string, actionId: string) => {
    toggleActionItem(recommendationId, actionId);
  };

  const handleActionItemPress = (action: ActionItem, recommendationId: string) => {
    // If it's an appointment action, navigate to appointments screen
    if (action.type === 'appointment') {
      navigation.navigate('Appointments');
      return;
    }
    
    // Otherwise, toggle the action item
    handleToggleActionItem(recommendationId, action.id);
  };

  const CollapsibleSection = ({ 
    title, 
    isCollapsed, 
    onToggle, 
    children, 
    count 
  }: { 
    title: string; 
    isCollapsed: boolean; 
    onToggle: () => void; 
    children: React.ReactNode;
    count: number;
  }) => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader} 
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons 
            name={isCollapsed ? 'chevron-down' : 'chevron-up'} 
            size={20} 
            color="#64748b" 
          />
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>({count})</Text>
        </View>
      </TouchableOpacity>
      {!isCollapsed && children}
    </View>
  );

  const renderActionItem = (action: ActionItem, recommendationId: string) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.actionItem,
        action.isCompleted && styles.actionItemCompleted
      ]}
      onPress={() => handleActionItemPress(action, recommendationId)}
    >
      <View style={styles.actionItemHeader}>
        <Ionicons 
          name={getActionTypeIcon(action.type)} 
          size={20} 
          color={action.isCompleted ? '#10b981' : '#6b7280'} 
        />
        <Text style={[
          styles.actionItemTitle,
          action.isCompleted && styles.actionItemTitleCompleted
        ]}>
          {action.title}
        </Text>
        <TouchableOpacity
          style={[
            styles.checkbox,
            action.isCompleted && styles.checkboxCompleted
          ]}
        >
          {action.isCompleted && (
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
      {!action.isCompleted && (
        <Text style={styles.actionItemDescription}>
          {action.description}
        </Text>
      )}
      {action.isCompleted && action.completedAt && (
        <Text style={styles.completedDate}>
          ✓ Completed {action.completedAt.toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderRecommendation = (recommendation: MedicalRecommendation) => (
    <View key={recommendation.id} style={[
      styles.recommendationCard,
      recommendation.isCompleted && styles.recommendationCardCompleted,
      recommendation.isCancelled && styles.recommendationCardCancelled
    ]}>
      {/* Problem Section */}
      <View style={styles.problemSection}>
        <View style={styles.problemHeader}>
          <Ionicons 
            name={getCategoryIcon(recommendation.category)} 
            size={24} 
            color={getPriorityColor(recommendation.priority)} 
          />
          <View style={styles.problemTitleContainer}>
            <Text style={[
              styles.problemTitle,
              recommendation.isCompleted && styles.problemTitleCompleted,
              recommendation.isCancelled && styles.problemTitleCancelled
            ]}>
              {recommendation.title}
            </Text>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(recommendation.priority) }
            ]}>
              <Text style={styles.priorityText}>
                {getPriorityLabel(recommendation.priority)}
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={[
          styles.problemDescription,
          recommendation.isCompleted && styles.problemDescriptionCompleted,
          recommendation.isCancelled && styles.problemDescriptionCancelled
        ]}>
          {recommendation.description}
        </Text>
      </View>

      {/* Solutions Section */}
      <View style={styles.solutionsSection}>
        <Text style={styles.solutionsTitle}>Solutions:</Text>
        <View style={styles.actionItemsContainer}>
          {recommendation.actionItems.map(action => renderActionItem(action, recommendation.id!))}
        </View>
      </View>

      {/* Why This Helps */}
      <View style={styles.whySection}>
        <Text style={styles.whyTitle}>Why this helps:</Text>
        <Text style={styles.whyText}>{recommendation.medicalRationale}</Text>
      </View>

      {/* Action Buttons */}
      {!recommendation.isCompleted && !recommendation.isCancelled && (
        <View style={styles.recommendationActions}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteRecommendation(recommendation.id!)}
          >
            <Ionicons name="checkmark" size={20} color="#ffffff" />
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelRecommendation(recommendation.id!)}
          >
            <Ionicons name="close" size={20} color="#ef4444" />
            <Text style={styles.cancelButtonText}>Not for me</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status info */}
      {recommendation.isCompleted && recommendation.completedAt && (
        <View style={styles.completedInfo}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.completedText}>
            Completed on {recommendation.completedAt.toLocaleDateString()}
          </Text>
        </View>
      )}

      {recommendation.isCancelled && recommendation.cancelledAt && (
        <View style={styles.cancelledInfo}>
          <Ionicons name="close-circle" size={16} color="#ef4444" />
          <Text style={styles.cancelledText}>
            Cancelled on {recommendation.cancelledAt.toLocaleDateString()}
          </Text>
          {recommendation.cancelledReason && (
            <Text style={styles.cancelledReason}>
              Reason: {recommendation.cancelledReason}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const activeRecommendations = recommendations.filter(rec => !rec.isCompleted && !rec.isCancelled);
  const completedRecommendations = recommendations.filter(rec => rec.isCompleted);
  const cancelledRecommendations = recommendations.filter(rec => rec.isCancelled);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeRecommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Recommendations</Text>
            {activeRecommendations.map(renderRecommendation)}
          </View>
        )}

        {completedRecommendations.length > 0 && (
          <CollapsibleSection
            title="Completed"
            isCollapsed={completedCollapsed}
            onToggle={() => setCompletedCollapsed(!completedCollapsed)}
            count={completedRecommendations.length}
          >
            {completedRecommendations.map(renderRecommendation)}
          </CollapsibleSection>
        )}

        {cancelledRecommendations.length > 0 && (
          <CollapsibleSection
            title="Cancelled"
            isCollapsed={cancelledCollapsed}
            onToggle={() => setCancelledCollapsed(!cancelledCollapsed)}
            count={cancelledRecommendations.length}
          >
            {cancelledRecommendations.map(renderRecommendation)}
          </CollapsibleSection>
        )}

        {recommendations.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="medical" size={64} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Recommendations Yet</Text>
            <Text style={styles.emptyStateText}>
              Keep recording your symptoms to receive personalized health suggestions.
            </Text>
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
    paddingTop: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionCount: {
    ...fontStyles.caption,
    color: '#64748b',
    fontWeight: '500',
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
    borderLeftWidth: 4,
    borderLeftColor: '#00b4d8',
  },
  recommendationCardCompleted: {
    borderLeftColor: '#10b981',
    opacity: 0.7,
  },
  recommendationCardCancelled: {
    borderLeftColor: '#ef4444',
    opacity: 0.7,
  },
  
  // Problem Section
  problemSection: {
    marginBottom: 20,
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  problemTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  problemTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 8,
  },
  problemTitleCompleted: {
    color: '#10b981',
  },
  problemTitleCancelled: {
    color: '#ef4444',
  },
  problemDescription: {
    ...fontStyles.body,
    color: '#374151',
    lineHeight: 22,
  },
  problemDescriptionCompleted: {
    color: '#10b981',
  },
  problemDescriptionCancelled: {
    color: '#ef4444',
  },
  
  // Solutions Section
  solutionsSection: {
    marginBottom: 16,
  },
  solutionsTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 12,
    fontWeight: '600',
  },
  actionItemsContainer: {
    gap: 8,
  },
  actionItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionItemCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  actionItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionItemTitle: {
    ...fontStyles.bodyMedium,
    color: '#1e293b',
    flex: 1,
    marginLeft: 12,
    fontWeight: '600',
  },
  actionItemTitleCompleted: {
    color: '#10b981',
  },
  actionItemDescription: {
    ...fontStyles.body,
    color: '#64748b',
    marginLeft: 32,
    lineHeight: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  completedDate: {
    ...fontStyles.caption,
    color: '#10b981',
    marginLeft: 32,
    fontWeight: '500',
  },
  
  // Why Section
  whySection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00b4d8',
  },
  whyTitle: {
    ...fontStyles.bodyMedium,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  whyText: {
    ...fontStyles.body,
    color: '#374151',
    lineHeight: 20,
  },
  
  // Action Buttons
  recommendationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    ...fontStyles.bodyMedium,
    color: '#ffffff',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  cancelButtonText: {
    ...fontStyles.bodyMedium,
    color: '#ef4444',
    fontWeight: '600',
  },
  
  // Priority Badge
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    ...fontStyles.caption,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Status Info
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  completedText: {
    ...fontStyles.body,
    color: '#10b981',
    fontWeight: '500',
  },
  cancelledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelledText: {
    ...fontStyles.body,
    color: '#ef4444',
    fontWeight: '500',
  },
  cancelledReason: {
    ...fontStyles.caption,
    color: '#ef4444',
    marginTop: 4,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    ...fontStyles.h3,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...fontStyles.body,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
}); 