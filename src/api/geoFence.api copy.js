import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../constants/api';
import { TokenService } from '../services';
// Add mock data for testing
// const testToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vMX4yMDI2MDMzMTAwMDAwMDAwMDAwMX5OIiwiaXNzIjoiU2ltYXBob3JlIiwiaWF0IjoxNzc0OTQ1MTc4LCJleHAiOjE3NzQ5NjMxNzh9.MtuD-GunIsL_JD9RaZCG_yVTXNhuj8HsMzCLKfunmDo'
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async headers => {
    // ✅ FIX: Make this async and await the token
    const token = await TokenService.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const geoFenceApi = createApi({
  reducerPath: 'geoFenceApi',
  baseQuery,
  tagTypes: ['GeoFence'],
  endpoints: builder => ({
    getFenceData: builder.mutation({
      query: payload => {
        console.log(
          '🔵 API Request - URL:',
          `${API_BASE_URL}/SUF00191/getUserJuridiction`,
          payload
        );
        return {
          url: '/SUF00191/getUserJuridiction',
          method: 'POST',
          body: payload,
        };
      },
      providesTags: ['GeoFence'],
      transformResponse: response => {
        let data = response || {};
        let result = {
          geoJSONsArray: [],
          success: false,
          message: 'Failed to fetch GeoFence data',
          isMapped: false,
        };

        if (data?.appMsgList?.errorStatus === false && data.content?.mst?.length ) {
          result = {
            geoJSONsArray: data.content.mst.map(item => ({
              ...item?.geojson,
            })) || [],
            success: true, 
            message: 'GeoFence data fetched successfully',
            isMapped: true,
          };
        }else{
          result = {
            geoJSONsArray: [],
            success: false,
            message: data?.appMsgList?.list[0]?.errDesc || 'Failed to fetch GeoFence data',
            isMapped: data?.appMsgList?.list[0]?.errCd === "CMAE000094" ? true : false,
          };

        }
        
        return result;
      },
      transformErrorResponse: response => {
        console.error('🔴 API Error:', response);
        return response;
      },
    }),

  }),
});

export const { 
  useGetFenceDataMutation,

 } = geoFenceApi;
