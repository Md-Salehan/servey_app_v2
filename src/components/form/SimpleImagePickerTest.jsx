// SimpleImagePickerTest.jsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import ImagePicker from 'react-native-image-picker';

const SimpleImagePickerTest = () => {
  const testImagePicker = async () => {
    try {
      // Test if ImagePicker is properly imported
      console.log('ImagePicker object:', ImagePicker);
      console.log('launchCamera exists:', !!ImagePicker.launchCamera);
      console.log('launchImageLibrary exists:', !!ImagePicker.launchImageLibrary);
      
      if (!ImagePicker || !ImagePicker.launchImageLibrary) {
        Alert.alert('Error', 'ImagePicker not properly initialized');
        return;
      }
      
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      console.log('Result:', result);
      
      if (result.didCancel) {
        Alert.alert('Cancelled', 'User cancelled image picker');
      } else if (result.error) {
        Alert.alert('Error', result.error);
      } else if (result.assets && result.assets[0]) {
        Alert.alert('Success', `Selected: ${result.assets[0].fileName}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        onPress={testImagePicker}
        style={{ padding: 20, backgroundColor: 'blue' }}
      >
        <Text style={{ color: 'white' }}>Test Image Picker</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SimpleImagePickerTest;