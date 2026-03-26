// services/submissionService.js
import { Q } from '@nozbe/watermelondb';
import PendingSubmission from '../database/models/PendingSubmission';
import PendingFile from '../database/models/PendingFile';
import SubmissionAttempt from '../database/models/SubmissionAttempt';
import UploadService from './uploadService';
import { API_BASE_URL } from '../constants/api';
import TokenService from './storage/tokenService';
import NetInfo from '@react-native-community/netinfo';
import { store } from '../app/store';
import { STATUS } from '../constants/enums';
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
    }, 3000);

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
    if (!(await this.isOnline())) {
      console.log('Device is offline, skipping queue processing');
      return;
    }

    if (this.isProcessing) {
      console.log('Already processing queue, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // Get all pending submissions that are either pending or failed and ready for retry
      const pendingSubmissions = await this.database.collections
        .get('pending_submissions')
        .query(Q.where('status', Q.oneOf(['pending', 'failed'])))
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

      // Step 2: Submit the form data with uploaded file references
      const submitResult = await this.submitFormData(submission);
      if (!submitResult.success) {
        throw new Error(`Form submission failed: ${submitResult.error}`);
      }

      // Step 3: Confirm uploaded files using server response
      const confirmResult = await this.confirmUploads(
        submission,
        submitResult.confirmationData,
      );
      if (!confirmResult.success) {
        throw new Error(`Upload confirmation failed: ${confirmResult.error}`);
      }

      // All steps completed successfully
      await submission.markAsCompleted();
      console.log(
        `Submission ${submission.submissionId} completed successfully`,
      );
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
        Q.where('status', Q.oneOf(['pending', 'failed'])),
      )
      .fetch();

    if (pendingFiles.length === 0) {
      return { success: true };
    }

    console.log(pendingFiles, "vvr pendingfile");
    

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
          file.fcId,
        );

        if (result.success) {
          // Mark as uploaded with server response
          await file.markAsUploaded(
            result.flUpldLogNo,
            result.fileId,
            result.fileUri,
          );
          uploadResults.push({
            success: true,
            fileId: file.fileId,
            flUpldLogNo: result.flUpldLogNo,
            fcId: file.fcId,
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        // dont call handleFileUploadError if its network error, just set nextRetryAt and wait for next retry
        if (error.message !== 'Network error') {
          await this.handleFileUploadError(file, error);
          uploadResults.push({ success: false, fileId: file.fileId, error });
        }
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

    return {
      success: true,
      uploadedFiles: uploadResults,
    };
  }

  // Submit form data to server with file references
  async submitFormData(submission) {
    const attempt = await SubmissionAttempt.createAttempt(this.database, {
      submissionId: submission.submissionId,
      step: SubmissionAttempt.STEP.SUBMIT,
      retryCount: submission.retryCount,
    });

    try {
      // Get all uploaded files for this submission
      const uploadedFiles = await this.database.collections
        .get('pending_files')
        .query(
          Q.where('submission_id', submission.submissionId),
          Q.where('status', 'uploaded'),
        )
        .fetch();

      // const fieldValues = submission.fieldValues || {};
      // const formComponents = submission.formComponents || [];

      await submission.updateFieldValuesByUploadedFiles(uploadedFiles);

      // Prepare the submission payload similar to handleFormSubmit in PreviewEntry
      const payload = this.prepareSubmissionPayload(submission, uploadedFiles);

      console.log('Submitting form data:', payload);

      const token = await TokenService.getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/SUF00191/surveyFormSubmit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();
      console.log('Form submission response:', result);

      if (result?.appMsgList?.errorStatus === false) {
        await attempt.markAsSuccess();

        // Extract confirmation data from response (similar to handleFormSubmit)
        const confirmationData = result?.content?.mst || {};

        return {
          success: true,
          data: result.content,
          confirmationData: confirmationData,
        };
      } else {
        const errorMsg =
          result?.appMsgList?.list?.[0]?.errDesc ||
          result?.appMsgList?.errorMsg ||
          'Form submission failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      if (error.message !== 'Network error') {
        await attempt.markAsFailed(error);
        return { success: false, error: error.message };
      }
    }
  }



  // Prepare submission payload with file references
  prepareSubmissionPayload(submission, uploadedFiles) {
    const now = new Date();

    // Process form components to include flUpldLogNo for images
    const dtl02 =
      submission.formComponents
        ?.map(component => {
          let value = submission.fieldValues[component.fcId];

          // Handle image upload field (compTyp '07')
          if (component.compTyp === '07' && value) {
            if (Array.isArray(value)) {
              // Extract flUpldLogNo from uploaded files for this component
              const componentFiles = uploadedFiles.filter(
                file => file.fcId === component.fcId,
              );

              // Get flUpldLogNo values from uploaded files
              const flUpldLogNos = componentFiles
                .map(file => file.flUpldLogNo)
                .filter(logNo => logNo);

              // Also include any existing flUpldLogNo from field values that might already be uploaded
              const existingFlUpldLogNos = value
                .filter(img => img.uploaded && img.flUpldLogNo)
                .map(img => img.flUpldLogNo);

              // Combine and deduplicate
              const allFlUpldLogNos = [
                ...new Set([...flUpldLogNos, ...existingFlUpldLogNos]),
              ];

              value = JSON.stringify(allFlUpldLogNos);
            }
          }

          // Only include fields with values
          if (value !== undefined && value !== null && value !== '') {
            return {
              compTyp: component.compTyp,
              fcId: component.fcId,
              value: value,
            };
          }
          return null;
        })
        .filter(item => item !== null) || [];

    // Get location from field values if exists
    // const { lat, lng } = this.getLatLng(
    //   submission.fieldValues,
    //   submission.formComponents,
    // );

    const storePayload = submission.payload || {};

    storePayload.mst[0].dtl01[0].dtl02 = dtl02;

    storePayload.mst[0].dtl01[0].latitude =
      storePayload.mst[0].dtl01[0].latitude || null;
    storePayload.mst[0].dtl01[0].longitude =
      storePayload.mst[0].dtl01[0].longitude || null;

    console.log('pld storePayload', storePayload);

    return storePayload;
  }

  // Helper to extract location from field values
  getLatLng(fieldValues, formComponents) {
    let lat = '';
    let lng = '';

    formComponents?.forEach(component => {
      if (component.compTyp === '08') {
        const locationValue = fieldValues[component.fcId];
        if (locationValue) {
          try {
            const location =
              typeof locationValue === 'string'
                ? JSON.parse(locationValue)
                : locationValue;
            lat = location.latitude || '';
            lng = location.longitude || '';
          } catch (e) {
            console.error('Error parsing location:', e);
          }
        }
      }
    });

    return { lat, lng };
  }

  // Confirm uploaded files with server
  async confirmUploads(submission, confirmationData) {
    const attempt = await SubmissionAttempt.createAttempt(this.database, {
      submissionId: submission.submissionId,
      step: SubmissionAttempt.STEP.CONFIRM,
      retryCount: submission.retryCount,
    });

    try {
      // If no confirmation data, nothing to confirm
      if (!confirmationData || Object.keys(confirmationData).length === 0) {
        await attempt.markAsSuccess();
        return { success: true };
      }

      // Prepare confirmation payload based on server response structure
      // The confirmationData should contain the structure needed for confirmUploads
      // Similar to how handleFormSubmit uses need_to_confirm_data
      const confirmResult = await UploadService.confirmUploads(
        confirmationData,
      );

      if (confirmResult.success) {
        // Update files as confirmed in local database
        await this.markFilesAsConfirmed(submission);
        await attempt.markAsSuccess();
        return { success: true };
      } else {
        throw new Error(confirmResult.error || 'Upload confirmation failed');
      }
    } catch (error) {
      if (error.message !== 'Network error') {
        await attempt.markAsFailed(error);
        return { success: false, error: error.message };
      }
    }
  }

  // Mark files as confirmed in local database
  async markFilesAsConfirmed(submission) {
    const uploadedFiles = await this.database.collections
      .get('pending_files')
      .query(
        Q.where('submission_id', submission.submissionId),
        Q.where('status', 'uploaded'),
      )
      .fetch();

    // Wrap all updates in a single write transaction for better performance
    if (uploadedFiles.length > 0) {
      await this.database.write(async () => {
        for (const file of uploadedFiles) {
          await file.update(record => {
            // You can add a 'confirmed' field here if needed
            // For now, we'll just let the update happen
            // The updatedAt timestamp will be auto-updated by WatermelonDB
          });
        }
      });
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
  async createPendingSubmission(
    formDetail,
    fieldValues,
    formComponents,
    payload,
  ) {
    try {
      // Create the pending submission
      const pendingSubmission = await PendingSubmission.createPendingSubmission(
        this.database,
        {
          formId: formDetail.formId,
          formName: formDetail.formName,
          appId: formDetail.appId,
          fieldValues,
          formComponents,
          payload,
        },
      );

      // Extract and create pending files
      const filesToUpload = this.extractFilesFromFieldValues(
        fieldValues,
        formComponents,
      );

      for (const file of filesToUpload) {
        await PendingFile.createPendingFile(this.database, {
          submissionId: pendingSubmission.submissionId,
          fcId: file.fcId,
          formId: formDetail.formId,
          localUri: file.uri,
          fileName: file.fileNm || file.fileName || `file_${Date.now()}.jpg`,
          fileType: file.type || 'image/jpeg',
          fileSize: file.fileSize || 0,
        });
      }

      // Immediately try to process if online
      if (await this.isOnline()) {
        await this.processSubmission(pendingSubmission);
      }

      return pendingSubmission;
    } catch (error) {
      console.error('Error creating pending submission:', error);
      throw error;
    }
  }

  async isOnline() {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable !== false;
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
            if (image.status === STATUS.PENDING || image.status === STATUS.FAILED) {
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

      // Log the submission data for debugging
      console.log('Submission data:', {
        submissionId: submission.submissionId,
        formName: submission.formName,
        fieldValuesKeys: Object.keys(submission.fieldValues || {}),
        formComponentsLength: submission.formComponents?.length,
      });

      result.push({
        ...submission._raw, // Use _raw to get raw data if needed
        submissionId: submission.submissionId,
        formId: submission.formId,
        formName: submission.formName,
        appId: submission.appId,
        fieldValues: submission.fieldValues,
        formComponents: submission.formComponents,
        status: submission.status,
        retryCount: submission.retryCount,
        maxRetries: submission.maxRetries,
        createdAt: submission.createdAt,
        completedAt: submission.completedAt,
        errorMessage: submission.errorMessage,
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

    // Reset submission status within a write transaction
    await this.database.write(async () => {
      await submission.update(record => {
        record.status = 'pending';
        record.retryCount = 0;
        record.nextRetryAt = null;
        record.errorMessage = null;
      });
    });

    // Reset failed files - wrap each update in a write transaction
    const failedFiles = await this.database.collections
      .get('pending_files')
      .query(
        Q.where('submission_id', submissionId),
        Q.where('status', 'failed'),
      )
      .fetch();

    if (failedFiles.length > 0) {
      await this.database.write(async () => {
        for (const file of failedFiles) {
          await file.update(record => {
            record.status = 'pending';
            record.retryCount = 0;
            record.nextRetryAt = null;
            record.errorMessage = null;
          });
        }
      });
    }

    // Process immediately
    await this.processSubmission(submission);
  }
}

export default SubmissionService;
