import { useState, useMemo, useCallback } from 'react';

export const useLOVController = ({
  data = [],
  multiple = false,
  value,
  onChange,
  rowKey = 'id',
}) => {
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!search) return data;

    const lower = search.toLowerCase();
    return data.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(lower),
      ),
    );
  }, [data, search]);

  const isSelected = useCallback(
    key => {
      if (multiple) {
        return Array.isArray(value) && value.includes(key);
      }
      return value === key;
    },
    [value, multiple],
  );

  const toggleSelection = useCallback(
    row => {
      const key = row[rowKey];

      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        if (current.includes(key)) {
          onChange(current.filter(v => v !== key));
        } else {
          onChange([...current, key]);
        }
      } else {
        onChange(key);
      }
    },
    [value, multiple, onChange],
  );

  const selectAll = () => {
    if (!multiple) return;
    onChange(data.map(item => item[rowKey]));
  };

  const clearAll = () => {
    onChange(multiple ? [] : null);
  };

  return {
    search,
    setSearch,
    filteredData,
    isSelected,
    toggleSelection,
    selectAll,
    clearAll,
  };
};