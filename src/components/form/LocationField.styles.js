import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const styles = StyleSheet.create({
  // Location coordinates display
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  coordinateBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
  },
  coordinateLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  
  // Address display
  addressContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  
  // Action buttons container
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryActionButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
    marginLeft: 6,
  },
  
  // Manual entry modal
  manualEntryContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
  },
  manualEntryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  manualInput: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 12,
    fontFamily: 'System',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  manualInputHalf: {
    flex: 1,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  modalSubmitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});

export default styles;