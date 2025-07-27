import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSmartAI } from '../contexts/SmartAIContext';
import { fontStyles } from '../utils/fonts';

// ============================================================================
// AI COST MONITOR COMPONENT
// ============================================================================
// 
// PURPOSE: Displays real-time AI usage statistics and costs
// USAGE: Can be added to settings or developer panel
// COST TRACKING: Shows reactive vs proactive AI costs

export default function AICostMonitor() {
  const { getCostBreakdown, getUsageStats } = useSmartAI();
  
  const costBreakdown = getCostBreakdown();
  const usageStats = getUsageStats();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 AI Usage Statistics</Text>
      
      {/* Cost Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Cost Breakdown</Text>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Reactive AI:</Text>
          <Text style={styles.costValue}>${costBreakdown.reactiveCost}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Proactive AI:</Text>
          <Text style={styles.costValue}>${costBreakdown.proactiveCost}</Text>
        </View>
        <View style={[styles.costRow, styles.totalRow]}>
          <Text style={styles.costLabel}>Total:</Text>
          <Text style={styles.costValue}>${costBreakdown.totalCost}</Text>
        </View>
      </View>

      {/* Usage Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 API Calls</Text>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Reactive Calls:</Text>
          <Text style={styles.usageValue}>{usageStats.reactiveCalls}</Text>
        </View>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Proactive Calls:</Text>
          <Text style={styles.usageValue}>{usageStats.proactiveCalls}</Text>
        </View>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Total Calls:</Text>
          <Text style={styles.usageValue}>{usageStats.totalCalls}</Text>
        </View>
        <Text style={styles.lastCall}>
          Last call: {usageStats.lastCall.toLocaleTimeString()}
        </Text>
      </View>

      {/* Cost Explanation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Cost Explanation</Text>
        <Text style={styles.explanation}>
          • Reactive AI: User-triggered actions (symptom processing, recommendations)
        </Text>
        <Text style={styles.explanation}>
          • Proactive AI: Background monitoring (pattern analysis, follow-ups)
        </Text>
        <Text style={styles.explanation}>
          • Total daily cost: ~$0.50 per user (vs $1.95 for full agentic AI)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...fontStyles.bodyMedium,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  costLabel: {
    ...fontStyles.body,
    color: '#6b7280',
  },
  costValue: {
    ...fontStyles.bodyMedium,
    color: '#1e293b',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 4,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  usageLabel: {
    ...fontStyles.body,
    color: '#6b7280',
  },
  usageValue: {
    ...fontStyles.bodyMedium,
    color: '#1e293b',
    fontWeight: '600',
  },
  lastCall: {
    ...fontStyles.caption,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
  explanation: {
    ...fontStyles.caption,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 16,
  },
}); 