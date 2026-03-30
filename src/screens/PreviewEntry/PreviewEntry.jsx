import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import {
  CheckboxField,
  DatePickerField,
  DropdownField,
  ImageUploadField,
  LocationField,
  SignatureField,
  TextInputField,
} from '../../components';
import styles from './PreviewScreen.styles';
import { Header } from './component';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurveyFormSubmitMutation } from '../../features/form/formsApi';
import { getLatLng } from './Functions';
import { useDispatch, useSelector } from 'react-redux';
import uploadService from '../../services/uploadService';
import SubmissionService from '../../services/submissionService';
import useInternetStatus from '../../hook/useInternetStatus';
import { STATUS } from '../../constants/enums';

const PreviewScreen = ({ database }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    formTitle,
    appId,
    formId,
    fieldValues,
    formComponents,
    surFormGenFlg,
    isViewOnly = false,
    isOfflineSave = false, // Flag to indicate this is from offline save
  } = route.params || {};

  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { isOnline } = useInternetStatus();
  const [surveyFormSubmit, { isLoading: isFormSubmitLoading }] =
    useSurveyFormSubmitMutation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  console.log(
    {
      formTitle,
      appId,
      formId,
      fieldValues,
      formComponents,
      surFormGenFlg,
      isViewOnly,
      isOfflineSave, // Flag to indicate this is from offline save
    },
    'preview data',
  );

  // Preview mode render function
  const renderPreviewFieldComponent = component => {
    const { fcId, compTyp, compTypTxt, props } = component;

    switch (compTyp) {
      case '01': // Text Input - Preview mode
        return (
          <TextInputField
            key={fcId}
            fcId={fcId}
            label={props?.label || ''}
            placeholder={props?.placeholder || ''}
            value={fieldValues[fcId]}
            maxLength={props?.maxLength ? parseInt(props.maxLength) : undefined}
            keyboardType={getKeyboardType(props?.keyboardType)}
            editable={false}
            multiline={true}
            required={props?.required === 'Y'}
            isPreview={true}
          />
        );

      case '02': // Date Picker - Preview mode
        const parseTimeToDate = timeStr => {
          if (!timeStr) return undefined;
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          return date.toISOString();
        };

        return (
          <DatePickerField
            key={fcId}
            fcId={fcId}
            label={props?.label || ''}
            placeholder={props?.placeholder}
            value={fieldValues[fcId]}
            maximumDate={
              props?.maximumDate ? new Date(props.maximumDate) : undefined
            }
            minimumDate={
              props?.minimumDate ? new Date(props.minimumDate) : undefined
            }
            maximumTime={
              props?.maximumTime
                ? parseTimeToDate(props.maximumTime)
                : undefined
            }
            minimumTime={
              props?.minimumTime
                ? parseTimeToDate(props.minimumTime)
                : undefined
            }
            required={props?.required === 'Y'}
            editable={false}
            isPreview={true}
            mode={props?.mode || 'date'}
          />
        );

      case '03': // Dropdown
        return (
          <DropdownField
            key={fcId}
            fcId={fcId}
            label={props?.label || ''}
            placeholder={props?.placeholder || 'Select option'}
            options={props?.options || ''}
            multiple={props?.multiple === 'Y'}
            required={props?.required === 'Y'}
            value={fieldValues[fcId]}
            disabled={true}
            searchable={false}
            maxSelections={
              props?.maxSelections ? parseInt(props.maxSelections) : undefined
            }
          />
        );

      case '05': // Checkbox
        return (
          <CheckboxField
            key={fcId}
            fcId={fcId}
            label={props?.label || ''}
            value={fieldValues[fcId]}
            required={props?.required === 'Y'}
            disabled={props?.disabled === 'Y'}
            description={props?.description || ''}
            size={props?.size || 'small'}
            isPreview={true}
            error=""
          />
        );

      case '07': // Image Upload
        return (
          <ImageUploadField
            key={fcId}
            fcId={fcId}
            formId={formId}
            label={props?.label || 'Upload Image'}
            required={props?.Required === 'Y' || props?.required === 'Y'}
            multiple={true}
            maxImages={props?.maxImages ? parseInt(props.maxImages) : 5}
            initialImages={fieldValues[fcId] || []}
            isPreview={true}
            onImagesChange={() => {}}
            onError={() => {}}
          />
        );

      case '08': // Location Field
        return (
          <LocationField
            key={fcId}
            fcId={fcId}
            label={props?.Label || 'Location'}
            value={fieldValues[fcId]}
            required={props?.Required === 'Y'}
            description={props?.Description}
            showAddress={true}
            isPreview={true}
          />
        );

      case '09': // Signature Field
        return (
          <SignatureField
            key={fcId}
            fcId={fcId}
            label={props?.Label || 'Signature'}
            value={fieldValues[fcId]}
            required={props?.Required === 'Y'}
            description={props?.Description}
            isPreview={true}
          />
        );

      default:
        return (
          <View key={fcId} style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              Preview not available for: {compTypTxt}
            </Text>
          </View>
        );
    }
  };

  const getKeyboardType = type => {
    switch (type) {
      case 'numeric':
      case 'number-pad':
        return 'numeric';
      case 'email-address':
        return 'email-address';
      case 'phone-pad':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  // Generate payload for submission or local save
  const generatePayload = () => {
    const now = new Date();
    const { lat, lng } = getLatLng(fieldValues, formComponents);

    // Process form components to extract flUpldLogNo for images
    const dtl02 =
      formComponents
        ?.map(component => {
          let value = fieldValues[component.fcId];
          console.log(value, 'pld value');

          // Handle image upload field (compTyp '07')
          if (component.compTyp === '07' && value) {
            if (Array.isArray(value)) {
              // Extract serverUrl from each image object and filter out any invalid URLs
              value = value
                .map(image => image.flUpldLogNo)
                .filter(flUpldLogNo => flUpldLogNo);
              value = JSON.stringify(value); // Convert array of flUpldLogNo to JSON string for submission
            }
          }

          // Handle signature field (compTyp '09')
          else if (component.compTyp === '09' && value) {
            // Signature can be an object with upload status
            if (value && typeof value === 'object') {
              // If signature has been uploaded, use the flUpldLogNo
              if (value.status === STATUS.UPLOADED && value.flUpldLogNo) {
                value = JSON.stringify([value.flUpldLogNo]);
              } else {
                value = JSON.stringify([]);
              }
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

    // Prepare the payload for pending submission
    const payload = {
      apiId: 'SUA01031',
      mst: [
        {
          appId: appId,
          formId: formId,
          dtl01: [
            {
              dtl02: dtl02,
              blkCd: '',
              blkNm: '',
              csLocTyp: '',
              distCd: '',
              distNm: '',
              geoJson: '',
              jlNo: '',
              latitude: lat,
              longitude: lng,
              lvlRefCd: '',
              panCd: '',
              panNm: '',
              plcn: '',
              stateCd: '',
              stateNm: '',
              subdCd: '',
              subdNm: '',
              surDate: now.toISOString().split('T')[0],
              surMobNo: user?.mobNo || '',
              surRefTyp: '',
              surTime: now.toTimeString().split(' ')[0],
              surUserId: user?.userId || '',
              townNm: '',
              villNm: '',
              wardNo: '',
            },
          ],
        },
      ],
    };

    return payload;
  };

  // Save submission to local database (offline mode)
  const saveToLocalDatabase = async () => {
    setIsSaving(true);
    try {
      const submissionService = new SubmissionService(database);
      const payload = generatePayload();

      // Create pending submission
      await submissionService.createPendingSubmission(
        { formId, formName: formTitle, appId },
        fieldValues,
        formComponents,
        payload,
      );

      Alert.alert(
        'Success',
        'Your submission has been saved locally and will be automatically submitted when you reconnect.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 1,
                routes: [
                  { name: ROUTES.DASHBOARD },
                  {
                    name: ROUTES.RECORD_ENTRY,
                    params: {
                      appId,
                      formId,
                      formTitle,
                      surFormGenFlg,
                      shouldReset: true,
                    },
                  },
                ],
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error saving offline submission:', error);
      Alert.alert(
        'Error',
        'Failed to save submission offline. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = async () => {
    const payload = generatePayload();

    console.log(payload, 'pld');

    try {
      // Step 1: Submit the form
      const response = await surveyFormSubmit(payload).unwrap();
      console.log('Form submission response:', response);

      if (response?.appMsgList?.errorStatus === true) {
        Alert.alert(
          'Error',
          response?.appMsgList?.errorMsg ||
            'Failed to submit form. Please try again.',
        );
        return;
      }
      const need_to_confirm_data = response?.content?.mst || {};
      // Step 2: After successful form submission, confirm all uploads
      const confirmResult = await uploadService.confirmUploads(
        need_to_confirm_data,
      );

      if (!confirmResult.success) {
        // Log but don't show error to user since form already submitted
        console.error('Upload confirmation failed:', confirmResult.error);
        return;
      }

      // Step 3: Show success message and navigate
      Alert.alert('Success', 'Form submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 1,
              routes: [
                { name: ROUTES.DASHBOARD },
                {
                  name: ROUTES.RECORD_ENTRY,
                  params: {
                    appId,
                    formId,
                    formTitle,
                    surFormGenFlg,
                    shouldReset: true,
                  },
                },
              ],
            });
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    }
  };

  // Determine if we're in offline mode and should show Save button
  const showSaveButton = !isOnline && !isViewOnly && surFormGenFlg === 'Y';
  const showSubmitButton = isOnline && !isViewOnly && surFormGenFlg === 'Y';
  const isLoading = isFormSubmitLoading || isConfirming || isSaving;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        navigation={navigation}
        formTitle={formTitle || 'Preview'}
        appId={appId}
        formId={formId}
        fieldValues={fieldValues}
        totalNumFormComp={formComponents?.length || 0}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* Render form fields in preview mode */}
        <View style={styles.formContainer}>
          {formComponents?.length > 0 ? (
            formComponents.map(renderPreviewFieldComponent)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No form components to preview
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.editButtonText}>
            {isViewOnly ? 'Back' : 'Edit'}
          </Text>
        </TouchableOpacity>

        {showSaveButton && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: COLORS.warning }]}
            onPress={saveToLocalDatabase}
            disabled={isLoading}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Save Offline</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {showSubmitButton && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleFormSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}

        {!showSaveButton &&
          !showSubmitButton &&
          !isViewOnly &&
          surFormGenFlg !== 'Y' && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: COLORS.gray[400] },
              ]}
              disabled={true}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          )}
      </View>
    </SafeAreaView>
  );
};

export default withDatabase(PreviewScreen);
