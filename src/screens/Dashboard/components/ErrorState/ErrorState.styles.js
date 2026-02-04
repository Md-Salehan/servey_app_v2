import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../../../constants/colors';

export const errorStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  message: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: COLORS.surface,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});