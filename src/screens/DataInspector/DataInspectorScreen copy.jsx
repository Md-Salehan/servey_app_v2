// src/screens/DataInspector/DataInspectorScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import { COLORS } from '../../constants/colors';

// Helper function to format JSON data for display
const formatValue = (value) => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
};

// Helper to truncate long strings
const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

// Table Component for displaying records
const DataTable = ({ title, data, columns, onRefresh, icon, color = COLORS.primary }) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [showAllColumns, setShowAllColumns] = useState(false);

  if (!data || data.length === 0) {
    return (
      <View style={styles.tableContainer}>
        <View style={[styles.tableHeader, { borderBottomColor: color }]}>
          <View style={styles.headerLeft}>
            <Icon name={icon} size={20} color={color} />
            <Text style={[styles.tableTitle, { color }]}>{title}</Text>
          </View>
          <Text style={styles.emptyText}>No records found</Text>
        </View>
      </View>
    );
  }

  // Determine which columns to show
  const allColumns = columns || Object.keys(data[0]).filter(key => 
    !key.startsWith('_') && key !== 'id' && key !== 'table'
  );
  const displayColumns = showAllColumns ? allColumns : allColumns.slice(0, 5);

  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <View style={styles.tableContainer}>
      <View style={[styles.tableHeader, { borderBottomColor: color }]}>
        <View style={styles.headerLeft}>
          <Icon name={icon} size={20} color={color} />
          <Text style={[styles.tableTitle, { color }]}>{title}</Text>
          <Text style={styles.recordCount}>{data.length} records</Text>
        </View>
        <View style={styles.headerRight}>
          {allColumns.length > 5 && (
            <TouchableOpacity
              onPress={() => setShowAllColumns(!showAllColumns)}
              style={styles.columnToggle}
            >
              <Icon 
                name={showAllColumns ? 'visibility-off' : 'visibility'} 
                size={18} 
                color={COLORS.text.secondary} 
              />
            </TouchableOpacity>
          )}
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Icon name="refresh" size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Table Header */}
          <View style={styles.columnHeaders}>
            <View style={[styles.cell, styles.indexCell]}>
              <Text style={styles.columnHeaderText}>#</Text>
            </View>
            {displayColumns.map((column) => (
              <View key={column} style={[styles.cell, styles.headerCell]}>
                <Text style={styles.columnHeaderText}>{column}</Text>
              </View>
            ))}
            <View style={[styles.cell, styles.actionCell]}>
              <Text style={styles.columnHeaderText}>Actions</Text>
            </View>
          </View>

          {/* Table Rows */}
          {data.map((item, index) => (
            <View key={index}>
              <View style={styles.row}>
                <View style={[styles.cell, styles.indexCell]}>
                  <Text style={styles.rowText}>{index + 1}</Text>
                </View>
                {displayColumns.map((column) => (
                  <View key={column} style={styles.cell}>
                    <Text style={styles.rowText}>
                      {truncate(formatValue(item[column]))}
                    </Text>
                  </View>
                ))}
                <View style={[styles.cell, styles.actionCell]}>
                  <TouchableOpacity
                    onPress={() => toggleRow(index)}
                    style={styles.actionButton}
                  >
                    <Icon 
                      name={expandedRows[index] ? 'expand-less' : 'expand-more'} 
                      size={20} 
                      color={COLORS.primary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Expanded Row Details */}
              {expandedRows[index] && (
                <View style={styles.expandedRow}>
                  <Text style={styles.expandedTitle}>Full Record:</Text>
                  {Object.entries(item).map(([key, value]) => (
                    <View key={key} style={styles.expandedField}>
                      <Text style={styles.expandedKey}>{key}:</Text>
                      <Text style={styles.expandedValue}>
                        {formatValue(value)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// AsyncStorage Table Component
const AsyncStorageTable = ({ data, onRefresh }) => {
  const [expandedKeys, setExpandedKeys] = useState({});

  if (!data || data.length === 0) {
    return (
      <View style={styles.tableContainer}>
        <View style={[styles.tableHeader, { borderBottomColor: COLORS.warning }]}>
          <View style={styles.headerLeft}>
            <Icon name="storage" size={20} color={COLORS.warning} />
            <Text style={[styles.tableTitle, { color: COLORS.warning }]}>AsyncStorage</Text>
          </View>
          <Text style={styles.emptyText}>No data in AsyncStorage</Text>
        </View>
      </View>
    );
  }

  const toggleKey = (index) => {
    setExpandedKeys(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <View style={styles.tableContainer}>
      <View style={[styles.tableHeader, { borderBottomColor: COLORS.warning }]}>
        <View style={styles.headerLeft}>
          <Icon name="storage" size={20} color={COLORS.warning} />
          <Text style={[styles.tableTitle, { color: COLORS.warning }]}>AsyncStorage</Text>
          <Text style={styles.recordCount}>{data.length} keys</Text>
        </View>
        <View style={styles.headerRight}>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Icon name="refresh" size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header */}
          <View style={styles.columnHeaders}>
            <View style={[styles.cell, styles.indexCell]}>
              <Text style={styles.columnHeaderText}>#</Text>
            </View>
            <View style={[styles.cell, { minWidth: 150 }]}>
              <Text style={styles.columnHeaderText}>Key</Text>
            </View>
            <View style={[styles.cell, { minWidth: 200 }]}>
              <Text style={styles.columnHeaderText}>Value</Text>
            </View>
            <View style={[styles.cell, styles.actionCell]}>
              <Text style={styles.columnHeaderText}>Actions</Text>
            </View>
          </View>

          {/* Rows */}
          {data.map((item, index) => (
            <View key={index}>
              <View style={styles.row}>
                <View style={[styles.cell, styles.indexCell]}>
                  <Text style={styles.rowText}>{index + 1}</Text>
                </View>
                <View style={[styles.cell, { minWidth: 150 }]}>
                  <Text style={styles.rowText}>{item.key}</Text>
                </View>
                <View style={[styles.cell, { minWidth: 200 }]}>
                  <Text style={styles.rowText}>{truncate(item.value, 50)}</Text>
                </View>
                <View style={[styles.cell, styles.actionCell]}>
                  <TouchableOpacity
                    onPress={() => toggleKey(index)}
                    style={styles.actionButton}
                  >
                    <Icon 
                      name={expandedKeys[index] ? 'expand-less' : 'expand-more'} 
                      size={20} 
                      color={COLORS.primary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Expanded Value */}
              {expandedKeys[index] && (
                <View style={styles.expandedRow}>
                  <Text style={styles.expandedTitle}>Full Value:</Text>
                  <Text style={styles.expandedJson}>{item.value}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Main Data Inspector Screen
const DataInspectorScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbData, setDbData] = useState({
    forms: [],
    formComponents: [],
    submissions: [],
  });
  const [asyncData, setAsyncData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDbData, setFilteredDbData] = useState(dbData);
  const [showSearch, setShowSearch] = useState(false);

  // Fetch all data from WatermelonDB
  const fetchDbData = async () => {
    try {
      const forms = await database.collections.get('forms').query().fetch();
      const formComponents = await database.collections.get('form_components').query().fetch();
      const submissions = await database.collections.get('submissions').query().fetch();

      setDbData({
        forms: forms.map(form => ({
          id: form.id,
          formId: form.formId,
          formName: form.formName,
          appId: form.appId,
          description: form.description,
          status: form.status,
          priority: form.priority,
          totalFields: form.totalFields,
          estimatedTime: form.estimatedTime,
          completionRate: form.completionRate,
          deadline: form.deadline ? new Date(form.deadline).toLocaleString() : null,
          createdAt: new Date(form.createdAt).toLocaleString(),
          updatedAt: new Date(form.updatedAt).toLocaleString(),
        })),
        formComponents: formComponents.map(comp => ({
          id: comp.id,
          formId: comp.formId,
          components: comp.components,
          version: comp.version,
          createdAt: new Date(comp.createdAt).toLocaleString(),
          updatedAt: new Date(comp.updatedAt).toLocaleString(),
        })),
        submissions: submissions.map(sub => ({
          id: sub.id,
          submissionId: sub.submissionId,
          formId: sub.formId,
          formName: sub.formName,
          appId: sub.appId,
          data: sub.data,
          status: sub.status,
          retryCount: sub.retryCount,
          lastAttemptAt: sub.lastAttemptAt ? new Date(sub.lastAttemptAt).toLocaleString() : null,
          errorMessage: sub.errorMessage,
          submittedAt: new Date(sub.submittedAt).toLocaleString(),
          uploadedAt: sub.uploadedAt ? new Date(sub.uploadedAt).toLocaleString() : null,
          createdAt: new Date(sub.createdAt).toLocaleString(),
          updatedAt: new Date(sub.updatedAt).toLocaleString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching database data:', error);
      Alert.alert('Error', 'Failed to fetch database data');
    }
  };

  // Fetch all data from AsyncStorage
  const fetchAsyncData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      
      const formattedData = pairs
        .map(([key, value]) => ({
          key,
          value,
        }))
        .sort((a, b) => a.key.localeCompare(b.key));

      setAsyncData(formattedData);
    } catch (error) {
      console.error('Error fetching AsyncStorage data:', error);
      Alert.alert('Error', 'Failed to fetch AsyncStorage data');
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDbData(), fetchAsyncData()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Clear all data (dev only)
  const handleClearAllData = () => {
    if (!__DEV__) return;

    Alert.alert(
      'Clear All Data',
      'This will delete ALL data from both WatermelonDB and AsyncStorage. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Clear WatermelonDB
              await database.write(async () => {
                await database.unsafeResetDatabase();
              });

              // Clear AsyncStorage
              await AsyncStorage.clear();

              await loadData();
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Export data
  const handleExportData = async () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        database: dbData,
        asyncStorage: asyncData,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        title: 'Database Export',
        message: jsonString,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  // Apply search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDbData(dbData);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = {
      forms: dbData.forms.filter(item => 
        JSON.stringify(item).toLowerCase().includes(term)
      ),
      formComponents: dbData.formComponents.filter(item => 
        JSON.stringify(item).toLowerCase().includes(term)
      ),
      submissions: dbData.submissions.filter(item => 
        JSON.stringify(item).toLowerCase().includes(term)
      ),
    };
    setFilteredDbData(filtered);
  }, [searchTerm, dbData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Inspector</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={styles.headerButton}
            >
              <Icon name="search" size={22} color={COLORS.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleExportData}
              style={styles.headerButton}
            >
              <Icon name="share" size={22} color={COLORS.text.primary} />
            </TouchableOpacity>
            {__DEV__ && (
              <TouchableOpacity
                onPress={handleClearAllData}
                style={[styles.headerButton, styles.clearButton]}
              >
                <Icon name="delete-sweep" size={22} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={COLORS.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in all tables..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoFocus
              placeholderTextColor={COLORS.text.disabled}
            />
            {searchTerm ? (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Icon name="close" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="description" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{dbData.forms.length}</Text>
            <Text style={styles.statLabel}>Forms</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="widgets" size={24} color={COLORS.info} />
            <Text style={styles.statNumber}>{dbData.formComponents.length}</Text>
            <Text style={styles.statLabel}>Components</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="assignment" size={24} color={COLORS.success} />
            <Text style={styles.statNumber}>{dbData.submissions.length}</Text>
            <Text style={styles.statLabel}>Submissions</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="storage" size={24} color={COLORS.warning} />
            <Text style={styles.statNumber}>{asyncData.length}</Text>
            <Text style={styles.statLabel}>Storage Keys</Text>
          </View>
        </View>

        {/* Database Tables */}
        <DataTable
          title="Forms"
          data={filteredDbData.forms}
          icon="description"
          color={COLORS.primary}
          onRefresh={handleRefresh}
        />

        <DataTable
          title="Form Components"
          data={filteredDbData.formComponents}
          icon="widgets"
          color={COLORS.info}
          onRefresh={handleRefresh}
        />

        <DataTable
          title="Submissions"
          data={filteredDbData.submissions}
          icon="assignment"
          color={COLORS.success}
          onRefresh={handleRefresh}
        />

        {/* AsyncStorage Table */}
        <AsyncStorageTable
          data={asyncData}
          onRefresh={handleRefresh}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray[50],
  },
  clearButton: {
    backgroundColor: COLORS.error + '10',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  tableContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
    backgroundColor: COLORS.gray[50],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordCount: {
    fontSize: 12,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  columnToggle: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray[200],
  },
  refreshButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray[200],
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.disabled,
    fontStyle: 'italic',
  },
  columnHeaders: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cell: {
    padding: 12,
    minWidth: 120,
    maxWidth: 250,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  indexCell: {
    minWidth: 50,
    maxWidth: 50,
    backgroundColor: COLORS.gray[50],
  },
  headerCell: {
    backgroundColor: COLORS.gray[50],
  },
  actionCell: {
    minWidth: 60,
    maxWidth: 60,
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
  },
  columnHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowText: {
    fontSize: 12,
    color: COLORS.text.primary,
  },
  actionButton: {
    padding: 4,
  },
  expandedRow: {
    backgroundColor: COLORS.gray[50],
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  expandedField: {
    marginBottom: 6,
  },
  expandedKey: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  expandedValue: {
    fontSize: 11,
    color: COLORS.text.primary,
    fontFamily: 'monospace',
  },
  expandedJson: {
    fontSize: 11,
    color: COLORS.text.primary,
    fontFamily: 'monospace',
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 4,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.text.disabled,
  },
});

export default DataInspectorScreen;