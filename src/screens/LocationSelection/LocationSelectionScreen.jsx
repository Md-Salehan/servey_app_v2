// screens/LocationSelection/LocationSelectionScreen.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { DropdownField, LOVField } from '../../components';
import {
  fetchStates,
  fetchDistricts,
  fetchBlocks,
  fetchPanchayats,
  fetchVillages,
  setCsLocType,
  setState,
  setDistrict,
  setBlock,
  setPanchayat,
  setTown,
  setVillage,
  setWard,
  saveLocationSelections,
  loadLocationSelections,
  clearLocationSelections,
  clearErrors,
  resetLocationState,
  fetchTowns,
  fetchWards,
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

  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const initialLoadDone = useRef(false);

  // Load saved location selections only once when screen mounts
  useEffect(() => {
    const loadSavedSelections = async () => {
      if (!initialLoadDone.current) {
        setIsLoadingSavedData(true);
        await dispatch(loadLocationSelections());
        setIsLoadingSavedData(false);
        initialLoadDone.current = true;
      }
    };

    loadSavedSelections();
  }, [dispatch]);

  // Load states only once after saved data is loaded and if states list is empty
  useEffect(() => {
    if (!isLoadingSavedData && lists.states.length === 0 && !loading.states) {
      dispatch(fetchStates(2011));
    }
  }, [dispatch, isLoadingSavedData, lists.states.length, loading.states]);

  // Auto-fetch districts only when state changes AND districts list is empty
  useEffect(() => {
    if (
      selections.state &&
      lists.districts.length === 0 &&
      !loading.districts
    ) {
      dispatch(
        fetchDistricts({
          censusYr: 2011,
          stateCd: selections.state.code,
        }),
      );
    }
  }, [selections.state, dispatch, lists.districts.length, loading.districts]);

  // Auto-fetch blocks only when district changes AND blocks list is empty
  useEffect(() => {
    if (
      selections.state &&
      selections.district &&
      lists.blocks.length === 0 &&
      !loading.blocks
    ) {
      dispatch(
        fetchBlocks({
          censusYr: 2011,
          stateCd: selections.state.code,
          distCd: selections.district.code,
        }),
      );
    }
  }, [
    selections.district,
    selections.state,
    dispatch,
    lists.blocks.length,
    loading.blocks,
  ]);

  // Auto-fetch panchayats only when block changes AND panchayats list is empty
  useEffect(() => {
    if (
      selections.state &&
      selections.district &&
      selections.block &&
      lists.panchayats.length === 0 &&
      !loading.panchayats
    ) {
      dispatch(
        fetchPanchayats({
          censusYr: 2011,
          stateCd: selections.state.code,
          distCd: selections.district.code,
          blkCd: selections.block.code,
        }),
      );
    }
  }, [
    selections.block,
    selections.district,
    selections.state,
    dispatch,
    lists.panchayats.length,
    loading.panchayats,
  ]);

  // Auto-fetch towns only when block changes AND towns list is empty
  useEffect(() => {
    console.log('fetchTowns-', lists.towns.length, selections.csLocType);

    if (
      selections.state &&
      selections.district &&
      lists.towns.length === 0 &&
      !loading.towns &&
      selections.csLocType === 'U'
    ) {
      dispatch(
        fetchTowns({
          censusYr: 2011,
          stateCd: selections.state.code,
          distCd: selections.district.code,
        }),
      );
    }
  }, [
    selections.district,
    selections.state,
    dispatch,
    lists.towns.length,
    loading.towns,
  ]);

  // Auto-fetch villages only when panchayat changes AND villages list is empty
  useEffect(() => {
    if (
      selections.state &&
      selections.district &&
      selections.block &&
      selections.panchayat &&
      lists.villages.length === 0 &&
      !loading.villages
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
    lists.villages.length,
    loading.villages,
  ]);

  // Auto-fetch Wards only when town changes AND wards list is empty
  useEffect(() => {
    console.log(
      'fetchWards-',
      selections.state,
      selections.district,
      selections.town,
      lists.wards.length,
      loading.wards,
    );
    if (
      selections.state &&
      selections.district &&
      selections.town &&
      lists.wards.length === 0 &&
      !loading.wards
    ) {
      dispatch(
        fetchWards({
          censusYr: 2011,
          stateCd: selections.state.code,
          distCd: selections.district.code,
          townCd: selections.town.code,
        }),
      );
    }
  }, [
    selections.town,
    selections.district,
    selections.state,
    dispatch,
    lists.wards.length,
    loading.wards,
  ]);

  // Save selections to AsyncStorage whenever they change (but not on first load)
  useEffect(() => {
    if (!isLoadingSavedData && !isFirstLoad && selections.state) {
      const hasAnySelection =
        selections.state ||
        selections.district ||
        selections.block ||
        selections.panchayat ||
        selections.town ||
        selections.village ||
        selections.ward;
      if (hasAnySelection) {
        dispatch(saveLocationSelections(selections));
      }
    }
    if (isFirstLoad && !isLoadingSavedData) {
      setIsFirstLoad(false);
    }
  }, [selections, dispatch, isLoadingSavedData, isFirstLoad]);

  // Reset isFirstLoad when screen loses focus (optional - if you want to reset on navigation)
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Don't reset isFirstLoad - this keeps data persisted
        // If you want to reset when navigating away, uncomment:
        // setIsFirstLoad(true);
      };
    }, []),
  );

  // Column configuration for LOV fields
  const locationColumns = [
    { key: 'code', title: 'Code', width: 100 },
    { key: 'name', title: 'Name', flex: 1 },
  ];

  const handleLocationTypeChange = value => {
    console.log('Location type changed to:', value);
    if (!value) {
      dispatch(setCsLocType(''));
    } else {
      dispatch(setCsLocType(value));
    }

    if (value === 'R') {
      // Clear urban-specific selections
      dispatch(setTown(null));
      dispatch(setWard(null));
    } else if (value === 'U') {
      // Clear rural-specific selections
      dispatch(setBlock(null));
      dispatch(setPanchayat(null));
      dispatch(setVillage(null));
    }
  };

  // Handle state selection
  const handleStateChange = value => {
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

  // Handle town selection
  const handleTownChange = value => {
    if (!value) {
      dispatch(setTown(null));
    } else {
      const selectedTown = lists.towns.find(t => t.code === value);
      dispatch(setTown(selectedTown));
    }
  };
  console.log('towns--', lists.towns, selections.csLocType, selections.town);

  // Handle village selection
  const handleVillageChange = value => {
    if (!value) {
      dispatch(setVillage(null));
    } else {
      const selectedVillage = lists.villages.find(v => v.code === value);
      dispatch(setVillage(selectedVillage));
    }
  };

  const handleWardChange = value => {
    if (!value) {
      dispatch(setWard(null));
    } else {
      const selectedWard = lists.wards.find(w => w.code === value);
      dispatch(setWard(selectedWard));
    }
  };

  // Check if all required fields are selected
  const isFormValid = useCallback(() => {
    if (selections.csLocType === 'R') {
      return (
        selections.csLocType &&
        selections.state &&
        selections.district &&
        selections.block &&
        selections.panchayat &&
        selections.village
      );
    } else if (selections.csLocType === 'U') {
      return (
        selections.csLocType &&
        selections.state &&
        selections.district &&
        selections.town &&
        selections.ward
      );
    }
    return false;
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
        // locationData: selections,
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
            // Reset the first load flag to allow refetching
            initialLoadDone.current = false;
            setIsFirstLoad(true);
            setIsLoadingSavedData(true);
            // Reload fresh data
            await dispatch(loadLocationSelections());
            setIsLoadingSavedData(false);
            dispatch(fetchStates(2011));
          },
        },
      ],
    );
  };

  // Handle back button
  const handleBack = () => {
    navigation.goBack();
  };

  // Get display value for LOV fields
  const getCsLocTypeDisplayValue = () => {
    if (selections.csLocType === 'R') return 'RURAL';
    if (selections.csLocType === 'U') return 'URBAN';
    return '';
  };
  const getStateDisplayValue = () => selections.state?.code || '';
  const getDistrictDisplayValue = () => selections.district?.code || '';
  const getBlockDisplayValue = () => selections.block?.code || '';
  const getPanchayatDisplayValue = () => selections.panchayat?.code || '';
  const getTownDisplayValue = () => selections.town?.code || '';
  const getVillageDisplayValue = () => selections.village?.code || '';
  const getWardDisplayValue = () => selections.ward?.code || '';

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

      {/* {renderProgress()} */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <DropdownField
            fcId={'csLocTyp'}
            label={'Location Type'}
            placeholder={'Select Location Type'}
            options={{ R: 'RURAL', U: 'URBAN' }}
            multiple={false}
            required={true}
            value={selections.csLocType}
            onChange={handleLocationTypeChange}
            disabled={false}
            searchable={false}
          />

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
            searchable={true}
            searchPlaceholder="Search state..."
            emptyMessage={
              loading.states ? 'Loading states...' : 'No states found'
            }
            modalTitle="Select State"
          />

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
            searchable={true}
            searchPlaceholder="Search district..."
            emptyMessage={
              loading.districts ? 'Loading districts...' : 'No districts found'
            }
            modalTitle="Select District"
            dependencyValues={[selections.state]}
          />

          {/* Block Field */}
          {selections.csLocType === 'R' && (
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
              searchable={true}
              searchPlaceholder="Search block..."
              emptyMessage={
                loading.blocks ? 'Loading blocks...' : 'No blocks found'
              }
              modalTitle="Select Block"
              dependencyValues={[selections.state, selections.district]}
            />
          )}

          {/* Panchayat Field */}
          {selections.csLocType === 'R' && (
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
          )}

          {/* Town Field */}
          {selections.csLocType === 'U' && (
            <LOVField
              fcId="town"
              label="Town"
              placeholder={
                selections.block ? 'Select Town' : 'Select Block first'
              }
              data={lists.towns}
              columns={locationColumns}
              value={getTownDisplayValue()}
              onChange={handleTownChange}
              displayKey="name"
              primaryKey="code"
              required={true}
              disabled={!selections.district}
              loading={loading.towns}
              searchable={true}
              searchPlaceholder="Search town..."
              emptyMessage={
                loading.towns ? 'Loading towns...' : 'No towns found'
              }
              modalTitle="Select Town"
              dependencyValues={[selections.state, selections.district]}
            />
          )}

          {/* Village Field */}
          {selections.csLocType === 'R' && (
            <LOVField
              fcId="village"
              label="Village"
              placeholder={
                selections.panchayat
                  ? 'Select Village'
                  : 'Select Panchayat first'
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
          )}

          {/* Ward Field */}
          {selections.csLocType === 'U' && (
            <LOVField
              fcId="ward"
              label="Ward"
              placeholder={
                selections.block ? 'Select Ward' : 'Select Block first'
              }
              data={lists.wards}
              columns={locationColumns}
              value={getWardDisplayValue()}
              onChange={handleWardChange}
              displayKey="name"
              primaryKey="code"
              required={true}
              disabled={!selections.district}
              loading={loading.wards}
              searchable={true}
              searchPlaceholder="Search ward..."
              emptyMessage={
                loading.wards ? 'Loading wards...' : 'No wards found'
              }
              modalTitle="Select Ward"
              dependencyValues={[selections.state, selections.district]}
            />
          )}
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
