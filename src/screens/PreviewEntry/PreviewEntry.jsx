import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
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
            label={props?.Label || ''}
            placeholder={props?.Placeholder || ''}
            value={fieldValues[fcId]}
            // No onChange handler - read-only
            maxLength={props?.maxLength ? parseInt(props.maxLength) : undefined}
            keyboardType={getKeyboardType(props?.keyboardType)}
            editable={false} // Always false for preview mode
            multiline={true}
            required={props?.Required === 'Y'}
            isPreview={true} // New prop for preview styling
          />
        );

      case '02': // Date Picker - Preview mode
        return (
          <DatePickerField
            key={fcId}
            fcId={fcId}
            label={props?.Label || ''}
            placeholder={props?.Placeholder || 'Select Date'}
            value={fieldValues[fcId]}
            // No onChange handler - read-only
            maximumDate={
              props?.['Maximum Date?'] === 'Y'
                ? new Date(props['Enter Maximum Date'])
                : undefined
            }
            required={props?.Required === 'Y'}
            editable={false} // New prop for preview mode
            isPreview={true} // New prop for preview styling
          />
        );

      case '03': // Dropdown - Add this case
        return (
          <DropdownField
            key={fcId}
            fcId={fcId}
            label={props?.Label || ''}
            placeholder={props?.Placeholder || 'Select option'}
            options={props?.Options || ''}
            value={fieldValues[fcId]}
            required={props?.Required === 'Y'}
            multiple={props?.multiple === true}
            maxSelections={
              props?.['Maximum Selections']
                ? parseInt(props['Maximum Selections'])
                : undefined
            }
            isPreview={true}
            searchable={false} // Disable search in preview mode
          />
        );

      case '05': // Checkbox - Add this case
        return (
          <CheckboxField
            key={fcId}
            fcId={fcId}
            label={props?.Label || ''}
            value={fieldValues[fcId]}
            required={props?.Required === 'Y'}
            disabled={props?.Editable === 'N'}
            description={props?.Description}
            isPreview={true}
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
