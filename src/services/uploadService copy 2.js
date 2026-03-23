// services/uploadService.js
import { API_BASE_URL } from '../constants/api';
import TokenService from './storage/tokenService';

class UploadService {
  async uploadImage(image, formId, fcId) {
    try {
      const token = await TokenService.getAccessToken();
      
      // Create form data
      const formData = new FormData();
      
      // Add the file
      formData.append('vfile', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || `image_${Date.now()}.jpg`,
      });
      
      // Add required fields
      formData.append('refApiId', 'SUA01031'); // Survey form submit API ID
      formData.append('fileCatCd', 'C0020'); // File category code
      formData.append('apiId', 'SUA01032'); // Upload API ID
      formData.append('appId', 'AP000001'); // App ID
      
      // Note: mobRegNo is typically added by middleware from stored user credential
      // Only include if your middleware doesn't add it automatically
      
      console.log('Uploading image:', {
        fileName: image.fileName,
        formId,
        fcId,
        refApiId: 'SUA01031',
        fileCatCd: 'C0001'
      });

      const response = await fetch(`${API_BASE_URL}/SUF00134/fileUpload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      
      console.log('Upload response:', result);
      
      // Check for success based on the response structure
      if (result?.code === 0 && result?.appMsgList?.errorStatus === false) {
        return {
          success: true,
          flUpldLogNo: result.content?.flUpldLogNo, // CRITICAL: Used for confirmation
          fileId: result.content?.fileId,
          filePath: result.content?.filePath,
          fileUri: result.content?.fileUri,
          fileNm: result.content?.fileNm,
          data: result.content,
        };
      } else {
        return {
          success: false,
          error: result?.appMsgList?.list?.[0]?.errDesc || 
                 result?.appMsgList?.errorMsg || 
                 'Upload failed',
        };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // File upload confirmation (CRITICAL second step)
  async confirmUpload(flUpldLogNo, formId, fcId, recordIdentifier = {}) {
    try {
      const token = await TokenService.getAccessToken();
      
      // Build confirmation payload according to API spec
      const confirmationPayload = {
        mst: [
          {
            colNm: "FILE_ID", // As per documentation
            flUpldLogNo: flUpldLogNo, // From upload response
            keyStr: recordIdentifier.keyStr || "formId",
            keyStrVal: recordIdentifier.keyStrVal || formId,
            tabNm: recordIdentifier.tabNm || "FAT_M_SURVEY_FORM",
          }
        ]
      };

      console.log('Confirming upload with payload:', confirmationPayload);

      const response = await fetch(`${API_BASE_URL}/SUF00134/fileUploadConf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(confirmationPayload),
      });

      const result = await response.json();
      
      console.log('Confirmation response:', result);
      
      // Check for success based on the response structure
      if (result?.code === 0 && result?.appMsgList?.errorStatus === false) {
        return {
          success: true,
          message: result?.appMsgList?.list?.[0]?.errDesc || 'Confirmed successfully',
          data: result.content,
        };
      } else {
        return {
          success: false,
          error: result?.appMsgList?.list?.[0]?.errDesc || 
                 result?.appMsgList?.errorMsg || 
                 'Confirmation failed',
        };
      }
    } catch (error) {
      console.error('Upload confirmation error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // Upload multiple images with confirmation
  async uploadMultipleImages(images, formId, fcId, onProgress) {
    const results = [];
    const total = images.length;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Skip already uploaded images
      if (image.uploaded && image.serverUri) {
        results.push({
          id: image.id,
          success: true,
          uri: image.serverUri,
        });
        onProgress?.(i + 1, total, image);
        continue;
      }

      // Step 1: Upload the image
      const uploadResult = await this.uploadImage(image, formId, fcId);
      
      if (uploadResult.success) {
        // Step 2: CRITICAL - Confirm the upload with flUpldLogNo
        if (uploadResult.flUpldLogNo) {
          const confirmResult = await this.confirmUpload(
            uploadResult.flUpldLogNo,
            formId,
            fcId,
            {
              keyStr: "fcId",
              keyStrVal: fcId,
              tabNm: "FAT_M_SURVEY_FORM_DTL"
            }
          );
          
          if (confirmResult.success) {
            // Both upload and confirmation succeeded
            results.push({
              id: image.id,
              success: true,
              flUpldLogNo: uploadResult.flUpldLogNo,
              fileId: uploadResult.fileId,
              uri: uploadResult.fileUri ,
              fileNm: uploadResult.fileNm,
              confirmed: true,
            });
          } else {
            // Upload succeeded but confirmation failed
            results.push({
              id: image.id,
              success: false,
              error: `Upload succeeded but confirmation failed: ${confirmResult.error}`,
              needsRetry: true,
              flUpldLogNo: uploadResult.flUpldLogNo, // Keep for retry
            });
          }
        } else {
          // Upload succeeded but no flUpldLogNo (shouldn't happen per API spec)
          results.push({
            id: image.id,
            success: true,
            uri: uploadResult.fileUri,
          });
        }
      } else {
        // Upload failed
        results.push({
          id: image.id,
          success: false,
          error: uploadResult.error,
        });
      }
      
      onProgress?.(i + 1, total, { 
        ...image, 
        ...uploadResult,
        confirmed: results[results.length - 1]?.confirmed 
      });
    }
    
    return results;
  }

  // Retry confirmation for a previously uploaded image
  async retryConfirmation(image, formId, fcId) {
    if (!image.flUpldLogNo) {
      return {
        success: false,
        error: 'No upload log number available for confirmation',
      };
    }

    try {
      const confirmResult = await this.confirmUpload(
        image.flUpldLogNo,
        formId,
        fcId,
        {
          keyStr: "fcId",
          keyStrVal: fcId,
          tabNm: "FAT_M_SURVEY_FORM_DTL"
        }
      );

      return {
        success: confirmResult.success,
        error: confirmResult.error,
        confirmed: confirmResult.success,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper to check if an image is fully processed (uploaded + confirmed)
  isImageFullyProcessed(image) {
    return image.uploaded && image.confirmed === true && image.flUpldLogNo;
  }

  // Get uploaded file info for API payload
  getUploadedFileInfo(fieldValue) {
    if (!fieldValue) return [];
    
    // If fieldValue is an array of image objects
    if (Array.isArray(fieldValue)) {
      return fieldValue
        .filter(img => this.isImageFullyProcessed(img))
        .map(img => ({
          flUpldLogNo: img.flUpldLogNo,
          fileId: img.fileId,
          fileUri: img.uri || img.fileUri,
          fileName: img.fileNm || img.fileName,
        }));
    }
    
    return [];
  }

  // Get file URIs for display
  getFileUris(fieldValue) {
    if (!fieldValue) return [];
    
    if (Array.isArray(fieldValue)) {
      return fieldValue
        .filter(img => img.uri || img.uri || img.fileUri)
        .map(img => img.uri || img.uri || img.fileUri);
    }
    
    return [];
  }
}

export default new UploadService();