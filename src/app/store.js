import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/authApi';
import { formsApi } from '../features/form/formsApi';
import { formComponentsApi } from '../features/form/formComponentsApi'; 
import authReducer from '../features/auth/authSlice';
import locationReducer from '../features/location/locationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    [authApi.reducerPath]: authApi.reducer,
    [formsApi.reducerPath]: formsApi.reducer,
    [formComponentsApi.reducerPath]: formComponentsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
    .concat(authApi.middleware)
    .concat(formsApi.middleware)
    .concat(formComponentsApi.middleware),
});