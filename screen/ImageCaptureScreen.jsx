import React, {useState} from 'react';
import {View, Button, Image, FlatList, StyleSheet} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ImageCaptureScreen() {
  const [images, setImages] = useState([]);

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        saveToPhotos: true,
        selectionLimit: 0, // 👈 allows multiple captures
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.log('Camera error:', response.errorMessage);
          return;
        }

        setImages(prev => [...prev, ...response.assets]);
      },
    );
  };

  return (
    <View style={styles.container}>
      <Button title="Open Camera" onPress={openCamera} />
            <Icon name="check" />
            <MaterialIcons name="check-circle" size={30} color="green" />

      <FlatList
        data={images}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        renderItem={({item}) => (
          <Image source={{uri: item.uri}} style={styles.image} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  image: {
    width: 110,
    height: 110,
    margin: 5,
    borderRadius: 8,
  },
});
