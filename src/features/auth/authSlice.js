import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import TokenService from '../../services/storage/tokenService';

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
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
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
      });
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;