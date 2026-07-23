import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const DataTable = () => {
 const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
    { id: 7, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 8, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 9, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 10, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 11, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
    { id: 12, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 13, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 14, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 15, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 16, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
    { id: 17, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 18, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 19, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 20, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 21, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
    { id: 22, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 23, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 24, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 25, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 26, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
    { id: 27, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 28, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 29, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 30, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 31, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
    { id: 32, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 33, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 34, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 35, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 36, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
    { id: 37, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 38, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: 39, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
    { id: 40, name: 'Alice Williams', email: 'alice@example.com', role: 'QA' },
    { id: 41, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
  ];

  const columns = [
    { key: 'id', title: 'ID', width: 50 },
    { key: 'name', title: 'Name', width: "150" },
    // { key: 'email', title: 'Email', width: 160 },
    // { key: 'role', title: 'Role', width: 100 },
  ];

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  const renderHeader = () => (
    <View style={[styles.headerRow, { width: totalWidth }]}>
      {columns.map((col) => (
        <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
          <Text style={styles.headerText}>{col.title}</Text>
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={[styles.row, { width: totalWidth }]}>
      {columns.map((col) => (
        <View key={col.key} style={[styles.cell, { width: col.width }]}>
          <Text style={styles.cellText}>{item[col.key]}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Horizontal ScrollView for the entire table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header */}
          {renderHeader()}
          
          {/* Vertical FlatList for data */}
          <FlatList
            data={sampleData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={true}
            style={styles.list}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  cellText: {
    fontSize: 13,
    color: '#333',
  },
  list: {
    maxHeight: 400, // Adjust as needed
  },
});

export default DataTable;