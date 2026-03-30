// components/SignatureField.jsx
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
import RNFS from 'react-native-fs';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import commonStyles from './FormComponents.styles';
import { STATUS } from '../../constants/enums';

// React Native Skia and Gesture Handler imports
import {
  Canvas,
  Path,
  Skia,
  PaintStyle,
  StrokeCap,
  StrokeJoin,
  Group,
} from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

// Import upload service for consistent handling
import uploadService from '../../services/uploadService';

const SignatureField = ({
  formId,
  fcId,
  label = 'Signature',
  value = null,
  onChange,
  required = false,
  disabled = false,
  description = '',
  strokeColor = COLORS.primary,
  strokeWidth = 3,
  backgroundColor = COLORS.surface,
  minPoints = 10,
  onSave,
  onSigningStart,
  onSigningEnd,
  isPreview = false,
  errorText = '',
  onError = null,
}) => {
  // State for signature
  const [signature, setSignature] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [paths, setPaths] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isTapped, setIsTapped] = useState(false);
  const [fieldValidationError, setFieldValidationError] = useState(
    errorText || '',
  );

  // Upload status tracking - matches ImageUploadField pattern
  const [uploadStatus, setUploadStatus] = useState({
    status: STATUS.PENDING, // pending, uploading, uploaded, failed
    progress: 0,
    flUpldLogNo: null,
    fileId: null,
    fileUri: null,
    error: null,
  });

  // Refs
  const canvasRef = useRef(null);
  const pathsRef = useRef([]);
  const currentPointsRef = useRef([]);

  // Mobile screen dimensions
  const { width: screenWidth } = Dimensions.get('window');

  const handleFieldValidation = (errorMessage, externalErrorMessage) => {
    setFieldValidationError(errorMessage || '');
    onError && onError(externalErrorMessage || errorMessage || '');
  };

  // Canvas dimensions (optimized for mobile)
  const containerWidth = useMemo(() => {
    return Math.floor(screenWidth - 40);
  }, [screenWidth]);

  const containerHeight = useMemo(() => {
    return Math.floor(Dimensions.get('window').height / 4);
  }, []);

  // Initialize canvas size
  useEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      setCanvasSize({
        width: containerWidth,
        height: containerHeight,
      });
    }
  }, [containerWidth, containerHeight]);

  // Check if signature exists
  const isSigned = useCallback(() => {
    if (!signature) return false;
    return (
      typeof signature === 'object' &&
      signature !== null &&
      !!signature.uri &&
      signature.uri.length > 0
    );
  }, [signature]);

  // Convert signature to file object - matches ImageUploadField pattern
  const signatureToFile = useCallback(() => {
    if (!signature) return null;

    return {
      id:
        signature.id ||
        `${formId}-${fcId}-1-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      uri: signature.uri,
      type: 'image/png',
      fileNm: signature.fileNm || `signature_${fcId}_${Date.now()}.png`,
      fileSize: signature.fileSize || 0,
      fcId: fcId,
      status: signature.status || STATUS.PENDING,
      flUpldLogNo: signature.flUpldLogNo || null,
      fileId: signature.fileId || null,
      fileUri: signature.fileUri || null,
      error: signature.error || null,
    };
  }, [signature, formId, fcId]);

  // Create a smooth path from points
  const createSmoothPath = useCallback(points => {
    if (points.length < 2) return null;

    const path = Skia.Path.Make();
    path.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midPoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
      path.quadTo(p1.x, p1.y, midPoint.x, midPoint.y);
    }

    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      path.lineTo(lastPoint.x, lastPoint.y);
    }

    return path;
  }, []);

  // Create gesture for drawing
  const gesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(!disabled && !isPreview && isSigning)
      .minDistance(1)
      .minPointers(1)
      .maxPointers(1)
      .onBegin(event => {
        currentPointsRef.current = [{ x: event.x, y: event.y }];
        setCurrentPoints(currentPointsRef.current);
      })
      .onUpdate(event => {
        currentPointsRef.current = [
          ...currentPointsRef.current,
          { x: event.x, y: event.y },
        ];
        setCurrentPoints([...currentPointsRef.current]);

        if (currentPointsRef.current.length > 100) {
          const newPath = createSmoothPath(currentPointsRef.current);
          if (newPath) {
            const updatedPaths = [...pathsRef.current, newPath];
            pathsRef.current = updatedPaths;
            setPaths(updatedPaths);
            currentPointsRef.current = [{ x: event.x, y: event.y }];
            setCurrentPoints(currentPointsRef.current);
          }
        }
      })
      .onEnd(() => {
        if (currentPointsRef.current.length > 1) {
          const newPath = createSmoothPath(currentPointsRef.current);
          if (newPath) {
            const updatedPaths = [...pathsRef.current, newPath];
            pathsRef.current = updatedPaths;
            setPaths(updatedPaths);
          }
        }
        currentPointsRef.current = [];
        setCurrentPoints([]);
      });
  }, [disabled, isSigning, createSmoothPath, isPreview]);

  // Clear the signature canvas
  const clearCanvas = useCallback(() => {
    if (isPreview) return;
    setPaths([]);
    pathsRef.current = [];
    setCurrentPoints([]);
    currentPointsRef.current = [];
  }, [isPreview]);

  // Upload signature - uses uploadService for consistency
  const uploadSignature = useCallback(
    async signatureObject => {
      if (!signatureObject || !formId) return null;

      try {
        // Update status to uploading - matches ImageUploadField pattern
        setUploadStatus({
          status: STATUS.UPLOADING,
          progress: 0,
          flUpldLogNo: null,
          fileId: null,
          fileUri: null,
          error: null,
        });

        // // Update signature object with uploading status
        // setSignature(prev => ({
        //   ...prev,
        //   uploading: true,
        //   status: STATUS.UPLOADING,
        //   error: null,
        // }));

        const file = signatureToFile();
        console.log('Uploading signature:', file);

        // Use uploadService.uploadFile (same as images)
        const result = await uploadService.uploadFile(file, formId, fcId);

        if (result.success) {
          const uploadData = {
            status: STATUS.UPLOADED,
            progress: 100,
            flUpldLogNo: result.flUpldLogNo,
            fileId: result.fileId,
            fileUri: result.fileUri,
            error: null,
          };

          setUploadStatus(uploadData);
          return uploadData;

          // // Update signature with upload success - matches ImageUploadField pattern
          // const updatedSignature = {
          //   ...signatureObject,
          //   uploaded: true,
          //   uploading: false,
          //   status: STATUS.UPLOADED,
          //   flUpldLogNo: result.flUpldLogNo,
          //   fileId: result.fileId,
          //   fileUri: result.fileUri,
          //   error: null,
          // };

          // setSignature(updatedSignature);

          // // Notify parent component
          // onChange(updatedSignature);

          // return uploadData;
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Signature upload error:', error);

        const errorData = {
          status: STATUS.FAILED,
          progress: 0,
          flUpldLogNo: null,
          fileId: null,
          fileUri: null,
          error: error.message,
        };

        setUploadStatus(errorData);

        // // Update signature with failure status
        // const failedSignature = {
        //   ...signatureObject,
        //   uploading: false,
        //   uploaded: false,
        //   status: STATUS.FAILED,
        //   error: error.message,
        // };

        // setSignature(failedSignature);
        // onChange(failedSignature);

        return errorData;
      }
    },
    [formId, fcId, signatureToFile, onChange],
  );

  // Manual upload retry - matches ImageUploadField pattern
  const retryUpload = useCallback(async () => {
    if (signature && signature.uri && signature.status !== STATUS.UPLOADED) {
      await uploadSignature(signature);
    }
  }, [signature, uploadSignature]);

  // Capture signature as image object
  const captureSignature = useCallback(async () => {
    if (
      pathsRef.current.length === 0 &&
      currentPointsRef.current.length === 0
    ) {
      return null;
    }

    try {
      // Calculate total points for validation
      const totalPoints = pathsRef.current.reduce(total => {
        return total + 10;
      }, currentPointsRef.current.length);

      if (totalPoints < minPoints) {
        throw new Error(`Minimum ${minPoints} points required`);
      }

      // Create an offscreen surface
      const surface = Skia.Surface.MakeOffscreen(
        Math.floor(canvasSize.width),
        Math.floor(canvasSize.height),
      );

      if (!surface) {
        throw new Error('Failed to create surface');
      }

      const canvas = surface.getCanvas();

      // Clear with background color
      const backgroundPaint = Skia.Paint();
      backgroundPaint.setColor(Skia.Color(backgroundColor));
      canvas.drawRect(
        Skia.XYWHRect(0, 0, canvasSize.width, canvasSize.height),
        backgroundPaint,
      );

      // Draw all saved paths
      const strokePaint = Skia.Paint();
      strokePaint.setColor(Skia.Color(strokeColor));
      strokePaint.setStyle(PaintStyle.Stroke);
      strokePaint.setStrokeWidth(strokeWidth);
      strokePaint.setStrokeCap(StrokeCap.Round);
      strokePaint.setStrokeJoin(StrokeJoin.Round);
      strokePaint.setAntiAlias(true);

      pathsRef.current.forEach(path => {
        canvas.drawPath(path, strokePaint);
      });

      // Draw current stroke if in progress
      if (currentPointsRef.current.length > 1) {
        const currentPath = createSmoothPath(currentPointsRef.current);
        if (currentPath) {
          canvas.drawPath(currentPath, strokePaint);
        }
      }

      // Take snapshot
      const image = surface.makeImageSnapshot();
      if (!image) {
        throw new Error('Failed to create image snapshot');
      }
      const id = `${formId}-${fcId}-1-${Date.now()}`;
      // Get base64 from image
      const base64Data = image.encodeToBase64();
      const fileName = `signature_${id}.png`;
      const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      // Save to file system
      await RNFS.writeFile(localPath, base64Data, 'base64');

      // Get file size
      const stats = await RNFS.stat(localPath);
      const fileSize = stats.size;

      // Generate unique ID for the signature - matches ImageUploadField pattern
      const signatureId = `${id}-${Math.random().toString(36).substr(2, 9)}`;

      // Return the image object with all required fields
      return {
        id: signatureId,
        uri: `file://${localPath}`,
        type: 'image/png',
        fileNm: fileName,
        fileSize: fileSize,
        // width: canvasSize.width,
        // height: canvasSize.height,
        byteData: base64Data, // Base64 data
        // fcId: fcId,
        // formId: formId,
        // status: STATUS.PENDING, // Start as pending - will be uploaded
        // uploaded: false,
        // uploading: false,
        // flUpldLogNo: null,
        // fileId: null,
        // fileUri: null,
        // error: null,
        // timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error capturing signature:', error);
      return null;
    }
  }, [
    canvasSize,
    backgroundColor,
    strokeColor,
    strokeWidth,
    minPoints,
    createSmoothPath,
    fcId,
    formId,
  ]);

  // Handle signature save and upload
  const handleSignatureSave = useCallback(async () => {
    if (isPreview) return;

    setIsSaving(true);

    try {
      const signatureObject = await captureSignature();

      if (!signatureObject) {
        handleFieldValidation(
          'Please provide a signature',
          `${label} is required.`,
        );
        return;
      }

      // Try to upload immediately if online
      // The upload may succeed or fail - if it fails, it will be added to pending queue
      // This matches ImageUploadField behavior where images are uploaded immediately
      const uploadResult = await uploadSignature(signatureObject);

      const finalSignatureObject = {
        ...signatureObject,
        ...uploadResult,
      };

      setSignature(finalSignatureObject);

      // Notify parent component of the signature data
      onChange(finalSignatureObject);

      if (onSave) {
        onSave(finalSignatureObject);
      }

      handleFieldValidation('');
      setIsSigning(false);

      if (onSigningEnd) {
        onSigningEnd();
      }
    } catch (err) {
      console.error('Error saving signature:', err);
      handleFieldValidation(
        err.message || 'Failed to capture signature. Please try again.',
        `At ${label}: ${
          err.message || 'Failed to capture signature. Please try again.'
        }`,
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    captureSignature,
    onChange,
    onSave,
    onSigningEnd,
    isPreview,
    label,
    uploadSignature,
  ]);

  // Handle signature clear
  const handleSignatureClear = useCallback(() => {
    if (disabled || isPreview) return;

    if (isSigning) {
      clearCanvas();
    } else {
      Alert.alert(
        'Clear Signature',
        'Are you sure you want to clear the signature?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              setSignature(null);
              onChange(null);
              handleFieldValidation('');
              clearCanvas();
              setUploadStatus({
                status: STATUS.PENDING,
                progress: 0,
                flUpldLogNo: null,
                fileId: null,
                fileUri: null,
                error: null,
              });
            },
          },
        ],
      );
    }
  }, [disabled, onChange, isSigning, clearCanvas, isPreview]);

  // Handle start signing
  const handleStartSigning = useCallback(() => {
    if (disabled || isPreview) return;

    setIsTapped(true);
    setIsSigning(true);
    handleFieldValidation('');
    clearCanvas();

    if (onSigningStart) {
      onSigningStart();
    }
  }, [disabled, onSigningStart, clearCanvas, isPreview]);

  // Handle edit existing signature
  const handleEdit = useCallback(() => {
    if (disabled || isPreview) return;

    Alert.alert(
      'Edit Signature',
      'This will clear your current signature. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            setSignature(null);
            onChange(null);
            clearCanvas();
            setIsSigning(true);
            setIsTapped(true);
            setUploadStatus({
              status: STATUS.PENDING,
              progress: 0,
              flUpldLogNo: null,
              fileId: null,
              fileUri: null,
              error: null,
            });
            onSigningStart && onSigningStart();
          },
        },
      ],
    );
  }, [disabled, onChange, onSigningStart, clearCanvas, isPreview]);

  // Handle cancel signing
  const handleCancelSigning = useCallback(() => {
    if (isPreview) return;

    setIsSigning(false);
    clearCanvas();

    if (onSigningEnd) {
      onSigningEnd();
    }
  }, [onSigningEnd, clearCanvas, isPreview]);

  // Validate on mount and when value changes
  useEffect(() => {
    if (isTapped) {
      if (required && !isSigned() && !fieldValidationError && !isPreview) {
        handleFieldValidation('Signature is required');
      } else if (isSigned() && fieldValidationError) {
        handleFieldValidation('');
      }
    }
  }, [required, isSigned, fieldValidationError, isPreview, isTapped]);

  // Update signature when value changes externally
  useEffect(() => {
    if (value && value !== signature) {
      setSignature(value);
      // Update upload status based on signature status
      if (value.status === STATUS.UPLOADED) {
        setUploadStatus({
          status: STATUS.UPLOADED,
          progress: 100,
          flUpldLogNo: value.flUpldLogNo,
          fileId: value.fileId,
          fileUri: value.fileUri,
          error: null,
        });
      } else if (value.status === STATUS.FAILED) {
        setUploadStatus({
          status: STATUS.FAILED,
          progress: 0,
          flUpldLogNo: null,
          fileId: null,
          fileUri: null,
          error: value.error,
        });
      }
    }
  }, [value, signature]);

  // Create path from current points for rendering
  const currentPath = useMemo(() => {
    if (currentPoints.length < 2) return null;
    return createSmoothPath(currentPoints);
  }, [currentPoints, createSmoothPath]);

  // Helper to get display URI for signature
  const getSignatureUri = useCallback(() => {
    if (!signature) return null;
    if (typeof signature === 'object' && signature !== null && signature.uri) {
      return signature.uri;
    }
    return null;
  }, [signature]);

  // Preview mode render
  if (isPreview) {
    const hasSignature = isSigned();
    const signatureUri = getSignatureUri();

    return (
      <View style={[commonStyles.fieldContainer, styles.container]}>
        <View style={commonStyles.labelContainer}>
          <Text
            style={[
              commonStyles.labelText,
              hasSignature && styles.labelTextSigned,
            ]}
          >
            {label}
          </Text>
          {required && <Text style={commonStyles.requiredStar}> *</Text>}
        </View>

        <View
          style={[
            commonStyles.previewValueContainer,
            !hasSignature && commonStyles.previewEmptyValue,
          ]}
        >
          {hasSignature && signatureUri ? (
            <View style={styles.previewSignatureContainer}>
              <View style={styles.previewSignatureBox}>
                <View style={styles.previewSignatureBackground}>
                  <Image
                    source={{ uri: signatureUri }}
                    style={styles.previewSignatureImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.previewSignatureBadge}>
                  <Icon name="check" size={12} color={COLORS.surface} />
                </View>
              </View>
              <View style={styles.previewSignatureInfo}>
                <Text style={styles.previewSignatureTitle}>
                  Signature Captured
                </Text>
                <Text style={styles.previewSignatureSize}>
                  {(signature.fileSize || 0 / 1024).toFixed(2)} KB
                </Text>
                {signature.status === STATUS.UPLOADED && (
                  <Text style={styles.uploadedText}>✓ Uploaded</Text>
                )}
                {signature.status === STATUS.FAILED && (
                  <TouchableOpacity
                    onPress={retryUpload}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryButtonText}>Retry Upload</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.previewEmptySignature}>
              <Icon name="draw" size={32} color={COLORS.text.disabled} />
              <Text
                style={[
                  commonStyles.previewValueText,
                  commonStyles.previewPlaceholderText,
                ]}
              >
                No signature provided
              </Text>
            </View>
          )}
        </View>

        {required && !hasSignature && (
          <View style={styles.errorContainer}>
            <Text style={commonStyles.errorText}>This field is required</Text>
          </View>
        )}
      </View>
    );
  }

  // Regular edit mode render
  return (
    <View style={[commonStyles.fieldContainer, styles.container]}>
      <View style={commonStyles.labelContainer}>
        <Text
          style={[commonStyles.labelText, disabled && styles.labelTextDisabled]}
        >
          {label}
          {required && <Text style={commonStyles.requiredStar}> *</Text>}
        </Text>
      </View>

      {description && !isSigning && !isSigned() && (
        <View style={styles.descriptionContainer}>
          <Text style={commonStyles.descriptionText}>{description}</Text>
        </View>
      )}

      {/* Upload Status Indicator - Matches ImageUploadField */}
      {isSigned() && uploadStatus.status === STATUS.UPLOADING && (
        <View style={styles.uploadingStatus}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.uploadingText}>Uploading signature...</Text>
        </View>
      )}

      {isSigned() && uploadStatus.status === STATUS.FAILED && (
        <View style={styles.failedStatus}>
          <Icon name="error-outline" size={16} color={COLORS.error} />
          <Text style={styles.failedText}>
            Upload failed: {uploadStatus.error}
          </Text>
          <TouchableOpacity
            onPress={retryUpload}
            style={styles.retrySmallButton}
          >
            <Text style={styles.retrySmallText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View
        style={styles.signatureArea}
        accessibilityLabel={`${label}. ${
          isSigned() ? 'Signed' : 'Not signed'
        }. ${required ? 'Required.' : ''} ${disabled ? 'Disabled.' : ''}`}
        accessible={true}
        importantForAccessibility="yes"
      >
        {isSigned() && !isSigning ? (
          <View
            style={[commonStyles.previewContainer, styles.previewContainer]}
          >
            <View style={styles.previewContent}>
              <View style={styles.signaturePreviewBox}>
                <View style={styles.signatureBackground}>
                  <Image
                    source={{ uri: getSignatureUri() }}
                    style={styles.signaturePreviewImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.previewBadge}>
                  <Icon name="check" size={12} color={COLORS.surface} />
                </View>
              </View>

              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>Signature Captured</Text>
                <Text style={styles.previewSize}>
                  {(signature.fileSize || 0 / 1024).toFixed(2)} KB
                </Text>
                {uploadStatus.status === STATUS.UPLOADED && (
                  <Text style={styles.uploadedText}>✓ Uploaded</Text>
                )}
                {uploadStatus.status === STATUS.FAILED && (
                  <TouchableOpacity
                    onPress={retryUpload}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryButtonText}>Retry Upload</Text>
                  </TouchableOpacity>
                )}
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
                        <Icon name="edit" size={11} color={COLORS.primary} />{' '}
                        Tap to edit
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : isSigning ? (
          <GestureHandlerRootView style={styles.gestureRoot}>
            <View style={[styles.canvasOuterContainer]}>
              <View
                style={[
                  styles.signatureCanvasWrapper,
                  fieldValidationError && commonStyles.canvasError,
                  disabled && commonStyles.canvasDisabled,
                  {
                    width: canvasSize.width,
                    height: canvasSize.height,
                  },
                  styles.canvasBorder,
                ]}
                onLayout={event => {
                  const { width, height } = event.nativeEvent.layout;
                  if (width > 0 && height > 0) {
                    setCanvasSize({ width, height });
                  }
                }}
              >
                <GestureDetector gesture={gesture}>
                  <View style={[styles.canvasContainer]}>
                    <Canvas
                      style={[styles.canvas, styles.canvasBorder]}
                      ref={canvasRef}
                    >
                      <Path
                        path={Skia.Path.Make().addRect(
                          Skia.XYWHRect(
                            0,
                            0,
                            canvasSize.width,
                            canvasSize.height,
                          ),
                        )}
                        color={backgroundColor}
                      />

                      <Group>
                        {paths.map((path, index) => (
                          <Path
                            key={`path-${index}`}
                            path={path}
                            color={strokeColor}
                            style="stroke"
                            strokeWidth={strokeWidth}
                            strokeCap="round"
                            strokeJoin="round"
                            antiAlias={true}
                          />
                        ))}
                      </Group>

                      {currentPath && (
                        <Path
                          path={currentPath}
                          color={strokeColor}
                          style="stroke"
                          strokeWidth={strokeWidth}
                          strokeCap="round"
                          strokeJoin="round"
                          antiAlias={true}
                        />
                      )}
                    </Canvas>
                  </View>
                </GestureDetector>
              </View>

              <View
                style={[
                  commonStyles.controlsContainer,
                  styles.controlsContainer,
                ]}
              >
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
                      color={
                        disabled ? COLORS.text.disabled : COLORS.text.secondary
                      }
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

                <TouchableOpacity
                  style={[
                    commonStyles.primaryButton,
                    styles.saveButton,
                    (disabled || !isSigning) &&
                      commonStyles.primaryButtonDisabled,
                  ]}
                  onPress={handleSignatureSave}
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
                          (disabled || !isSigning) &&
                            commonStyles.buttonTextDisabled,
                        ]}
                      >
                        Capture
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {isSigning && !disabled && (
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsText}>
                    {Platform.OS === 'ios'
                      ? 'Draw your signature with your finger'
                      : 'Draw your signature in the box above'}
                  </Text>
                  {Platform.OS === 'android' && (
                    <Text style={styles.instructionsHint}>
                      Use finger or stylus
                    </Text>
                  )}
                </View>
              )}
            </View>
          </GestureHandlerRootView>
        ) : (
          <TouchableOpacity
            style={[
              commonStyles.secondaryButton,
              styles.startButton,
              styles.canvasBorder,
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
                { marginTop: 0 },
              ]}
            >
              {disabled ? 'Signature is disabled' : 'Tap to start signing'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {fieldValidationError ? (
        <View style={styles.errorContainer}>
          <Text style={commonStyles.errorText}>{fieldValidationError}</Text>
        </View>
      ) : null}
    </View>
  );
};

SignatureField.propTypes = {
  formId: PropTypes.string.isRequired,
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.shape({
    id: PropTypes.string,
    uri: PropTypes.string,
    fileNm: PropTypes.string,
    fileSize: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    status: PropTypes.string,
    flUpldLogNo: PropTypes.string,
    fileId: PropTypes.string,
    fileUri: PropTypes.string,
    error: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  description: PropTypes.string,
  strokeColor: PropTypes.string,
  strokeWidth: PropTypes.number,
  backgroundColor: PropTypes.string,
  minPoints: PropTypes.number,
  onSave: PropTypes.func,
  onSigningStart: PropTypes.func,
  onSigningEnd: PropTypes.func,
  isPreview: PropTypes.bool,
  errorText: PropTypes.string,
  onError: PropTypes.func,
};

SignatureField.defaultProps = {
  label: 'Signature',
  value: null,
  required: false,
  disabled: false,
  description: '',
  strokeWidth: 3,
  backgroundColor: COLORS.surface,
  minPoints: 10,
  onSave: null,
  onSigningStart: null,
  onSigningEnd: null,
  isPreview: false,
  errorText: '',
  onError: null,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelTextDisabled: {
    color: COLORS.text.disabled,
  },
  labelTextError: {
    color: COLORS.error,
  },
  labelTextSigned: {
    color: COLORS.success,
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  signatureArea: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gestureRoot: {
    flex: 1,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  canvasOuterContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  canvasBorder: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  signatureCanvasWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  canvasContainer: {
    width: '100%',
    height: '100%',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
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
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
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
  previewSignatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewSignatureBox: {
    position: 'relative',
    marginRight: 16,
  },
  previewSignatureBackground: {
    width: 120,
    height: 80,
    backgroundColor: COLORS.gray[50],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSignatureImage: {
    width: '90%',
    height: '90%',
  },
  previewSignatureBadge: {
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
  previewSignatureInfo: {
    flex: 1,
  },
  previewSignatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  previewSignatureSize: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  previewEmptySignature: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  errorContainer: {
    marginTop: 8,
  },
  uploadingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.infoLight,
    borderRadius: 6,
    marginBottom: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: COLORS.info,
    flex: 1,
  },
  failedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.errorLight,
    borderRadius: 6,
    marginBottom: 12,
    gap: 8,
  },
  failedText: {
    fontSize: 12,
    color: COLORS.error,
    flex: 1,
  },
  retrySmallButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.error,
    borderRadius: 4,
  },
  retrySmallText: {
    fontSize: 11,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: COLORS.errorLight,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 11,
    color: COLORS.error,
    fontFamily: 'System',
    fontWeight: '500',
  },
  uploadedText: {
    fontSize: 11,
    color: COLORS.success,
    marginTop: 2,
    fontWeight: '500',
  },
});

export default React.memo(SignatureField);
