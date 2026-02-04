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
import { useGetFormComponentsMutation } from '../../features/form/formComponentsApi';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import TextInputField from '../../components/form/TextInputField';
import DatePickerField from '../../components/form/DatePickerField';
import ImageUploadField from '../../components/form/ImageUploadField';
import ImageCaptureScreen from '../../components/form/ImageCaptureScreen';
import CheckboxField from '../../components/form/CheckboxField';
import SignatureField from '../../components/form/SignatureField';
import SimpleTest from '../../components/form/SimpleTest';
import DropdownField from '../../components/form/DropdownField';
import styles from './RecordEntry.styles';
import { Header } from './component';

const RecordEntryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [getFormComponents, { isLoading, error }] =
    useGetFormComponentsMutation();

  const { appId, formId, formTitle } = route.params || {};

  const [formData, setFormData] = useState({
    mst: {
      appId: appId || '',
      formId: formId || '',
    },
  });

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

      const response = await getFormComponents(payload).unwrap();

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
        Alert.alert('Error', 'Failed to load form components');
      }
    } catch (err) {
      console.error('Error fetching form components:', err);
      Alert.alert('Error', 'Failed to load form. Please try again.');
    }
  };

  const handleFieldChange = (fcId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fcId]: value,
    }));
  };

  const handleSubmit = () => {
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

    // Prepare submission data
    const submissionData = {
      apiId: 'SUA00935', // Assuming different API for submission
      mst: {
        appId,
        formId,
      },
      dtl01: formComponents.map(component => ({
        fcId: component.fcId,
        value: fieldValues[component.fcId],
        compTyp: component.compTyp,
      })),
    };

    console.log('Submitting form data:', submissionData);
    Alert.alert('Success', 'Form submitted successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
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
            maxLength={
              props?.['Maximum Length']
                ? parseInt(props['Maximum Length'])
                : undefined
            }
            keyboardType={getKeyboardType(props?.['Key Board Type'])}
            editable={props?.Editable !== 'N'}
            multiline={props?.['Multiple Line'] === 'Y'}
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

        <SimpleTest />
        <ImageCaptureScreen />

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
          onPress={handleSubmit}
          disabled={formComponents.length === 0}
        >
          <Text style={styles.submitButtonText}>Submit Form</Text>
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
