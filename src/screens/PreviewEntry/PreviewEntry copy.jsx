import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
// Other components will be added gradually
import styles from './PreviewScreen.styles';
import { Header } from './component';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurveyFormSubmitMutation } from '../../features/form/formsApi';
import { getLatLng } from './Functions';
import { useDispatch, useSelector } from 'react-redux';
const PreviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    formData,
    formTitle,
    appId,
    formId,
    fieldValues,
    formComponents,
    surFormGenFlg,
  } = route.params || {};
  console.log(surFormGenFlg, 'surFormGenFlg');
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  console.log(user, 'user from preview');
  const [surveyFormSubmit, { isLoading: isFormSubmitLoading }] =
    useSurveyFormSubmitMutation();

  // Preview mode render function - similar to RecordEntryScreen but with preview props
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
            // No onChange handler - read-only
            maxLength={props?.maxLength ? parseInt(props.maxLength) : undefined}
            keyboardType={getKeyboardType(props?.keyboardType)}
            editable={false} // Always false for preview mode
            multiline={true}
            required={props?.required === 'Y'}
            isPreview={true} // New prop for preview styling
          />
        );

      case '02': // Date Picker - Preview mode
        // Parse time string to a valid Date object with a reference date
        const parseTimeToDate = timeStr => {
          if (!timeStr) return undefined;

          // Split the time string (format: "HH:MM")
          const [hours, minutes] = timeStr.split(':').map(Number);

          // Create a date object with a reference date (today)
          // This ensures the Date object is valid
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);

          // Return the ISO string to maintain consistency
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
      case '03': // Dropdown - Add this case
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
            // onChange={value => handleFieldChange(fcId, value)}
            disabled={true}
            searchable={false}
            maxSelections={
              props?.maxSelections ? parseInt(props.maxSelections) : undefined
            }
          />
        );

      case '05': // Checkbox - Add this case
        return (
          <CheckboxField
            key={fcId}
            fcId={fcId}
            label={props?.label || ''}
            value={fieldValues[fcId]}
            // onChange={checked => handleFieldChange(fcId, checked)}
            required={props?.required === 'Y'}
            disabled={props?.disabled === 'Y'}
            description={props?.description || ''}
            size={props?.size || 'small'}
            isPreview={true}
            error=""
          />
        );

      case '07': // Image Upload - Add this case
        return (
          <ImageUploadField
            key={fcId}
            fcId={fcId}
            label={props?.label || 'Upload Image'}
            required={props?.Required === 'Y'}
            multiple={true}
            maxImages={props?.maxImages ? parseInt(props.maxImages) : 5}
            initialImages={fieldValues[fcId] || []}
            isPreview={true}
          />
        );

      case '08': // Location Field - Add this case
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

      case '09': // Signature Field - Add this case
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

      // Other component types will be added gradually in future steps
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

  const handleFormSubmit = async () => {
    const now = new Date();
    const { lat, lng } = getLatLng(fieldValues, formComponents);

    // Process form components to extract image URLs
    const dtl02 =
      formComponents
        ?.map(component => {
          let value = fieldValues[component.fcId];

          // Handle image upload field (compTyp '07')
          if (component.compTyp === '07' && value) {
            // If value is an array of image objects, extract URLs
            if (Array.isArray(value)) {
              // Extract serverUrl from each image object and filter out any invalid URLs
              value = value.map(image => image.serverUrl).filter(url => url); // Keep only valid URLs
              value = JSON.stringify(value); // Convert array of URLs to JSON string for submission
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

    const payload = {
      apiId: 'SUA01031',
      mst: {
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
    };

    console.log(payload, 'pld');

    try {
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
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Review Your Entries</Text>
          <Text style={styles.previewSubtitle}>
            Please verify all information before submitting
          </Text>
        </View>

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
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        {surFormGenFlg === 'Y' ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleFormSubmit}
            disabled={surFormGenFlg === 'Y' && isFormSubmitLoading}
          >
            {isFormSubmitLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: COLORS.gray[400] }]}
            disabled={true}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PreviewScreen;
