import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/routes';

class TokenService {
  static async setTokens(accessToken, refreshToken) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      return true;
    } catch (error) {
      console.error('Error saving tokens:', error);
      return false;
    }
  }

  static async getAccessToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  static async clearTokens() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return true;
    } catch (error) {
      console.error('Error clearing tokens:', error);
      return false;
    }
  }

  static async setUserData(userData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  static async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  static decodeJWT(token) {
    try {
      // Split the token into parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      // Replace URL-safe characters and decode base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  static isTokenExpired(token) {
    try {
      const decoded = this.decodeJWT(token);
      if (!decoded || !decoded.exp) {
        return true; // If no expiration claim, consider it expired
      }

      // Compare expiration time with current time
      // exp is in seconds, Date.now() returns milliseconds
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // If error occurs, consider token expired
    }
  }

  static async isAuthenticated() {
    try {
      const token = await this.getAccessToken();
      
      // If no token exists, user is not authenticated
      if (!token) {
        return false;
      }

      // Check if token is expired
      if (this.isTokenExpired(token)) {
        // Optional: Auto-clear tokens if expired
        // await this.clearTokens();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  // Optional: Method to get token expiration time
  static async getTokenExpirationTime() {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;
      
      const decoded = this.decodeJWT(token);
      return decoded?.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  // Optional: Method to check if token needs refresh (e.g., within 5 minutes of expiration)
  static async shouldRefreshToken() {
    try {
      const token = await this.getAccessToken();
      if (!token) return false;

      const decoded = this.decodeJWT(token);
      if (!decoded?.exp) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;
      
      // Consider refresh if token expires within 5 minutes (300 seconds)
      return timeUntilExpiry < 300;
    } catch (error) {
      console.error('Error checking token refresh need:', error);
      return false;
    }
  }
}

export default TokenService;