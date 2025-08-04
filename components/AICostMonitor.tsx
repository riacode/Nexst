import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSmartAI } from '../contexts/SmartAIContext';
import { colors } from '../utils/colors';

// ============================================================================
// AI COST MONITOR - Displays AI API Usage Costs and Statistics
// ============================================================================

/**
 * AI Cost Monitor component
 * Displays detailed breakdown of AI costs and usage statistics
 */
export default function AICostMonitor() {
  const { getCostBreakdown, getUsageStats, resetCosts } = useSmartAI();
  const costBreakdown = getCostBreakdown();
  const usageStats = getUsageStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={24} color={colors.accent} />
        <Text style={styles.title}>AI Usage & Costs</Text>
      </View>

      {/* Cost Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Transcription:</Text>
          <Text style={styles.costValue}>${costBreakdown.transcriptionCost.toFixed(2)}</Text>
        </View>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Analysis:</Text>
          <Text style={styles.costValue}>${costBreakdown.analysisCost.toFixed(2)}</Text>
        </View>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Recommendations:</Text>
          <Text style={styles.costValue}>${costBreakdown.recommendationCost.toFixed(2)}</Text>
        </View>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Questions:</Text>
          <Text style={styles.costValue}>${costBreakdown.questionCost.toFixed(2)}</Text>
        </View>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Autonomous:</Text>
          <Text style={styles.costValue}>${costBreakdown.autonomousCost.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.costRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Cost:</Text>
          <Text style={styles.totalValue}>${usageStats.totalCost.toFixed(2)}</Text>
        </View>
      </View>

      {/* Usage Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Statistics</Text>
        
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Transcription Calls:</Text>
          <Text style={styles.usageValue}>{costBreakdown.transcriptionCalls}</Text>
        </View>
        
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Analysis Calls:</Text>
          <Text style={styles.usageValue}>{costBreakdown.analysisCalls}</Text>
        </View>
        
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Recommendation Calls:</Text>
          <Text style={styles.usageValue}>{costBreakdown.recommendationCalls}</Text>
        </View>
        
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Question Calls:</Text>
          <Text style={styles.usageValue}>{costBreakdown.questionCalls}</Text>
        </View>
        
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Autonomous Calls:</Text>
          <Text style={styles.usageValue}>{costBreakdown.autonomousCalls}</Text>
        </View>
        
        <View style={[styles.usageRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Calls:</Text>
          <Text style={styles.totalValue}>{usageStats.totalCalls}</Text>
        </View>
      </View>

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={resetCosts}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.resetButtonText}>Reset Costs</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  costLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  usageLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
  },
  resetButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 