// LOVMaster.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import LOVField from './LOVField';
import { useGetLovDataMutation } from '../../api/lovData.api';
import { COLORS } from '../../constants/colors';
import { LovCacheService } from '../../services';
import { useInternetStatus } from '../../hook';

const response = {
  departmentData: {
    success: true,
    error: '',
    data: [
      {
        id: 1,
        name: 'Engineering',
        code: 'ENG',
        location: 'Building A',
      },
      {
        id: 2,
        name: 'Sales',
        code: 'SAL',
        location: 'Building B',
      },
      {
        id: 3,
        name: 'Marketing',
        code: 'MKT',
        location: 'Building C',
      },
      {
        id: 4,
        name: 'Human Resources',
        code: 'HR',
        location: 'Building A',
      },
    ],
    keys: ['id', 'name', 'code', 'location'],
    primaryKey: 'id',
    displayKey: 'name',
    columns: [
      {
        key: 'id',
        title: 'Id',
        // width: 80,
      },
      {
        key: 'name',
        title: 'Name',
        // width: 150,
      },
      // {
      //   key: 'code',
      //   title: 'Code',
      //   width: 150,
      // },
      // {
      //   key: 'location',
      //   title: 'Location',
      //   width: 150,
      // },
    ],
  },
  allEmployees: {
    success: true,
    error: '',
    data: [
      {
        id: 101,
        name: 'Alice Johnson',
        email: 'alice@eng.com',
        parentId: 1,
      },
      {
        id: 102,
        name: 'Bob Smith',
        email: 'bob@eng.com',
        parentId: 1,
      },
      {
        id: 103,
        name: 'Carol Davis',
        email: 'carol@eng.com',
        parentId: 1,
      },
      {
        id: 104,
        name: 'David Miller',
        email: 'david@eng.com',
        parentId: 1,
      },
      {
        id: 201,
        name: 'Eva Garcia',
        email: 'eva@sales.com',
        parentId: 2,
      },
      {
        id: 202,
        name: 'Frank Chen',
        email: 'frank@sales.com',
        parentId: 2,
      },
      {
        id: 203,
        name: 'Grace Lee',
        email: 'grace@sales.com',
        parentId: 2,
      },
      {
        id: 301,
        name: 'Henry Wilson',
        email: 'henry@mkt.com',
        parentId: 3,
      },
      {
        id: 302,
        name: 'Ivy Martinez',
        email: 'ivy@mkt.com',
        parentId: 3,
      },
      {
        id: 401,
        name: 'Jack Taylor',
        email: 'jack@hr.com',
        parentId: 4,
      },
      {
        id: 402,
        name: 'Karen White',
        email: 'karen@hr.com',
        parentId: 4,
      },
    ],
    keys: ['id', 'name', 'email'],
    primaryKey: 'id',
    displayKey: 'name',
    columns: [
      {
        key: 'id',
        title: 'Id',
        // width: 80,
      },
      {
        key: 'name',
        title: 'Name',
        // width: 150,
      },
      {
        key: 'email',
        title: 'Email',
        // width: 150,
      },
    ],
  },
  allProjects: {
    success: true,
    error: '',
    data: [
      {
        id: 1,
        name: 'Mobile App Development',
        parentId: 101, // Changed from 1 to 101 (Alice Johnson's employee ID)
        status: 'Active',
      },
      {
        id: 2,
        name: 'Cloud Migration',
        parentId: 101, // Changed from 1 to 101 (Alice Johnson's employee ID)
        status: 'Planning',
      },
      {
        id: 3,
        name: 'Q4 Sales Campaign',
        parentId: 201, // Changed from 2 to 201 (Eva Garcia's employee ID)
        status: 'Active',
      },
      {
        id: 4,
        name: 'Market Research',
        parentId: 201, // Changed from 2 to 201 (Eva Garcia's employee ID)
        status: 'Completed',
      },
      {
        id: 5,
        name: 'Brand Refresh',
        parentId: 301, // Changed from 3 to 301 (Henry Wilson's employee ID)
        status: 'Active',
      },
      {
        id: 6,
        name: 'Employee Wellness Program',
        parentId: 401, // Changed from 4 to 401 (Jack Taylor's employee ID)
        status: 'Planning',
      },
    ],
    keys: ['id', 'name', 'parentId', 'status'],
    primaryKey: 'id',
    displayKey: 'name',
    columns: [
      {
        key: 'id',
        title: 'Id',
        // width: 80,
      },
      {
        key: 'name',
        title: 'Name',
        // width: 150,
      },
      // {
      //   key: 'parentId',
      //   title: 'EmployeeId', // Changed from 'DepartmentId' to 'EmployeeId'
      //   // width: 150,
      // },
      // {
      //   key: 'status',
      //   title: 'Status',
      //   width: 150,
      // },
    ],
  },
};

const LOVMaster = ({
  fcId,
  label,
  required,
  disabled = false,
  placeholder = 'Select value',
  multiple = false,
  maxSelections = 1,
  value = null,
  parentValue = null,
  searchable = true,
  searchPlaceholder = 'Search...',
  onChange,
  onError,
  query,
  parId,
  isDependent = false,
  depParId = null,
  appId,
  formId,
  isPreview = false,
  errorText = '',
  payload = null,
  sampleDataType = 'allProjects', // Default to 'allProjects' if not provided
  database = null, // Database instance for caching
  depColNm = '', // New prop for dependent column name
}) => {
  // Internal state for LOV data

  const [loadedLovData, setLoadedLovData] = useState({});
  const [rowData, setRowData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [primaryKey, setPrimaryKey] = useState('');
  const [displayKey, setDisplayKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorText || null);

  const { isOnline, isChecking } = useInternetStatus();

  // Cache to avoid unnecessary re-fetches for the same (fcId + parentValue)
  const cacheRef = useRef(new Map());

  const [getLovData] = useGetLovDataMutation();

  const lovCacheService = useMemo(() => {
    if (database) {
      return new LovCacheService(database);
    }
    return null;
  }, [database]);

  const loadFromDatabase = useCallback(async () => {
    if (!lovCacheService) return null;
    return await lovCacheService.loadLovCache({
      appId,
      formId,
      fcId,
      parId,
      query,
      // parentValue,
    });
  }, [lovCacheService, appId, formId, fcId, parId, query, parentValue]);

  const saveToDatabase = useCallback(
    async (data, cols, pKey, dKey) => {
      if (!lovCacheService) return;
      await lovCacheService.saveLovCache({
        appId,
        formId,
        fcId,
        parId,
        query,
        // parentValue,
        data,
        columns: cols,
        primaryKey: pKey,
        displayKey: dKey,
      });
    },
    [lovCacheService, appId, formId, fcId, parId, query, parentValue],
  );

  const dependencyValues = useMemo(() => {
    if (isDependent && parentValue) {
      return [parentValue];
    }
    return [];
  }, [isDependent, parentValue]);

  // Build cache key
  const getCacheKey = useCallback(() => {
    return `${fcId}_${parentValue || 'independent'}`;
  }, [fcId, parentValue]);

  const handleProcessedState = result => {
    console.log('handleProcessedState...', fcId);

    if (!result) return;
    if (result?.success) {
      let loadedData = result?.data || [];
      if (isDependent && parentValue) {
        // Filter data based on parentValue for dependent LOVs
        loadedData = loadedData.filter(item => item.parentId === parentValue);
      }
      setRowData(loadedData);
      setColumns(result?.columns);
      setPrimaryKey(result?.primaryKey);
      setDisplayKey(result?.displayKey);
      setError(null);
    } else {
      setRowData([]);
      setColumns([]);
      setPrimaryKey('');
      setDisplayKey('');
      setError(null);
    }
  };

  // Load LOV data
  const loadLovData = async () => {
    if (!query || !parId) {
      return;
    }

    console.log('loadLovData..........', fcId, isOnline);

    const cacheKey = getCacheKey();

    // 1. Check in-memory cache
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      return cached;
    }

    // 2. Check database cache
    if (database && !isOnline) {
      const dbCache = await loadFromDatabase();
      if (dbCache) {
        cacheRef.current.set(cacheKey, dbCache);
        return dbCache;
      }
    }

    // 3. Not in cache – fetch from API
    setLoading(true);
    setError(null);
    let FinalResult = {
      success: false,
      error: 'No data found',
      data: [],
      keys: [],
      primaryKey: '',
      displayKey: '',
      columns: [],
    };

    try {
      const load = payload || {
        apiId: 'SUA00827',
        mst: {
          appId,
          formId,
          fcId,
          parId,
          query,
          depColNm,
          parentParId: isDependent ? depParId : null,
        },
      };

      let result = response[sampleDataType] ||
        (await getLovData(load).unwrap()) || {
          success: false,
          error: 'No data found',
          data: [],
          keys: [],
          primaryKey: '',
          displayKey: '',
          columns: [],
        };

      if (result.success) {
        // Store in cache
        cacheRef.current.set(cacheKey, {
          data: result.data,
          columns: result.columns,
          primaryKey: result.primaryKey,
          displayKey: result.displayKey,
        });

        // Save to database cache
        if (database) {
          await saveToDatabase(
            result.data,
            result.columns,
            result.primaryKey,
            result.displayKey,
          );
        }

        FinalResult = result;
      } else {
        const errorMsg = result.error || 'Failed to load data';
        if (onError) onError(fcId, errorMsg);
        FinalResult.error = errorMsg;
      }
    } catch (err) {
      const errorMsg =
        err?.data?.message || 'Failed to load data. Please try again.';
      if (onError) onError(fcId, errorMsg);
      FinalResult.error = errorMsg;
    } finally {
      setLoading(false);
    }
    return FinalResult;
  };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    (async () => {
      const res = await loadLovData();
      setLoadedLovData(res);
    })();
  }, []);

  // Re-fetch when parentValue changes (for dependent LOVs)
  useEffect(() => {
    handleProcessedState(loadedLovData);
  }, [parentValue, isDependent, loadedLovData]);

  // Handle retry
  const handleRetry = useCallback(() => {
    loadLovData();
  }, [loadLovData]);

  // Handle value change
  const handleChange = useCallback(
    newValue => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange],
  );

  // Render loading state
  if (loading) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ marginBottom: 4, fontSize: 14, color: '#333' }}>
          {label}
          {required && <Text style={{ color: 'red' }}> *</Text>}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
            backgroundColor: '#f5f5f5',
            borderRadius: 4,
          }}
        >
          <ActivityIndicator size="small" color={COLORS.primary || '#007AFF'} />
          <Text style={{ marginLeft: 8, color: '#666' }}>
            Loading options...
          </Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error && !isPreview) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ marginBottom: 4, fontSize: 14, color: '#333' }}>
          {label}
          {required && <Text style={{ color: 'red' }}> *</Text>}
        </Text>
        <View
          style={{ padding: 8, backgroundColor: '#ffebee', borderRadius: 4 }}
        >
          <Text style={{ color: '#d32f2f', fontSize: 14 }}>{error}</Text>
          <TouchableOpacity style={{ marginTop: 4 }} onPress={handleRetry}>
            <Text style={{ color: COLORS.primary || '#007AFF', fontSize: 12 }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If no data and not loading, show empty state (only when not preview)
  if (!rowData.length && !isPreview && !loading && !error) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ marginBottom: 4, fontSize: 14, color: '#333' }}>
          {label}
          {required && <Text style={{ color: 'red' }}> *</Text>}
        </Text>
        <View
          style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}
        >
          <Text style={{ color: '#999', fontSize: 14 }}>
            No options available
          </Text>
        </View>
      </View>
    );
  }

  // Common LOVField props
  const lovFieldProps = {
    fcId,
    label,
    placeholder,
    data: rowData,
    columns,
    value,
    onChange: handleChange,
    multiple,
    required,
    disabled,
    searchable,
    searchPlaceholder,
    maxSelections,
    displayKey,
    primaryKey,
    showSelectionCount: true,
    modalTitle: `Select ${label}`,
    loading,
    emptyMessage: error || 'No data available',
    onError,
  };

  // Render preview mode
  if (isPreview) {
    return <LOVField {...lovFieldProps} isPreview={true} />;
  }

  // Render edit mode
  return (
    <LOVField
      {...lovFieldProps}
      isPreview={false}
      dependencyValues={dependencyValues}
    />
  );
};

export default LOVMaster;
