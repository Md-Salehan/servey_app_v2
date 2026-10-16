// lovData.api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../constants/api';
import { TokenService } from '../services';



const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async headers => {
    const token = await TokenService.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const lovDataApi = createApi({
  reducerPath: 'lovDataApi',
  baseQuery,
  tagTypes: ['lovData'],
  endpoints: builder => ({
    getLovData: builder.mutation({
      query: payload => {
        console.log(
          '🔵 API Request - URL:',
          `${API_BASE_URL}/SUF00191/getLovDataRender`,
          payload,
        );
        return {
          url: '/SUF00191/getLovDataRender',
          method: 'POST',
          body: payload,
        };
      },
      providesTags: ['lovData'],
      transformResponse: response => {
        console.log('🟢 API Response received:', response);

        // Handle the response structure
        if (response?.appMsgList?.errorStatus === false) {
          // Extract the data from the response
          const qryRsltSet = response?.content?.qryRsltSet || [];

          // If we have data, process it
          if (qryRsltSet.length > 0) {
            // Extract keys from first data item
            const keys = Object.keys(qryRsltSet[0]);

            return {
              success: true,
              error: null,
              data: qryRsltSet,
              keys: keys,
              primaryKey: keys[0] || '',
              displayKey: keys[1] || keys[0] || '',
              columns: keys.map((key, index) => ({
                key: key,
                title: key
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' '),
                width: index === 0 ? 80 : 150,
              })),
            };
          }

          return {
            success: false,
            error: 'No data found',
            data: [],
            keys: [],
            primaryKey: '',
            displayKey: '',
            columns: [],
          };
        } else {
          // Handle error case
          const errorMsg =
            response?.appMsgList?.list?.[0]?.errDesc || 'Failed to load data';
          return {
            success: false,
            error: errorMsg,
            data: [],
            keys: [],
            primaryKey: '',
            displayKey: '',
            columns: [],
          };
        }
      },
      transformErrorResponse: response => {
        console.error('🔴 API Error:', response);
        return {
          success: false,
          error:
            response?.data?.message || 'An error occurred while fetching data',
          data: [],
          keys: [],
          primaryKey: '',
          displayKey: '',
          columns: [],
        };
      },
    }),
  }),
});

export const { useGetLovDataMutation } = lovDataApi;
