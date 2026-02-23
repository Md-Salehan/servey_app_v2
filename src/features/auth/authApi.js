import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  API_BASE_URL, 
  API_IDS,
  APP_ID,
  OTP_TYPE_CODES,
  API_ENDPOINTS
} from '../../constants/api';
import TokenService from '../../services/storage/tokenService';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers) => {
    // const token = await TokenService.getAccessToken();
    // if (token) {
    //   headers.set('Authorization', `Bearer ${token}`);
    // }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['User', 'OTPConfig'],
  endpoints: (builder) => ({
    // Stage 1: Get OTP Configuration
    getOtpConfig: builder.query({
      query: () => ({
        url: API_ENDPOINTS.GET_OTP_CONFIG,
        method: 'POST',
        body: {
          apiId: API_IDS.GET_OTP_CONFIG,
          mst: {
            otpTypCd: OTP_TYPE_CODES.LOGIN,
          },
        },
      }),
      providesTags: ['OTPConfig'],
      transformResponse: (response) => {
        if (response.code === 0 && response.content?.mst) {
          return {
            // otpMobFlg: response.content.mst.otpMobFlg === 'Y',
            // otpEmailFlg: response.content.mst.otpEmailFlg === 'Y',
            // userOptnSelFlg: response.content.mst.userOptnSelFlg === 'Y',
            otpMobFlg: true,
            otpEmailFlg: true,
            userOptnSelFlg: true,
          };
        }
        throw new Error(response.msg || 'Failed to get OTP configuration');
      },
    }),

    // Stage 2: Get OTP Session Log Number
    getOtpLogNo: builder.mutation({
      query: ({ phone, email, otpMobFlg, otpEmailFlg, otpOptnChngFlg = 'N' }) => ({
        url: API_ENDPOINTS.GET_OTP_LOG_NO,
        method: 'POST',
        body: {
          apiId: API_IDS.GET_OTP_LOG_NO,
          mst: {
            emailId: email || '',
            mobNo: phone,
            otpEmailFlg: otpEmailFlg ? 'Y' : 'N',
            otpMobFlg: otpMobFlg ? 'Y' : 'N',
            otpOptnChngFlg: otpOptnChngFlg,
            otpTypCd: OTP_TYPE_CODES.LOGIN,
            refApiId: API_IDS.GET_OTP_CONFIG,
          },
        },
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.content?.mst?.optnChngLogNo) {
          return {
            optnChngLogNo: response.content.mst.optnChngLogNo,
          };
        }
        throw new Error(response.msg || 'Failed to get OTP log number');
      },
    }),

    // Stage 3: Generate Login OTP
    generateLoginOTP: builder.mutation({
      query: ({ phone, email, optnChngLogNo }) => ({
        url: API_ENDPOINTS.GENERATE_LOGIN_OTP,
        method: 'POST',
        body: {
          apiId: API_IDS.GENERATE_LOGIN_OTP,
          mst: {
            appId: APP_ID,
            emailId: email || '',
            mobNo: phone,
            optnChngLogNo,
          },
        },
      }),
      transformResponse: (response) => {
        if (response.code === 0) {
          return { 
            success: true, 
            message: response.appMsgList?.list?.[0]?.errDesc || 'OTP sent successfully' 
          };
        }
        throw new Error(response.msg || 'Failed to generate OTP');
      },
    }),

    // Stage 4: Validate OTP and Login
    validateLoginOTP: builder.mutation({
      query: ({ 
        phone, 
        email, 
        mobOtp, 
        emailOtp, 
        optnChngLogNo 
      }) => ({
        url: API_ENDPOINTS.VALIDATE_LOGIN_OTP,
        method: 'POST',
        body: {
          apiId: API_IDS.VALIDATE_LOGIN_OTP,
          mst: {
            appId: APP_ID,
            emailId: email || '',
            emailIdOtp: emailOtp || '',
            mobNo: phone,
            mobNoOtp: mobOtp || '',
            optnChngLogNo,
          },
        },
      }),
      transformResponse: async (response) => {
        if (response.code === 0 && response.content?.mst?.token) {
          const userData = response.content.mst;
          const token = userData.token;
          
          // Store token and user data
          await TokenService.setTokens(token, token);
          await TokenService.setUserData(userData);
          
          return { 
            success: true, 
            user: userData,
            token 
          };
        }
        throw new Error(response.msg || 'OTP validation failed');
      },
      invalidatesTags: ['User'],
    }),

    // Legacy endpoints for backward compatibility
    login: builder.mutation({
      query: (credentials) => ({
        url: API_ENDPOINTS.LOGIN,
        method: 'POST',
        body: credentials,
      }),
      transformResponse: async (response) => {
        if (response.accessToken && response.refreshToken) {
          await TokenService.setTokens(response.accessToken, response.refreshToken);
          await TokenService.setUserData(response);
        }
        return response;
      },
      invalidatesTags: ['User'],
    }),
    
    getCurrentUser: builder.query({
      query: () => API_ENDPOINTS.ME,
      providesTags: ['User'],
    }),
    
    refreshToken: builder.mutation({
      query: (refreshData) => ({
        url: API_ENDPOINTS.REFRESH,
        method: 'POST',
        body: refreshData,
      }),
    }),
  }),
});

export const {
  useGetOtpConfigQuery,
  useGetOtpLogNoMutation,
  useGenerateLoginOTPMutation,
  useValidateLoginOTPMutation,
  useLoginMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useRefreshTokenMutation,
} = authApi;
