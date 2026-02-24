import React, { useState, useEffect } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';

const RecordEntryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [getFormComponents, { isLoading, error }] =
    useGetFormComponentsMutation();

  const { appId, formId, formTitle } = route.params || {}; //{ appId:'appId', formId:'formId', formTitle:'formTitle' };

  const [formComponents, setFormComponents] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [submissionError, setSubmissionError] = useState({});

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
        const fieldErrors = {};
        sortedComponents.forEach(component => {
          initialValues[component.fcId] = component.props?.value || '';
          if (component.props?.required === 'Y' && !component.props?.value) {
            fieldErrors[component.fcId] = `${
              component.props?.label || 'Field'
            } is required`;
          }
        });
        setFieldValues(initialValues);
        setSubmissionError(fieldErrors);
      } else {
        // Alert.alert('Error', 'Failed to load form components');
      }
    } catch (err) {
      console.error('Error fetching form components:', err);
      // Alert.alert('Error', 'Failed to load form. Please try again.');
    }
  };

  const handleFieldChange = (fcId, value) => {
    console.log('Field changed:', fcId, value);

    setFieldValues(prev => ({
      ...prev,
      [fcId]: value,
    }));
  };

  const handleError = (fcId, errorText) => {
    console.log('Field error:', fcId, errorText);
    setSubmissionError(prev => ({
      ...prev,
      [fcId]: errorText,
    }));
  };

  const handleNext = () => {
    // // Validate required fields
    // const errors = [];
    // formComponents.forEach(component => {
    //   if (component.props?.Required === 'Y' && !fieldValues[component.fcId]) {
    //     errors.push(`${component.props.label} is required`);
    //   }
    // });
    console.log('Submission Error:', submissionError);

    const hasErrors = Object.keys(submissionError).length > 0;
    if (hasErrors) {
      Alert.alert(
        'Validation Error',
        Object.values(submissionError).join('\n'),
      );
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
            label={props?.label || ''}
            placeholder={props?.placeholder || ''}
            value={fieldValues[fcId]}
            onChangeText={value => handleFieldChange(fcId, value)}
            maxLength={props?.maxLength ? parseInt(props.maxLength) : undefined}
            keyboardType={getKeyboardType(props?.keyboardType)}
            editable={props?.editable === 'Y'}
            multiline={props?.multiline === 'Y'}
            required={props?.required === 'Y'}
            // errorText={submissionError[fcId] || ''}
            onError={errorText => handleError(fcId, errorText)}
          />
        );

      case '02': // Date Picker
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
            onChange={date => handleFieldChange(fcId, date)}
            maximumDate={props?.maximumDate ? props.maximumDate : undefined}
            minimumDate={props?.minimumDate ? props.minimumDate : undefined}
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
            editable={props?.editable === 'Y'}
            mode={props?.mode || 'date'}
            onError={error => handleError(fcId, error)}
          />
        );

      case '07': // Image Upload
        return (
          <ImageUploadField
            key={fcId}
            fcId={fcId}
            label={props?.label || 'Upload Image'}
            required={props?.required === 'Y'}
            multiple={parseInt(props.maxImages) > 1}
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
            onImagesChange={images => handleFieldChange(fcId, images)}
            needLocation={props?.needLocation === 'Y'}
            // errorText={submissionError[fcId] || ''}
            onError={error => handleError(fcId, error)}
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
            onChange={value => handleFieldChange(fcId, value)}
            disabled={props?.editable === 'N'}
            searchable={true}
            maxSelections={
              props?.maxSelections ? parseInt(props.maxSelections) : undefined
            }
            // errorText={submissionError[fcId] || ''}
            onError={error => handleError(fcId, error)}
          />
        );

      case '05': // Check Box
        return (
          <CheckboxField
            key={fcId}
            fcId={fcId}
            label={props?.label || ''}
            value={fieldValues[fcId]}
            onChange={checked => handleFieldChange(fcId, checked)}
            required={props?.required === 'Y'}
            disabled={props?.editable === 'N'}
            description={props?.description || ''}
            size={props?.size || 'small'}
            onError={error => handleError(fcId, error)}
          />
        );

      case '08': // Location
        return (
          <LocationField
            key={fcId}
            fcId={fcId}
            label={props?.label || 'Location'}
            value={fieldValues[fcId]}
            onChange={locationData => handleFieldChange(fcId, locationData)}
            required={props?.required === 'Y'}
            disabled={props?.disabled === 'Y'}
            description={props?.description || ''}
            isMannualEntryAllowed={props?.isMannualEntryAllowed === 'Y'}
            enableHighAccuracy={props?.enableHighAccuracy === 'true'}
            timeout={props?.timeout ? parseInt(props.timeout) : 15000}
            maximumAge={props?.maximumAge ? parseInt(props.maximumAge) : 60000}
            minAccuracy={100}
            showAddress={true}
            showMapPreview={props?.showMapPreview === 'true'}
            onCaptureStart={() => console.log('Location capture started')}
            onCaptureComplete={(location, isAccurate) =>
              console.log('Location captured:', location)
            }
            onCaptureError={error =>
              console.log('Location capture error:', error)
            }
          />
        );

      case '09': // Signature
        return (
          <SignatureField
            key={fcId}
            fcId={fcId}
            label={props?.label || 'Signature'}
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
        {/* {submissionError && (
          <View style={styles.submissionErrorContainer}>
            <Text style={styles.submissionErrorText}>{Object.values(submissionError).join('\n')}</Text>
          </View>
        )} */}
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
