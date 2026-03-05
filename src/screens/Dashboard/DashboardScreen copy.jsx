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
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useGetFormsMutation } from '../../features/form/formsApi';
import TokenService from '../../services/storage/tokenService';
import { logout } from '../../features/auth/authSlice';
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
  const dispatch = useDispatch();
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
    async (body) => {
      try {
        console.log('📋 Fetching forms with token...');
        const result = await getForms(body).unwrap();
        // console.log('📋 Forms fetched successfully:', result);
        
        // Extract forms from the response
        if (result?.code === 0 && result?.content?.qryRsltSet) {
          console.log('📋 Forms fetched successfully:', result);
          // // Transform the data to match your UI needs
          // const transformedForms = result.content.qryRsltSet.map((item, index) => ({
          //   id: item.formId || `form-${index}`,
          //   formId: item.formId,
          //   title: item.formNm+"k" || 'Untitled Formx',
          //   formNm: item.formNm,
          //   description: item.formDesc || "No description available",
          //   status: item.status || 'active',
          //   priority: item.priority || 'normal',
          //   totalFields: item.totalFields || 0,
          //   estimatedTime: item.estimatedTime || 5,
          //   completionRate: item.completionRate || 0,
          //   deadline: item.deadline || null,
          //   createdAt: item.createdAt || new Date().toISOString(),
          // }));
          setForms(result.content.qryRsltSet || []);
        } else {
          // Handle error response
          const errorMsg = result?.appMsgList?.list?.[0]?.errDesc || 'Failed to load forms';
          console.error('Failed to load forms:', errorMsg);
          setForms([]);
          
          // Check if token expired
          if (result?.code === 401 || result?.code === 403) {
            handleTokenExpired();
          }
        }
      } catch (err) {
        console.error('Failed to fetch forms:', err);
        
        // Handle network errors or unauthorized
        if (err?.status === 401 || err?.status === 403) {
          handleTokenExpired();
        }
        
        setForms([]);
      }
    },
    [getForms],
  );

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
    await fetchForms(getFormsbody);
    setRefreshing(false);
  }, [fetchForms]);

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    let result = [...forms];

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
  }, [forms, activeFilter, activeSort]);

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
    if (isLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading forms...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <ErrorState 
          error={error} 
          onRetry={() => fetchForms(getFormsbody)} 
        />
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
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
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

export default DashboardScreen;
