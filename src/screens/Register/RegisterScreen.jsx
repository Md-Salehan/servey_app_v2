import React, { useState } from 'react';
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
} from 'react-native';
import { useRegisterMutation } from '../../features/auth/authApi';
import { styles } from './Register.styles';
import { ROUTES } from '../../constants/routes';

const RegisterScreen = ({ navigation }) => {
  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      const response = await register(userData).unwrap();
      
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully. Please login.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate(ROUTES.LOGIN),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error?.data?.message || 'An error occurred during registration.'
      );
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            
            <TextInput
              style={[styles.input, errors.username && { borderColor: '#ff4d4f' }]}
              placeholder="Username"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}

            <TextInput
              style={[styles.input, errors.email && { borderColor: '#ff4d4f' }]}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TextInput
              style={[styles.input, errors.firstName && { borderColor: '#ff4d4f' }]}
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              editable={!isLoading}
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}

            <TextInput
              style={[styles.input, errors.lastName && { borderColor: '#ff4d4f' }]}
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              editable={!isLoading}
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}

            <TextInput
              style={[styles.input, errors.password && { borderColor: '#ff4d4f' }]}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              editable={!isLoading}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TextInput
              style={[styles.input, errors.confirmPassword && { borderColor: '#ff4d4f' }]}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry
              editable={!isLoading}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => navigation.navigate(ROUTES.LOGIN)}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;