import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../constants/api';
import { TokenService } from '../services';

const res = {
  msg: 'Successful operation',
  code: 0,
  appMsgList: {
    errorStatus: false,
    list: [
      {
        errCd: 'CMAI000008',
        errDesc: 'Record/Records Found',
        errType: 'AI',
      },
    ],
  },
  content: {
    mst: {
      appId: 'AP000001',
      appDesc: 'SCPL Generic Mobile APP',
      formId: 'F0000025',
      formNm: 'TESTING...',
      dtl01: [
        {
          fcId: 'C0001',
          compSlNo: 1,
          compTyp: '07',
          compTypTxt: 'Image',
          colTyp: 'T',
          colSize: '1000',
          props: {
            allowedTypes: '',
            needLocation: 'Y',
            sourceType: 'G',
            multiple: 'Y',
            label: 'Image Upload',
            maxFileSize: '5',
            maxImages: '5',
            imageQuality: '',
            required: 'N',
          },
        },
        {
          fcId: 'C0002',
          compSlNo: 1,
          compTyp: '07',
          compTypTxt: 'Image',
          colTyp: 'T',
          colSize: '1000',
          props: {
            allowedTypes: '',
            needLocation: 'Y',
            sourceType: 'C',
            multiple: 'N',
            label: 'Image Upload 2',
            maxFileSize: '5',
            maxImages: '1',
            imageQuality: '',
            required: 'N',
          },
        },
        {
          fcId: 'C0003',
          compSlNo: 2,
          compTyp: '07',
          compTypTxt: 'Image',
          colTyp: 'T',
          colSize: '1000',
          props: {
            allowedTypes: '',
            needLocation: 'Y',
            sourceType: 'B',
            multiple: '5',
            label: 'Image Upload 3',
            maxFileSize: '5',
            maxImages: '8',
            imageQuality: '',
            required: 'Y',
          },
        },
      ],
      dtl02: [],
    },
  },
};

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

export const formsApi = createApi({
  reducerPath: 'formsApi',
  baseQuery,
  tagTypes: ['Forms'],
  endpoints: builder => ({
    getForms: builder.mutation({
      query: formData => {
        console.log(
          '🔵 API Request - URL:',
          `${API_BASE_URL}/SUF00191/getAllAppUserFormInfo`,
        );
        console.log('🔵 API Request - Payload:', formData);
        return {
          url: '/SUF00191/getAllAppUserFormInfo',
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
            status: item.surFormGenFlg === 'Y' ? 'active' : 'inActive',
            priority: '', // item.priority || 'medium' || 'low' || 'high',
            totalFields: 18,
            estimatedTime: 15,
            completionRate: 85,
            deadline: Date.now(),
            surFormGenFlg: item.surFormGenFlg,
            createdAt: '2024-01-12T11:45:00Z',
          }));
        }
        return data;
      },
    }),
    getFormComponents: builder.mutation({
      query: formData => {
        console.log(
          '🔵 Form Components API Request - URL:',
          `${API_BASE_URL}/SUF00191/getAllFormComponents`,
        );
        console.log('🔵 Form Components API Request - Payload:', formData);

        return {
          url: '/SUF00191/getAllFormComponents',
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: response => {
        console.log('🟢 Form Components API Response:', response);
        let list = response?.content?.mst?.dtl01 || [];
        list = [
          ...list,
          {
            fcId: 'C0006',
            compSlNo: 100,
            compTyp: '11',
            compTypTxt: 'Lov',
            props: {
              label: 'Module Group',
              query: 'string',
              disabled: 'N',
              required: 'Y',
              parId: 'mod_grp_id',
              isDependent: 'N',
              depParId: '',
              multiple: 'N',
              maxSelections: '1',
              placeholder: '',
              searchable: 'Y',
              searchPlaceholder: '',
              value: null,
              
              payload: {
                apiId: 'SUA00827',
                mst: {
                  parId: 'mod_grp_id',
                  qryId: 'QRY/000017',
                  qryParam: [
                    {
                      parId: '',
                      parVal: '',
                    },
                  ],
                },
              },
            },
          },
          {
            fcId: 'C0007',
            compSlNo: 101,
            compTyp: '11',
            compTypTxt: 'Lov',
            props: {
              label: 'Dependent Module Group',
              query: 'string',
              disabled: 'N',
              required: 'Y',
              parId: 'dependent_module_group',
              isDependent: 'Y',
              depParId: 'mod_grp_id',
              multiple: 'Y',
              maxSelections: '2',
              placeholder: '',
              searchable: 'Y',
              searchPlaceholder: 'Search Value',
              value: null,

              payload: {
                apiId: 'SUA00827',
                mst: {
                  parId: 'mod_id',
                  qryId: 'QRY/000017',
                  qryParam: [
                    {
                      parId: 'mod_grp_id',
                      parVal: 'MG001',
                    },
                  ],
                },
              },
            },
          },
        ];

        response.content.mst.dtl01 = list;
        return response;
      },
      transformErrorResponse: response => {
        console.error('🔴 Form Components API Error:', response);
        return response;
      },
    }),
    surveyFormSubmit: builder.mutation({
      query: formData => ({
        url: '/SUF00191/surveyFormSubmit',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetFormsMutation,
  useGetFormComponentsMutation,
  useSurveyFormSubmitMutation,
} = formsApi;
