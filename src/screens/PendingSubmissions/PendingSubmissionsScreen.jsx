// screens/PendingSubmissions/PendingSubmissionsScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import styles from './PendingSubmissions.styles';
import SubmissionService from '../../services/submissionService';

const PendingSubmissionsScreen = ({ database }) => {
  const navigation = useNavigation();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const submissionServiceRef = useRef(null);

  // Initialize submission service
  useEffect(() => {
    if (database && !submissionServiceRef.current) {
      const service = new SubmissionService(database);
      submissionServiceRef.current = service;
      service.startQueueProcessor();

      // Load submissions immediately after service is initialized
      loadSubmissions();
    }

    return () => {
      if (submissionServiceRef.current) {
        submissionServiceRef.current.stopQueueProcessor();
      }
    };
  }, [database]);

  useFocusEffect(
    useCallback(() => {
      // Refresh submissions when screen comes into focus
      if (submissionServiceRef.current) {
        loadSubmissions();
      }
    }, []),
  );

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      if (!submissionServiceRef.current) {
        console.log('Submission service not initialized yet');
        return;
      }
      const pendingSubmissions =
        (await submissionServiceRef.current.getPendingSubmissions()) || [];
      console.log('Loaded pending submissions:', pendingSubmissions.length);
      setSubmissions(pendingSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Alert.alert('Error', 'Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async submissionId => {
    Alert.alert(
      'Retry Submission',
      'Are you sure you want to retry this submission?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: async () => {
            try {
              await submissionServiceRef.current?.retrySubmission(submissionId);
              Alert.alert('Success', 'Submission queued for retry');
              loadSubmissions();
            } catch (error) {
              console.error('Retry error:', error);
              Alert.alert('Error', 'Failed to retry submission');
            }
          },
        },
      ],
    );
  };

  const handleViewDetails = submission => {
    setSelectedSubmission(submission);
    setModalVisible(true);
  };

  const handleViewSubmissionData = submission => {
    // Navigate to preview with proper data
    navigation.navigate(ROUTES.PREVIEW_ENTRY, {
      formTitle: submission.formName,
      appId: submission.appId,
      formId: submission.formId,
      fieldValues: submission.fieldValues,
      formComponents: submission.formComponents,
      surFormGenFlg: 'N', // Disable submit button
      isViewOnly: true,
    });
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'completed':
        return <Icon name="check-circle" size={24} color={COLORS.success} />;
      case 'processing':
        return <ActivityIndicator size="small" color={COLORS.primary} />;
      case 'failed':
        return <Icon name="error" size={24} color={COLORS.error} />;
      default:
        return <Icon name="pending" size={24} color={COLORS.warning} />;
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const renderSubmissionItem = ({ item }) => {
    const progress = item.uploadedFiles / (item.totalFiles || 1);
    const hasFailed = item.failedFiles > 0;

    return (
      <TouchableOpacity
        style={styles.submissionCard}
        onPress={() => handleViewDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, styles[`status${item.status}`]]}>
              {getStatusText(item.status)}
            </Text>
          </View>
          <Text style={styles.retryCount}>
            Attempts: {item.retryCount}/{item.maxRetries}
          </Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.formName}>{item.formName}</Text>
          <Text style={styles.submissionDate}>
            Created: {new Date(item.createdAt).toLocaleString()}
          </Text>

          {item.totalFiles > 0 && (
            <View style={styles.fileProgressContainer}>
              <View style={styles.fileProgressBar}>
                <View
                  style={[
                    styles.fileProgressFill,
                    { width: `${Math.min(progress * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.fileProgressText}>
                Files: {item.uploadedFiles}/{item.totalFiles}
              </Text>
            </View>
          )}

          {hasFailed && (
            <View style={styles.errorContainer}>
              <Icon name="warning" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>
                {item.failedFiles} file(s) failed to upload
              </Text>
            </View>
          )}

          {item.errorMessage && (
            <Text style={styles.errorMessage} numberOfLines={2}>
              Error: {item.errorMessage}
            </Text>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewSubmissionData(item)}
          >
            <Text style={styles.viewButtonText}>View Data</Text>
          </TouchableOpacity>

          {(item.status === 'failed' || item.status === 'pending') && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => handleRetry(item.submissionId)}
            >
              <Icon name="refresh" size={16} color={COLORS.text.inverse} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedSubmission) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submission Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>General Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Form Name:</Text>
                <Text style={styles.detailValue}>
                  {selectedSubmission.formName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submission ID:</Text>
                <Text style={styles.detailValue}>
                  {selectedSubmission.submissionId}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    styles[`status${selectedSubmission.status}`],
                  ]}
                >
                  {getStatusText(selectedSubmission.status)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Retry Count:</Text>
                <Text style={styles.detailValue}>
                  {selectedSubmission.retryCount}/
                  {selectedSubmission.maxRetries}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedSubmission.createdAt).toLocaleString()}
                </Text>
              </View>
              {selectedSubmission.completedAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Completed:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedSubmission.completedAt).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            {selectedSubmission.files &&
              selectedSubmission.files.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>
                    Files ({selectedSubmission.files.length})
                  </Text>
                  {selectedSubmission.files.map((file, index) => (
                    <View key={index} style={styles.fileItem}>
                      <View style={styles.fileInfo}>
                        <Icon
                          name="image"
                          size={20}
                          color={COLORS.text.secondary}
                        />
                        <Text style={styles.fileName}>{file.fileName}</Text>
                      </View>
                      <View style={styles.fileStatus}>
                        {getStatusIcon(file.status)}
                        <Text style={styles.fileStatusText}>
                          {file.status === 'uploaded'
                            ? 'Uploaded'
                            : file.status === 'uploading'
                            ? 'Uploading'
                            : file.status === 'failed'
                            ? 'Failed'
                            : 'Pending'}
                        </Text>
                      </View>
                      {file.errorMessage && (
                        <Text style={styles.fileError}>
                          {file.errorMessage}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

            {selectedSubmission.attempts &&
              selectedSubmission.attempts.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Submission Attempts</Text>
                  {selectedSubmission.attempts.map((attempt, index) => (
                    <View key={index} style={styles.attemptItem}>
                      <View style={styles.attemptHeader}>
                        <Text style={styles.attemptStep}>{attempt.step}</Text>
                        <View style={styles.attemptStatus}>
                          {attempt.status === 'success' ? (
                            <Icon
                              name="check-circle"
                              size={16}
                              color={COLORS.success}
                            />
                          ) : attempt.status === 'failed' ? (
                            <Icon name="error" size={16} color={COLORS.error} />
                          ) : (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.primary}
                            />
                          )}
                          <Text style={styles.attemptStatusText}>
                            {attempt.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.attemptTime}>
                        Started: {new Date(attempt.startedAt).toLocaleString()}
                      </Text>
                      {attempt.completedAt && (
                        <Text style={styles.attemptTime}>
                          Duration: {(attempt.durationMs / 1000).toFixed(2)}s
                        </Text>
                      )}
                      {attempt.errorMessage && (
                        <Text style={styles.attemptError}>
                          {attempt.errorMessage}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.viewDataButton}
              onPress={() => {
                setModalVisible(false);
                handleViewSubmissionData(selectedSubmission);
              }}
            >
              <Text style={styles.viewDataButtonText}>
                View Submission Data
              </Text>
            </TouchableOpacity>

            {(selectedSubmission.status === 'failed' ||
              selectedSubmission.status === 'pending') && (
              <TouchableOpacity
                style={styles.retryNowButton}
                onPress={() => {
                  setModalVisible(false);
                  handleRetry(selectedSubmission.submissionId);
                }}
              >
                <Icon name="refresh" size={20} color={COLORS.text.inverse} />
                <Text style={styles.retryNowButtonText}>Retry Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading pending submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Submissions</Text>
        <TouchableOpacity onPress={loadSubmissions}>
          <Icon name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {submissions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="check-circle" size={64} color={COLORS.success} />
          <Text style={styles.emptyTitle}>No Pending Submissions</Text>
          <Text style={styles.emptyText}>
            All submissions have been successfully synced with the server.
          </Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmissionItem}
          keyExtractor={item => item.submissionId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderDetailsModal()}
    </View>
  );
};

export default withDatabase(PendingSubmissionsScreen);
