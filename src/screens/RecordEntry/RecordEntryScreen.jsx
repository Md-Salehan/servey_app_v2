import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGetFormComponentsMutation } from '../../features/form/formsApi';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
// import VoiceTest from '../../../screen/VoiceTest';
import styles from './RecordEntry.styles';
import { Header } from './component';
import {
  CheckboxField,
  DatePickerField,
  DropdownField,
  ImageUploadField,
  LocationField,
  SignatureField,
  TextInputField,
} from '../../components';

// const allFormComp = {
//     "msg": "Successful operation",
//     "code": 0,
//     "appMsgList": {
//         "errorStatus": false,
//         "list": [
//             {
//                 "errCd": "CMAI000008",
//                 "errDesc": "Record/Records Found",
//                 "errType": "AI"
//             }
//         ]
//     },
//     "content": {
//         "mst": {
//             "appId": "AP000001",
//             "appDesc": "E-Physical Progress",
//             "formId": "F0000004",
//             "formNm": "XYZ",
//             "dtl01": [
//                 {
//                     "fcId": "C0028",
//                     "compSlNo": 1,
//                     "compTyp": "01",
//                     "compTypTxt": "Text input",
//                     "props": {
//                         "Placeholder": "Enter your name",
//                         "Maximum Length": "",
//                         "Label": "Name",
//                         "Value": "",
//                         "Key Board Type": "default",
//                         "Editable": "",
//                         "Multiple Line  ": ""
//                     }
//                 },
//                 {
//                     "fcId": "C0022",
//                     "compSlNo": 2,
//                     "compTyp": "07",
//                     "compTypTxt": "Image",
//                     "props": {
//                         "Label": "Image Upload"
//                     }
//                 },
//                 {
//                     "fcId": "C0029",
//                     "compSlNo": 2,
//                     "compTyp": "03",
//                     "compTypTxt": "Dropdown",
//                     "props": {
//                         "Placeholder": "Enter your country name",
//                         "Options": "IND~India; BN~Bangladesh; S~Saudi",
//                         "Label": "Country",
//                         "multiple": true,
//                     }
//                 },
//                 {
//                     "fcId": "C0030",
//                     "compSlNo": 3,
//                     "compTyp": "08",
//                     "compTypTxt": "Location",
//                     "props": {
//                         "Label": "Current Location"
//                     }
//                 },
//                 {
//                     "fcId": "C0031",
//                     "compSlNo": 4,
//                     "compTyp": "02",
//                     "compTypTxt": "Date Picker",
//                     "props": {
//                         "Placeholder": "Select Date",
//                         "Maximum Date?": "N~No",
//                         "Label": "Date",
//                         "Enter Maximum Date": "",
//                         "Date": ""
//                     }
//                 },
//                 {
//                     "fcId": "C0032",
//                     "compSlNo": 5,
//                     "compTyp": "06",
//                     "compTypTxt": "Voice input",
//                     "props": {
//                         "Placeholder": "Speak Something",
//                         "Label": "Description"
//                     }
//                 },
//                 {
//                     "fcId": "C0033",
//                     "compSlNo": 6,
//                     "compTyp": "05",
//                     "compTypTxt": "Check Box",
//                     "props": {
//                         "Placeholder": "",
//                         "Label": "Terms & Condition",
//                         "Data": "N~No"
//                     }
//                 },
//                 {
//                     "fcId": "C0034",
//                     "compSlNo": 7,
//                     "compTyp": "09",
//                     "compTypTxt": "Signature",
//                     "props": {
//                         "Label": "eSignature"
//                     }
//                 }
//             ],
//             "dtl02": []
//         }
//     }
// };
const RecordEntryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [getFormComponents, { isLoading, error }] =
    useGetFormComponentsMutation();

  const { appId, formId, formTitle } = route.params || {}; //{ appId:'appId', formId:'formId', formTitle:'formTitle' };



  const [formComponents, setFormComponents] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [submissionError, setSubmissionError] = useState(null);

  useEffect(() => {
    if (appId && formId) {
      fetchFormComponents();
    } else {
      Alert.alert(
        'Error',
        'Missing required parameters. Please select a form from dashboard.',
      );
      navigation.goBack();
    }
  }, [appId, formId]);

  const fetchFormComponents = async () => {
    try {
      const payload = {
        apiId: 'SUA00934',
        mst: {
          appId,
          formId,
        },
      };

      const response = await getFormComponents(payload).unwrap(); // allFormComp

      if (response?.appMsgList?.errorStatus === false) {
        const components = response?.content?.mst?.dtl01 || [];
        // Sort by compSlNo to maintain order
        const sortedComponents = [...components].sort(
          (a, b) => a.compSlNo - b.compSlNo,
        );
        setFormComponents(sortedComponents);

        // Initialize field values
        const initialValues = {};
        sortedComponents.forEach(component => {
          initialValues[component.fcId] = component.props?.Value || '';
        });
        setFieldValues(initialValues);
      } else {
        // Alert.alert('Error', 'Failed to load form components');
      }
    } catch (err) {
      console.error('Error fetching form components:', err);
      // Alert.alert('Error', 'Failed to load form. Please try again.');
    }
  };

  const handleFieldChange = (fcId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fcId]: value,
    }));
  };

  const handleNext = () => {
    // Validate required fields
    const errors = [];
    formComponents.forEach(component => {
      if (component.props?.Required === 'Y' && !fieldValues[component.fcId]) {
        errors.push(`${component.props.Label} is required`);
      }
    });

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    // Navigate to preview screen with all form data
    navigation.navigate(ROUTES.PREVIEW_ENTRY, {
      formData: {
        apiId: 'SUA00935',
        mst: { appId, formId },
        dtl01: formComponents.map(component => ({
          fcId: component.fcId,
          value: fieldValues[component.fcId],
          compTyp: component.compTyp,
        })),
      },
      formTitle,
      appId,
      formId,
      fieldValues,
      formComponents,
    });
  };

  const renderFieldComponent = component => {
    const { fcId, compTyp, compTypTxt, props } = component;

    switch (compTyp) {
      case '01': // Text Input
        return (
          <TextInputField
            key={fcId}
            fcId={fcId}
            label={props?.Label || ''}
            placeholder={props?.Placeholder || ''}
            value={fieldValues[fcId]}
            onChangeText={value => handleFieldChange(fcId, value)}
            maxLength={props?.maxLength ? parseInt(props.maxLength) : undefined}
            keyboardType={getKeyboardType(props?.keyboardType)}
            editable={props?.Editable !== 'N'}
            multiline={true}
            required={props?.Required === 'Y'}
          />
        );

      case '02': // Date Picker
        return (
          <DatePickerField
            key={fcId}
            fcId={fcId}
            label={props?.Label || ''}
            placeholder={props?.Placeholder || 'Select Date'}
            value={fieldValues[fcId]}
            onChange={date => handleFieldChange(fcId, date)}
            maximumDate={
              props?.['Maximum Date?'] === 'Y'
                ? new Date(props['Enter Maximum Date'])
                : undefined
            }
            required={props?.Required === 'Y'}
          />
        );

      case '07': // Image Upload
        return (
          <ImageUploadField
            key={fcId}
            fcId={fcId}
            label={props?.label || 'Upload Image'}
            required={props?.Required === 'Y'}
            multiple={true}
            maxImages={props?.maxImages ? parseInt(props.maxImages) : 5}
            imageQuality={
              props?.imageQuality ? parseFloat(props.imageQuality) : 0.8
            }
            maxFileSize={props?.maxFileSize ? parseInt(props.maxFileSize) : 5}
            allowedTypes={
              props?.allowedTypes
                ? props.allowedTypes.split(',').map(type => type.trim())
                : ['image/jpeg', 'image/png', 'image/jpg']
            }
            onImagesChange={(fcId, images) => handleFieldChange(fcId, images)}
          />
        );

      case '03': // Dropdown
        return (
          <DropdownField
            key={fcId}
            fcId={fcId}
            label={props?.Label || ''}
            placeholder={props?.Placeholder || 'Select option'}
            options={props?.Options || ''}
            multiple={props?.multiple === true}
            required={props?.Required === 'Y'}
            value={fieldValues[fcId]}
            onChange={value => handleFieldChange(fcId, value)}
            disabled={props?.Editable === 'N'}
            searchable={true}
            maxSelections={
              props?.['Maximum Selections']
                ? parseInt(props['Maximum Selections'])
                : undefined
            }
          />
        );

      case '05': // Check Box
        return (
          <CheckboxField
            key={fcId}
            fcId={fcId}
            label={props?.Label || ''}
            value={
              fieldValues[fcId] ||
              props?.value === 'true' ||
              props?.value === true
            }
            onChange={checked => handleFieldChange(fcId, checked)}
            required={props?.Required === 'Y'}
            disabled={props?.Editable === 'N'}
            description={
              props?.Description ||
              'The issue is that without proper linking, the MaterialIcons font files arent being bundled with your app, so the icons cant render. '
            }
            // error={validationErrors[fcId] || ''}
          />
        );

      case '08': // Location
        return (
          <LocationField
            key={fcId}
            fcId={fcId}
            label={props?.Label || 'Location'}
            value={fieldValues[fcId]}
            onChange={locationData => handleFieldChange(fcId, locationData)}
            required={props?.Required === 'Y'}
            disabled={props?.Editable === 'N'}
            description={props?.Description}
            enableHighAccuracy={props?.EnableHighAccuracy === 'true'}
            timeout={props?.Timeout ? parseInt(props.Timeout) : 15000}
            maximumAge={props?.MaxAge ? parseInt(props.MaxAge) : 60000}
            minAccuracy={100}
            showAddress={true}
            showMapPreview={props?.ShowMapPreview === 'true'}
            onCaptureStart={() => console.log('Location capture started')}
            onCaptureComplete={(location, isAccurate) =>
              console.log('Location captured:', location)
            }
            onCaptureError={error =>
              console.log('Location capture error:', error)
            }
            isMannualEntryAllowed={true}
          />
        );

      case '09': // Signature
        return (
          <SignatureField
            key={fcId}
            fcId={fcId}
            label={props?.Label || 'Signature'}
            value={fieldValues[fcId]}
            onChange={signatureData => handleFieldChange(fcId, signatureData)}
            required={props?.Required === 'Y'}
            disabled={props?.Editable === 'N'}
            description={props?.Description}
            canvasWidth={props?.CanvasWidth ? parseInt(props.CanvasWidth) : 300}
            canvasHeight={
              props?.CanvasHeight ? parseInt(props.CanvasHeight) : 150
            }
            strokeColor={props?.StrokeColor || COLORS.primary}
            strokeWidth={props?.StrokeWidth ? parseInt(props.StrokeWidth) : 3}
            minPoints={props?.MinPoints ? parseInt(props.MinPoints) : 10}
            onSigningStart={() => {}}
            onSigningEnd={() => {}}
          />
        );

      default:
        return (
          <View key={fcId} style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              Unsupported component type: {compTypTxt}
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Header
          navigation={navigation}
          formTitle={formTitle}
          appId={appId}
          formId={formId}
          fieldValues={fieldValues}
          totalNumFormComp={formComponents.length}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Header
          navigation={navigation}
          formTitle={formTitle}
          appId={appId}
          formId={formId}
          fieldValues={fieldValues}
          totalNumFormComp={formComponents.length}
        />

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load form. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchFormComponents}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        navigation={navigation}
        formTitle={formTitle}
        appId={appId}
        formId={formId}
        fieldValues={fieldValues}
        totalNumFormComp={formComponents.length}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // scrollEnabled={scrollEnabled}
        nestedScrollEnabled={true}
      >
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {formComponents.length > 0 ? (
            formComponents.map(renderFieldComponent)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No form components found</Text>
            </View>
          )}
        </View>

        {/* Submission Error */}
        {submissionError && (
          <View style={styles.submissionErrorContainer}>
            <Text style={styles.submissionErrorText}>{submissionError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleNext}
          disabled={formComponents.length === 0}
        >
          <Text style={styles.submitButtonText}>Preview Form</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      {/* <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Fields completed: {Object.values(fieldValues).filter(v => v).length} /{' '}
          {formComponents.length}
        </Text>
      </View> */}
    </SafeAreaView>
  );
};

export default RecordEntryScreen;
