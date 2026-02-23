import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
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

const PreviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { formData, formTitle, appId, formId, fieldValues, formComponents } =
    route.params || {};
  console.log(fieldValues, 'fieldValues');

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
            value={
              fieldValues[fcId]
            }
            // onChange={checked => handleFieldChange(fcId, checked)}
            required={props?.required === 'Y'}
            disabled={props?.disabled === 'Y'}
            description={props?.description || ''}
            size={props?.size || 'small'}
            isPreview={true}
            error = ''
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

        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => {
            // Handle form submission
            console.log('Submitting form data:', formData);
            Alert.alert('Success', 'Form submitted successfully!', [
              {
                text: 'OK',
                onPress: () => navigation.navigate(ROUTES.DASHBOARD),
              },
            ]);
          }}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PreviewScreen;
