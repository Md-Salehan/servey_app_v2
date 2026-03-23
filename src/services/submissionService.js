// services/submissionService.js
import { Q } from '@nozbe/watermelondb';
import PendingSubmission from '../database/models/PendingSubmission';
import PendingFile from '../database/models/PendingFile';
import SubmissionAttempt from '../database/models/SubmissionAttempt';
import UploadService from './uploadService';
import { API_BASE_URL } from '../constants/api';
import TokenService from './storage/tokenService';

class SubmissionService {
  constructor(database) {
    this.database = database;
    this.isProcessing = false;
    this.processingInterval = null;
  }

  // Initialize the submission queue processor
  startQueueProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Check every 30 seconds for pending submissions that need processing
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, 30000);
    
    // Also process immediately
    this.processQueue();
  }

  stopQueueProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Main queue processing method
  async processQueue() {
    if (this.isProcessing) {
      console.log('Already processing queue, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // Get all pending submissions that are either pending or failed and ready for retry
      const pendingSubmissions = await this.database.collections
        .get('pending_submissions')
        .query(
          Q.where('status', Q.oneOf(['pending', 'failed']))
        )
        .fetch();

      for (const submission of pendingSubmissions) {
        // Check if it's ready for retry
        if (submission.status === 'failed' && !submission.shouldRetryNow()) {
          continue;
        }

        await this.processSubmission(submission);
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process a single submission
  async processSubmission(submission) {
    console.log(`Processing submission: ${submission.submissionId}`);
    
    // Mark as processing
    await submission.markAsProcessing();

    try {
      // Step 1: Upload all pending files
      const uploadResult = await this.processFileUploads(submission);
      if (!uploadResult.success) {
        throw new Error(`File upload failed: ${uploadResult.error}`);
      }

      // Step 2: Submit the form data
      const submitResult = await this.submitFormData(submission);
      if (!submitResult.success) {
        throw new Error(`Form submission failed: ${submitResult.error}`);
      }

      // Step 3: Confirm uploaded files
      const confirmResult = await this.confirmUploads(submission);
      if (!confirmResult.success) {
        throw new Error(`Upload confirmation failed: ${confirmResult.error}`);
      }

      // All steps completed successfully
      await submission.markAsCompleted();
      console.log(`Submission ${submission.submissionId} completed successfully`);

    } catch (error) {
      console.error(`Submission ${submission.submissionId} failed:`, error);
      await this.handleSubmissionError(submission, error);
    }
  }

  // Process file uploads for a submission
  async processFileUploads(submission) {
    // Get all pending files for this submission
    const pendingFiles = await this.database.collections
      .get('pending_files')
      .query(
        Q.where('submission_id', submission.submissionId),
        Q.where('status', Q.oneOf(['pending', 'failed']))
      )
      .fetch();

    if (pendingFiles.length === 0) {
      return { success: true };
    }

    const uploadResults = [];

    for (const file of pendingFiles) {
      // Check if file is ready for retry
      if (file.status === 'failed' && !file.shouldRetryNow()) {
        continue;
      }

      try {
        // Mark as uploading
        await file.markAsUploading();

        // Upload the file
        const result = await UploadService.uploadFile(
          {
            uri: file.localUri,
            fileNm: file.fileName,
            type: file.fileType,
            id: file.fileId,
          },
          submission.formId,
          file.fcId
        );

        if (result.success) {
          // Mark as uploaded
          await file.markAsUploaded(
            result.flUpldLogNo,
            result.fileId,
            result.fileUri
          );
          uploadResults.push({ success: true, fileId: file.fileId });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        // Handle file upload failure
        await this.handleFileUploadError(file, error);
        uploadResults.push({ success: false, fileId: file.fileId, error });
      }
    }

    // Check if all files uploaded successfully
    const allSuccess = uploadResults.every(r => r.success);
    const anySuccess = uploadResults.some(r => r.success);

    if (!allSuccess && !anySuccess) {
      return { success: false, error: 'All file uploads failed' };
    }

    if (!allSuccess) {
      return { success: false, error: 'Some file uploads failed' };
    }

    return { success: true };
  }

  // Submit form data to server
  async submitFormData(submission) {
    const attempt = await SubmissionAttempt.createAttempt(this.database, {
      submissionId: submission.submissionId,
      step: SubmissionAttempt.STEP.SUBMIT,
      retryCount: submission.retryCount,
    });

    try {
      const token = await TokenService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/SUF00134/formSubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submission.payload),
      });

      const result = await response.json();

      if (result?.code === 0 && result?.appMsgList?.errorStatus === false) {
        await attempt.markAsSuccess();
        return { success: true, data: result.content };
      } else {
        const errorMsg = result?.appMsgList?.list?.[0]?.errDesc || 'Form submission failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      await attempt.markAsFailed(error);
      return { success: false, error: error.message };
    }
  }

  // Confirm uploaded files with server
  async confirmUploads(submission) {
    const attempt = await SubmissionAttempt.createAttempt(this.database, {
      submissionId: submission.submissionId,
      step: SubmissionAttempt.STEP.CONFIRM,
      retryCount: submission.retryCount,
    });

    try {
      // Get all uploaded files that need confirmation
      const uploadedFiles = await this.database.collections
        .get('pending_files')
        .query(
          Q.where('submission_id', submission.submissionId),
          Q.where('status', 'uploaded')
        )
        .fetch();

      if (uploadedFiles.length === 0) {
        await attempt.markAsSuccess();
        return { success: true };
      }

      // Prepare confirmation payload
      const confirmations = uploadedFiles.map(file => ({
        flUpldLogNo: file.flUpldLogNo,
        formId: submission.formId,
        fcId: file.fcId,
        fileId: file.fileIdServer,
        keyStr: 'fcId',
        keyStrVal: file.fcId,
        tabNm: 'FAT_M_SURVEY_FORM_DTL',
        colNm: 'FILE_ID',
      }));

      const payload = {
        apiId: 'SUA00487',
        mst: confirmations,
      };

      const token = await TokenService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/SUF00134/fileUploadConf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result?.code === 0 && result?.appMsgList?.errorStatus === false) {
        await attempt.markAsSuccess();
        return { success: true };
      } else {
        const errorMsg = result?.appMsgList?.list?.[0]?.errDesc || 'Upload confirmation failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      await attempt.markAsFailed(error);
      return { success: false, error: error.message };
    }
  }

  // Handle file upload error
  async handleFileUploadError(file, error) {
    await file.markAsFailed(error);
    await file.incrementRetry();
  }

  // Handle submission error
  async handleSubmissionError(submission, error) {
    await submission.markAsFailed(error);
    await submission.incrementRetry();
  }

  // Create a new pending submission
  async createPendingSubmission(formData, fieldValues, formComponents, payload) {
    // Create the pending submission
    const pendingSubmission = await PendingSubmission.createPendingSubmission(
      this.database,
      {
        formId: formData.formId,
        formName: formData.formName,
        appId: formData.appId,
        fieldValues,
        formComponents,
        payload,
      }
    );

    // Extract and create pending files
    const filesToUpload = this.extractFilesFromFieldValues(fieldValues, formComponents);
    
    for (const file of filesToUpload) {
      await PendingFile.createPendingFile(this.database, {
        submissionId: pendingSubmission.submissionId,
        fcId: file.fcId,
        formId: formData.formId,
        localUri: file.uri,
        fileName: file.fileNm,
        fileType: file.type,
        fileSize: file.fileSize,
      });
    }

    // Immediately try to process if online
    await this.processSubmission(pendingSubmission);

    return pendingSubmission;
  }

  // Extract files from field values
  extractFilesFromFieldValues(fieldValues, formComponents) {
    const files = [];

    formComponents.forEach(component => {
      if (component.compTyp === '07') {
        const images = fieldValues[component.fcId] || [];
        
        if (Array.isArray(images)) {
          images.forEach(image => {
            // Only include files that haven't been uploaded yet
            if (!image.uploaded && image.uri) {
              files.push({
                ...image,
                fcId: component.fcId,
              });
            }
          });
        }
      }
    });

    return files;
  }

  // Get pending submissions with their files and attempts
  async getPendingSubmissions() {
    const submissions = await this.database.collections
      .get('pending_submissions')
      .query(Q.sortBy('created_at', 'desc'))
      .fetch();

    const result = [];
    
    for (const submission of submissions) {
      const files = await submission.files.fetch();
      const attempts = await submission.attempts.fetch();
      
      result.push({
        ...submission,
        files: files,
        attempts: attempts,
        totalFiles: files.length,
        uploadedFiles: files.filter(f => f.status === 'uploaded').length,
        failedFiles: files.filter(f => f.status === 'failed').length,
      });
    }
    
    return result;
  }

  // Retry a specific submission
  async retrySubmission(submissionId) {
    const submission = await this.database.collections
      .get('pending_submissions')
      .find(submissionId);
    
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Reset status and retry
    await submission.update(record => {
      record.status = 'pending';
      record.retryCount = 0;
      record.nextRetryAt = null;
      record.errorMessage = null;
    });

    // Reset failed files
    const failedFiles = await this.database.collections
      .get('pending_files')
      .query(
        Q.where('submission_id', submissionId),
        Q.where('status', 'failed')
      )
      .fetch();

    for (const file of failedFiles) {
      await file.update(record => {
        record.status = 'pending';
        record.retryCount = 0;
        record.nextRetryAt = null;
        record.errorMessage = null;
      });
    }

    // Process immediately
    await this.processSubmission(submission);
  }
}

export default SubmissionService;