import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Keyboard,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useValidateLoginOTPMutation } from '../../features/auth/authApi';
import { ROUTES } from '../../constants/routes';
import { COLORS } from '../../constants/colors';
import { setUser } from '../../features/auth/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const OTPScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { phone, otpMethod, optnChngLogNo } = route.params || {};
  
  const [validateLoginOTP, { isLoading: isValidating }] = useValidateLoginOTPMutation();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef([]);
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Start timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0].focus();
      }, 100);
    }
  }, []);

  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.split('').slice(0, 6);
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      
      // Focus last filled input
      const lastFilledIndex = pastedOtp.findIndex(d => !d) - 1;
      const focusIndex = lastFilledIndex >= 0 ? lastFilledIndex : pastedOtp.length - 1;
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Move to previous input if deleted
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length < 6) {
      setError('Please enter complete OTP');
      return;
    }

    try {
      setError('');
      
      const payload = {
        phone,
        email: '', // Add email if available
        mobOtp: otpMethod === 'mobile' ? otpString : '',
        emailOtp: otpMethod === 'email' ? otpString : '',
        optnChngLogNo,
      };

      const response = await validateLoginOTP(payload).unwrap();
      
      if (response.success) {
        // Dispatch user data to Redux
        dispatch(setUser(response.user));
        
        // Show success message
        Alert.alert(
          'Success',
          'Login successful!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to main app
                navigation.reset({
                  index: 0,
                  routes: [{ name: ROUTES.DASHBOARD }],
                });
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error?.data?.details) {
        errorMessage = error.data.details;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      
      // Navigate back to login screen to resend OTP
      Alert.alert(
        'Resend OTP',
        'Do you want to resend OTP?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsResending(false),
          },
          {
            text: 'Yes, Resend',
            onPress: () => {
              navigation.goBack();
              setIsResending(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackPress = () => {
    Alert.alert(
      'Cancel OTP Verification',
      'Are you sure you want to cancel OTP verification?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => navigation.goBack() 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              disabled={isValidating}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Verify OTP</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* OTP Info */}
            <View style={styles.infoContainer}>
              <View style={styles.methodIconContainer}>
                <Text style={styles.methodIcon}>
                  {otpMethod === 'mobile' ? '📱' : '✉️'}
                </Text>
              </View>
              <Text style={styles.infoTitle}>
                Enter verification code
              </Text>
              <Text style={styles.infoDescription}>
                We've sent a 6-digit verification code to
              </Text>
              <Text style={styles.infoHighlight}>
                {otpMethod === 'mobile' ? `+91 ${phone}` : 'email@example.com'}
              </Text>
            </View>

            {/* OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    error && styles.otpInputError,
                    otp[index] && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isValidating}
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>
                Code expires in{' '}
                <Text style={styles.timerValue}>
                  {formatTime(timer)}
                </Text>
              </Text>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                isValidating && styles.buttonDisabled,
                otp.join('').length < 6 && styles.buttonDisabled,
              ]}
              onPress={handleVerifyOTP}
              disabled={isValidating || otp.join('').length < 6}
              activeOpacity={0.8}
            >
              {isValidating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={isResending}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendTimer}>
                  Resend in {formatTime(timer)}
                </Text>
              )}
            </View>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Having trouble?{' '}
                <Text style={styles.helpLink}>
                  Contact Support
                </Text>
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: COLORS.text.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  methodIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodIcon: {
    fontSize: 36,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  infoHighlight: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: (width - 72) / 6,
    height: (width - 72) / 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    color: COLORS.text.primary,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  otpInputError: {
    borderColor: COLORS.error,
  },
  errorContainer: {
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  timerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.inverse,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resendTimer: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  helpContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  helpLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default OTPScreen;
