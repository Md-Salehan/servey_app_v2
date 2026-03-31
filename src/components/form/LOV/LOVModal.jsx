import React from 'react';
import {
  View,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../constants/colors';
import { useLOVController } from './useLOVController';
import LOVTable from './LOVTable';

const LOVModal = ({
  visible,
  onClose,
  title = 'Select',
  data = [],
  columns = [],
  value,
  onChange,
  multiple = false,
}) => {
  const {
    search,
    setSearch,
    filteredData,
    isSelected,
    toggleSelection,
    selectAll,
    clearAll,
  } = useLOVController({
    data,
    value,
    onChange,
    multiple,
    rowKey: 'id',
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#00000066' }}>
        <View
          style={{
            marginTop: 'auto',
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            maxHeight: '80%',
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <TextInput
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 8,
              padding: 10,
              marginVertical: 10,
            }}
          />

          {/* Actions */}
          {multiple && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TouchableOpacity onPress={selectAll}>
                <Text style={{ color: COLORS.primary }}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAll}>
                <Text style={{ color: COLORS.error }}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Table */}
          <LOVTable
            columns={columns}
            data={filteredData}
            isSelected={isSelected}
            onRowPress={toggleSelection}
          />

          {/* Footer */}
          <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
            <Text style={{ textAlign: 'center', color: COLORS.primary }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LOVModal;