/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StyleSheet} from 'react-native';
import ImageCaptureScreen from './screen/ImageCaptureScreen'
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Image } from 'react-native/types_generated/index';

function App() {
  

  return (
    <SafeAreaProvider>
      <ImageCaptureScreen />
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
