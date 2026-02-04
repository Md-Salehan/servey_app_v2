export const API_BASE_URL = 'http://192.168.0.44/SuV4Sa';
// export const API_BASE_URL = 'http://192.168.0.44/SuV4Sa';
export const API_ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  ME: '/me',
  REFRESH: '/refresh',
  GENERATE_OTP: '/SUF00124/Mob/generateLoginOtp', // Dummy endpoints - replace with your actual OTP API
  VALIDATE_OTP: '/otp/validate',
  RESEND_OTP: '/otp/resend',
};

export const API_TIMEOUT = 10000;