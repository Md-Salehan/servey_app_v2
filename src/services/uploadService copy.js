// services/uploadService.js
import { API_BASE_URL } from '../constants/api';
import TokenService from './storage/tokenService';

class UploadService {
  // Constants for better maintainability
  static API_IDS = {
    FORM_SUBMIT: 'SUA01031',
    UPLOAD: 'SUA01032',
    CONFIRM: 'SUA00487',
    APP_ID: 'AP000001',
    FILE_CAT_CD: 'C0020',
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
    const fileNm = file.fileNm;

    // Add file extension if missing
    const finalFileName = this._ensureFileExtension(fileNm, fileType);

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
  _ensureFileExtension(fileNm, mimeType) {
    const extension = fileNm.split('.').pop();
    if (extension) return fileNm;

    const extensionMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
      'text/plain': '.txt',
    };

    const fileExtension = extensionMap[mimeType] || '';
    return fileNm + fileExtension;
  }

  // Generic file upload method (UPLOAD ONLY - NO CONFIRMATION)
  async uploadFile(file, formId, fcId) {
    try {
      const headers = await this._getHeaders('multipart/form-data');
      const formData = this._createUploadFormData(file);

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
          success: true,
          message: parsed.message,
          flUpldLogNo: result.content?.flUpldLogNo,
          fileId: result.content?.fileId,
          filePath: result.content?.filePath,
          fileUri: result.content?.fileUri,
          // fileNm: result.content?.fileNm,
          fileType: file.type,
          fileNm: file.fileNm,
          data: result.content,
        };
      }

      return parsed;
    } catch (error) {
      return this._handleError(error, 'Upload error');
    }
  }

  // Upload multiple files (UPLOAD ONLY - NO CONFIRMATION)
  async uploadMultipleFiles(files, formId, fcId, onProgress) {
    const results = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Upload the file
      const uploadResult = await this.uploadFile(file, formId, fcId);

      results.push({
        id: file.id,
        ...uploadResult,
      });

      this._reportProgress(onProgress, i + 1, total, {
        ...file,
        ...uploadResult,
      });
    }

    return results;
  }

  // Create confirmation payload supporting multiple items
  _createConfirmationPayload(confirmations) {
    let list = [];
    confirmations.map(conf => {
      const { keyStr, keyStrVal, tabNm, colNm, value } = conf;

      let flUpldLogNoArr = JSON.parse(value);
      flUpldLogNoArr.map(fileUri => {
        const file = fileUri.split('/').pop(); // Assuming flUpldLogNo is the last part of the URI
        const flUpldLogNo = file.split('.').shift(); // Remove file extension to get flUpldLogNo
        list.push({
          colNm,
          flUpldLogNo,
          keyStr,
          keyStrVal,
          tabNm,
        });
      });
    });

    return {
      apiId: UploadService.API_IDS.CONFIRM,
      mst: [...list],
    };
  }

  // Confirm uploads (to be called AFTER form submission)
  async confirmUploads(confirmations) {
    try {
      const payload = this._createConfirmationPayload(confirmations);

      console.log('pld Confirming payload:', payload);

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
        success: parsed.success,
        confirmed: parsed.success,
        error: parsed.error,
      };
    } catch (error) {
      return this._handleError(error, 'Upload confirmation error');
    }
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
}

export default new UploadService();
