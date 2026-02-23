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
  Dimensions,
  StyleSheet,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import commonStyles from './FormComponents.styles';
const { width: screenWidth } = Dimensions.get('window');

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
  isPreview = false, // New prop for preview mode
  errorText = '', // New prop for external error messages
  onError = null, // New prop for error callback
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
    if (images.length === 0 && required) {
      handleFieldValidation('This field is required', styles.validationText);
    } 
    else if (images.length > maxImages) {
      handleFieldValidation(`Maximum ${maxImages} images allowed`, styles.limitText);
    } else {
      handleFieldValidation('');
    }
  }, [images, required, maxImages]);
  console.log(onError, "onError");
  
  const handleFieldValidation = (errorMessage, errorStyle = null) => {
    setFieldValidationError({
      message: errorMessage || '',
      style: errorStyle || styles.validationErrorText,
    });
    onError && onError(errorMessage);
    return !errorMessage; // Return true if no error, false if there is an error
  };

  // Check and request permissions
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
        includeBase64: true,
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
          base64: asset.base64,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
          timestamp: new Date().toISOString(),
          uploaded: false,
          uploading: false,
          error: null,
        };

        newImages.push(imageObj);
      } catch (error) {
        console.error('Image processing error:', error);
        errors.push(`Failed to process ${asset.fileName || 'image'}`);
      }
    }

    const updatedImages = multiple ? [...images, ...newImages] : [...newImages];
    const finalSetOfImages = updatedImages.slice(0, maxImages); // Ensure we don't exceed maxImages limit
    setImages(finalSetOfImages);

    if (onImagesChange) {
      onImagesChange(finalSetOfImages);
    }

    if (errors.length > 0) {
      Alert.alert('Validation Errors', errors.join('\n'), [{ text: 'OK' }]);
    }
  };

  // Upload image to server (mock implementation)
  const uploadImage = async image => {
    setUploadProgress(prev => ({ ...prev, [image.id]: 0 }));

    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[image.id] || 0;
          const newProgress = Math.min(currentProgress + 10, 100);

          if (newProgress >= 100) {
            clearInterval(interval);
            resolve({
              ...image,
              uploaded: true,
              serverUrl: `https://example.com/uploads/${image.fileName}`,
              uploadedAt: new Date().toISOString(),
            });
          }

          return { ...prev, [image.id]: newProgress };
        });
      }, 200);
    });
  };

  // Upload all images
  // const uploadAllImages = async () => {
  //   if (images.length === 0 || isPreview) return;

  //   setUploading(true);
  //   const failedImages = [];

  //   for (const image of images) {
  //     if (image.uploaded) {
  //       continue;
  //     }

  //     try {
  //       setImages(prev => prev.map(img =>
  //         img.id === image.id ? { ...img, uploading: true, error: null } : img
  //       ));

  //       const uploadedImage = await uploadImage(image);

  //       setImages(prev => prev.map(img =>
  //         img.id === image.id ? { ...uploadedImage, uploading: false } : img
  //       ));

  //       if (onImagesChange) {

  //       }

  //     } catch (error) {
  //       console.error('Upload error:', error);
  //       failedImages.push(image.fileName);

  //       setImages(prev => prev.map(img =>
  //         img.id === image.id ? { ...img, uploading: false, error: 'Upload failed' } : img
  //       ));

  //       if (onImagesChange) {

  //       }
  //     }
  //   }

  //   setUploading(false);

  //   if (failedImages.length > 0) {
  //     Alert.alert(
  //       'Upload Issues',
  //       `Failed to upload: ${failedImages.join(', ')}`,
  //       [{ text: 'OK' }]
  //     );
  //   }

  //   if (failedImages.length === 0) {
  //     Alert.alert('Success', 'All images uploaded successfully!');
  //   }
  // };

  const uploadAllImages = async () => {
    if (images.length === 0 || isPreview) return;

    setUploading(true);
    const failedImages = [];
    let updatedImages = [...images]; // Local copy to track changes

    for (const image of images) {
      if (image.uploaded) {
        continue;
      }

      try {
        // Mark as uploading
        setImages(prev =>
          prev.map(img =>
            img.id === image.id
              ? { ...img, uploading: true, error: null }
              : img,
          ),
        );

        const uploadedImage = await uploadImage(image);

        // Update local copy and state on success
        updatedImages = updatedImages.map(img =>
          img.id === image.id ? { ...uploadedImage, uploading: false } : img,
        );
        setImages(updatedImages);
      } catch (error) {
        console.error('Upload error:', error);
        failedImages.push(image.fileName);

        // Update local copy and state on error
        updatedImages = updatedImages.map(img =>
          img.id === image.id
            ? { ...img, uploading: false, error: 'Upload failed' }
            : img,
        );
        setImages(updatedImages);
      }
    }

    setUploading(false);

    // Notify parent with the final updated images
    if (onImagesChange) {
      onImagesChange(updatedImages);
    }

    if (failedImages.length > 0) {
      Alert.alert(
        'Upload Issues',
        `Failed to upload: ${failedImages.join(', ')}`,
        [{ text: 'OK' }],
      );
    }

    if (failedImages.length === 0) {
      Alert.alert('Success', 'All images uploaded successfully!');
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
    if (isPreview) return;
    setImages(prev =>
      prev.map(img => (img.id === image.id ? { ...img, error: null } : img)),
    );
  };

  // Handle errors
  const handleError = errorMessage => {
    Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
  };

  // Render image item
  const renderImageItem = image => {
    const progress = uploadProgress[image.id] || 0;
    const isUploading = image.uploading;
    const hasError = image.error;

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
              <Text style={styles.errorText}>Upload Failed</Text>
            </View>
          )}

          {image.uploaded && (
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
    const hasImages = images && images.length > 0;

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
                {images.length}/{maxImages}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            commonStyles.previewValueContainer,
            !hasImages && commonStyles.previewEmptyValue,
          ]}
        >
          {hasImages ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.previewImagesScroll}
            >
              {images.map(image => (
                <View key={image.id} style={styles.previewImageWrapper}>
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  {image.uploaded && (
                    <View style={styles.previewSuccessBadge}>
                      <Icon
                        name="check-circle"
                        size={16}
                        color={COLORS.success}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.previewEmptyState}>
              <Icon
                name="photo-library"
                size={32}
                color={COLORS.text.disabled}
              />
              <Text
                style={[
                  commonStyles.previewValueText,
                  commonStyles.previewPlaceholderText,
                ]}
              >
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
          <TouchableOpacity
            style={[styles.actionButton, styles.uploadButton]}
            onPress={uploadAllImages}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.text.inverse} />
            ) : (
              <>
                <Icon
                  name="cloud-upload"
                  size={20}
                  color={COLORS.text.inverse}
                />
                <Text
                  style={[styles.actionButtonText, styles.uploadButtonText]}
                >
                  Upload
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {fieldValidationError && fieldValidationError.message && isPress && (
        <Text style={fieldValidationError.style}>{fieldValidationError.message}</Text>
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
  initialImages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      uri: PropTypes.string.isRequired,
      base64: PropTypes.string,
      type: PropTypes.string,
      fileName: PropTypes.string,
      fileSize: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
      timestamp: PropTypes.string,
      uploaded: PropTypes.bool,
      uploading: PropTypes.bool,
      error: PropTypes.string,
    }),
  ),
  isPreview: PropTypes.bool,
  errorText: PropTypes.string,
  onError: PropTypes.func,
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
});

export default ImageUploadField;
