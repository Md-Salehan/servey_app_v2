import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../constants/api';
import TokenService from '../../services/storage/tokenService';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers) => {
      const token = await TokenService.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response) => {
        if (response.accessToken && response.refreshToken) {
          TokenService.setTokens(response.accessToken, response.refreshToken);
          TokenService.setUserData(response);
        }
        return response;
      },
      invalidatesTags: ['User'],
    }),
    
    // OTP APIs
    generateOTP: builder.mutation({
      query: ({ phone, password }) => ({
        url: '/otp/generate',
        method: 'POST',
        body: { phone, password },
      }),
    }),
    
    validateOTP: builder.mutation({
      query: ({ phone, otp }) => ({
        url: '/otp/validate',
        method: 'POST',
        body: { phone, otp },
      }),
      transformResponse: (response) => {
        if (response.accessToken && response.refreshToken) {
          TokenService.setTokens(response.accessToken, response.refreshToken);
          TokenService.setUserData(response);
        }
        return response;
      },
      invalidatesTags: ['User'],
    }),
    
    resendOTP: builder.mutation({
      query: (phone) => ({
        url: '/otp/resend',
        method: 'POST',
        body: { phone },
      }),
    }),
    
    getCurrentUser: builder.query({
      query: () => '/me',
      providesTags: ['User'],
    }),
    
    refreshToken: builder.mutation({
      query: (refreshData) => ({
        url: '/refresh',
        method: 'POST',
        body: refreshData,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGenerateOTPMutation,
  useValidateOTPMutation,
  useResendOTPMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useRefreshTokenMutation,
} = authApi;