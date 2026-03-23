// screens/RecordEntry/RecordEntryScreen.jsx
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
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import useInternetStatus from '../../hook/useInternetStatus';
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
import { useGetFormComponentsMutation } from '../../features/form/formsApi';

const RecordEntryScreen = ({ database }) => {
  const route = useRoute();
  const navigation = useNavigation();

  const { appId, formId, formTitle } = route.params || {};

  const [isInitialized, setIsInitialized] = useState(false);
  const [formComponents, setFormComponents] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [submissionError, setSubmissionError] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  const { isOnline, isChecking } = useInternetStatus();
  const [getFormComponents, { isLoading: isApiLoading }] =
    useGetFormComponentsMutation();

  useEffect(() => {
    if (appId && formId) {
      initializeData();
    } else {
      Alert.alert(
        'Error',
        'Missing required parameters. Please select a form from dashboard.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    }
  }, [appId, formId]);

  const initializeData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from server if online
      if (isOnline) {
        const success = await fetchFormComponentsFromServer();
        if (success) {
          setLoading(false);
          return;
        }
      }

      // If offline or server fetch failed, try to load from local database
      await loadFormComponentsFromDB();
    } catch (err) {
      console.error('Error loading form components:', err);
      setError('Failed to load form components');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormComponentsFromServer = async () => {
    try {
      console.log('📡 Fetching form components from server...');

      const payload = {
        apiId: 'SUA00934',
        mst: {
          appId,
          formId,
        },
      };

      const result = await getFormComponents(payload).unwrap();

      if (result?.appMsgList?.errorStatus === false) {
        console.log('✅ Form components fetched from server');

        const components = result?.content?.mst?.dtl01 || [];
        const sortedComponents = [...components].sort(
          (a, b) => a.compSlNo - b.compSlNo,
        );

        // Store in local database
        await database.write(async () => {
          const existing = await database.collections
            .get('form_components')
            .query(Q.where('form_id', formId))
            .fetch();

          if (existing.length > 0) {
            // Update existing
            await existing[0].update(record => {
              record.components = sortedComponents;
              // updatedAt is automatically set by WatermelonDB
            });
          } else {
            // Create new
            await database.collections.get('form_components').create(record => {
              record.formId = formId;
              record.components = sortedComponents;
              record.version = '1.0';
              // createdAt and updatedAt are automatically set
            });
          }
        });

        setFormComponents(sortedComponents);
        initializeFieldValues(sortedComponents);
        return true;
      } else {
        console.log('Server returned error, falling back to cache');
        const errorMsg =
          result?.appMsgList?.list?.[0]?.errDesc ||
          'Failed to load from server';
        console.log('Error:', errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Error fetching from server:', err);
      return false;
    }
  };

  const loadFormComponentsFromDB = async () => {
    try {
      console.log('💾 Loading form components from database...');

      const components = await database.collections
        .get('form_components')
        .query(Q.where('form_id', formId))
        .fetch();

      if (components.length > 0) {
        const storedComponents = components[0].components || [];
        const sortedComponents = [...storedComponents].sort(
          (a, b) => a.compSlNo - b.compSlNo,
        );

        setFormComponents(sortedComponents);
        initializeFieldValues(sortedComponents);
        console.log('✅ Form components loaded from database');
      } else {
        // No data available locally
        setError(
          'Form not available offline. Please connect to the internet to download it.',
        );
      }
    } catch (err) {
      console.error('Error loading from database:', err);
      setError('Failed to load form from local storage');
    }
  };

  const initializeFieldValues = components => {
    const initialValues = {};
    const fieldErrors = {};

    components.forEach(component => {
      initialValues[component.fcId] = component.props?.value || '';
      if (component.props?.required === 'Y' && !component.props?.value) {
        fieldErrors[component.fcId] = `${
          component.props?.label || 'Field'
        } is required`;
      }
    });

    setFieldValues(initialValues);
    setSubmissionError(fieldErrors);
  };

  const handleFieldChange = (fcId, value) => {
    console.log('Field changed:', fcId, value);
    setFieldValues(prev => ({
      ...prev,
      [fcId]: value,
    }));

    // Clear error for this field if it exists
    if (submissionError[fcId]) {
      setSubmissionError(prev => ({
        ...prev,
        [fcId]: null,
      }));
    }
  };

  const handleError = (fcId, errorText) => {
    console.log('Field error:', fcId, errorText);
    setSubmissionError(prev => ({
      ...prev,
      [fcId]: errorText,
    }));
  };

  const validateForm = () => {
    const errors = {};
    let hasErrors = false;

    formComponents.forEach(component => {
      if (component.props?.required === 'Y' && !fieldValues[component.fcId]) {
        errors[component.fcId] = `${
          component.props?.label || 'Field'
        } is required`;
        hasErrors = true;
      }
    });

    setSubmissionError(prev => ({ ...prev, ...errors }));
    return !hasErrors;
  };

  const handleNext = () => {
    const hasErrors = Object.keys(submissionError).filter(key => submissionError[key]).length > 0;
    if (hasErrors) {
      Alert.alert(
        'Validation Error',
        Object.values(submissionError).filter(error => error).join('\n'),
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
            errorText={''}
            onError={error => handleError(fcId, error)}
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
            errorText={''}
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
            errorText={''}
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
            errorText={''} // submissionError[fcId] || ''
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
            errorText={''}
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
            errorText={''}
            onError={error => handleError(fcId, error)}
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
            required={props?.required === 'Y'}
            disabled={props?.disabled === 'Y'}
            description={props?.description || ''}
            canvasWidth={props?.CanvasWidth ? parseInt(props.CanvasWidth) : 300}
            canvasHeight={
              props?.CanvasHeight ? parseInt(props.CanvasHeight) : 150
            }
            strokeColor={props?.StrokeColor || COLORS.primary}
            strokeWidth={props?.StrokeWidth ? parseInt(props.StrokeWidth) : 3}
            minPoints={props?.MinPoints ? parseInt(props.MinPoints) : 10}
            onSigningStart={() => {}}
            onSigningEnd={() => {}}
            errorText={''}
            onError={error => handleError(fcId, error)}
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

  if (loading || isApiLoading) {
    return (
      <SafeAreaView style={styles.container}>
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
          <Text style={styles.loadingText}>
            {isOnline ? 'Loading form...' : 'Loading from offline storage...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          navigation={navigation}
          formTitle={formTitle}
          appId={appId}
          formId={formId}
          fieldValues={fieldValues}
          totalNumFormComp={formComponents.length}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadFormComponents}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        nestedScrollEnabled={true}
      >
        <View style={styles.formContainer}>
          {formComponents.length > 0 ? (
            formComponents.map(renderFieldComponent)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No form components found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            formComponents.length === 0 && styles.submitButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={formComponents.length === 0}
        >
          <Text style={styles.submitButtonText}>Preview Form</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default withDatabase(RecordEntryScreen);
