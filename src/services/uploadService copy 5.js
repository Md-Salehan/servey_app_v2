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
    MOB_REG_NO: 'AP0000016290017920',

  };

  static TABLE_NAMES = {
    SURVEY_FORM: 'FAT_M_SURVEY_FORM',
    SURVEY_FORM_DTL: 'FAT_M_SURVEY_FORM_DTL',
  };

  static DEFAULT_MIME_TYPES = {
    image: 'image/jpeg',
    document: 'application/pdf',
    all: 'application/octet-stream',
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

  // Generic form data creator for any file type
  _createUploadFormData(file) {
    const formData = new FormData();
    
    // Determine file type and name
    const fileType = file.type || this._getMimeType(file);
    const fileName = file.fileName || file.name || `file_${Date.now()}`;
    
    // Add file extension if missing
    const finalFileName = this._ensureFileExtension(fileName, fileType);

    formData.append('vfile', {
      uri: file.uri,
      type: fileType,
      name: finalFileName,
    });

    formData.append('refApiId', UploadService.API_IDS.FORM_SUBMIT);
    formData.append('fileCatCd', UploadService.API_IDS.FILE_CAT_CD);
    formData.append('apiId', UploadService.API_IDS.UPLOAD);
    formData.append('appId', UploadService.API_IDS.APP_ID);
    formData.append('mobRegNo', UploadService.API_IDS.MOB_REG_NO);

    return formData;
  }

  // Helper to determine mime type if not provided
  _getMimeType(file) {
    if (file.uri) {
      const extension = file.uri.split('.').pop()?.toLowerCase();
      const mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        txt: 'text/plain',
      };
      return mimeTypes[extension] || UploadService.DEFAULT_MIME_TYPES.all;
    }
    return UploadService.DEFAULT_MIME_TYPES.all;
  }

  // Ensure file has proper extension
  _ensureFileExtension(fileName, mimeType) {
    const extension = fileName.split('.').pop();
    if (extension) return fileName;

    const extensionMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt',
    };

    const fileExtension = extensionMap[mimeType] || '';
    return fileName + fileExtension;
  }

  // Generic file upload method
  async uploadFile(file, formId, fcId) {
    try {
      const headers = await this._getHeaders('multipart/form-data');
      const formData = this._createUploadFormData(file);

      console.log('Uploading file:', {
        fileName: file.fileName || file.name,
        fileType: file.type,
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
          fileType: file.type,
          fileName: file.fileName || file.name,
        };
      }

      return parsed;
    } catch (error) {
      return this._handleError(error, 'Upload error');
    }
  }

  // Create confirmation payload supporting multiple items
  _createConfirmationPayload(confirmations) {
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

  // Enhanced confirmation supporting multiple uploads
  async confirmUploads(confirmations) {
    try {
      const enhancedConfirmations = confirmations.map(conf => ({
        flUpldLogNo: conf.flUpldLogNo,
        keyStr: conf.keyStr || 'fcId',
        keyStrVal: conf.keyStrVal || conf.fcId,
        tabNm: conf.tabNm || UploadService.TABLE_NAMES.SURVEY_FORM_DTL,
        colNm: conf.colNm || 'FILE_ID',
        formId: conf.formId,
        fcId: conf.fcId,
        fileId: conf.fileId,
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
      return {
        ...parsed,
        results: enhancedConfirmations.map((conf, index) => ({
          ...conf,
          success: parsed.success,
          confirmed: parsed.success,
          error: parsed.error,
          data: result.content?.[index],
        })),
      };
    } catch (error) {
      return this._handleError(error, 'Upload confirmation error');
    }
  }

  // Combined upload and confirm for a single file
  async uploadAndConfirmFile(file, formId, fcId, confirmationConfig = {}) {
    try {
      // Step 1: Upload the file
      const uploadResult = await this.uploadFile(file, formId, fcId);

      if (!uploadResult.success || !uploadResult.flUpldLogNo) {
        return {
          success: false,
          error: uploadResult.error || 'Upload failed',
          step: 'upload',
          file,
        };
      }

      // Step 2: Confirm the upload
      const confirmation = {
        flUpldLogNo: uploadResult.flUpldLogNo,
        formId,
        fcId,
        fileId: uploadResult.fileId,
        keyStr: confirmationConfig.keyStr || 'fcId',
        keyStrVal: confirmationConfig.keyStrVal || fcId,
        tabNm: confirmationConfig.tabNm || UploadService.TABLE_NAMES.SURVEY_FORM_DTL,
        colNm: confirmationConfig.colNm || 'FILE_ID',
      };

      const confirmResult = await this.confirmUploads([confirmation]);

      if (confirmResult.success && confirmResult.results?.[0]?.confirmed) {
        return {
          success: true,
          flUpldLogNo: uploadResult.flUpldLogNo,
          fileId: uploadResult.fileId,
          fileUri: uploadResult.fileUri,
          fileNm: uploadResult.fileNm,
          fileName: uploadResult.fileName,
          fileType: uploadResult.fileType,
          confirmed: true,
          data: uploadResult.data,
          confirmationData: confirmResult.data,
        };
      } else {
        return {
          success: false,
          error: confirmResult.error || 'Confirmation failed',
          step: 'confirmation',
          flUpldLogNo: uploadResult.flUpldLogNo,
          fileId: uploadResult.fileId,
          fileUri: uploadResult.fileUri,
          fileNm: uploadResult.fileNm,
          needsRetry: true,
        };
      }
    } catch (error) {
      return this._handleError(error, 'Upload and confirm error');
    }
  }

  // Upload multiple files with batch confirmation
  async uploadMultipleFiles(files, formId, fcId, onProgress) {
    const results = [];
    const total = files.length;
    const pendingConfirmations = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Skip already processed files
      if (this.isFileFullyProcessed(file)) {
        results.push(this._createResultFromProcessed(file));
        this._reportProgress(onProgress, i + 1, total, file);
        continue;
      }

      // Step 1: Upload the file
      const uploadResult = await this.uploadFile(file, formId, fcId);

      if (uploadResult.success && uploadResult.flUpldLogNo) {
        // Queue for batch confirmation
        pendingConfirmations.push({
          flUpldLogNo: uploadResult.flUpldLogNo,
          formId,
          fcId,
          fileId: uploadResult.fileId,
          keyStr: 'fcId',
          keyStrVal: fcId,
          tabNm: UploadService.TABLE_NAMES.SURVEY_FORM_DTL,
          fileIndex: i,
          fileData: {
            id: file.id,
            fileName: file.fileName || file.name,
            fileType: file.type,
          },
        });

        // Store preliminary result
        results.push({
          id: file.id,
          success: true,
          flUpldLogNo: uploadResult.flUpldLogNo,
          fileId: uploadResult.fileId,
          uri: uploadResult.fileUri,
          fileNm: uploadResult.fileNm,
          fileName: uploadResult.fileName,
          fileType: uploadResult.fileType,
          confirmed: false,
          pendingConfirmation: true,
        });
      } else {
        // Upload failed
        results.push({
          id: file.id,
          success: false,
          error: uploadResult.error,
          fileName: file.fileName || file.name,
        });
      }

      this._reportProgress(onProgress, i + 1, total, {
        ...file,
        ...uploadResult,
        confirmed: false,
      });
    }

    // Step 2: Batch confirm all pending uploads
    if (pendingConfirmations.length > 0) {
      const confirmResult = await this.confirmUploads(pendingConfirmations);

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

  // Combined upload and confirm for multiple files
  async uploadAndConfirmMultipleFiles(files, formId, fcId, onProgress) {
    const results = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Process each file with uploadAndConfirm
      const result = await this.uploadAndConfirmFile(file, formId, fcId);
      
      results.push({
        id: file.id,
        ...result,
      });

      this._reportProgress(onProgress, i + 1, total, {
        ...file,
        ...result,
      });
    }

    return results;
  }

  // Retry confirmation for failed confirmations
  async retryFailedConfirmations(files) {
    const failedConfirmations = files
      .filter(file => file.flUpldLogNo && file.needsRetry)
      .map(file => ({
        flUpldLogNo: file.flUpldLogNo,
        formId: file.formId,
        fcId: file.fcId,
        fileId: file.fileId,
        keyStr: 'fcId',
        keyStrVal: file.fcId,
        tabNm: UploadService.TABLE_NAMES.SURVEY_FORM_DTL,
      }));

    if (failedConfirmations.length === 0) {
      return { success: true, message: 'No failed confirmations to retry' };
    }

    return await this.confirmUploads(failedConfirmations);
  }

  // Error handler
  _handleError(error, context) {
    console.error(`${context}:`, error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }

  // Progress reporter
  _reportProgress(onProgress, current, total, fileData) {
    if (onProgress) {
      onProgress(current, total, fileData);
    }
  }

  // Result creator for processed files
  _createResultFromProcessed(file) {
    return {
      id: file.id,
      success: true,
      flUpldLogNo: file.flUpldLogNo,
      fileId: file.fileId,
      uri: file.uri || file.fileUri,
      fileNm: file.fileNm || file.fileName,
      fileName: file.fileName,
      fileType: file.fileType,
      confirmed: file.confirmed,
    };
  }

  // Check if file is fully processed
  isFileFullyProcessed(file) {
    return file?.uploaded && file?.confirmed === true && file?.flUpldLogNo;
  }

  // Get uploaded file info for API payload
  getUploadedFileInfo(fieldValue) {
    if (!fieldValue) return [];

    if (Array.isArray(fieldValue)) {
      return fieldValue
        .filter(file => this.isFileFullyProcessed(file))
        .map(file => ({
          flUpldLogNo: file.flUpldLogNo,
          fileId: file.fileId,
          fileUri: file.uri || file.fileUri,
          fileName: file.fileNm || file.fileName,
          fileType: file.fileType,
        }));
    }

    return [];
  }

  // Get file URIs for display
  getFileUris(fieldValue) {
    if (!fieldValue) return [];

    if (Array.isArray(fieldValue)) {
      return fieldValue
        .filter(file => file.uri || file.fileUri)
        .map(file => file.uri || file.fileUri);
    }

    return [];
  }

  // Get file metadata for display
  getFileMetadata(fieldValue) {
    if (!fieldValue) return [];

    if (Array.isArray(fieldValue)) {
      return fieldValue.map(file => ({
        uri: file.uri || file.fileUri,
        name: file.fileNm || file.fileName,
        type: file.fileType,
        id: file.fileId,
        confirmed: file.confirmed,
      }));
    }

    return [];
  }
}

export default new UploadService();