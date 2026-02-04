import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../../../constants/colors';

export const formCardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.surface,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.errorLight,
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.error,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  formDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});