import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { colors } from '../utils/colors';
import { useFollowUpQuestions } from '../contexts/FollowUpQuestionsContext';
import { useSymptomLogs } from '../contexts/SymptomLogsContext';

interface FollowUpQuestionsScreenProps {
  navigation?: any;
}

export default function FollowUpQuestionsScreen({ navigation }: FollowUpQuestionsScreenProps) {
  const { followUpQuestions, removeFollowUpQuestion, markAsAnswered } = useFollowUpQuestions();
  const { addSymptomLog } = useSymptomLogs();
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null);

  const handleRecordAnswer = async (question: any) => {
    setRecordingQuestionId(question.id);
    
    try {
      // This would integrate with your existing recording system
      // For now, we'll simulate recording and add a placeholder log
      const answerLog = {
        id: Date.now().toString(),
        summary: `Answer to follow-up: ${question.question}`,
        healthDomain: 'GENERAL_WELLNESS' as any,
        severity: 'mild' as 'mild',
        impact: 'low' as 'low',
        timestamp: new Date(),
        transcript: `User answered: ${question.question}`,
        isFollowUpAnswer: true,
        followUpQuestionId: question.id,
      };
      
      await addSymptomLog(answerLog);
      markAsAnswered(question.id);
      removeFollowUpQuestion(question.id);
      
      Alert.alert('Success', 'Your answer has been recorded and added to your symptom logs.');
    } catch (error) {
      console.error('Error recording answer:', error);
      Alert.alert('Error', 'Failed to record your answer. Please try again.');
    } finally {
      setRecordingQuestionId(null);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this follow-up question?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => removeFollowUpQuestion(questionId)
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow-up Questions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {followUpQuestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses" size={64} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Follow-up Questions</Text>
            <Text style={styles.emptyStateText}>
              When you have follow-up questions, they'll appear here for you to answer.
            </Text>
          </View>
        ) : (
          followUpQuestions.map((question) => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.questionInfo}>
                  <Text style={styles.questionText}>{question.question}</Text>
                  <Text style={styles.questionMeta}>
                    {formatDate(question.timestamp)} • {question.questionType}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteQuestion(question.id)}
                >
                  <Ionicons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    recordingQuestionId === question.id && styles.recordingButton
                  ]}
                  onPress={() => handleRecordAnswer(question)}
                  disabled={recordingQuestionId === question.id}
                >
                  <Ionicons 
                    name={recordingQuestionId === question.id ? "stop" : "mic"} 
                    size={20} 
                    color="#ffffff" 
                  />
                  <Text style={styles.recordButtonText}>
                    {recordingQuestionId === question.id ? 'Recording...' : 'Record Answer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyStateTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...fontStyles.body,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionInfo: {
    flex: 1,
  },
  questionText: {
    ...fontStyles.body,
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 8,
  },
  questionMeta: {
    ...fontStyles.caption,
    color: '#64748b',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  recordingButton: {
    backgroundColor: '#ef4444',
  },
  recordButtonText: {
    ...fontStyles.bodyMedium,
    color: '#ffffff',
    marginLeft: 8,
  },
}); 