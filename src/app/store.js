import { configureStore } from '@reduxjs/toolkit';

import { authApi } from '../api';
import { formsApi } from '../api';
import { geoFenceApi } from '../api';

import authReducer from '../features/auth/authSlice';
import locationReducer from '../features/location/locationSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    [authApi.reducerPath]: authApi.reducer,
    [formsApi.reducerPath]: formsApi.reducer,
    [geoFenceApi.reducerPath]: geoFenceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
    .concat(authApi.middleware)
    .concat(formsApi.middleware)
    .concat(geoFenceApi.middleware),
});