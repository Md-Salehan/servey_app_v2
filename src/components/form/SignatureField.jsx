import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SignatureScreen from 'react-native-signature-canvas';
import { COLORS } from '../../constants/colors';
import commonStyles from './FormComponents.styles';

const SignatureField = ({
  fcId,
  label = 'Signature',
  value = '',
  onChange,
  required = false,
  disabled = false,
  description = '',
  error = '',
  // canvasWidth = 350,
  // canvasHeight = 150,
  strokeColor = COLORS.primary,
  strokeWidth = 3,
  backgroundColor = COLORS.surface,
  minPoints = 10,
  onSave,
  onSigningStart,
  onSigningEnd,
}) => {
  // State for signature
  const [signature, setSignature] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [validationError, setValidationError] = useState(error);

  

  // Mobile screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Ref for signature canvas
  const signatureRef = useRef(null);

  // Parse boolean value from string if needed
  const isSigned = useCallback(() => {
    if (typeof signature === 'string') {
      return (
        signature.length > 0 &&
        signature !== 'false' &&
        signature !== '0' &&
        !signature.includes('mock')
      );
    }
    return Boolean(signature);
  }, [signature]);

  // Handle signature save
  const handleSignatureSave = useCallback(
    signatureData => {
      if (
        !signatureData ||
        signatureData.trim() === '' ||
        signatureData === 'data:image/png;base64,'
      ) {
        setValidationError('Please provide a signature');
        return;
      }

      setIsSaving(true);

      try {
        // Mobile-optimized validation: Base64 signatures are typically > 100 chars
        if (signatureData.length < 100) {
          setValidationError(
            'Signature is too simple. Please provide a more complete signature.',
          );
          return;
        }

        setSignature(signatureData);
        onChange(signatureData);

        if (onSave) {
          onSave(signatureData);
        }

        setValidationError('');
        setIsSigning(false);

        // Notify parent that signing has ended
        if (onSigningEnd) {
          onSigningEnd();
        }
      } catch (err) {
        console.error('Error saving signature:', err);
        setValidationError('Failed to save signature. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [onChange, onSave, onSigningEnd],
  );

  // Handle signature clear
  const handleSignatureClear = useCallback(() => {
    if (disabled) return;

    if (isSigning) {
      // If currently signing, clear the canvas
      if (signatureRef.current) {
        signatureRef.current.clearSignature();
      }
    } else {
      // If signature is saved, clear it
      Alert.alert(
        'Clear Signature',
        'Are you sure you want to clear the signature?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              setSignature('');
              onChange('');
              setValidationError('');
            },
          },
        ],
      );
    }
  }, [disabled, onChange, isSigning]);

  // Handle start signing
  const handleStartSigning = useCallback(() => {
    if (disabled) return;

    setIsSigning(true);
    setValidationError('');

    // Notify parent that signing has started
    if (onSigningStart) {
      onSigningStart();
    }
  }, [disabled, onSigningStart]);

  // Handle edit existing signature
  const handleEdit = useCallback(() => {
    if (disabled) return;

    Alert.alert(
      'Edit Signature',
      'This will clear your current signature. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            setSignature('');
            onChange('');
            setIsSigning(true);
            onSigningStart && onSigningStart();
          },
        },
      ],
    );
  }, [disabled, onChange]);

  // Handle cancel signing
  const handleCancelSigning = useCallback(() => {
    setIsSigning(false);

    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }

    // Notify parent that signing has ended
    if (onSigningEnd) {
      onSigningEnd();
    }
  }, [onSigningEnd]);

  // Validate on mount and when value changes
  useEffect(() => {
    if (required && !isSigned() && !validationError) {
      setValidationError('Signature is required');
    } else if (isSigned() && validationError) {
      setValidationError('');
    }
  }, [required, isSigned, validationError]);

  // Update when external error changes
  useEffect(() => {
    if (error !== validationError) {
      setValidationError(error);
    }
  }, [error]);

  // Mobile-optimized canvas dimensions
  // const containerWidth = useMemo(() => {
  //   const maxWidth = Math.min(screenWidth - 32, 400); // Account for padding
  //   return Math.min(canvasWidth, maxWidth);
  // }, [canvasWidth, screenWidth]);
  const containerWidth = useMemo(() => {
    return Math.floor(screenWidth - 20);
  }, [screenWidth]);
  console.log(containerWidth, 'contain');

  // const containerHeight = useMemo(() => {
  //   return Math.min(canvasHeight, 200); // Max height for mobile
  // }, [canvasHeight]);
  const containerHeight = useMemo(() => {
    return Math.floor(screenHeight / 4); // Max height for mobile
  }, [screenHeight]);
  // CSS style for the signature canvas (optimized for mobile WebView)
  const signatureStyle = useMemo(() => {
    const isIOS = Platform.OS === 'ios';
    const borderWidth = validationError ? 2 : 1;

    return `
      .m-signature-pad {
        box-shadow: none;
        border: none;
        background-color: ${backgroundColor};
        width: 100%;
        height: 100%;
        touch-action: ${disabled ? 'none' : 'auto'};
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      
      .m-signature-pad--body {
        border: ${borderWidth}px solid ${
      validationError ? COLORS.error : COLORS.border
    };
        border-radius: 8px;
        width: 100% !important;
        height: 100% !important;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        ${disabled ? `background-color: ${COLORS.gray[100]};` : ''}
        ${disabled ? 'opacity: 0.6;' : ''}
        -webkit-tap-highlight-color: transparent;
      }
      
      .m-signature-pad--body canvas {
        border-radius: 7px;
        width: 100% !important;
        height: 100% !important;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        ${isIOS ? '-webkit-overflow-scrolling: touch;' : ''}
      }
      
      .m-signature-pad--footer {
        display: none !important;
      }
      
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        position: relative;
      }
      
      #root {
        width: 100%;
        height: 100%;
        position: relative;
      }
      
      html {
        -webkit-text-size-adjust: 100%;
      }`;
  }, [backgroundColor, disabled, validationError]);

  // Render signature preview
  const renderSignaturePreview = () => {
    if (!isSigned()) return null;

    return (
      <View style={[commonStyles.previewContainer, styles.previewContainer]}>
        <View style={styles.previewContent}>
          {/* Signature Preview with background */}
          <View style={styles.signaturePreviewBox}>
            <View style={styles.signatureBackground}>
              {signature ? (
                <Image
                  source={{ uri: signature }}
                  style={styles.signaturePreviewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noSignaturePreview}>
                  <Icon name="draw" size={24} color={COLORS.text.secondary} />
                </View>
              )}
            </View>
            <View style={styles.previewBadge}>
              <Icon name="check" size={12} color={COLORS.surface} />
            </View>
          </View>

          {/* Preview Info */}
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>Signature Captured</Text>
            <Text style={styles.previewSize}>
              {signature ? Math.round(signature.length / 1024) : 0} KB
            </Text>
            <TouchableOpacity
              onPress={handleEdit}
              disabled={disabled}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel="Edit signature"
            >
              <View>
                {disabled ? (
                  <Text style={styles.previewHint}>View only</Text>
                ) : (
                  <Text style={styles.previewHint}>
                    <Icon name="edit" size={11} color={COLORS.primary} /> Tap to
                    edit
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render signature canvas
  const renderSignatureCanvas = () => {
    if (isSigned() && !isSigning) return null;

    return (
      <View style={styles.canvasOuterContainer}>
        {/* Signature Canvas */}
        <View
          style={[
            styles.signatureCanvasWrapper,
            validationError && commonStyles.canvasError,
            disabled && commonStyles.canvasDisabled,
            {
              width: 350,
              height: containerHeight,
            },
          ]}
        >
          <SignatureScreen
            ref={signatureRef}
            onOK={handleSignatureSave}
            onBegin={handleStartSigning}
            onClear={() => {
              // Mobile-specific: Handle clear event
              if (Platform.OS === 'android') {
                // Android-specific handling
              }
            }}
            webStyle={signatureStyle}
            autoClear={false}
            descriptionText=""
            clearText=""
            confirmText=""
            imageType="image/png"
            penColor={strokeColor}
            backgroundColor={backgroundColor}
            dotSize={strokeWidth}
            minWidth={strokeWidth}
            maxWidth={strokeWidth}
            style={{
              // width: containerWidth,
              height: containerHeight,
              backgroundColor: 'transparent',
            }}
            dataURL={isSigning ? '' : value}
          />
        </View>

        {/* Control buttons - optimized for mobile touch targets */}
        <View
          style={[commonStyles.controlsContainer, styles.controlsContainer]}
        >
          {/* Clear button */}
          <TouchableOpacity
            style={[
              commonStyles.secondaryButton,
              styles.controlButton,
              disabled && commonStyles.secondaryButtonDisabled,
            ]}
            onPress={handleSignatureClear}
            disabled={disabled || (!isSigning && !isSigned())}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Clear signature"
            accessibilityHint="Tap to clear signature"
          >
            <Icon
              name="delete"
              size={20}
              color={
                disabled || (!isSigning && !isSigned())
                  ? COLORS.text.disabled
                  : COLORS.error
              }
            />
            <Text
              style={[
                commonStyles.secondaryButtonText,
                (disabled || (!isSigning && !isSigned())) &&
                  commonStyles.buttonTextDisabled,
              ]}
            >
              Clear
            </Text>
          </TouchableOpacity>

          {/* Cancel button (only shown when signing) */}
          {isSigning && (
            <TouchableOpacity
              style={[
                commonStyles.secondaryButton,
                styles.controlButton,
                disabled && commonStyles.secondaryButtonDisabled,
              ]}
              onPress={handleCancelSigning}
              disabled={disabled}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Cancel signing"
              accessibilityHint="Tap to cancel signature"
            >
              <Icon
                name="close"
                size={20}
                color={disabled ? COLORS.text.disabled : COLORS.text.secondary}
              />
              <Text
                style={[
                  commonStyles.secondaryButtonText,
                  disabled && commonStyles.buttonTextDisabled,
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[
              commonStyles.primaryButton,
              styles.saveButton,
              (disabled || !isSigning) && commonStyles.primaryButtonDisabled,
            ]}
            onPress={() => {
              if (signatureRef.current) {
                signatureRef.current.readSignature();
              }
            }}
            disabled={disabled || !isSigning || isSaving}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Save signature"
            accessibilityHint="Tap to save your signature"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <>
                <Icon
                  name="check"
                  size={20}
                  color={
                    disabled || !isSigning
                      ? COLORS.text.disabled
                      : COLORS.surface
                  }
                />
                <Text
                  style={[
                    commonStyles.primaryButtonText,
                    (disabled || !isSigning) && commonStyles.buttonTextDisabled,
                  ]}
                >
                  Save
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Mobile-specific instructions */}
        {isSigning && !disabled && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              {Platform.OS === 'ios'
                ? 'Draw your signature with your finger'
                : 'Draw your signature in the box above'}
            </Text>
            {Platform.OS === 'android' && (
              <Text style={styles.instructionsHint}>Use finger or stylus</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render start signature button
  const renderStartSignatureButton = () => {
    if (isSigned() || isSigning) return null;

    return (
      <TouchableOpacity
        style={[
          commonStyles.secondaryButton,
          styles.startButton,
          disabled && commonStyles.secondaryButtonDisabled,
        ]}
        onPress={handleStartSigning}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Start signature"
        accessibilityHint="Tap to start drawing your signature"
      >
        <Icon
          name="gesture"
          size={24}
          color={disabled ? COLORS.text.disabled : COLORS.primary}
        />
        <Text
          style={[
            styles.startButtonText,
            disabled && commonStyles.buttonTextDisabled,
          ]}
        >
          {description || ' Tap to start signing'}
        </Text>
      </TouchableOpacity>
    );
  };

  // Determine what to render
  const renderSignatureArea = () => {
    if (isSigned() && !isSigning) {
      return renderSignaturePreview();
    } else if (isSigning) {
      return renderSignatureCanvas();
    } else {
      return renderStartSignatureButton();
    }
  };

  // Accessibility label optimized for mobile screen readers
  const accessibilityLabel = useMemo(() => {
    let labelText = `${label}. ${isSigned() ? 'Signed' : 'Not signed'}.`;
    if (required) labelText += ' Required.';
    if (disabled) labelText += ' Disabled.';
    if (validationError) labelText += ` Error: ${validationError}`;
    if (isSigning) labelText += ' Currently signing.';
    return labelText;
  }, [label, isSigned, required, disabled, validationError, isSigning]);

  return (
    <View style={[commonStyles.fieldContainer, styles.container]}>
      {/* Label */}
      <View style={commonStyles.labelContainer}>
        <Text
          style={[
            commonStyles.labelText,
            disabled && styles.labelTextDisabled,
            validationError && styles.labelTextError,
          ]}
        >
          {label}
          {required && <Text style={commonStyles.requiredStar}> *</Text>}
        </Text>
      </View>

      {/* Description (only shown when not signing) */}
      {description && !isSigning && !isSigned() && (
        <View style={styles.descriptionContainer}>
          <Text style={commonStyles.descriptionText}>{description}</Text>
        </View>
      )}

      {/* Signature Area */}
      <View
        style={styles.signatureArea}
        accessibilityLabel={accessibilityLabel}
        accessible={true}
        importantForAccessibility="yes"
      >
        {renderSignatureArea()}
      </View>

      {/* Error message */}
      {validationError ? (
        <View style={styles.errorContainer}>
          <Text style={commonStyles.errorText}>{validationError}</Text>
        </View>
      ) : null}
    </View>
  );
};

SignatureField.propTypes = {
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.string, // Base64 image data
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  description: PropTypes.string,
  error: PropTypes.string,
  // canvasWidth: PropTypes.number,
  // canvasHeight: PropTypes.number,
  strokeColor: PropTypes.string,
  strokeWidth: PropTypes.number,
  backgroundColor: PropTypes.string,
  minPoints: PropTypes.number,
  onSave: PropTypes.func,
  onSigningStart: PropTypes.func, // Add this
  onSigningEnd: PropTypes.func, // Add this
};

SignatureField.defaultProps = {
  label: 'Signature',
  value: '',
  required: false,
  disabled: false,
  description: '',
  error: '',
  // canvasWidth: 300,
  // canvasHeight: 150,
  strokeWidth: 3,
  backgroundColor: COLORS.surface,
  minPoints: 10,
  onSave: null,
  onSigningStart: null,
  onSigningEnd: null,
};

export default React.memo(SignatureField);

////////////////////////////////////////////////////////////////////////////////
// STYLES /////////////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  // Label states
  labelTextDisabled: {
    color: COLORS.text.disabled,
  },
  labelTextError: {
    color: COLORS.error,
  },

  // Description
  descriptionContainer: {
    marginBottom: 12,
  },

  // Signature area
  signatureArea: {
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Start button
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  startButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Canvas wrapper
  canvasOuterContainer: {
    alignItems: 'center',
  },
  signatureCanvasWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Controls
  controlsContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  controlButton: {
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  saveButton: {
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
  },

  // Instructions
  instructionsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionsHint: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
  },

  // Preview
  previewContainer: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signaturePreviewBox: {
    position: 'relative',
    marginRight: 16,
  },
  signatureBackground: {
    width: 150,
    height: 100,
    backgroundColor: COLORS.gray[50],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signaturePreviewImage: {
    width: '90%',
    height: '90%',
  },
  noSignaturePreview: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  previewSize: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  previewHint: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'flex-end',
  },
  editIconButton: {
    padding: 8,
    marginLeft: 8,
  },

  // Error container
  errorContainer: {
    marginTop: 8,
  },
});
