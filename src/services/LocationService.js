// services/LocationService.js
import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid } from 'react-native';

class LocationService {
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true; // iOS permissions are handled in Info.plist
  }

  // Promisified version - similar to working LocationField approach
  async getCurrentLocation(options = {}) {
    const {
      enableHighAccuracy = true,  // Changed to true for better accuracy
      timeout = 25000,            // Match LocationField's timeout
      maximumAge = 0,             // Match LocationField's maximumAge
    } = options;

    // Request permissions first
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    // Use promisified approach (same as LocationField.jsx)
    return this.getCurrentPositionAsync({
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }

  // Promisified version of Geolocation.getCurrentPosition
  getCurrentPositionAsync(options) {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('Location obtained:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          resolve(position);
        },
        (error) => {
          console.error('Geolocation error:', error);
          
          let errorMessage;
          // Handle error codes properly (same as LocationField)
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied. Please enable location access in settings.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location information is unavailable.';
              break;
            case 3: // TIMEOUT
              errorMessage = `Location request timed out after ${options.timeout / 1000} seconds.`;
              break;
            default:
              errorMessage = error.message || 'Failed to capture location.';
          }
          
          reject(error);
        },
        options
      );
    });
  }

  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(point1.latitude)) * Math.cos(this.toRad(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }
}

export default new LocationService();