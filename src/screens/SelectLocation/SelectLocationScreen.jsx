import { StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import styles from './SelectLocation.style';
import LOVModal from '../../components/form/LOV/LOVModal';
import LOVField from '../../components/form/LOVField';

const SelectLocationScreen = ({navigation}) => {
     const [selectedValue, setSelectedValue] = useState('');
  const [selectedValues, setSelectedValues] = useState([]);

  // Sample data structure
  const sampleData = [
    { id: '1', name: 'John Doe', email: 'john@example.com', department: 'Engineering' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', department: 'Engineering' },
  ];

  // Column configuration
  const columns = [
    { key: 'name', title: 'Name', width: 120 },
    { key: 'email', title: 'Email', width: 180 },
    { key: 'department', title: 'Department' },
  ];

  console.log('Selected Value:', selectedValue);
  console.log('Selected Values:', selectedValues);

  return (
    <View style={styles.container}>
      {/* Single Select Example */}
      <LOVField
        fcId="user_select"
        label="Select User"
        data={sampleData}
        columns={columns}
        value={selectedValue}
        onChange={setSelectedValue}
        displayKey="name"
        primaryKey="id"
        placeholder="Choose a user..."
        required={true}
      />

      {/* Multi-Select Example with Custom Rendering */}
      <LOVField
        fcId="user_multi_select"
        label="Select Users"
        data={sampleData}
        columns={columns}
        value={selectedValues}
        onChange={setSelectedValues}
        multiple={true}
        maxSelections={3}
        displayKey="name"
        primaryKey="id"
        placeholder="Select users..."
        searchKeys={['name', 'email', 'department']}
        modalTitle="Select Users"
        showSelectAll={true}
        showClearAll={true}
        required={true}
        onError={(error) => console.log('Error:', error)}
        dependencyValues={[selectedValue]}
      />


      {/* Example with Custom Row Renderer */}
      <LOVField
        fcId="custom_render"
        label="Select with Custom Render"
        data={sampleData}
        columns={columns}
        value={selectedValue}
        onChange={setSelectedValue}
        displayKey="name"
        primaryKey="id"
        renderRowItem={({ item, isSelected }) => (
          <View style={{ flexDirection: 'row', padding: 12, backgroundColor: isSelected ? '#e8f5e9' : 'white' }}>
            <View style={{ flex: 2 }}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>{item.email}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#999' }}>{item.department}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default SelectLocationScreen;

