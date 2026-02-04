import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useGenerateOTPMutation } from '../../features/auth/authApi';
import { ROUTES } from '../../constants/routes';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [generateOTP, { isLoading, error: apiError }] =
    useGenerateOTPMutation();

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateOTP = async () => {
    if (!validateForm()) return;

    try {
      const response = await generateOTP({
        phone: formData.phone,
        password: formData.password,
      }).unwrap();

      navigation.navigate(ROUTES.OTP, { phone: formData.phone });
    } catch (error) {
      console.error('OTP generation error:', error);

      let errorMessage = 'Failed to generate OTP. Please try again.';

      if (error?.status === 'FETCH_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      Alert.alert('OTP Generation Failed', errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: handleGenerateOTP, style: 'default' },
      ]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPhoneNumber = text => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join(' ').trim();
    }
    return cleaned;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>🛍️</Text>
              </View>
              <Text style={styles.brandName}>Shopify</Text>
              <Text style={styles.tagline}>Login to your store</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Welcome back</Text>
                <Text style={styles.formSubtitle}>
                  Enter your phone number and password to continue
                </Text>
              </View>

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone number</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.phone && styles.inputError,
                  ]}
                >
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="#6B7280"
                    value={formatPhoneNumber(formData.phone)}
                    onChangeText={text =>
                      handleInputChange('phone', text.replace(/\D/g, ''))
                    }
                    keyboardType="phone-pad"
                    maxLength={12}
                    editable={!isLoading}
                  />
                </View>
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.password && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#6B7280"
                    value={formData.password}
                    onChangeText={text => handleInputChange('password', text)}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* API Error */}
              {apiError && (
                <View style={styles.apiError}>
                  <Text style={styles.apiErrorText}>
                    ⚠️ {apiError.data?.message || 'Something went wrong'}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isLoading && styles.buttonDisabled,
                  (!formData.phone || !formData.password) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleGenerateOTP}
                disabled={isLoading || !formData.phone || !formData.password}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Get OTP</Text>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.signupSection}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate(ROUTES.REGISTER)}
                  disabled={isLoading}
                >
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#008060',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#008060',
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
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
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
    color: '#1F2937',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#008060',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    height: 48,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    height: '100%',
    textAlignVertical: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingHorizontal: 16,
    height: '100%',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },
  apiError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  apiErrorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#008060',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#008060',
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
    color: '#FFFFFF',
    letterSpacing: 0.25,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  alternativeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  alternativeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 8,
  },
  alternativeButtonEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  alternativeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 14,
    color: '#008060',
    fontWeight: '600',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#008060',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
