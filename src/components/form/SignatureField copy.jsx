import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
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
  canvasWidth = 300,
  canvasHeight = 150,
  strokeColor = COLORS.primary,
  strokeWidth = 3,
  backgroundColor = COLORS.surface,
  minPoints = 10,
  onSave,
}) => {
  // State for signature
  const [signature, setSignature] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [validationError, setValidationError] = useState(error);
  
  // Ref for signature canvas
  const signatureRef = useRef(null);
  const isSigningRef = useRef(false);

  // Parse boolean value from string if needed
  const isSigned = useCallback(() => {
    if (typeof signature === 'string') {
      return signature.length > 0 && signature !== 'false' && signature !== '0' && !signature.includes('mock');
    }
    return Boolean(signature);
  }, [signature]);

  // Handle signature save
  const handleSignatureSave = useCallback((signatureData) => {
    if (!signatureData || signatureData.trim() === '') {
      setValidationError('Please provide a signature');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Validate signature is not empty
      if (signatureData.length < 100) { // Base64 signatures are typically > 100 chars
        setValidationError('Signature is too simple. Please provide a more complete signature.');
        return;
      }
      
      setSignature(signatureData);
      onChange(signatureData);
      
      if (onSave) {
        onSave(signatureData);
      }
      
      setValidationError('');
      setIsSigning(false);
      isSigningRef.current = false;
    } catch (err) {
      console.error('Error saving signature:', err);
      setValidationError('Failed to save signature. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [onChange, onSave]);

  // Handle signature clear
  const handleSignatureClear = useCallback(() => {
    if (disabled) return;
    
    if (isSigningRef.current) {
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
        ]
      );
    }
  }, [disabled, onChange]);

  // Handle start signing
  const handleStartSigning = useCallback(() => {
    if (disabled) return;
    
    setIsSigning(true);
    isSigningRef.current = true;
    setValidationError('');
  }, [disabled]);

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
            isSigningRef.current = true;
          },
        },
      ]
    );
  }, [disabled, onChange]);

  // Handle cancel signing
  const handleCancelSigning = useCallback(() => {
    setIsSigning(false);
    isSigningRef.current = false;
    
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  }, []);

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

  // Calculate canvas dimensions
  const containerWidth = Math.min(canvasWidth, 400); // Max width for mobile
  const containerHeight = Math.min(canvasHeight, 200); // Max height for mobile

  // CSS style for the signature canvas (WebView)
  const signatureStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: ${backgroundColor};
    }
    
    .m-signature-pad--body {
      border: 1px solid ${validationError ? COLORS.error : COLORS.border};
      border-radius: 8px;
      ${disabled ? `background-color: ${COLORS.gray[100]};` : ''}
    }
    
    .m-signature-pad--body canvas {
      border-radius: 7px;
    }
    
    .m-signature-pad--footer {
      display: none;
    }
    
    body {
      margin: 0;
      padding: 0;
    }
  `;

  // Custom HTML for the signature canvas, including instructions and disabled overlay
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        ${signatureStyle}
        
        .signature-instruction {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: ${COLORS.text.secondary};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          pointer-events: none;
          z-index: 1;
        }
        
        .signature-instruction i {
          display: block;
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.7;
        }
        
        .disabled-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(243, 244, 246, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${COLORS.text.disabled};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          z-index: 2;
          border-radius: 7px;
        }
      </style>
    </head>
    <body>
      <div class="m-signature-pad">
        <div class="m-signature-pad--body">
          ${disabled ? '<div class="disabled-overlay">Signature field disabled</div>' : ''}
          ${!disabled && isSigning ? '<div class="signature-instruction"><i>✍️</i>Sign here</div>' : ''}
          <canvas></canvas>
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script>
    </body>
    </html>
  `;

  // Render signature preview
  const renderSignaturePreview = () => {
    if (!isSigned()) return null;
    
    return (
      <View style={[commonStyles.previewContainer, styles.previewContainer]}>
        <View style={styles.previewImage}>
          <Icon name="draw" size={40} color={COLORS.primary} />
          <View style={styles.previewTextContainer}>
            <Text style={styles.previewText}>Signature saved</Text>
            <Text style={styles.previewSubtext}>Tap edit to make changes</Text>
          </View>
        </View>
        {!disabled && (
          <TouchableOpacity
            style={[commonStyles.secondaryButton, styles.editButton]}
            onPress={handleEdit}
            disabled={disabled}
            accessibilityLabel="Edit signature"
            accessibilityHint="Tap to clear and redraw signature"
          >
            <Icon name="edit" size={20} color={COLORS.primary} />
            <Text style={[commonStyles.secondaryButtonText, styles.editButtonText]}>
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render signature canvas
  const renderSignatureCanvas = () => {
    if (isSigned() && !isSigning) return null;
    
    return (
      <View style={styles.canvasOuterContainer}>
        {/* Signature Canvas */}
        <View style={[
          styles.signatureCanvasWrapper,
          validationError && commonStyles.canvasError,
          disabled && commonStyles.canvasDisabled,
        ]}>
          <SignatureScreen
            ref={signatureRef}
            onOK={handleSignatureSave}
            onClear={() => {
              // Clear handler - we'll handle this manually
            }}
            onBegin={handleStartSigning}
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
              width: containerWidth,
              height: containerHeight,
              backgroundColor: 'transparent',
            }}
            dataURL={isSigning ? '' : value}
          />
        </View>
        
        {/* Control buttons */}
        <View style={[commonStyles.controlsContainer, styles.controlsContainer]}>
          {/* Clear button */}
          <TouchableOpacity
            style={[
              commonStyles.secondaryButton,
              styles.controlButton,
              disabled && commonStyles.secondaryButtonDisabled,
            ]}
            onPress={handleSignatureClear}
            disabled={disabled || (!isSigning && !isSigned())}
            accessibilityLabel="Clear signature"
            accessibilityHint="Tap to clear signature"
          >
            <Icon 
              name="delete" 
              size={20} 
              color={disabled || (!isSigning && !isSigned()) ? COLORS.text.disabled : COLORS.error} 
            />
            <Text style={[
              commonStyles.secondaryButtonText,
              (disabled || (!isSigning && !isSigned())) && commonStyles.buttonTextDisabled
            ]}>
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
              accessibilityLabel="Cancel signing"
              accessibilityHint="Tap to cancel signature"
            >
              <Icon 
                name="close" 
                size={20} 
                color={disabled ? COLORS.text.disabled : COLORS.text.secondary} 
              />
              <Text style={[
                commonStyles.secondaryButtonText,
                disabled && commonStyles.buttonTextDisabled
              ]}>
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
                    disabled || !isSigning ? 
                    COLORS.text.disabled : COLORS.surface
                  } 
                />
                <Text style={[
                  commonStyles.primaryButtonText,
                  (disabled || !isSigning) && commonStyles.buttonTextDisabled
                ]}>
                  Save
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Instructions */}
        {isSigning && !disabled && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Draw your signature in the box above
            </Text>
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
        accessibilityLabel="Start signature"
        accessibilityHint="Tap to start drawing your signature"
      >
        <Icon 
          name="gesture" 
          size={24} 
          color={disabled ? COLORS.text.disabled : COLORS.primary} 
        />
        <Text style={[
          styles.startButtonText,
          disabled && commonStyles.buttonTextDisabled
        ]}>
          {description || 'Tap to start signing'}
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

  // Accessibility label
  const accessibilityLabel = useMemo(() => {
    let labelText = `${label}. ${isSigned() ? 'Signed' : 'Not signed'}.`;
    if (required) labelText += ' Required.';
    if (disabled) labelText += ' Disabled.';
    if (validationError) labelText += ` Error: ${validationError}`;
    return labelText;
  }, [label, isSigned, required, disabled, validationError]);

  return (
    <View style={[commonStyles.fieldContainer, styles.container]}>
      {/* Label */}
      <View style={commonStyles.labelContainer}>
        <Text style={[
          commonStyles.labelText,
          disabled && styles.labelTextDisabled,
          validationError && styles.labelTextError,
        ]}>
          {label}
          {required && <Text style={commonStyles.requiredStar}> *</Text>}
        </Text>
      </View>
      
      {/* Description (only shown when not signing) */}
      {description && !isSigning && !isSigned() && (
        <View style={styles.descriptionContainer}>
          <Text style={commonStyles.descriptionText}>
            {description}
          </Text>
        </View>
      )}
      
      {/* Signature Area */}
      <View
        style={styles.signatureArea}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="region"
        accessible={true}
      >
        {renderSignatureArea()}
      </View>
      
      {/* Error message */}
      {validationError ? (
        <View style={styles.errorContainer}>
          <Text style={commonStyles.errorText}>
            {validationError}
          </Text>
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
  canvasWidth: PropTypes.number,
  canvasHeight: PropTypes.number,
  strokeColor: PropTypes.string,
  strokeWidth: PropTypes.number,
  backgroundColor: PropTypes.string,
  minPoints: PropTypes.number,
  onSave: PropTypes.func,
};

SignatureField.defaultProps = {
  label: 'Signature',
  value: '',
  required: false,
  disabled: false,
  description: '',
  error: '',
  canvasWidth: 300,
  canvasHeight: 150,
  strokeWidth: 3,
  backgroundColor: COLORS.surface,
  minPoints: 10,
  onSave: null,
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
    minHeight: 120,
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
  },
  
  // Controls
  controlsContainer: {
    marginBottom: 8,
  },
  controlButton: {
    minWidth: 90,
  },
  saveButton: {
    minWidth: 90,
  },
  
  // Instructions
  instructionsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  instructionsText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Preview
  previewContainer: {
    minHeight: 120,
    alignItems: 'center',
  },
  previewImage: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previewTextContainer: {
    marginLeft: 12,
  },
  previewText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '600',
  },
  previewSubtext: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    marginLeft: 4,
  },
  
  // Error container
  errorContainer: {
    marginTop: 8,
  },
});