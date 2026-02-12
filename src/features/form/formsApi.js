import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../constants/api';
import TokenService from '../../services/storage/tokenService';

// Add mock data for testing

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers) => {
    // ✅ FIX: Make this async and await the token
    const token = await TokenService.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const formsApi = createApi({
  reducerPath: 'formsApi',
  baseQuery,
  tagTypes: ['Forms'],
  endpoints: builder => ({
    getForms: builder.mutation({
      query: formData => {
        console.log(
          '🔵 API Request - URL:',
          `${API_BASE_URL}/SUF00191/getAllAppFormInfo`,
        );
        console.log('🔵 API Request - Payload:', formData);
        return {
          url: '/SUF00191/getAllAppFormInfo',
          method: 'POST',
          body: formData,
        };
      },
      providesTags: ['Forms'],
      transformResponse: response => {
        let data = response || {};
        if (data?.appMsgList?.errorStatus === false) {
          data.content.qryRsltSet = data.content?.qryRsltSet?.map(item => ({
            id: item.formId,
            title: item.formNm,
            formId: item.formId,
            formNm: item.formNm,
            description:
              "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s",
            status: 'active',
            priority: 'high',
            totalFields: 18,
            estimatedTime: 15,
            completionRate: 85,
            deadline: '2024-01-25',
            createdAt: '2024-01-12T11:45:00Z',
          }));
        }
        return data;
      },
    }),
  }),
});

export const { useGetFormsMutation } = formsApi;
