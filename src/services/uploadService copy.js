// services/uploadService.js
import { API_BASE_URL } from '../constants/api';
import TokenService from './storage/tokenService';

class UploadService {
  async uploadImage(image, formId, fcId) {
    try {
      const token = await TokenService.getAccessToken();
      
      // Create form data
      const formData = new FormData();
      formData.append('vfile', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || `image_${Date.now()}.jpg`,
        size: image.fileSize || 0,
      });
    //   formData.append('formId', formId);
    //   formData.append('fcId', fcId);
    //   formData.append('apiId', 'SUA01032'); 
      formData.append('mobRegNo', 'AP0000016290017920'); 
      formData.append('refApiId', 'SUA01031');
      formData.append('apiId', 'SUA01032');
      formData.append('appId', 'AP000001');
      formData.append('fileCatCd', 'C0001');
      
      console.log(formData, 'Uploading image with formId:', formId, 'and fcId:', fcId);
      

      const response = await fetch(`${API_BASE_URL}/SUF00134/fileUpload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result?.appMsgList?.errorStatus === false) {
        return {
          success: true,
          url: result.content?.imageUrl,
          data: result.content,
        };
      } else {
        return {
          success: false,
          error: result?.appMsgList?.errorMsg || 'Upload failed',
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

  async uploadMultipleImages(images, formId, fcId, onProgress) {
    const results = [];
    const total = images.length;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Skip already uploaded images
      if (image.uploaded && image.serverUrl) {
        results.push({
          id: image.id,
          success: true,
          url: image.serverUrl,
        });
        onProgress?.(i + 1, total, image);
        continue;
      }

      const result = await this.uploadImage(image, formId, fcId);
      
      if (result.success) {
        results.push({
          id: image.id,
          success: true,
          url: result.url,
        });
      } else {
        results.push({
          id: image.id,
          success: false,
          error: result.error,
        });
      }
      
      onProgress?.(i + 1, total, { ...image, ...result });
    }
    
    return results;
  }
}

export default new UploadService();