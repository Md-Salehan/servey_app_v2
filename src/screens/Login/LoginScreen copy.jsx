
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Animated,
  Modal,
} from 'react-native';
import { 
  useGetOtpConfigQuery,
  useGetOtpLogNoMutation,
  useGenerateLoginOTPMutation 
} from '../../features/auth/authApi';
import { ROUTES } from '../../constants/routes';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  // RTK Query hooks
  const { data: otpConfig, isLoading: isLoadingConfig, error: configError } = useGetOtpConfigQuery();
  const [getOtpLogNo, { isLoading: isLoadingLogNo }] = useGetOtpLogNoMutation();
  const [generateLoginOTP, { isLoading: isGeneratingOTP }] = useGenerateLoginOTPMutation();
  
  // State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [otpMethod, setOtpMethod] = useState(null);
  const [showOtpMethodModal, setShowOtpMethodModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-determine OTP method based on configuration
  useEffect(() => {
    if (otpConfig) {
      const { otpMobFlg, otpEmailFlg, userOptnSelFlg } = otpConfig;
      
      if (userOptnSelFlg && otpMobFlg && otpEmailFlg) { //needtofix 
        setOtpMethod(null);
        setShowEmailInput(true);
      } else if (otpMobFlg && !otpEmailFlg) {
        // Only mobile OTP available
        setOtpMethod('mobile');
        setShowEmailInput(false);
      } else if (!otpMobFlg && otpEmailFlg) {
        // Only email OTP available
        setOtpMethod('email');
        setShowEmailInput(true);
      } else if (otpMobFlg && otpEmailFlg) {
        // Both available but user cannot choose - default to mobile
        setOtpMethod('mobile');
        setShowEmailInput(false);
      }
    }
  }, [otpConfig]);

  // Show error if OTP config fails
  useEffect(() => {
    if (configError) {
      Alert.alert(
        'Configuration Error',
        'Failed to load OTP configuration. Please restart the app.',
        [{ text: 'OK' }]
      );
    }
  }, [configError]);

  const validateForm = () => {
    const newErrors = {};
    
    if (otpMethod === 'mobile' || (!otpMethod && otpConfig?.otpMobFlg)) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!phoneRegex.test(phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }
    
    if (otpMethod === 'email' || (!otpMethod && otpConfig?.otpEmailFlg)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetOTP = async () => {
    if (!validateForm()) return;

    try {
      setIsProcessing(true);

      // Check OTP configuration
      if (!otpConfig) {
        throw new Error('OTP configuration not available');
      }

      const { otpMobFlg, otpEmailFlg, userOptnSelFlg } = otpConfig;

      // Show method selection modal if user can choose
      if (userOptnSelFlg && otpMobFlg && otpEmailFlg) {
        setShowOtpMethodModal(true);
        setIsProcessing(false);
        return;
      }

      // Determine OTP method
      let selectedMethod = otpMethod;
      if (!selectedMethod) {
        if (otpMobFlg && !otpEmailFlg) selectedMethod = 'mobile';
        else if (!otpMobFlg && otpEmailFlg) selectedMethod = 'email';
        else if (otpMobFlg && otpEmailFlg) selectedMethod = 'mobile';
        else throw new Error('No OTP method available. Please contact support.');
      }

      // Proceed with OTP generation
      await proceedWithOTP(selectedMethod);
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', error.message || 'Failed to generate OTP. Please try again.');
    }
  };

  const proceedWithOTP = async (method) => {
    try {
      // Step 1: Get OTP log number
      const otpLogNoResponse = await getOtpLogNo({
        phone: method === 'mobile' ? phone : '',
        email: method === 'email' ? email : '',
        otpMobFlg: method === 'mobile',
        otpEmailFlg: method === 'email',
        otpOptnChngFlg: 'N',
      }).unwrap();

      const { optnChngLogNo } = otpLogNoResponse;

      // Step 2: Generate OTP
      await generateLoginOTP({
        phone: method === 'mobile' ? phone : '',
        email: method === 'email' ? email : '',
        optnChngLogNo,
      }).unwrap();

      // Navigate to OTP screen with necessary params
      navigation.navigate(ROUTES.OTP, { 
        phone: method === 'mobile' ? phone : '',
        email: method === 'email' ? email : '',
        otpMethod: method,
        optnChngLogNo,
      });
    } catch (error) {
      console.error('OTP generation error:', error);
      throw new Error(error?.data?.message || error?.message || 'Failed to generate OTP');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOtpMethodSelect = (method) => {
    setOtpMethod(method);
    setShowOtpMethodModal(false);
    setIsProcessing(true);
    proceedWithOTP(method);
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join(' ').trim();
    }
    return cleaned;
  };

  const isLoading = isLoadingConfig || isProcessing || isLoadingLogNo || isGeneratingOTP;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View 
            style={[
              styles.content, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Animated.View 
                style={[
                  styles.logoContainer,
                  {
                    transform: [{
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.logoText}>📋</Text>
              </Animated.View>
              <Text style={styles.brandName}>SurveyApp</Text>
              <Text style={styles.tagline}>Secure OTP Verification</Text>
              
              {/* OTP Method Indicator */}
              {otpConfig && (
                <View style={styles.otpMethodIndicator}>
                  <Text style={styles.otpMethodText}>
                    {otpConfig.otpMobFlg && otpConfig.otpEmailFlg 
                      ? '📱✉️ Mobile & Email OTP available'
                      : otpConfig.otpMobFlg 
                      ? '📱 Mobile OTP enabled'
                      : '✉️ Email OTP enabled'}
                  </Text>
                </View>
              )}
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Welcome</Text>
                <Text style={styles.formSubtitle}>
                  Enter your {otpMethod === 'email' ? 'email address' : 'phone number'} to receive OTP
                </Text>
              </View>

              {/* Phone Input - Show for mobile OTP */}
              {(otpMethod === 'mobile' || (!otpMethod && otpConfig?.otpMobFlg)) && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone number</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.phone && styles.inputError,
                      isLoading && styles.inputDisabled,
                    ]}
                  >
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor={COLORS.gray[400]}
                      value={formatPhoneNumber(phone)}
                      onChangeText={text => {
                        setPhone(text.replace(/\D/g, ''));
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      keyboardType="phone-pad"
                      maxLength={12}
                      editable={!isLoading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>
              )}

              {/* Email Input - Show for email OTP */}
              {(otpMethod === 'email' || showEmailInput) && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email address</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.email && styles.inputError,
                      isLoading && styles.inputDisabled,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address"
                      placeholderTextColor={COLORS.gray[400]}
                      value={email}
                      onChangeText={text => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isLoading && styles.buttonDisabled,
                  (otpMethod === 'mobile' && !phone) && styles.buttonDisabled,
                  (otpMethod === 'email' && !email) && styles.buttonDisabled,
                  (!otpMethod && !phone && !email) && styles.buttonDisabled,
                ]}
                onPress={handleGetOTP}
                disabled={isLoading || 
                  (otpMethod === 'mobile' && !phone) || 
                  (otpMethod === 'email' && !email) ||
                  (!otpMethod && !phone && !email)
                }
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Get OTP</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our{' '}
                <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Method Selection Modal */}
      <Modal
        visible={showOtpMethodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpMethodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select OTP Method</Text>
            <Text style={styles.modalSubtitle}>
              Choose how you want to receive your OTP
            </Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOtpMethodSelect('mobile')}
            >
              <Text style={styles.optionEmoji}>📱</Text>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Mobile OTP</Text>
                <Text style={styles.optionDescription}>
                  OTP will be sent to your mobile number
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOtpMethodSelect('email')}
            >
              <Text style={styles.optionEmoji}>✉️</Text>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Email OTP</Text>
                <Text style={styles.optionDescription}>
                  OTP will be sent to your email address
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowOtpMethodModal(false);
                setIsProcessing(false);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  otpMethodIndicator: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.infoLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  otpMethodText: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    height: 48,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.gray[100],
    opacity: 0.7,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[700],
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    height: '100%',
    textAlignVertical: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    paddingHorizontal: 16,
    height: '100%',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.inverse,
    letterSpacing: 0.25,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  modalCancelButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default LoginScreen;
