import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { MedicalRecommendation, ActionItem, CompletedRecommendation } from '../types/recommendations';
import { useRecommendations } from '../contexts/RecommendationsContext';
import { useTutorial } from '../contexts/TutorialContext';
import FeatureTutorial from '../components/FeatureTutorial';
import { featureTutorials } from '../utils/onboardingContent';
import SharedBackground from '../components/SharedBackground';
import { colors, gradients, getPriorityColor as getPriorityColorUtil } from '../utils/colors';

export default function RecommendationsScreen({ route, navigation }: any) {
  // Get recommendations from global context
  const { recommendations, completedRecommendations, completeRecommendation, cancelRecommendation, toggleActionItem } = useRecommendations();
  const { tutorialState, completeRecommendationTutorial } = useTutorial();
  const activeAlert = route?.params?.activeAlert;
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [cancelledCollapsed, setCancelledCollapsed] = useState(false);

  const getPriorityColor = (priority: string) => {
    return getPriorityColorUtil(priority as 'HIGH' | 'MEDIUM' | 'LOW');
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
            style={{ marginRight: 8 }}
          />
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
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
          color={action.isCompleted ? colors.accent : '#6b7280'} 
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

  const renderCompletedRecommendation = (recommendation: CompletedRecommendation) => (
    <View key={recommendation.id} style={styles.recommendationCard}>
      {/* Title */}
      <Text style={styles.recommendationTitleCompleted}>
        {recommendation.title}
      </Text>

      {/* Symptom Correlation */}
      {recommendation.symptomsTriggering && recommendation.symptomsTriggering.length > 0 && (
        <View style={styles.symptomCorrelation}>
          <Ionicons name="link" size={16} color="#666" />
          <Text style={styles.symptomCorrelationText}>
            Addressed: {recommendation.symptomsTriggering.join(', ')}
          </Text>
        </View>
      )}

      {/* Completion Date */}
      <View style={styles.completedInfo}>
        <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
        <Text style={styles.completedText}>
          Completed on {recommendation.completedAt.toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderRecommendation = (recommendation: MedicalRecommendation) => (
    <View key={recommendation.id} style={[
      styles.recommendationCard,
      recommendation.isCompleted && styles.recommendationCardCompleted,
      recommendation.isCancelled && styles.recommendationCardCancelled
    ]}>
      {/* 1. Title - The recommendation */}
      <Text style={[
        styles.recommendationTitle,
        recommendation.isCompleted && styles.recommendationTitleCompleted,
        recommendation.isCancelled && styles.recommendationTitleCancelled
      ]}>
        {recommendation.title}
      </Text>

      {/* 2. Severity Label */}
      <View style={styles.severityContainer}>
        <View style={[
          styles.severityBadge,
          { backgroundColor: getPriorityColor(recommendation.priority) }
        ]}>
          <Text style={styles.severityText}>
            {getPriorityLabel(recommendation.priority)}
          </Text>
        </View>
      </View>

      {/* 3. Short Description */}
      <Text style={[
        styles.recommendationDescription,
        recommendation.isCompleted && styles.recommendationDescriptionCompleted,
        recommendation.isCancelled && styles.recommendationDescriptionCancelled
      ]}>
        {recommendation.description}
      </Text>

      {/* 4. Symptom Correlation */}
      {recommendation.symptomsTriggering && recommendation.symptomsTriggering.length > 0 && (
        <View style={styles.symptomCorrelation}>
          <Ionicons name="link" size={16} color="#666" />
          <Text style={styles.symptomCorrelationText}>
            Addresses: {recommendation.symptomsTriggering.join(', ')}
          </Text>
        </View>
      )}

      {/* 5. Reasoning */}
      <View style={styles.reasoningSection}>
        <Text style={styles.reasoningTitle}>Why this helps:</Text>
        <Text style={styles.reasoningText}>{recommendation.medicalRationale}</Text>
      </View>

      {/* 6. Action Buttons - Done, Not for me */}
      {!recommendation.isCompleted && !recommendation.isCancelled && (
        <View style={styles.recommendationActions}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => handleCompleteRecommendation(recommendation.id!)}
          >
            <Ionicons name="checkmark" size={20} color="#ffffff" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notForMeButton}
            onPress={() => handleCancelRecommendation(recommendation.id!)}
          >
            <Ionicons name="close" size={20} color="#ef4444" />
            <Text style={styles.notForMeButtonText}>Not for me</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status info */}
      {recommendation.isCompleted && recommendation.completedAt && (
        <View style={styles.completedInfo}>
          <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
          <Text style={styles.completedText}>
            Completed on {recommendation.completedAt.toLocaleDateString()}
          </Text>
        </View>
      )}

      {recommendation.isCancelled && recommendation.cancelledAt && (
        <View style={styles.cancelledInfo}>
          <Ionicons name="close-circle" size={16} color={colors.accentElectric} />
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
  const cancelledRecommendations = recommendations.filter(rec => rec.isCancelled);

  return (
    <SharedBackground>
      <View style={styles.container}>
      <FeatureTutorial
        visible={!tutorialState.hasSeenRecommendationTutorial && recommendations.length === 0}
        title={featureTutorials.recommendations.title}
        description={featureTutorials.recommendations.description}
        position="center"
        onComplete={completeRecommendationTutorial}
        showSkip={false}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeRecommendations.length > 0 && (
          <View style={styles.section}>
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
            {completedRecommendations.map(renderCompletedRecommendation)}
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


      </ScrollView>
      </View>
    </SharedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginRight: 8,
  },
  sectionHeaderTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginRight: 8,
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
  },
  sectionCount: {
    ...fontStyles.h3,
    color: '#888888',
    fontWeight: '400',
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#00B39F',
  },
  recommendationCardCompleted: {
    borderLeftColor: '#00B39F',
    opacity: 0.7,
  },
  recommendationCardCancelled: {
    borderLeftColor: colors.accentElectric,
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
    color: '#00B39F',
  },
  problemTitleCancelled: {
    color: colors.accentElectric,
  },
  problemDescription: {
    ...fontStyles.body,
    color: '#64748b',
    lineHeight: 22,
  },
  problemDescriptionCompleted: {
    color: '#00B39F',
  },
  problemDescriptionCancelled: {
    color: colors.accentElectric,
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
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionItemCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: colors.accent,
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
    color: colors.accent,
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
    backgroundColor: '#00B39F',
    borderColor: '#00B39F',
  },
  completedDate: {
    ...fontStyles.caption,
    color: '#00B39F',
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
    borderLeftColor: '#00B39F',
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
    backgroundColor: '#00B39F',
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
    color: 'rgb(231, 151, 110)',
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
    color: '#00B39F',
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
    color: 'rgb(231, 151, 110)',
    fontWeight: '500',
  },
  cancelledReason: {
    ...fontStyles.caption,
    color: 'rgb(231, 151, 110)',
    marginTop: 4,
  },
  
  // Symptom Correlation
  symptomCorrelation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 6,
  },
  symptomCorrelationText: {
    ...fontStyles.caption,
    color: '#666666',
    fontStyle: 'italic',
  },
  
  // New Recommendation Format Styles
  recommendationTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 12,
    fontWeight: '600',
  },
  recommendationTitleCompleted: {
    color: '#00B39F',
  },
  recommendationTitleCancelled: {
    color: colors.accentElectric,
  },
  severityContainer: {
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  severityText: {
    ...fontStyles.caption,
    color: '#ffffff',
    fontWeight: '600',
  },
  recommendationDescription: {
    ...fontStyles.body,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 12,
  },
  recommendationDescriptionCompleted: {
    color: '#00B39F',
  },
  recommendationDescriptionCancelled: {
    color: colors.accentElectric,
  },
  reasoningSection: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00B39F',
  },
  reasoningTitle: {
    ...fontStyles.bodyMedium,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasoningText: {
    ...fontStyles.body,
    color: '#374151',
    lineHeight: 20,
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B39F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  doneButtonText: {
    ...fontStyles.bodyMedium,
    color: '#ffffff',
    fontWeight: '600',
  },
  notForMeButton: {
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
  notForMeButtonText: {
    ...fontStyles.bodyMedium,
    color: '#ef4444',
    fontWeight: '600',
  },

}); 