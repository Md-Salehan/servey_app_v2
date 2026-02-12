// export const API_BASE_URL = 'http://192.168.0.44/SuV4Sa';
export const API_BASE_URL = 'http://192.168.0.44/SuV4SaPg';


export const API_ENDPOINTS = {
  // OTP Configuration
  GET_OTP_CONFIG: '/SUF00135/Mob/getOtpOptnChngDtl',
  GET_OTP_LOG_NO: '/SUF00135/Mob/getOtpOptnChngLogNo',
  // OTP Generation & Validation
  GENERATE_LOGIN_OTP: '/SUF00124/Mob/generateLoginOtp',
  VALIDATE_LOGIN_OTP: '/SUF00124/Mob/validateLoginOtp',

  LOGIN: '/login',
  REGISTER: '/register',
  ME: '/me',
  REFRESH: '/refresh',
  GENERATE_OTP: '/SUF00124/Mob/generateLoginOtp', // Dummy endpoints - replace with your actual OTP API
  VALIDATE_OTP: '/otp/validate',
  RESEND_OTP: '/otp/resend',
};

export const API_IDS = {
  GET_OTP_CONFIG: 'SUA00514',
  GET_OTP_LOG_NO: 'SUA00515',
  GENERATE_LOGIN_OTP: 'SUA00455',
  VALIDATE_LOGIN_OTP: 'SUA00467',
};

export const OTP_TYPE_CODES = {
  LOGIN: 'T0008',
};

export const APP_ID = 'AP000001';

export const API_TIMEOUT = 10000;