import AsyncStorage from '@react-native-async-storage/async-storage';
import { OTP_TYPE_CODES } from '../../constants/api';
import { STORAGE_KEYS } from '../../constants/routes';

class LoginService {
  // Store OTP session data
  static async storeOtpSessionData(phone, email, logNumber, otpConfig) {
    try {
      const sessionData = {
        phone,
        email,
        logNumber,
        otpConfig,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('otp_session', JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('Error storing OTP session:', error);
      return false;
    }
  }

  static async getOtpSessionData() {
    try {
      const sessionData = await AsyncStorage.getItem('otp_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting OTP session:', error);
      return null;
    }
  }

  static async clearOtpSessionData() {
    try {
      await AsyncStorage.removeItem('otp_session');
      return true;
    } catch (error) {
      console.error('Error clearing OTP session:', error);
      return false;
    }
  }

  // Validation helpers
  static validatePhoneNumber(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone.trim()) {
      return { isValid: false, message: 'Phone number is required' };
    }
    if (!phoneRegex.test(phone)) {
      return { isValid: false, message: 'Please enter a valid 10-digit phone number' };
    }
    return { isValid: true, message: '' };
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  }

  static validateOtp(otp) {
    const otpRegex = /^[0-9]{4,6}$/;
    if (!otp.trim()) {
      return { isValid: false, message: 'OTP is required' };
    }
    if (!otpRegex.test(otp)) {
      return { isValid: false, message: 'OTP must be 4-6 digits' };
    }
    return { isValid: true, message: '' };
  }

  // Format phone number for display
  static formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join(' ').trim();
    }
    return cleaned;
  }

  // Prepare payload for API 1
  static prepareOtpOptionDetailsPayload() {
    return {
      mst: {
        otpTypCd: OTP_TYPE_CODES.LOGIN, // From app config
      },
    };
  }

  // Prepare payload for API 2
  static prepareOtpLogNumberPayload(data) {
    return {
      mst: {
        emailId: data.email || '',
        mobNo: data.phone || '',
        otpEmailFlg: data.otpEmailFlg || 'N',
        otpMobFlg: data.otpMobFlg || 'N',
        otpOptnChngFlg: data.userOptnSelFlg || 'N',
        otpTypCd: OTP_TYPE_CODES.LOGIN,
        refApiId: 'SUA00514',
      },
    };
  }

  // Prepare payload for API 3
  static prepareGenerateOtpPayload(data) {
    return {
      mst: {
        emailId: data.email || '',
        mobNo: data.phone || '',
        optnChngLogNo: data.logNumber || '',
      },
    };
  }

  // Prepare payload for API 4
  static prepareValidateOtpPayload(data) {
    return {
      mst: {
        emailId: data.email || '',
        emailIdOtp: data.emailOtp || '',
        mobNo: data.phone || '',
        mobNoOtp: data.phoneOtp || '',
        optnChngLogNo: data.logNumber || '',
      },
    };
  }
}

export default LoginService;