// services/uploadService.js
import { API_BASE_URL } from '../constants/api';
import TokenService from './storage/tokenService';

class UploadService {
  // Constants for better maintainability
  static API_IDS = {
    FORM_SUBMIT: 'SUA01031',
    UPLOAD: 'SUA01032',
    APP_ID: 'AP000001',
    FILE_CAT_CD: 'C0001',
  };

  static TABLE_NAMES = {
    SURVEY_FORM: 'FAT_M_SURVEY_FORM',
    SURVEY_FORM_DTL: 'FAT_M_SURVEY_FORM_DTL',
  };

  // Common headers builder
  async _getHeaders(contentType = 'application/json') {
    const token = await TokenService.getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    return headers;
  }

  // Common response parser
  _parseResponse(result, successMessage = 'Operation successful') {
    if (result?.code === 0 && result?.appMsgList?.errorStatus === false) {
      return {
        success: true,
        message: result?.appMsgList?.list?.[0]?.errDesc || successMessage,
        data: result.content,
      };
    }

    return {
      success: false,
      error:
        result?.appMsgList?.list?.[0]?.errDesc ||
        result?.appMsgList?.errorMsg ||
        'Operation failed',
      rawError: result,
    };
  }

  // Create form data for upload
  _createUploadFormData(image) {
    const formData = new FormData();

    formData.append('vfile', {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.fileName || `image_${Date.now()}.jpg`,
    });

    formData.append('refApiId', UploadService.API_IDS.FORM_SUBMIT);
    formData.append('fileCatCd', UploadService.API_IDS.FILE_CAT_CD);
    formData.append('apiId', UploadService.API_IDS.UPLOAD);
    formData.append('appId', UploadService.API_IDS.APP_ID);

    return formData;
  }

  // Create confirmation payload supporting multiple items
  _createConfirmationPayload(confirmations) {
    // Handle single confirmation object for backward compatibility
    if (!Array.isArray(confirmations)) {
      confirmations = [confirmations];
    }

    return {
      mst: confirmations.map(conf => ({
        colNm: conf.colNm || 'FILE_ID',
        flUpldLogNo: conf.flUpldLogNo,
        keyStr: conf.keyStr || 'formId',
        keyStrVal: conf.keyStrVal || conf.formId,
        tabNm: conf.tabNm || UploadService.TABLE_NAMES.SURVEY_FORM,
      })),
    };
  }

  // Single image upload
  async uploadImage(image, formId, fcId) {
    try {
      const headers = await this._getHeaders('multipart/form-data');
      const formData = this._createUploadFormData(image);

      console.log('Uploading image:', {
        fileName: image.fileName,
        formId,
        fcId,
        ...UploadService.API_IDS,
      });

      const response = await fetch(`${API_BASE_URL}/SUF00134/fileUpload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json();
      console.log('Upload response:', result);

      const parsed = this._parseResponse(result, 'Upload successful');

      if (parsed.success) {
        return {
          ...parsed,
          flUpldLogNo: result.content?.flUpldLogNo,
          fileId: result.content?.fileId,
          filePath: result.content?.filePath,
          fileUri: result.content?.fileUri,
          fileNm: result.content?.fileNm,
        };
      }

      return parsed;
    } catch (error) {
      return this._handleError(error, 'Upload error');
    }
  }

  // Enhanced confirmation supporting multiple uploads
  async confirmUploads(confirmations, formId, fcId) {
    try {
      // Handle single confirmation for backward compatibility
      if (!Array.isArray(confirmations)) {
        confirmations = [
          {
            flUpldLogNo: confirmations,
            formId,
            fcId,
            ...confirmations,
          },
        ];
      }

      // Enhance each confirmation with defaults
      const enhancedConfirmations = confirmations.map(conf => ({
        flUpldLogNo: conf.flUpldLogNo,
        keyStr: conf.keyStr || 'fcId',
        keyStrVal: conf.keyStrVal || conf.fcId || fcId,
        tabNm: conf.tabNm || UploadService.TABLE_NAMES.SURVEY_FORM_DTL,
        colNm: conf.colNm || 'FILE_ID',
        formId: conf.formId || formId,
      }));

      const payload = this._createConfirmationPayload(enhancedConfirmations);

      console.log('Confirming uploads with payload:', payload);

      const headers = await this._getHeaders();
      const response = await fetch(`${API_BASE_URL}/SUF00134/fileUploadConf`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Confirmation response:', result);

      const parsed = this._parseResponse(result, 'Confirmed successfully');

      // Map results back to individual confirmations
      if (parsed.success && enhancedConfirmations.length > 1) {
        return {
          ...parsed,
          results: enhancedConfirmations.map((conf, index) => ({
            flUpldLogNo: conf.flUpldLogNo,
            success: true,
            confirmed: true,
            data: result.content?.[index],
          })),
        };
      }

      return {
        ...parsed,
        confirmed: parsed.success,
      };
    } catch (error) {
      return this._handleError(error, 'Upload confirmation error');
    }
  }

  // Keep single confirmUpload for backward compatibility
  async confirmUpload(flUpldLogNo, formId, fcId, recordIdentifier = {}) {
    const result = await this.confirmUploads({
      flUpldLogNo,
      formId,
      fcId,
      ...recordIdentifier,
    });

    return {
      success: result.success,
      error: result.error,
      confirmed: result.confirmed,
      data: result.data,
    };
  }

  // Upload multiple images with confirmation
  async uploadMultipleImages(images, formId, fcId, onProgress) {
    const results = [];
    const total = images.length;
    const pendingConfirmations = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // Skip already uploaded images
      if (this.isImageFullyProcessed(image)) {
        results.push(this._createResultFromProcessed(image));
        this._reportProgress(onProgress, i + 1, total, image);
        continue;
      }

      // Step 1: Upload the image
      const uploadResult = await this.uploadImage(image, formId, fcId);

      if (uploadResult.success && uploadResult.flUpldLogNo) {
        // Queue for batch confirmation
        pendingConfirmations.push({
          flUpldLogNo: uploadResult.flUpldLogNo,
          formId,
          fcId,
          keyStr: 'fcId',
          keyStrVal: fcId,
          tabNm: UploadService.TABLE_NAMES.SURVEY_FORM_DTL,
          imageId: image.id,
          uploadResult,
        });

        // Store preliminary result
        results.push({
          id: image.id,
          success: true,
          flUpldLogNo: uploadResult.flUpldLogNo,
          fileId: uploadResult.fileId,
          uri: uploadResult.fileUri,
          fileNm: uploadResult.fileNm,
          confirmed: false,
          pendingConfirmation: true,
        });
      } else {
        // Upload failed
        results.push({
          id: image.id,
          success: false,
          error: uploadResult.error,
        });
      }

      this._reportProgress(onProgress, i + 1, total, {
        ...image,
        ...uploadResult,
        confirmed: false,
      });
    }

    // Step 2: Batch confirm all pending uploads
    if (pendingConfirmations.length > 0) {
      const confirmResult = await this.confirmUploads(
        pendingConfirmations,
        formId,
        fcId,
      );

      if (confirmResult.success && confirmResult.results) {
        // Update results with confirmation status
        confirmResult.results.forEach(conf => {
          const result = results.find(r => r.flUpldLogNo === conf.flUpldLogNo);
          if (result) {
            result.confirmed = true;
            result.pendingConfirmation = false;
          }
        });
      } else if (!confirmResult.success) {
        // Mark all as needing retry
        pendingConfirmations.forEach(pc => {
          const result = results.find(r => r.flUpldLogNo === pc.flUpldLogNo);
          if (result) {
            result.confirmed = false;
            result.pendingConfirmation = false;
            result.needsRetry = true;
            result.error = confirmResult.error;
          }
        });
      }
    }

    return results;
  }

  // Retry confirmation for failed confirmations
  async retryFailedConfirmations(images, formId, fcId) {
    const failedConfirmations = images
      .filter(img => img.flUpldLogNo && img.needsRetry)
      .map(img => ({
        flUpldLogNo: img.flUpldLogNo,
        formId,
        fcId,
        imageId: img.id,
      }));

    if (failedConfirmations.length === 0) {
      return { success: true, message: 'No failed confirmations to retry' };
    }

    const confirmResult = await this.confirmUploads(
      failedConfirmations,
      formId,
      fcId,
    );

    if (confirmResult.success && confirmResult.results) {
      return {
        success: true,
        results: failedConfirmations.map((conf, index) => ({
          id: conf.imageId,
          flUpldLogNo: conf.flUpldLogNo,
          confirmed: true,
          ...confirmResult.results[index],
        })),
      };
    }

    return confirmResult;
  }

  // Error handler
  _handleError(error, context) {
    console.error(`${context}:`, error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }

  // Get uploaded file info for API payload
  getUploadedFileInfo(fieldValue) {
    if (!fieldValue) return [];

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
        .filter(img => img.uri || img.fileUri)
        .map(img => img.uri || img.fileUri);
    }

    return [];
  }

  // Progress reporter
  _reportProgress(onProgress, current, total, imageData) {
    if (onProgress) {
      onProgress(current, total, imageData);
    }
  }

  // Result creator for processed images
  _createResultFromProcessed(image) {
    return {
      id: image.id,
      success: true,
      flUpldLogNo: image.flUpldLogNo,
      fileId: image.fileId,
      uri: image.uri || image.fileUri,
      fileNm: image.fileNm || image.fileName,
      confirmed: image.confirmed,
    };
  }

  // Check if image is fully processed
  isImageFullyProcessed(image) {
    return image?.uploaded && image?.confirmed === true && image?.flUpldLogNo;
  }

  // Get uploaded file info for API payload
  getUploadedFileInfo(fieldValue) {
    if (!fieldValue) return [];

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
        .filter(img => img.uri || img.fileUri)
        .map(img => img.uri || img.fileUri);
    }

    return [];
  }
}

export default new UploadService();
