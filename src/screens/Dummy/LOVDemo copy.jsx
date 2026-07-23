import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { LOVField } from '../../components'

const LOVDemo = () => {
     // State for single selection
  const [selectedValue, setSelectedValue] = useState(null);
  
  // State for multiple selection
  const [selectedMultiple, setSelectedMultiple] = useState([]);

  // Sample data
  const sampleData = [
    { id: 1, name: 'John Doe John Doe John Doe John Doe John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
  ];
//width = length*20
  // Column configuration
  const columns = [
    { key: 'id', title: 'ID', width: 0 },
    { key: 'name', title: 'Name', width: 0 },
    { key: 'email', title: 'Email', width: 0 },
    // { key: 'role', title: 'Role', width: 100 },
  ];

  return (
    <View style={styles.container}>
      {/* Single Selection LOV */}
      <LOVField
        fcId="user-select"
        label="Select User"
        placeholder="Choose a user..."
        data={sampleData}
        columns={columns}
        value={selectedValue}
        onChange={setSelectedValue}
        displayKey="name"
        primaryKey="id"
        required={true}
        searchable={true}
        searchPlaceholder="Search users..."
        modalTitle="Select User"
      />

      {/* Multiple Selection LOV */}
      <LOVField
        fcId="team-select"
        label="Select Team Members"
        placeholder="Choose team members..."
        data={sampleData}
        columns={columns}
        value={selectedMultiple}
        onChange={setSelectedMultiple}
        multiple={true}
        maxSelections={5}
        displayKey="name"
        primaryKey="id"
        searchable={true}
        showSelectionCount={true}
        modalTitle="Select Team Members"
        emptyMessage="No team members available"
      />

      {/* Disabled LOV */}
      <LOVField
        fcId="disabled-select"
        label="Disabled Field"
        placeholder="This is disabled"
        data={sampleData}
        columns={columns}
        value="2"
        disabled={true}
        displayKey="name"
        primaryKey="id"
      />

      {/* Preview Mode LOV */}
      <LOVField
        fcId="preview-select"
        label="Preview Field"
        placeholder="Preview mode"
        data={sampleData}
        columns={columns}
        value="3"
        isPreview={true}
        displayKey="name"
        primaryKey="id"
      />
    </View>
  )
}

export default LOVDemo

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
});