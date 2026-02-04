import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  
  formContainer: {
    padding: 20,
  },
  unsupportedContainer: {
    backgroundColor: COLORS.warningLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  unsupportedText: {
    fontSize: 14,
    color: COLORS.warning,
    fontFamily: 'System',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: 'System',
    textAlign: 'center',
  },
  submissionErrorContainer: {
    backgroundColor: COLORS.errorLight,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  submissionErrorText: {
    fontSize: 14,
    color: COLORS.error,
    fontFamily: 'System',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.inverse,
    fontFamily: 'System',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },
});

export default styles;