import axios from 'axios';
import TokenService from '../storage/tokenService';
import { API_BASE_URL, API_TIMEOUT } from '../../constants/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await TokenService.getAccessToken();
    console.log(token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await TokenService.getRefreshToken();
        
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/refresh`,
            { refreshToken, expiresInMins: 30 }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          await TokenService.setTokens(accessToken, newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await TokenService.clearTokens();
        // You might want to redirect to login here
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;