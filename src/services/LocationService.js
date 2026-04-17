// services/LocationService.js
import Geolocation from '@react-native-community/geolocation';

class LocationService {
  async getCurrentLocation(options = {}) {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 5000,
    } = options;

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          if (error.code === 1) errorMessage = 'Location permission denied';
          if (error.code === 2) errorMessage = 'GPS unavailable';
          if (error.code === 3) errorMessage = 'Location request timed out';
          reject(new Error(errorMessage));
        },
        { enableHighAccuracy, timeout, maximumAge }
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

export default new LocationService(); // Singleton export