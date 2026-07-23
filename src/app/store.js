import { configureStore } from '@reduxjs/toolkit';

import { authApi } from '../api';
import { formsApi } from '../api';
import { geoFenceApi } from '../api';

import { authReducer, locationReducer } from '../slice';
import { lovDataApi } from '../api/lovData.api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    [authApi.reducerPath]: authApi.reducer,
    [formsApi.reducerPath]: formsApi.reducer,
    [geoFenceApi.reducerPath]: geoFenceApi.reducer,
    [lovDataApi.reducerPath]: lovDataApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
      .concat(authApi.middleware)
      .concat(formsApi.middleware)
      .concat(geoFenceApi.middleware),
});
