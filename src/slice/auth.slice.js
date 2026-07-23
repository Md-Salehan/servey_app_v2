// src/slice/auth.slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TokenService } from '../services'; 

// Async thunk for initializing auth state
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const isAuthenticated = await TokenService.isAuthenticated();
    const userData = await TokenService.getUserData();
    return { isAuthenticated, userData };
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await TokenService.clearTokens();
    return true;
  }
);

// New thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { getState }) => {
    const currentUser = getState().auth.user;
    const updatedUser = { ...currentUser, ...userData };
    await TokenService.setUserData(updatedUser);
    return updatedUser;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      // Persist to AsyncStorage
      TokenService.setUserData(action.payload);
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    updateUserField: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Persist to AsyncStorage
        TokenService.setUserData(state.user);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.userData;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { setUser, clearAuth, updateUserField } = authSlice.actions;
export default authSlice.reducer;