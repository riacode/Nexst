import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFollowUpQuestions, FollowUpQuestion } from '../contexts/FollowUpQuestionsContext';
import { colors } from '../utils/colors';

interface FollowUpQuestionsScreenProps {
  navigation: any;
}

export default function FollowUpQuestionsScreen({ navigation }: FollowUpQuestionsScreenProps) {
  const { questions, updateQuestion, markAsAnswered } = useFollowUpQuestions();

  const handleMarkAsAnswered = (questionId: string) => {
    Alert.prompt(
      'Answer Question',
      'Please provide your answer:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: (answer) => markAsAnswered(questionId, answer || 'No answer provided')
        }
      ],
      'plain-text'
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => updateQuestion(questionId, { isAnswered: true })
        }
      ]
    );
  };

  const renderQuestion = ({ item }: { item: FollowUpQuestion }) => (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionType}>
          <Ionicons 
            name={getQuestionIcon(item.type)} 
            size={16} 
            color={getQuestionColor(item.type)} 
          />
          <Text style={[styles.questionTypeText, { color: getQuestionColor(item.type) }]}>
            {item.type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <View style={styles.questionPriority}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.questionText}>{item.question}</Text>
      
      <View style={styles.questionFooter}>
        <Text style={styles.questionDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        
        <View style={styles.questionActions}>
          {!item.isAnswered && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.answerButton]} 
              onPress={() => handleMarkAsAnswered(item.id)}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Answer</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDeleteQuestion(item.id)}
          >
            <Ionicons name="trash" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {item.isAnswered && item.answer && (
        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>Your Answer:</Text>
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'missing_update': return 'time';
      case 'overdue_recommendation': return 'warning';
      case 'pattern_change': return 'trending-up';
      default: return 'help-circle';
    }
  };

  const getQuestionColor = (type: string) => {
    switch (type) {
      case 'missing_update': return colors.warning;
      case 'overdue_recommendation': return colors.error;
      case 'pattern_change': return colors.info;
      default: return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Follow-up Questions</Text>
        <Text style={styles.subtitle}>
          {questions.filter(q => !q.isAnswered).length} unanswered questions
        </Text>
      </View>
      
      {questions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="help-circle" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Follow-up Questions</Text>
          <Text style={styles.emptySubtitle}>
            Follow-up questions will appear here when the AI needs more information about your health.
          </Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          renderItem={renderQuestion}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  questionPriority: {
    backgroundColor: '#fef3f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 12,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  questionDate: {
    fontSize: 12,
    color: '#64748b',
  },
  questionActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  answerButton: {
    backgroundColor: colors.success,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 4,
  },
  answerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
}); 