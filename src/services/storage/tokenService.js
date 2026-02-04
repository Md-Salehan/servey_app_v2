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

  static async isAuthenticated() {
    const token = await this.getAccessToken();
    return !!token;
  }
}

export default TokenService;