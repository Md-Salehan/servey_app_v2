import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/watermelondb/react/withObservables';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useGetFormsMutation } from '../../features/form/formsApi';
import TokenService from '../../services/storage/tokenService';
import { logout } from '../../features/auth/authSlice';
import { ROUTES } from '../../constants/routes';
import { COLORS } from '../../constants/colors';
import useInternetStatus from '../../hook/useInternetStatus';

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

// Inner component that receives forms from database
const DashboardScreenInner = ({ 
  navigation, 
  dispatch,
  forms: dbForms,
  database 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const [getForms] = useGetFormsMutation();
  const { isOnline, isChecking } = useInternetStatus();

  // Load forms from server when online and component mounts
  useEffect(() => {
    if (isOnline) {
      fetchFormsFromServer();
    }
  }, [isOnline]);

  const fetchFormsFromServer = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      
      console.log('📋 Fetching forms from server...');
      const result = await getForms(getFormsbody).unwrap();
      
      if (result?.code === 0 && result?.content?.qryRsltSet) {
        console.log('📋 Forms fetched successfully from server');
        
        // Store forms in local database
        await database.write(async () => {
          for (const formData of result.content.qryRsltSet) {
            const existingForms = await database.collections
              .get('forms')
              .query(Q.where('form_id', formData.formId))
              .fetch();

            if (existingForms.length > 0) {
              // Update existing form
              await existingForms[0].update(record => {
                record.formName = formData.formNm;
                record.formSchema = formData;
                record.updatedAt = Date.now();
              });
            } else {
              // Create new form
              await database.collections.get('forms').create(record => {
                record.formId = formData.formId;
                record.formName = formData.formNm;
                record.formSchema = formData;
                record.appId = 'AP000001';
                record.createdAt = Date.now();
                record.updatedAt = Date.now();
              });
            }
          }
        });
        
        console.log('✅ Forms stored in local database');
      } else {
        // Handle API error response
        const errorMsg = result?.appMsgList?.list?.[0]?.errDesc || 'Failed to load forms';
        console.error('Failed to load forms:', errorMsg);
        setIsError(true);
        setError({ message: errorMsg });
        
        // Check if token expired
        if (result?.code === 401 || result?.code === 403) {
          handleTokenExpired();
        }
      }
    } catch (err) {
      console.error('Failed to fetch forms:', err);
      setIsError(true);
      setError(err);
      
      // Handle network errors or unauthorized
      if (err?.status === 401 || err?.status === 403) {
        handleTokenExpired();
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleTokenExpired = async () => {
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please login again.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await TokenService.clearTokens();
            dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.LOGIN }],
            });
          },
        },
      ]
    );
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    if (isOnline) {
      await fetchFormsFromServer();
    } else {
      // If offline, just stop refreshing and show message
      setRefreshing(false);
      Alert.alert('Offline', 'You are currently offline. Showing cached forms.');
    }
  }, [isOnline]);

  // Transform database forms to the format expected by UI
  const transformedForms = useMemo(() => {
    return dbForms.map(form => ({
      id: form.id,
      formId: form.formId,
      title: form.formName,
      formNm: form.formName,
      // Add default values for UI properties that might be missing
      status: form.formSchema?.status || 'active',
      priority: form.formSchema?.priority || 'normal',
      createdAt: form.formSchema?.createdAt || form.createdAt,
      description: form.formSchema?.description || "No description available",
      totalFields: form.formSchema?.totalFields || 0,
      estimatedTime: form.formSchema?.estimatedTime || 5,
      completionRate: form.formSchema?.completionRate || 0,
      deadline: form.formSchema?.deadline || null,
    }));
  }, [dbForms]);

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    let result = [...transformedForms];

    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'priority') {
        result = result.filter(form => form.priority === 'high' || form.priority === 'geom');
      } else {
        result = result.filter(form => form.status === activeFilter);
      }
    }

    // Apply sort
    result.sort((a, b) => {
      switch (activeSort) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'deadline':
          return new Date(a.deadline || 0) - new Date(b.deadline || 0);
        case 'progress':
          return (b.completionRate || 0) - (a.completionRate || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [transformedForms, activeFilter, activeSort]);

  const handleFormPress = form => {
    console.log('Form selected:', form.id);
    navigation.navigate(ROUTES.RECORD_ENTRY, {
      appId: 'AP000001',
      formId: form.formId,
      formTitle: form.title,
    });
  };

  const handleProfilePress = () => {
    navigation.navigate(ROUTES.PROFILE);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await TokenService.clearTokens();
            dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.LOGIN }],
            });
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => (
    <FormCard 
      form={item} 
      index={index} 
      onPress={() => handleFormPress(item)} 
    />
  );

  const renderContent = () => {
    // Show loading only on initial load when we have no data
    if (isLoading && !refreshing && dbForms.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading forms...</Text>
        </View>
      );
    }

    // Show error only if we have no data to display
    if (isError && dbForms.length === 0) {
      return (
        <ErrorState 
          error={error} 
          onRetry={fetchFormsFromServer} 
        />
      );
    }

    // Show empty state if no forms in database
    if (dbForms.length === 0) {
      return (
        <EmptyState
          title="No Forms Available"
          message={
            isOnline 
              ? "There are no forms assigned to you at the moment."
              : "You are offline. Pull down to refresh when online."
          }
          onAction={isOnline ? fetchFormsFromServer : null}
        />
      );
    }

    // Show filtered forms
    if (filteredForms.length === 0) {
      return (
        <EmptyState
          title={`No ${activeFilter} Forms`}
          message={`You don't have any ${activeFilter} forms.`}
          onAction={() => setActiveFilter('all')}
        />
      );
    }

    return (
      <FlatList
        data={filteredForms}
        renderItem={renderItem}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            title={isOnline ? "Refreshing..." : "Offline"}
            titleColor={COLORS.text.secondary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // Show offline indicator if needed
  const renderOfflineIndicator = () => {
    if (!isOnline && !isChecking) {
      return (
        <View style={styles.offlineIndicator}>
          <Icon name="wifi-off" size={16} color="#fff" />
          <Text style={styles.offlineText}>Offline - Showing cached forms</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderOfflineIndicator()}
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.subtitle}>
            {dbForms.length}{' '}
            {dbForms.length === 1 ? 'form' : 'forms'} available
            {!isOnline && ' (offline)'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleProfilePress}
          >
            <Icon name="person" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handleLogout}
          >
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

// Wrap with database observer for reactive updates
const enhance = withObservables([], ({ database }) => ({
  forms: database.collections
    .get('forms')
    .query(Q.sortBy('created_at', 'desc')),
}));

const DashboardScreen = (props) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  return (
    <DashboardScreenInner 
      {...props}
      navigation={navigation}
      dispatch={dispatch}
    />
  );
};

export default withDatabase(enhance(DashboardScreen));