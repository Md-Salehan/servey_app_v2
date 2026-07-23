// lovData.api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../constants/api';
import { TokenService } from '../services';

// Sample data - Departments
const sampleData = {
  departmentData: [
    { id: 1, name: 'Engineering', code: 'ENG', location: 'Building A' },
    { id: 2, name: 'Sales', code: 'SAL', location: 'Building B' },
    { id: 3, name: 'Marketing', code: 'MKT', location: 'Building C' },
    { id: 4, name: 'Human Resources', code: 'HR', location: 'Building A' },
  ],

  // Sample data - Employees (dependent on department)
  allEmployees: [
    // Engineering
    {
      id: 101,
      name: 'Alice Johnson',
      email: 'alice@eng.com',
      departmentId: 1,
      role: 'Senior Developer',
      projectId: 1,
    },
    {
      id: 102,
      name: 'Bob Smith',
      email: 'bob@eng.com',
      departmentId: 1,
      role: 'Developer',
      projectId: 1,
    },
    {
      id: 103,
      name: 'Carol Davis',
      email: 'carol@eng.com',
      departmentId: 1,
      role: 'QA Engineer',
      projectId: 2,
    },
    {
      id: 104,
      name: 'David Miller',
      email: 'david@eng.com',
      departmentId: 1,
      role: 'DevOps',
      projectId: 2,
    },
    // Sales
    {
      id: 201,
      name: 'Eva Garcia',
      email: 'eva@sales.com',
      departmentId: 2,
      role: 'Sales Manager',
      projectId: 3,
    },
    {
      id: 202,
      name: 'Frank Chen',
      email: 'frank@sales.com',
      departmentId: 2,
      role: 'Account Executive',
      projectId: 3,
    },
    {
      id: 203,
      name: 'Grace Lee',
      email: 'grace@sales.com',
      departmentId: 2,
      role: 'Sales Representative',
      projectId: 4,
    },
    // Marketing
    {
      id: 301,
      name: 'Henry Wilson',
      email: 'henry@mkt.com',
      departmentId: 3,
      role: 'Marketing Director',
      projectId: 4,
    },
    {
      id: 302,
      name: 'Ivy Martinez',
      email: 'ivy@mkt.com',
      departmentId: 3,
      role: 'Content Strategist',
      projectId: 5,
    },
    // HR
    {
      id: 401,
      name: 'Jack Taylor',
      email: 'jack@hr.com',
      departmentId: 4,
      role: 'HR Manager',
      projectId: 5,
    },
    {
      id: 402,
      name: 'Karen White',
      email: 'karen@hr.com',
      departmentId: 4,
      role: 'Recruiter',
      projectId: 6,
    },
  ],

  // Sample data - Projects (dependent on department)
  allProjects: [
    {
      id: 1,
      name: 'Mobile App Development',
      departmentId: 1,
      status: 'Active',
    },
    { id: 2, name: 'Cloud Migration', departmentId: 1, status: 'Planning' },
    { id: 3, name: 'Q4 Sales Campaign', departmentId: 2, status: 'Active' },
    { id: 4, name: 'Market Research', departmentId: 2, status: 'Completed' },
    { id: 5, name: 'Brand Refresh', departmentId: 3, status: 'Active' },
    {
      id: 6,
      name: 'Employee Wellness Program',
      departmentId: 4,
      status: 'Planning',
    },
  ],
};

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
          `${API_BASE_URL}/SUF00180/getQryLov`,
          payload,
        );
        return {
          url: '/SUF00180/getQryLov',
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
              error: '',
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
