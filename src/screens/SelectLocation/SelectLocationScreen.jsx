import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import LOVModal from '../../components/form/LOV/LOVModal';

const SelectLocationScreen = () => {
    const [lovOpen, setLovOpen] = React.useState(false);
    const [value, setValue] = React.useState([]);

    // Mock API data
    const apiData = [
        { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' },
        { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com' },
    ];  
    
  return (
    <View>
      <Text>Select Location</Text>
      <LOVModal
        visible={lovOpen}
        onClose={() => setLovOpen(false)}
        title="Select Users"
        data={apiData}
        columns={[
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'email', title: 'Email', dataIndex: 'email' },
        ]}
        value={value}
        onChange={setValue}
        multiple={true}
      />
    </View>
  );
};

export default SelectLocationScreen;

const styles = StyleSheet.create({});
