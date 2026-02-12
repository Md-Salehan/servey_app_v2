import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import styles from './PreviewScreen.styles';
import { Header } from './component';

const PreviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { formData, formTitle, appId, formId, fieldValues, formComponents } = route.params || {};

  const getDisplayValue = (component) => {
    const value = fieldValues?.[component.fcId];
    
    if (!value || value === '') return '—';
    
    switch (component.compTyp) {
      case '05': // Checkbox
        return value ? 'Yes' : 'No';
      case '07': // Image Upload
        return Array.isArray(value) ? `${value.length} image(s)` : '—';
      case '08': // Location
        if (value?.address) return value.address;
        if (value?.latitude && value?.longitude) 
          return `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`;
        return '—';
      default:
        return String(value);
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

        <View style={styles.previewContainer}>
          {formComponents?.map((component) => (
            <View key={component.fcId} style={styles.previewItem}>
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>
                  {component.props?.Label || component.compTypTxt}
                </Text>
                {component.props?.Required === 'Y' && (
                  <Text style={styles.requiredStar}>*</Text>
                )}
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>
                  {getDisplayValue(component)}
                </Text>
              </View>
            </View>
          ))}
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
              { text: 'OK', onPress: () => navigation.navigate(ROUTES.DASHBOARD) },
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