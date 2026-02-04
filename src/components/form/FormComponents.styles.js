import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    fontFamily: 'System',
  },
  requiredStar: {
    color: COLORS.error,
    marginLeft: 4,
    fontSize: 16,
    fontFamily: 'System',
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    fontFamily: 'System',
    minHeight: 48,
  },
  disabledInput: {
    backgroundColor: COLORS.gray[100],
    color: COLORS.text.disabled,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  counterText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'System',
  },
  selectionButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontFamily: 'System',
  },
  datePickerPlaceholder: {
    color: COLORS.text.disabled,
  },
  dateTimePicker: {
    backgroundColor: COLORS.surface,
  },
  
  // Common validation and description styles
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    fontFamily: 'System',
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 4,
    fontFamily: 'System',
    lineHeight: 18,
  },
  
  // Common canvas/border states (used by multiple components)
  canvasContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 150,
  },
  canvasActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  canvasError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  canvasDisabled: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[300],
  },
  
  // Common button styles (used by multiple components)
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 80,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.gray[300],
    borderColor: COLORS.gray[300],
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
    justifyContent: 'center',
  },
  secondaryButtonDisabled: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[300],
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: COLORS.text.primary,
  },
  buttonTextDisabled: {
    color: COLORS.text.disabled,
  },
  
  // Common controls container
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    width: '100%',
  },
  
  // Common placeholder styles
  placeholderText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  placeholderTextDisabled: {
    color: COLORS.text.disabled,
  },
  
  // Common preview container
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.gray[800],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default styles;