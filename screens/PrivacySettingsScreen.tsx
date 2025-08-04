import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontStyles } from '../utils/fonts';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useSymptomLogs } from '../contexts/SymptomLogsContext';
import { useRecommendations } from '../contexts/RecommendationsContext';
import { useAppointments } from '../contexts/AppointmentsContext';

export default function PrivacySettingsScreen({ navigation }: any) {
  const { privacySettings, toggleAIProcessing, toggleDataSharing, toggleAnalytics, updateDataRetention, exportUserData, deleteAllData, resetPrivacySettings } = usePrivacy();
  const { clearAllSymptomLogs } = useSymptomLogs();
  const { clearRecommendations } = useRecommendations();
  const { clearAppointments } = useAppointments();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await exportUserData();
      
      await Share.share({
        message: 'My Nexst Health Data Export',
        title: 'Nexst Health Data',
        url: `data:application/json;base64,${Buffer.from(data).toString('base64')}`,
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your symptom logs, recommendations, appointments, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllData();
                              await clearAllSymptomLogs();
              await clearRecommendations();
              await clearAppointments();
              Alert.alert('Success', 'All data has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete all data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleResetPrivacySettings = () => {
    Alert.alert(
      'Reset Privacy Settings',
      'This will reset all privacy settings to their default values. Your data will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await resetPrivacySettings();
              Alert.alert('Success', 'Privacy settings have been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset privacy settings. Please try again.');
            }
          }
        }
      ]
    );
  };

  const PrivacySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const PrivacyItem = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange = () => {},
    showArrow = true,
    destructive = false 
  }: {
    title: string;
    subtitle: string;
    icon: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.privacyItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.privacyItemLeft}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={destructive ? '#ef4444' : '#00b4d8'} 
        />
        <View style={styles.privacyItemText}>
          <Text style={[styles.privacyItemTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          <Text style={styles.privacyItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.privacyItemRight}>
        {showSwitch && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#e2e8f0', true: '#00b4d8' }}
            thumbColor={switchValue ? '#ffffff' : '#ffffff'}
          />
        )}
        {showArrow && !showSwitch && (
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <PrivacySection title="Data Processing">
          <PrivacyItem
            title="AI Processing"
            subtitle="Allow AI analysis of your symptoms for recommendations"
            icon="brain"
            showSwitch={true}
            switchValue={privacySettings.aiProcessingEnabled}
            onSwitchChange={toggleAIProcessing}
            showArrow={false}
          />
          <PrivacyItem
            title="Data Sharing"
            subtitle="Allow sharing data with healthcare providers"
            icon="share"
            showSwitch={true}
            switchValue={privacySettings.dataSharingEnabled}
            onSwitchChange={toggleDataSharing}
            showArrow={false}
          />
          <PrivacyItem
            title="Analytics"
            subtitle="Help improve the app with anonymous usage data"
            icon="analytics"
            showSwitch={true}
            switchValue={privacySettings.analyticsEnabled}
            onSwitchChange={toggleAnalytics}
            showArrow={false}
          />
        </PrivacySection>

        <PrivacySection title="Data Management">
          <PrivacyItem
            title="Export My Data"
            subtitle="Download all your health data as JSON"
            icon="download"
            onPress={handleExportData}
          />
          <PrivacyItem
            title="Data Retention"
            subtitle={`Keep data for ${privacySettings.dataRetentionDays} days`}
            icon="time"
            onPress={() => {
              Alert.prompt(
                'Data Retention',
                'How many days should we keep your data?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Update',
                    onPress: (value) => {
                      const days = parseInt(value || '365');
                      if (days > 0 && days <= 3650) { // Max 10 years
                        updateDataRetention(days);
                      }
                    }
                  }
                ],
                'plain-text',
                privacySettings.dataRetentionDays.toString()
              );
            }}
          />
        </PrivacySection>



        <PrivacySection title="Account Actions">
          <PrivacyItem
            title="Reset Privacy Settings"
            subtitle="Reset all privacy settings to defaults"
            icon="refresh"
            onPress={handleResetPrivacySettings}
          />
          <PrivacyItem
            title="Delete All Data"
            subtitle="Permanently delete all your data"
            icon="trash"
            onPress={handleDeleteAllData}
            destructive={true}
          />
        </PrivacySection>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🔒 Your Data is Secure</Text>
          <Text style={styles.infoText}>
            • All data is stored locally on your device{'\n'}
            • Audio recordings are processed securely and immediately deleted{'\n'}
            • No health data is shared without your explicit consent{'\n'}
            • You have complete control over your data
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...fontStyles.h1,
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 16,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  privacyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyItemText: {
    marginLeft: 12,
    flex: 1,
  },
  privacyItemTitle: {
    ...fontStyles.body,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyItemSubtitle: {
    ...fontStyles.caption,
    color: '#64748b',
    lineHeight: 16,
  },
  privacyItemRight: {
    alignItems: 'center',
  },
  destructiveText: {
    color: '#ef4444',
  },
  infoSection: {
    backgroundColor: '#e0f7ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoTitle: {
    ...fontStyles.h3,
    color: '#1e293b',
    marginBottom: 8,
  },
  infoText: {
    ...fontStyles.body,
    color: '#475569',
    lineHeight: 20,
  },
}); 