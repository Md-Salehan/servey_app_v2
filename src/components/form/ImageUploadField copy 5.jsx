import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import uploadService from '../../services/uploadService';
import commonStyles from './FormComponents.styles';

const ImageUploadField = ({
  fcId,
  label,
  required = false,
  multiple = false,
  maxImages = 5,
  imageQuality = 0.8,
  compressImageMaxWidth = 1024,
  compressImageMaxHeight = 1024,
  allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
  maxFileSize = 5,
  onImagesChange,
  initialImages = [],
  isPreview = false,
  errorText = '',
  onError = null,
  formId, // Add formId prop
}) => {
  const [images, setImages] = useState(initialImages || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isPress, setIsPress] = useState(false);
  const [fieldValidationError, setFieldValidationError] = useState({
    message: errorText || '',
    style: styles.validationText,
  });
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (isPress) {
      validateField();
    }
  }, [images, required, maxImages]);

  const validateField = () => {
    if (images.length === 0 && required) {
      handleFieldValidation('This field is required', styles.validationText);
      return false;
    } else if (images.length > maxImages) {
      handleFieldValidation(
        `Maximum ${maxImages} images allowed`,
        styles.limitText,
      );
      return false;
    } else {
      handleFieldValidation('');
      return true;
    }
  };

  const handleFieldValidation = (errorMessage, errorStyle = null) => {
    setFieldValidationError({
      message: errorMessage || '',
      style: errorStyle || styles.validationErrorText,
    });
    onError && onError(errorMessage);
  };

  // Request permissions (same as before)
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const photosGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        );
        return photosGranted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Storage permission error:', err);
        return false;
      }
    } else if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Storage permission error:', err);
        return false;
      }
    }
    return true;
  };

  // Validate image file
  const validateImage = file => {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported. Allowed types: ${allowedTypes
          .map(t => t.split('/')[1])
          .join(', ')}`,
      };
    }

    const fileSizeInMB = file.fileSize / (1024 * 1024);
    if (fileSizeInMB > maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxFileSize}MB limit`,
      };
    }

    return { valid: true };
  };

  // Handle image selection
  const handleImageSelection = async source => {
    if (isPreview) return;
    setIsPress(true);

    // Check permissions
    if (source === 'camera') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }
    } else {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required');
        return;
      }
    }

    try {
      if (images.length >= maxImages && !multiple) {
        Alert.alert('Limit Reached', `Maximum ${maxImages} image(s) allowed`);
        return;
      }

      const options = {
        mediaType: 'photo',
        quality: imageQuality,
        maxWidth: compressImageMaxWidth,
        maxHeight: compressImageMaxHeight,
        includeBase64: false,
        selectionLimit: multiple ? maxImages - images.length : 1,
        saveToPhotos: source === 'camera',
      };

      const result =
        source === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        handleError(result.errorMessage || 'Failed to get image');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        await processSelectedImages(result.assets);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      handleError('Failed to select image');
    }
  };

  // Process selected images
  const processSelectedImages = async selectedAssets => {
    const newImages = [];
    const errors = [];

    for (const asset of selectedAssets) {
      try {
        const validation = validateImage(asset);
        if (!validation.valid) {
          errors.push(validation.error);
          continue;
        }

        const imageObj = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
          timestamp: new Date().toISOString(),
          uploaded: false,
          uploading: false,
          error: null,
          flUpldLogNo: null, // Will store upload log number
          fileId: null, // Will store file ID
          fileUri: null, // Will store hosted URI after upload
        };

        newImages.push(imageObj);
      } catch (error) {
        console.error('Image processing error:', error);
        errors.push(`Failed to process ${asset.fileName || 'image'}`);
      }
    }

    const updatedImages = multiple ? [...images, ...newImages] : [...newImages];
    const finalSetOfImages = updatedImages.slice(0, maxImages);
    setImages(finalSetOfImages);

    if (onImagesChange) {
      onImagesChange(finalSetOfImages);
    }

    if (errors.length > 0) {
      Alert.alert('Validation Errors', errors.join('\n'), [{ text: 'OK' }]);
    }
  };

  // Upload all images to server
  const uploadAllImages = async () => {
    if (images.length === 0 || isPreview || !formId) return;

    setUploading(true);
    
    const imagesToUpload = images.filter(img => !img.uploaded);
    if (imagesToUpload.length === 0) {
      setUploading(false);
      Alert.alert('Info', 'All images are already uploaded');
      return;
    }

    try {
      // Use uploadMultipleFiles from uploadService
      const results = await uploadService.uploadMultipleFiles(
        imagesToUpload,
        formId,
        fcId,
        (current, total, fileData) => {
          // Update progress for the specific file
          if (fileData && fileData.id) {
            setUploadProgress(prev => ({
              ...prev,
              [fileData.id]: Math.round((current / total) * 100),
            }));
          }
        }
      );

      // Update images with upload results
      const updatedImages = images.map(img => {
        const result = results.find(r => r.id === img.id);
        if (result) {
          return {
            ...img,
            uploaded: result.success,
            uploading: false,
            fileUri: result.fileUri || result.uri,
            flUpldLogNo: result.flUpldLogNo,
            fileId: result.fileId,
            fileNm: result.fileNm,
            confirmed: result.confirmed || false,
            error: result.error || null,
          };
        }
        return img;
      });

      setImages(updatedImages);

      // Notify parent component
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }

      // Show summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (failed === 0) {
        Alert.alert('Success', `${successful} image(s) uploaded successfully`);
      } else if (successful > 0) {
        Alert.alert(
          'Partial Success',
          `${successful} uploaded, ${failed} failed. You can retry failed images.`
        );
      } else {
        Alert.alert('Upload Failed', 'All images failed to upload. Please try again.');
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      Alert.alert('Error', 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Upload single image (for retry)
  const uploadSingleImage = async (image) => {
    if (!formId) return;

    try {
      // Mark as uploading
      setImages(prev =>
        prev.map(img =>
          img.id === image.id ? { ...img, uploading: true, error: null } : img
        )
      );

      // Use uploadAndConfirmFile from uploadService
      const result = await uploadService.uploadAndConfirmFile(
        image, 
        formId, 
        fcId
      );

      const updatedImages = images.map(img => {
        if (img.id === image.id) {
          return {
            ...img,
            uploading: false,
            uploaded: result.success,
            fileUri: result.fileUri,
            flUpldLogNo: result.flUpldLogNo,
            fileId: result.fileId,
            fileNm: result.fileNm,
            confirmed: result.confirmed || false,
            error: result.error || null,
          };
        }
        return img;
      });

      setImages(updatedImages);

      if (onImagesChange) {
        onImagesChange(updatedImages);
      }

      if (result.success) {
        Alert.alert('Success', 'Image uploaded successfully');
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Single upload error:', error);
      
      setImages(prev =>
        prev.map(img =>
          img.id === image.id
            ? { ...img, uploading: false, error: 'Upload failed' }
            : img
        )
      );
      
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  // Remove image
  const removeImage = imageId => {
    if (isPreview) return;

    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updatedImages = images.filter(img => img.id !== imageId);
          setImages(updatedImages);

          if (onImagesChange) {
            onImagesChange(updatedImages);
          }
        },
      },
    ]);
  };

  // Retry failed upload
  const retryUpload = image => {
    uploadSingleImage(image);
  };

  // Retry all failed uploads
  const retryAllFailedUploads = async () => {
    const failedImages = images.filter(img => img.error && !img.uploaded);
    
    if (failedImages.length === 0) {
      Alert.alert('Info', 'No failed uploads to retry');
      return;
    }

    setUploading(true);
    
    for (const image of failedImages) {
      await uploadSingleImage(image);
    }
    
    setUploading(false);
  };

  // Handle errors
  const handleError = errorMessage => {
    Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
  };

  // Get value for API payload (returns array of upload log numbers for uploaded images)
  const getValueForApi = () => {
    return images
      .filter(img => img.uploaded && img.flUpldLogNo)
      .map(img => img.flUpldLogNo);
  };

  // Render image item
  const renderImageItem = image => {
    const progress = uploadProgress[image.id] || 0;
    const isUploading = image.uploading;
    const hasError = image.error;
    const isUploaded = image.uploaded;

    return (
      <View key={image.id} style={styles.imageItem}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image.uri }}
            style={styles.image}
            resizeMode="cover"
          />

          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}

          {hasError && (
            <View style={styles.errorOverlay}>
              <Icon name="error-outline" size={24} color={COLORS.error} />
              <Text style={styles.errorText}>Failed</Text>
            </View>
          )}

          {isUploaded && (
            <View style={styles.successOverlay}>
              <Icon name="check-circle" size={24} color={COLORS.success} />
            </View>
          )}

          {!isPreview && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(image.id)}
            >
              <Icon name="close" size={16} color={COLORS.text.inverse} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.imageInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {image.fileName}
          </Text>
          <Text style={styles.fileSize}>
            {(image.fileSize / (1024 * 1024)).toFixed(2)} MB
          </Text>
          
          {isUploaded && image.fileUri && (
            <Text style={styles.uploadedUri} numberOfLines={1}>
              ✓ Uploaded
            </Text>
          )}
          
          {hasError && !isPreview && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => retryUpload(image)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Preview mode render
  if (isPreview) {
    const uploadedImages = images.filter(img => img.uploaded && img.fileUri);
    const hasImages = uploadedImages.length > 0;

    return (
      <View style={[styles.fieldContainer, styles.previewFieldContainer]}>
        <View style={styles.header}>
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>{label}</Text>
            {required && <Text style={styles.requiredStar}>*</Text>}
          </View>

          {hasImages && (
            <View style={styles.countContainer}>
              <Text style={styles.countText}>
                {uploadedImages.length}/{maxImages}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.previewValueContainer, !hasImages && styles.previewEmptyValue]}>
          {hasImages ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.previewImagesScroll}
            >
              {uploadedImages.map(image => (
                <View key={image.id} style={styles.previewImageWrapper}>
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.previewSuccessBadge}>
                    <Icon name="check-circle" size={16} color={COLORS.success} />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.previewEmptyState}>
              <Icon name="photo-library" size={32} color={COLORS.text.disabled} />
              <Text style={styles.previewPlaceholderText}>
                No images uploaded
              </Text>
            </View>
          )}
        </View>

        {required && !hasImages && (
          <Text style={styles.validationText}>This field is required</Text>
        )}
      </View>
    );
  }

  // Regular edit mode render
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{label}</Text>
          {required && <Text style={styles.requiredStar}>*</Text>}
        </View>

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {images.length}/{maxImages}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        {multiple
          ? `Upload up to ${maxImages} images (${maxFileSize}MB max each)`
          : 'Upload a single image'}
      </Text>

      {/* Image Grid */}
      {images.length > 0 && (
        <View style={styles.imagesContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScrollView}
            contentContainerStyle={styles.imagesContent}
          >
            {images.map(renderImageItem)}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleImageSelection('camera')}
          disabled={images.length >= maxImages && !multiple}
        >
          <Icon name="photo-camera" size={20} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleImageSelection('gallery')}
          disabled={images.length >= maxImages && !multiple}
        >
          <Icon name="photo-library" size={20} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Gallery</Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.uploadButton]}
              onPress={uploadAllImages}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.text.inverse} />
              ) : (
                <>
                  <Icon name="cloud-upload" size={20} color={COLORS.text.inverse} />
                  <Text style={[styles.actionButtonText, styles.uploadButtonText]}>
                    Upload All
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {/* Show retry all button if there are failed uploads */}
            {images.some(img => img.error && !img.uploaded) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.retryAllButton]}
                onPress={retryAllFailedUploads}
                disabled={uploading}
              >
                <Icon name="refresh" size={20} color={COLORS.error} />
                <Text style={styles.retryAllButtonText}>Retry Failed</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {fieldValidationError && fieldValidationError.message && isPress && (
        <Text style={fieldValidationError.style}>
          {fieldValidationError.message}
        </Text>
      )}

      {/* Allowed Types */}
      <View style={styles.allowedTypesContainer}>
        <Text style={styles.allowedTypesLabel}>Allowed types:</Text>
        <View style={styles.allowedTypesList}>
          {allowedTypes.map((type, index) => (
            <View key={index} style={styles.typeTag}>
              <Text style={styles.typeText}>{type.split('/')[1]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

ImageUploadField.propTypes = {
  fcId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  maxImages: PropTypes.number,
  imageQuality: PropTypes.number,
  compressImageMaxWidth: PropTypes.number,
  compressImageMaxHeight: PropTypes.number,
  allowedTypes: PropTypes.arrayOf(PropTypes.string),
  maxFileSize: PropTypes.number,
  onImagesChange: PropTypes.func,
  initialImages: PropTypes.array,
  isPreview: PropTypes.bool,
  errorText: PropTypes.string,
  onError: PropTypes.func,
  formId: PropTypes.string,
};

ImageUploadField.defaultProps = {
  required: false,
  multiple: false,
  maxImages: 5,
  imageQuality: 0.8,
  compressImageMaxWidth: 1024,
  compressImageMaxHeight: 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  maxFileSize: 5,
  onImagesChange: null,
  initialImages: [],
  isPreview: false,
  errorText: '',
  onError: null,
  formId: null,
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewFieldContainer: {
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  countContainer: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    fontFamily: 'System',
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imagesScrollView: {
    marginHorizontal: -16,
  },
  imagesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  imageItem: {
    width: 120,
    marginRight: 12,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: COLORS.text.inverse,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'System',
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'System',
    fontWeight: '500',
  },
  successOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInfo: {
    marginTop: 8,
  },
  fileName: {
    fontSize: 12,
    color: COLORS.text.primary,
    fontFamily: 'System',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontFamily: 'System',
    marginTop: 2,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'System',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  uploadButtonText: {
    color: COLORS.text.inverse,
  },
  validationText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 8,
    fontFamily: 'System',
  },
  limitText: {
    fontSize: 12,
    color: COLORS.warning,
    marginTop: 8,
    fontFamily: 'System',
    fontWeight: '500',
  },
  allowedTypesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  allowedTypesLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8,
    fontFamily: 'System',
  },
  allowedTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeTag: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontFamily: 'System',
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  // Preview mode styles
  previewImagesScroll: {
    flexDirection: 'row',
  },
  previewImageWrapper: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewSuccessBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 2,
  },
  previewEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
   retryAllButton: {
    backgroundColor: COLORS.errorLight,
    borderColor: COLORS.error,
  },
  retryAllButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  uploadedUri: {
    fontSize: 11,
    color: COLORS.success,
    fontFamily: 'System',
    marginTop: 2,
    fontWeight: '500',
  },
});

export default ImageUploadField;
