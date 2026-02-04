import { StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS } from '../../../../constants/colors';

const { width, height } = Dimensions.get('window');

export const formFilterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    flex: 1,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    color: COLORS.surface,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  optionsList: {
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});