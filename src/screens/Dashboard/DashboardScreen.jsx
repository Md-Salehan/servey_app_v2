// screens/Dashboard/DashboardScreen.jsx
import React, { useState, useMemo, useCallback, useEffect, use } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';

import TokenService from '../../services/storage/tokenService';
import { logout } from '../../features/auth/authSlice';
import { ROUTES } from '../../constants/routes';
import { COLORS } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/api';
import useInternetStatus from '../../hook/useInternetStatus';

import { FormCard } from './components/FormCard/FormCard';
import { FormFilter } from './components/FormFilter/FormFilter';
import { EmptyState } from './components/EmptyState/EmptyState';
import { ErrorState } from './components/ErrorState/ErrorState';
import InfoBar from '../../components/UI/InfoBar';

import { useGetFormsMutation } from '../../features/form/formsApi';

import { styles } from './Dashboard.styles';

const DashboardScreen = ({ database }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  // Local state
  const [forms, setForms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');

  // Internet status hook
  const { isOnline, isChecking } = useInternetStatus();

  const [fetchForms] = useGetFormsMutation();

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
      setIsInitialized(true);
    }
  }, []);

  const initializeData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isOnline) {
        const success = await fetchFormsFromServer();
        if (success) {
          setLoading(false);
          return;
        }
      }
      // If offline or server fetch failed, try to load from local database
      await loadFormsFromDB();
    } catch (error) {
      console.error('Error loading forms:', error);
      setError('Failed to loads forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load forms from local database
  const loadFormsFromDB = async () => {
    console.log('Dashboardscreen: 📦 Loading forms from local database...');
    try {
      const formsCollection = database.collections.get('forms');
      const storedForms = await formsCollection.query().fetch();

      if (storedForms.length === 0) {
        setForms([]);
        return false; // Return false to indicate no data
      }

      // Transform WatermelonDB records to plain objects for UI
      const formList = storedForms.map(form => {
        return {
          ...form.formSchema,
          id: form.id,
          formId: form.formId,
          formName: form.formName,
          // title: form.formName,
          formSchema: form.formSchema,
          appId: form.appId,
          description: form.description,
          status: form.status,
          priority: form.priority,
          totalFields: form.totalFields,
          estimatedTime: form.estimatedTime,
          completionRate: form.completionRate,
          deadline: form.deadline,
          surFormGenFlg: form.surFormGenFlg,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        };
      });

      setForms(formList);
      setError(null);
      return true;
    } catch (error) {
      console.error('Error loading forms from DB:', error);
      setError('Failed to load forms from local storage');
      return false;
    }
  };

  // Fetch forms from server
  const fetchFormsFromServer = useCallback(async () => {
    try {
      console.log('📋 @Fetching forms from server...');
      const payload = {
        apiId: 'SUA01048',
        criteria: {
          appId: 'AP000001',
          userId: user?.userId || '',
        },
      };

      const result = await fetchForms(payload).unwrap();

      if (result?.code === 0 && result?.content?.qryRsltSet) {
        console.log('✅ @Forms fetched successfully from server');

        // Get all current form IDs from local database
        const formsCollection = database.collections.get('forms');
        const allLocalForms = await formsCollection.query().fetch();

        // Create a Set for IDs and a Map for object lookup
        const localFormsMap = new Map(
          allLocalForms.map(form => [form.formId, form]),
        );

        const allServerForms = result.content.qryRsltSet;
        const allServerFormsIds = new Set(
          allServerForms.map(form => form.formId),
        );

        // Find forms that exist locally but not on server (to be deleted)
        const formsToDelete = allLocalForms.filter(
          form => !allServerFormsIds.has(form.formId),
        );

        if (result.content.qryRsltSet.length === 0) {
          // Server has no forms - clear everything
          console.log('⚠️ @Server has no forms, clearing local database');
          await database.write(async () => {
            for (const form of allLocalForms) {
              await form.destroyPermanently();
            }
          });
          await loadFormsFromDB();
          return true;
        }

        // Perform database operations in a single write batch
        await database.write(async () => {
          // 1. Delete forms that no longer exist on server
          if (formsToDelete.length > 0) {
            console.log(
              '🗑️ @Deleting local forms that no longer exist on server:',
              formsToDelete.map(f => f.formId),
            );

            for (const form of formsToDelete) {
              await form.destroyPermanently();
            }
          }

          // 2. Update or create forms from server data
          for (const serverForm of allServerForms) {
            // Use the Map for lookup instead of Set
            const existingForm = localFormsMap.get(serverForm.formId);

            if (existingForm) {
              // Update existing form
              await existingForm.update(record => {
                record.formName = serverForm.formNm;
                record.formSchema = serverForm;
                record.appId = 'AP000001';
                record.description =
                  serverForm.formDesc || 'No description available';
                record.status = serverForm.status || 'active';
                record.priority = serverForm.priority || 'medium';
                record.totalFields = serverForm.totalFields || 0;
                record.estimatedTime = serverForm.estimatedTime || 5;
                record.completionRate = serverForm.completionRate || 0;
                record.deadline = serverForm.deadline || null;
                record.surFormGenFlg = serverForm.surFormGenFlg || null;
              });
              console.log(`🔄 @Updated form: ${serverForm.formId}`);
            } else {
              // Create new form
              await formsCollection.create(record => {
                record.formId = serverForm.formId;
                record.formName = serverForm.formNm;
                record.formSchema = serverForm;
                record.appId = 'AP000001';
                record.description =
                  serverForm.formDesc || 'No description available';
                record.status = serverForm.status || 'active';
                record.priority = serverForm.priority || 'medium';
                record.totalFields = serverForm.totalFields || 0;
                record.estimatedTime = serverForm.estimatedTime || 5;
                record.completionRate = serverForm.completionRate || 0;
                record.deadline = serverForm.deadline || null;
                record.surFormGenFlg = serverForm.surFormGenFlg || null;
              });
              console.log(`✅ @Created new form: ${serverForm.formId}`);
            }
          }
        });

        // Reload from DB to get updated data
        await loadFormsFromDB();
        return true;
      } else {
        // Handle API error (existing error handling code)
        const errorMsg =
          result?.appMsgList?.list?.[0]?.errDesc || 'Failed to load forms';
        console.error('Server error:', errorMsg);

        if (result?.code === 401 || result?.code === 403) {
          handleTokenExpired();
        }
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Network error fetching forms:', err);

      if (err?.status === 401 || err?.status === 403) {
        handleTokenExpired();
      }

      setError('Network error. Using cached data.');
      return false;
    }
  }, [database, fetchForms]);

  // Handle token expiration
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
      ],
    );
  };

  // Refresh handler (pull to refresh)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    // Always try to fetch from server when online
    if (isOnline) {
      await fetchFormsFromServer();
    } else {
      // If offline, just reload from DB
      await loadFormsFromDB();
    }

    setRefreshing(false);
  }, [isOnline, fetchFormsFromServer]);

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    let result = [...forms];

    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'priority') {
        result = result.filter(
          form => form.priority === 'high' || form.priority === 'geom',
        );
      } else if (activeFilter === 'inActive') {
        result = result.filter(form => form.status === 'inActive');
      } else if (activeFilter === 'active') {
        result = result.filter(form => form.status === 'active');
      } else {
        result = []; // No filter, show all
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
  }, [forms, activeFilter, activeSort]);

  // Handle form press
  const handleFormPress = form => {
    navigation.navigate(ROUTES.RECORD_ENTRY, {
      appId: 'AP000001',
      formId: form.formId,
      formTitle: form.formName,
      surFormGenFlg: form.surFormGenFlg,
    });
  };

  // Handle profile press
  const handleProfilePress = () => {
    navigation.navigate(ROUTES.PROFILE);
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
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
    ]);
  };

  // Render form item
  const renderItem = ({ item, index }) => (
    <FormCard form={item} index={index} onPress={() => handleFormPress(item)} />
  );

  // Render content based on state
  const renderContent = () => {
    if (loading && forms.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading forms...</Text>
        </View>
      );
    }

    if (error && forms.length === 0) {
      return (
        <ErrorState
          error={error}
          onRetry={() => {
            if (isOnline) {
              fetchFormsFromServer();
            } else {
              loadFormsFromDB();
            }
          }}
        />
      );
    }

    if (filteredForms.length === 0) {
      // Custom message for offline empty state
      const emptyTitle =
        !isOnline && !isChecking
          ? 'Offline - No Cached Forms'
          : activeFilter === 'all'
          ? 'No Forms Available'
          : `No ${activeFilter} Forms`;

      const emptyMessage =
        !isOnline && !isChecking
          ? 'You are offline and no cached forms are available. Please connect to internet and try again.'
          : activeFilter === 'all'
          ? 'There are no forms assigned to you at the moment.'
          : `You don't have any ${activeFilter} forms.`;

      return (
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          onAction={() => {
            if (isOnline) {
              fetchFormsFromServer();
            } else {
              loadFormsFromDB();
            }
          }}
        />
      );
    }

    return (
      <FlatList
        data={filteredForms}
        renderItem={renderItem}
        keyExtractor={item => item.id?.toString() || item.formId}
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
        ListHeaderComponent={
          error && forms.length > 0 ? (
            <InfoBar
              type={'warning'}
              title={
                error || 'Failed to sync with server. Showing cached data.'
              }
              showAction={isOnline}
              actionTitle="Retry"
              onAction={fetchFormsFromServer}
            />
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.subtitle}>
            {filteredForms.length}{' '}
            {filteredForms.length === 1 ? 'form' : 'forms'} available
            {!isOnline && !isChecking && ' (Offline)'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate(ROUTES.PENDING_SUBMISSIONS)}
          >
            <Icon
              name="pending-actions"
              size={24}
              color={COLORS.text.primary}
            />
          </TouchableOpacity>
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

      {/* Filter Component */}
      <FormFilter
        activeFilter={activeFilter}
        activeSort={activeSort}
        onFilterChange={setActiveFilter}
        onSortChange={setActiveSort}
        filterCount={activeFilter === 'all' ? 0 : filteredForms.length}
      />

      {/* Main Content */}
      {renderContent()}
    </SafeAreaView>
  );
};

export default withDatabase(DashboardScreen);
