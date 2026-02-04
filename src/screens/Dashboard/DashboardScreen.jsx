import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useGetFormsMutation } from '../../features/form/formsApi';
import { tokenService } from '../../services/storage/tokenService';
import { ROUTES } from '../../constants/routes';
import { COLORS } from '../../constants/colors';

import { FormCard } from './components/FormCard/FormCard';
import { FormFilter } from './components/FormFilter/FormFilter';
import { EmptyState } from './components/EmptyState/EmptyState';
import { ErrorState } from './components/ErrorState/ErrorState';

import { styles } from './Dashboard.styles';
const getFormsbody = {
  apiId: 'SUA00931',
  criteria: {
    appId: 'AP000001',
  },
};
const DashboardScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [forms, setForms] = useState([]);

  const [getForms, { isLoading, isError, error }] = useGetFormsMutation();

  // Fetch forms on component mount
  useEffect(() => {
    fetchForms(getFormsbody);
  }, []);

  const fetchForms = useCallback(
    async body => {
      try {
        const result = await getForms(body).unwrap();
        setForms(result?.content?.qryRsltSet || []);
      } catch (err) {
        console.error('Failed to fetch forms:', err);
      }
    },
    [getForms],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchForms(getFormsbody);
    setRefreshing(false);
  }, [fetchForms]);

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    let result = [...forms];

    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'priority') {
        result = result.filter(form => form.priority === 'geom');
      } else {
        result = result.filter(form => form.status === activeFilter);
      }
    }

    // Apply sort
    result.sort((a, b) => {
      switch (activeSort) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'deadline':
          return new Date(a.deadline) - new Date(b.deadline);
        case 'progress':
          return (b.completionRate || 0) - (a.completionRate || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [forms, activeFilter, activeSort]);

  const handleFormPress = form => {
    console.log('Form selected:', form.id);
    // Navigate to form collection screen
    navigation.navigate(ROUTES.RECORD_ENTRY, {
      appId: 'AP000001', // Get this from your API response or context
      formId: form.formId,
      formTitle: form.formNm,
    });
  };

  const handleProfilePress = () => {
    navigation.navigate(ROUTES.PROFILE);
  };

  const handleLogout = async () => {
    await tokenService.clearTokens();
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.LOGIN }],
    });
  };

  const renderItem = ({ item, index }) => (
    <FormCard form={item} index={index} onPress={() => handleFormPress(item)} />
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading forms...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <ErrorState error={error} onRetry={() => fetchForms(getFormsbody)} />
      );
    }

    if (filteredForms.length === 0) {
      return (
        <EmptyState
          title={
            activeFilter === 'all'
              ? 'No Forms Available'
              : `No ${activeFilter} Forms`
          }
          message={
            activeFilter === 'all'
              ? 'There are no forms assigned to you at the moment.'
              : `You don't have any ${activeFilter} forms.`
          }
          onAction={() => fetchForms(getFormsbody)}
        />
      );
    }

    return (
      <FlatList
        data={filteredForms}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.subtitle}>
            {filteredForms.length}{' '}
            {filteredForms.length === 1 ? 'form' : 'forms'} available
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleProfilePress}
          >
            <Icon name="person" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <FormFilter
        activeFilter={activeFilter}
        activeSort={activeSort}
        onFilterChange={setActiveFilter}
        onSortChange={setActiveSort}
        filterCount={activeFilter === 'all' ? 0 : filteredForms.length}
      />

      {renderContent()}
    </SafeAreaView>
  );
};

export default DashboardScreen;
