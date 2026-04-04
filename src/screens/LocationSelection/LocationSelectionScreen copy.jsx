// screens/LocationSelection/LocationSelectionScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import LOVField from '../../components/form/LOVField';
import {
  fetchStates,
  fetchDistricts,
  fetchBlocks,
  fetchPanchayats,
  fetchVillages,
  setState,
  setDistrict,
  setBlock,
  setPanchayat,
  setVillage,
  saveLocationSelections,
  loadLocationSelections,
  clearLocationSelections,
  clearErrors,
} from '../../features/location/locationSlice';

import styles from './LocationSelection.styles';

const LocationSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { formId, formTitle, appId, surFormGenFlg } = route.params || {};

  // Redux state
  const { selections, lists, loading, errors, isInitialized } = useSelector(
    state => state.location,
  );

  const [isLoadingSavedData, setIsLoadingSavedData] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log(selections, lists, loading, 'xxt');

  //   Load saved location selections when screen mounts
  useEffect(() => {
    const loadSavedSelections = async () => {
      setIsLoadingSavedData(true);
      await dispatch(loadLocationSelections());
      setIsLoadingSavedData(false);
    };

    loadSavedSelections();
  }, [dispatch]);

  // Load states after saved data is loaded
  useEffect(() => {
    if (!isLoadingSavedData) {
      dispatch(fetchStates(2011));
    }
  }, [dispatch, isLoadingSavedData]);

  // Auto-fetch districts when state changes
  useEffect(() => {
    if (selections.state) {
      dispatch(
        fetchDistricts({
          censusYr: 2011,
          stateCd: selections.state.code,
        }),
      );
    }
  }, [selections.state, dispatch]);

  // Auto-fetch blocks when district changes
  useEffect(() => {
    if (selections.state && selections.district) {
      dispatch(
        fetchBlocks({
          censusYr: 2011,
          stateCd: selections.state.code,
          distCd: selections.district.code,
        }),
      );
    }
  }, [selections.district, selections.state, dispatch]);

  // Auto-fetch panchayats when block changes
  useEffect(() => {
    if (selections.state && selections.district && selections.block) {
      dispatch(
        fetchPanchayats({
          censusYr: 2011,
          stateCd: selections.state.code,
          distCd: selections.district.code,
          blkCd: selections.block.code,
        }),
      );
    }
  }, [selections.block, selections.district, selections.state, dispatch]);

  // Auto-fetch villages when panchayat changes
  useEffect(() => {
    if (
      selections.state &&
      selections.district &&
      selections.block &&
      selections.panchayat
    ) {
      dispatch(
        fetchVillages({
          censusYr: 2011,
          stateCd: selections.state.code,
          distCd: selections.district.code,
          blkCd: selections.block.code,
          panCd: selections.panchayat.code,
        }),
      );
    }
  }, [
    selections.panchayat,
    selections.block,
    selections.district,
    selections.state,
    dispatch,
  ]);

  // Save selections to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoadingSavedData && selections.state) {
      // Don't save empty/incomplete selections
      const hasAnySelection =
        selections.state ||
        selections.district ||
        selections.block ||
        selections.panchayat ||
        selections.village;
      if (hasAnySelection) {
        dispatch(saveLocationSelections(selections));
      }
    }
  }, [selections, dispatch, isLoadingSavedData]);

  // Column configuration for LOV fields
  const locationColumns = [
    { key: 'code', title: 'Code', width: 100 },
    { key: 'name', title: 'Name', flex: 1 },
  ];

  // Handle state selection
  const handleStateChange = value => {
    console.log('xxt State changed:', value);

    if (!value) {
      dispatch(setState(null));
    } else {
      const selectedState = lists.states.find(s => s.code === value);
      dispatch(setState(selectedState));
    }
    dispatch(clearErrors());
  };

  // Handle district selection
  const handleDistrictChange = value => {
    if (!value) {
      dispatch(setDistrict(null));
    } else {
      const selectedDistrict = lists.districts.find(d => d.code === value);
      dispatch(setDistrict(selectedDistrict));
    }
  };

  // Handle block selection
  const handleBlockChange = value => {
    if (!value) {
      dispatch(setBlock(null));
    } else {
      const selectedBlock = lists.blocks.find(b => b.code === value);
      dispatch(setBlock(selectedBlock));
    }
  };

  // Handle panchayat selection
  const handlePanchayatChange = value => {
    if (!value) {
      dispatch(setPanchayat(null));
    } else {
      const selectedPanchayat = lists.panchayats.find(p => p.code === value);
      dispatch(setPanchayat(selectedPanchayat));
    }
  };

  // Handle village selection
  const handleVillageChange = value => {
    if (!value) {
      dispatch(setVillage(null));
    } else {
      const selectedVillage = lists.villages.find(v => v.code === value);
      dispatch(setVillage(selectedVillage));
    }
  };

  // Check if all required fields are selected
  const isFormValid = useCallback(() => {
    return (
      selections.state &&
      selections.district &&
      selections.block &&
      selections.panchayat &&
      selections.village
    );
  }, [selections]);

  // Handle continue button press
  const handleContinue = async () => {
    if (!isFormValid()) {
      Alert.alert(
        'Incomplete Selection',
        'Please select all location levels before proceeding.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Save selections to AsyncStorage one more time to ensure latest data
      await dispatch(saveLocationSelections(selections)).unwrap();

      // Navigate to Record Entry Screen with location data
      navigation.replace(ROUTES.RECORD_ENTRY, {
        appId,
        formId,
        formTitle,
        surFormGenFlg,
        shouldReset: false,
        locationData: selections, // Pass location data directly
      });
    } catch (error) {
      console.error('Error saving location selections:', error);
      Alert.alert('Error', 'Failed to save location data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reset button (clear all selections)
  const handleResetAll = () => {
    Alert.alert(
      'Reset Location',
      'Are you sure you want to clear all selected location data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await dispatch(clearLocationSelections());
            dispatch(fetchStates(2011)); // Reload states after reset
          },
        },
      ],
    );
  };

  // Handle back button
  const handleBack = () => {
    navigation.goBack();
  };

  //   const [selectedValue, setSelectedValue] = useState('');
  //     const [selectedValues, setSelectedValues] = useState([]);

  //   const sampleData = [
  //     { id: '1', name: 'John Doe', email: 'john@example.com', department: 'Engineering' },
  //     { id: '2', name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing' },
  //     { id: '3', name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales' },
  //     { id: '4', name: 'Alice Brown', email: 'alice@example.com', department: 'Engineering' },
  //   ];

  //   // Column configuration
  //   const columns = [
  //     { key: 'name', title: 'Name', width: 120 },
  //     { key: 'email', title: 'Email', width: 180 },
  //     { key: 'department', title: 'Department' },
  //   ];

  // Get display value for LOV fields
  const getStateDisplayValue = () => selections.state?.code || '';
  const getDistrictDisplayValue = () => selections.district?.code || '';
  const getBlockDisplayValue = () => selections.block?.code || '';
  const getPanchayatDisplayValue = () => selections.panchayat?.code || '';
  const getVillageDisplayValue = () => selections.village?.code || '';

  // Render progress indicator
  const renderProgress = () => {
    const steps = ['State', 'District', 'Block', 'Panchayat', 'Village'];
    const completedSteps = [
      !!selections.state,
      !!selections.district,
      !!selections.block,
      !!selections.panchayat,
      !!selections.village,
    ];
    const completedCount = completedSteps.filter(Boolean).length;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(completedCount / steps.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedCount} of {steps.length} selected
        </Text>
      </View>
    );
  };

  // Loading screen while restoring saved data
  if (isLoadingSavedData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading saved location data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Location</Text>
          <Text style={styles.headerSubtitle}>
            {formTitle || 'Survey Form'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleResetAll} style={styles.resetButton}>
          <Icon name="refresh" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {renderProgress()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* State Field */}
          <LOVField
            fcId="state"
            label="State"
            placeholder="Select State"
            data={lists.states}
            columns={locationColumns}
            value={getStateDisplayValue()}
            onChange={handleStateChange}
            displayKey="name"
            primaryKey="code"
            required={true}
            loading={loading.states}
            // error={errors.states}
            searchable={true}
            searchPlaceholder="Search state..."
            emptyMessage={
              loading.states ? 'Loading states...' : 'No states found'
            }
            modalTitle="Select State"
          />

          {/* <LOVField
              fcId="user_select"
              label="Select User"
              data={sampleData}
              columns={columns}
              value={selectedValue}
              onChange={setSelectedValue}
              displayKey="name"
              primaryKey="id"
              placeholder="Choose a user..."
              required={true}
            /> */}

          {/* District Field */}
          <LOVField
            fcId="district"
            label="District"
            placeholder={
              selections.state ? 'Select District' : 'Select State first'
            }
            data={lists.districts}
            columns={locationColumns}
            value={getDistrictDisplayValue()}
            onChange={handleDistrictChange}
            displayKey="name"
            primaryKey="code"
            required={true}
            disabled={!selections.state}
            loading={loading.districts}
            // error={errors.districts}
            searchable={true}
            searchPlaceholder="Search district..."
            emptyMessage={
              loading.districts ? 'Loading districts...' : 'No districts found'
            }
            modalTitle="Select District"
            dependencyValues={[selections.state]}
          />

          {/* Block Field */}
          <LOVField
            fcId="block"
            label="Block"
            placeholder={
              selections.district ? 'Select Block' : 'Select District first'
            }
            data={lists.blocks}
            columns={locationColumns}
            value={getBlockDisplayValue()}
            onChange={handleBlockChange}
            displayKey="name"
            primaryKey="code"
            required={true}
            disabled={!selections.district}
            loading={loading.blocks}
            // error={errors.blocks}
            searchable={true}
            searchPlaceholder="Search block..."
            emptyMessage={
              loading.blocks ? 'Loading blocks...' : 'No blocks found'
            }
            modalTitle="Select Block"
            dependencyValues={[selections.state, selections.district]}
          />

          {/* Panchayat Field */}
          <LOVField
            fcId="panchayat"
            label="Panchayat"
            placeholder={
              selections.block ? 'Select Panchayat' : 'Select Block first'
            }
            data={lists.panchayats}
            columns={locationColumns}
            value={getPanchayatDisplayValue()}
            onChange={handlePanchayatChange}
            displayKey="name"
            primaryKey="code"
            required={true}
            disabled={!selections.block}
            loading={loading.panchayats}
            // error={errors.panchayats}
            searchable={true}
            searchPlaceholder="Search panchayat..."
            emptyMessage={
              loading.panchayats
                ? 'Loading panchayats...'
                : 'No panchayats found'
            }
            modalTitle="Select Panchayat"
            dependencyValues={[
              selections.state,
              selections.district,
              selections.block,
            ]}
          />

          {/* Village Field */}
          <LOVField
            fcId="village"
            label="Village"
            placeholder={
              selections.panchayat ? 'Select Village' : 'Select Panchayat first'
            }
            data={lists.villages}
            columns={locationColumns}
            value={getVillageDisplayValue()}
            onChange={handleVillageChange}
            displayKey="name"
            primaryKey="code"
            required={true}
            disabled={!selections.panchayat}
            loading={loading.villages}
            // error={errors.villages}
            searchable={true}
            searchPlaceholder="Search village..."
            emptyMessage={
              loading.villages ? 'Loading villages...' : 'No villages found'
            }
            modalTitle="Select Village"
            dependencyValues={[
              selections.state,
              selections.district,
              selections.block,
              selections.panchayat,
            ]}
          />
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backFooterButton} onPress={handleBack}>
          <Text style={styles.backFooterButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!isFormValid() || isSubmitting) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Icon name="arrow-forward" size={20} color={COLORS.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LocationSelectionScreen;
