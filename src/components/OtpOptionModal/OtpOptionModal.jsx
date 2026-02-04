import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';

const OtpOptionModal = ({
  visible,
  onClose,
  onConfirm,
  otpConfig,
  initialSelection = { mobile: false, email: false },
}) => {
  const [selectedOptions, setSelectedOptions] = useState(initialSelection);
  const [animation] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      animation.setValue(0);
    }
  }, [visible]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const toggleOption = option => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleConfirm = () => {
    if (!selectedOptions.mobile && !selectedOptions.email) {
      // Should not happen as we validate before enabling confirm
      return;
    }
    onConfirm(selectedOptions);
    onClose();
  };

  const isConfirmDisabled = !selectedOptions.mobile && !selectedOptions.email;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Select OTP Method</Text>
              <Text style={styles.subtitle}>
                Choose how you want to receive your OTP
              </Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {/* Mobile Option */}
              {otpConfig.otpMobFlg === 'Y' && (
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    selectedOptions.mobile && styles.optionCardSelected,
                  ]}
                  onPress={() => toggleOption('mobile')}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <Text style={styles.optionIcon}>📱</Text>
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Mobile OTP</Text>
                      <Text style={styles.optionDescription}>
                        Receive OTP via SMS on your mobile number
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selectedOptions.mobile && styles.checkboxSelected,
                      ]}
                    >
                      {selectedOptions.mobile && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Email Option */}
              {otpConfig.otpEmailFlg === 'Y' && (
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    selectedOptions.email && styles.optionCardSelected,
                  ]}
                  onPress={() => toggleOption('email')}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <Text style={styles.optionIcon}>✉️</Text>
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Email OTP</Text>
                      <Text style={styles.optionDescription}>
                        Receive OTP via email
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selectedOptions.email && styles.checkboxSelected,
                      ]}
                    >
                      {selectedOptions.email && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isConfirmDisabled && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={isConfirmDisabled}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10', // 10% opacity
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    marginRight: 12,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.surface,
  },
});

export default OtpOptionModal;
