import React, { memo } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';

const LOVTable = ({
  columns = [],
  data = [],
  isSelected,
  onRowPress,
}) => {
  const renderHeader = () => (
    <View style={{ flexDirection: 'row', padding: 12 }}>
      {columns.map(col => (
        <Text key={col.key} style={{ flex: 1, fontWeight: '600' }}>
          {col.title}
        </Text>
      ))}
    </View>
  );

  const renderRow = ({ item }) => (
    <TouchableOpacity
      onPress={() => onRowPress(item)}
      style={{
        flexDirection: 'row',
        padding: 12,
        backgroundColor: isSelected(item.id)
          ? COLORS.gray[100]
          : COLORS.surface,
      }}
    >
      {columns.map(col => (
        <Text key={col.key} style={{ flex: 1 }}>
          {item[col.dataIndex]}
        </Text>
      ))}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) => item.id?.toString() || index.toString()}
      ListHeaderComponent={renderHeader}
      renderItem={renderRow}
      initialNumToRender={10}
      windowSize={10}
    />
  );
};

export default memo(LOVTable);