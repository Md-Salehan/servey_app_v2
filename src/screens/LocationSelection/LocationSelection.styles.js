// screens/LocationSelection/LocationSelection.styles.js
import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
    fontFamily: 'System',
  },
  headerRight: {
    width: 40,
  },
  
  // Progress Indicator
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  
  // Scroll Content
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    padding: 20,
  },
  
  // Footer Styles
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  backFooterButton: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },
  continueButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    fontFamily: 'System',
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
  
  // Reset Button
  resetButton: {
    padding: 8,
    marginRight: -8,
  },
});

export default styles;