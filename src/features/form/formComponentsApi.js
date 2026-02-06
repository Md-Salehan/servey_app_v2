import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../constants/api';

const test_token = 
'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vMX4yMDI2MDIwNjAwMDAwMDAwMDAwMn5OIiwiaXNzIjoiU2ltYXBob3JlIiwiaWF0IjoxNzcwMzg1ODk2LCJleHAiOjE3NzA0MDM4OTZ9.lYEsBb7nbzWVQ5DzJHIrlimfSoii_uBJAbzLX3rsNUY'
// const allFormComp = {
//     "msg": "Successful operation",
//     "code": 0,
//     "appMsgList": {
//         "errorStatus": false,
//         "list": [
//             {
//                 "errCd": "CMAI000008",
//                 "errDesc": "Record/Records Found",
//                 "errType": "AI"
//             }
//         ]
//     },
//     "content": {
//         "mst": {
//             "appId": "AP000001",
//             "appDesc": "E-Physical Progress",
//             "formId": "F0000004",
//             "formNm": "XYZ",
//             "dtl01": [
                
//                 {
//                     "fcId": "C0034",
//                     "compSlNo": 7,
//                     "compTyp": "09",
//                     "compTypTxt": "Signature",
//                     "props": {
//                         "Label": "eSignature"
//                     }
//                 }
//             ],
//             "dtl02": []
//         }
//     }
// };

const allFormComp = {
    "msg": "Successful operation",
    "code": 0,
    "appMsgList": {
        "errorStatus": false,
        "list": [
            {
                "errCd": "CMAI000008",
                "errDesc": "Record/Records Found",
                "errType": "AI"
            }
        ]
    },
    "content": {
        "mst": {
            "appId": "AP000001",
            "appDesc": "E-Physical Progress",
            "formId": "F0000004",
            "formNm": "XYZ",
            "dtl01": [
                {
                    "fcId": "C0028",
                    "compSlNo": 1,
                    "compTyp": "01",
                    "compTypTxt": "Text input",
                    "props": {
                        "Placeholder": "Enter your name",
                        "Maximum Length": "",
                        "Label": "Name",
                        "Value": "",
                        "Key Board Type": "default",
                        "Editable": "",
                        "Multiple Line  ": ""
                    }
                },
                {
                    "fcId": "C0022",
                    "compSlNo": 2,
                    "compTyp": "07",
                    "compTypTxt": "Image",
                    "props": {
                        "Label": "Image Upload"
                    }
                },
                {
                    "fcId": "C0029",
                    "compSlNo": 2,
                    "compTyp": "03",
                    "compTypTxt": "Dropdown",
                    "props": {
                        "Placeholder": "Enter your country name",
                        "Options": "IND~India; BN~Bangladesh; S~Saudi",
                        "Label": "Country",
                        "multiple": true,
                    }
                },
                {
                    "fcId": "C0030",
                    "compSlNo": 3,
                    "compTyp": "08",
                    "compTypTxt": "Location",
                    "props": {
                        "Label": "Current Location"
                    }
                },
                {
                    "fcId": "C0031",
                    "compSlNo": 4,
                    "compTyp": "02",
                    "compTypTxt": "Date Picker",
                    "props": {
                        "Placeholder": "Select Date",
                        "Maximum Date?": "N~No",
                        "Label": "Date",
                        "Enter Maximum Date": "",
                        "Date": ""
                    }
                },
                {
                    "fcId": "C0032",
                    "compSlNo": 5,
                    "compTyp": "06",
                    "compTypTxt": "Voice input",
                    "props": {
                        "Placeholder": "Speak Something",
                        "Label": "Description"
                    }
                },
                {
                    "fcId": "C0033",
                    "compSlNo": 6,
                    "compTyp": "05",
                    "compTypTxt": "Check Box",
                    "props": {
                        "Placeholder": "",
                        "Label": "Terms & Condition",
                        "Data": "N~No"
                    }
                },
                {
                    "fcId": "C0034",
                    "compSlNo": 7,
                    "compTyp": "09",
                    "compTypTxt": "Signature",
                    "props": {
                        "Label": "eSignature"
                    }
                }
            ],
            "dtl02": []
        }
    }
};

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: headers => {
    // const token = tokenService.getAccessToken();
    const token = test_token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const formComponentsApi = createApi({
  reducerPath: 'formComponentsApi',
  baseQuery,
  tagTypes: ['FormComponents'],
  endpoints: (builder) => ({
    getFormComponents: builder.mutation({
      query: (formData) => {
        console.log(
          '🔵 Form Components API Request - URL:',
          `${API_BASE_URL}/SUF00191/getAllFormComponents`
        );
        console.log('🔵 Form Components API Request - Payload:', formData);
        
        return {
          url: '/SUF00191/getAllFormComponents',
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response) => {
        console.log('🟢 Form Components API Response:', response);
        return allFormComp;
      },
      transformErrorResponse: (response) => {
        console.error('🔴 Form Components API Error:', response);
        return response;
      },
    }),
    submitFormData: builder.mutation({
      query: (formData) => ({
        url: '/SUF00191/submitFormData',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetFormComponentsMutation,
  useSubmitFormDataMutation,
} = formComponentsApi;