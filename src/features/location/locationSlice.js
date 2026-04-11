// features/location/locationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/api';
import TokenService from '../../services/storage/tokenService';

const LOCATION_STORAGE_KEY = '@location_data';

// Async thunks for location APIs
export const fetchStates = createAsyncThunk(
  'location/fetchStates',
  async (censusYr = 2011) => {
    const token = await TokenService.getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/WGF00014/getAllStateByCensusYr`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiId: 'WGA00184',
          criteria: { censusYr },
        }),
      },
    );
    const data = await response.json();

    if (data.code === 0 && data.content?.qryRsltSet) {
      return data.content.qryRsltSet.map((item, id) => ({
        id: id + 1,
        code: item.stateCd,
        name: item.stateNm,
      }));
    }
    throw new Error(data.msg || 'Failed to fetch states');
  },
);

export const fetchDistricts = createAsyncThunk(
  'location/fetchDistricts',
  async ({ censusYr = 2011, stateCd }) => {
    if (!stateCd) return [];

    const token = await TokenService.getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/WGF00014/getAllDistCdByStateAndCensusYr`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiId: 'WGA00185',
          criteria: { censusYr, stateCd },
        }),
      },
    );
    const data = await response.json();

    if (data.code === 0 && data.content?.qryRsltSet) {
      return data.content.qryRsltSet
        .filter(item => item.distCd !== '320') // Filter out invalid entry
        .map((item, id) => ({
          id: id + 1,
          code: item.distCd,
          name: item.distNm,
        }));
    }
    throw new Error(data.msg || 'Failed to fetch districts');
  },
);

export const fetchSubDivisions = createAsyncThunk(
  'location/fetchSubDivisions',
  async ({ censusYr = 2011, stateCd, distCd }) => {
    const token = await TokenService.getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/WGF00004/getAllSubDivByStateAndCensusYrAndDist`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          body: JSON.stringify({
            apiId: 'WGA00072',
            criteria: { censusYr, stateCd, distCd },
          }),
        },
      },
    );
    const data = await response.json();

    if (data.code === 0 && data.content?.qryRsltSet) {
      return data.content.qryRsltSet.map((item, id) => ({
        id: id + 1,
        code: item.blkCd,
        name: item.blkNm,
      }));
    }
    throw new Error(data.msg || 'Failed to fetch blocks');
  },
);

export const fetchBlocks = createAsyncThunk(
  'location/fetchBlocks',
  async ({ censusYr = 2011, stateCd, distCd }) => {
    if (!stateCd || !distCd) return [];

    const token = await TokenService.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/WGF00014/getAllBlkCd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apiId: 'WGA00186',
        criteria: { censusYr, stateCd, distCd },
      }),
    });
    const data = await response.json();

    if (data.code === 0 && data.content?.qryRsltSet) {
      return data.content.qryRsltSet.map((item, id) => ({
        id: id + 1,
        code: item.blkCd,
        name: item.blkNm,
      }));
    }
    throw new Error(data.msg || 'Failed to fetch blocks');
  },
);

export const fetchPanchayats = createAsyncThunk(
  'location/fetchPanchayats',
  async ({ censusYr = 2011, stateCd, distCd, blkCd }) => {
    if (!stateCd || !distCd || !blkCd) return [];

    const token = await TokenService.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/WGF00014/getAllPanCd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apiId: 'WGA00187',
        criteria: { censusYr, stateCd, distCd, blkCd },
      }),
    });
    const data = await response.json();

    if (data.code === 0 && data.content?.qryRsltSet) {
      return data.content.qryRsltSet.map((item, id) => ({
        id: id + 1,
        code: item.panCd,
        name: item.panNm,
      }));
    }
    throw new Error(data.msg || 'Failed to fetch panchayats');
  },
);

export const fetchTowns = createAsyncThunk(
  'location/fetchTowns',
  async ({ censusYr = 2011, stateCd, distCd }) => {
    if (!stateCd || !distCd) return [];

    const token = await TokenService.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/WGF00022/getAllTownPlcn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apiId: 'WGA00115',
        criteria: { censusYr, stateCd, distCd },
      }),
    });
    const data = await response.json();
    console.log('fetchTownsxx', data);

    if (data.code === 0 && data.content?.qryRsltSet) {
      return data.content.qryRsltSet.map((item, id) => ({
        id: id + 1,
        code: item.plcn,
        name: item.townNm,
      }));
    }
    throw new Error(data.msg || 'Failed to fetch towns');
  },
);

export const fetchVillages = createAsyncThunk(
  'location/fetchVillages',
  async ({ censusYr = 2011, stateCd, distCd, blkCd, panCd }) => {
    if (!stateCd || !distCd || !blkCd || !panCd) return [];

    const token = await TokenService.getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/WGF00014/getAllMappedVillCd`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiId: 'WGA00188',
          criteria: { censusYr, stateCd, distCd, blkCd, panCd },
        }),
      },
    );
    const data = await response.json();

    if (data.code === 0 && data.content?.qryRsltSet) {
      return data.content.qryRsltSet.map((item, id) => ({
        id: id + 1,
        code: item.plcn,
        name: item.villNm,
      }));
    }
    throw new Error(data.msg || 'Failed to fetch villages');
  },
);

export const fetchWards = createAsyncThunk(
  'location/fetchWards',
  async ({ censusYr = 2011, stateCd, distCd, townCd }) => {
    if (!stateCd || !distCd || !townCd) return [];

    const token = await TokenService.getAccessToken();

    console.log('fetchWards payload-', {
      apiId: 'WGA00312',
      criteria: { censusYr, stateCd, distCd, plcn:townCd },
    });
    const response = await fetch(`${API_BASE_URL}/WGF00022/getAllWards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apiId: 'WGA00312',
        criteria: { censusYr, stateCd, distCd, plcn: townCd },
      }),
    });
    const data = await response.json();

    if (data.code === 0 && data.content?.qryRsltSet) {
      return data.content.qryRsltSet.map((item, id) => ({
        id: id + 1,
        code: item.wardNo,
        name: item.wardNm,
      }));
    }
    throw new Error(data.msg || 'Failed to fetch wards');
  },
);

// Save location selections to AsyncStorage
export const saveLocationSelections = createAsyncThunk(
  'location/saveSelections',
  async selections => {
    await AsyncStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(selections),
    );
    return selections;
  },
);

// Load saved location selections
export const loadLocationSelections = createAsyncThunk(
  'location/loadSelections',
  async () => {
    const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  },
);

// Clear location selections
export const clearLocationSelections = createAsyncThunk(
  'location/clearSelections',
  async () => {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    return null;
  },
);

const initialState = {
  // Selected values
  selections: {
    csLocType: 'R', // Default to Rural
    state: null,
    district: null,
    // subDivision: null,
    block: null,
    panchayat: null,
    village: null,
    town: null,
    ward: null,
  },

  // Lists data
  lists: {
    states: [],
    districts: [],
    // subDivision: [],
    blocks: [],
    panchayats: [],
    villages: [],
    towns: [],
    wards: [],
  },

  // Loading states
  loading: {
    states: false,
    districts: false,
    subDivision: false,
    blocks: false,
    panchayats: false,
    villages: false,
    towns: false,
    wards: false,
  },

  // Error states
  errors: {
    states: null,
    districts: null,
    // subDivision: null,
    blocks: null,
    panchayats: null,
    villages: null,
    towns: null,
    wards: null,
  },

  // Initialization state
  isInitialized: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCsLocType: (state, action) => {
      state.selections.csLocType = action.payload;
    },
    setState: (state, action) => {
      state.selections.state = action.payload;
      // Reset dependent selections
      state.selections.district = null;
      state.selections.block = null;
      state.selections.panchayat = null;
      state.selections.village = null;
      // Clear dependent lists
      state.lists.districts = [];
      state.lists.blocks = [];
      state.lists.panchayats = [];
      state.lists.villages = [];
      // Clear dependent errors
      state.errors.districts = null;
      state.errors.blocks = null;
      state.errors.panchayats = null;
      state.errors.villages = null;
    },
    setDistrict: (state, action) => {
      state.selections.district = action.payload;
      // Reset dependent selections
      state.selections.block = null;
      state.selections.panchayat = null;
      state.selections.village = null;
      // Clear dependent lists
      state.lists.blocks = [];
      state.lists.panchayats = [];
      state.lists.villages = [];
      // Clear dependent errors
      state.errors.blocks = null;
      state.errors.panchayats = null;
      state.errors.villages = null;
    },
    // setSubDivision: (state, action) => {
    //   state.selections.block = action.payload;
    // },

    setBlock: (state, action) => {
      state.selections.block = action.payload;
      // Reset dependent selections
      state.selections.panchayat = null;
      state.selections.village = null;
      // Clear dependent lists
      state.lists.panchayats = [];
      state.lists.villages = [];
      // Clear dependent errors
      state.errors.panchayats = null;
      state.errors.villages = null;
    },
    setPanchayat: (state, action) => {
      state.selections.panchayat = action.payload;
      // Reset dependent selections
      state.selections.village = null;
      // Clear dependent lists
      state.lists.villages = [];
      // Clear dependent errors
      state.errors.villages = null;
    },

    setTown: (state, action) => {
      state.selections.town = action.payload;
      // Reset dependent selections
      state.selections.ward = null;
      // Clear dependent lists
      state.lists.wards = [];
      // Clear dependent errors
      state.errors.wards = null;
    },

    setVillage: (state, action) => {
      state.selections.village = action.payload;
    },

    setWard: (state, action) => {
      state.selections.ward = action.payload;
    },
    resetLocationState: () => initialState,
    clearErrors: state => {
      state.errors = {
        states: null,
        districts: null,
        blocks: null,
        panchayats: null,
        villages: null,
        towns: null,
        wards: null,
      };
    },
  },
  extraReducers: builder => {
    builder
      // Fetch States
      .addCase(fetchStates.pending, state => {
        state.loading.states = true;
        state.errors.states = null;
      })
      .addCase(fetchStates.fulfilled, (state, action) => {
        state.loading.states = false;
        state.lists.states = action.payload;
        state.isInitialized = true;
      })
      .addCase(fetchStates.rejected, (state, action) => {
        state.loading.states = false;
        state.errors.states = action.error.message;
      })

      // Fetch Districts
      .addCase(fetchDistricts.pending, state => {
        state.loading.districts = true;
        state.errors.districts = null;
      })
      .addCase(fetchDistricts.fulfilled, (state, action) => {
        state.loading.districts = false;
        state.lists.districts = action.payload;
      })
      .addCase(fetchDistricts.rejected, (state, action) => {
        state.loading.districts = false;
        state.errors.districts = action.error.message;
      })

      // Fetch SubDivisions
      // .addCase(fetchSubDivisions.pending, state => {
      //   state.loading.subDivisions = true;
      //   state.errors.subDivisions = null;
      // })
      // .addCase(fetchSubDivisions.fulfilled, (state, action) => {
      //   state.loading.subDivisions = false;
      //   state.lists.subDivisions = action.payload;
      // })
      // .addCase(fetchSubDivisions.rejected, (state, action) => {
      //   state.loading.subDivisions = false;
      //   state.errors.subDivisions = action.error.message;
      // })

      // Fetch Blocks
      .addCase(fetchBlocks.pending, state => {
        state.loading.blocks = true;
        state.errors.blocks = null;
      })
      .addCase(fetchBlocks.fulfilled, (state, action) => {
        state.loading.blocks = false;
        state.lists.blocks = action.payload;
      })
      .addCase(fetchBlocks.rejected, (state, action) => {
        state.loading.blocks = false;
        state.errors.blocks = action.error.message;
      })

      // Fetch Panchayats
      .addCase(fetchPanchayats.pending, state => {
        state.loading.panchayats = true;
        state.errors.panchayats = null;
      })
      .addCase(fetchPanchayats.fulfilled, (state, action) => {
        state.loading.panchayats = false;
        state.lists.panchayats = action.payload;
      })
      .addCase(fetchPanchayats.rejected, (state, action) => {
        state.loading.panchayats = false;
        state.errors.panchayats = action.error.message;
      })

      // Fetch Towns
      .addCase(fetchTowns.pending, state => {
        state.loading.towns = true;
        state.errors.towns = null;
      })
      .addCase(fetchTowns.fulfilled, (state, action) => {
        state.loading.towns = false;
        state.lists.towns = action.payload;
      })
      .addCase(fetchTowns.rejected, (state, action) => {
        state.loading.towns = false;
        state.errors.towns = action.error.message;
      })

      // Fetch Villages
      .addCase(fetchVillages.pending, state => {
        state.loading.villages = true;
        state.errors.villages = null;
      })
      .addCase(fetchVillages.fulfilled, (state, action) => {
        state.loading.villages = false;
        state.lists.villages = action.payload;
      })
      .addCase(fetchVillages.rejected, (state, action) => {
        state.loading.villages = false;
        state.errors.villages = action.error.message;
      })

      // Fetch Wards
      .addCase(fetchWards.pending, state => {
        state.loading.wards = true;
        state.errors.wards = null;
      })
      .addCase(fetchWards.fulfilled, (state, action) => {
        state.loading.wards = false;
        state.lists.wards = action.payload;
      })
      .addCase(fetchWards.rejected, (state, action) => {
        state.loading.wards = false;
        state.errors.wards = action.error.message;
      })

      // Load saved selections
      .addCase(loadLocationSelections.fulfilled, (state, action) => {
        if (action.payload) {
          state.selections = action.payload;
        }
      })

      // Save selections to storage
      .addCase(saveLocationSelections.fulfilled, (state, action) => {
        // State already updated, just confirming save
      })

      // Clear selections
      .addCase(clearLocationSelections.fulfilled, state => {
        state.selections = {
          csLocType: 'R',
          state: null,
          district: null,
          block: null,
          panchayat: null,
          towns: null,
          village: null,
          ward: null,
        };
        state.lists = {
          ...state.lists,
          districts: [],
          blocks: [],
          panchayats: [],
          towns: [],
          villages: [],
          wards: [],
        };
      });
  },
});

export const {
  setCsLocType,
  setState,
  setDistrict,
  setBlock,
  setPanchayat,
  setTown,
  setVillage,
  setWard,
  resetLocationState,
  clearErrors,
} = locationSlice.actions;

export default locationSlice.reducer;
