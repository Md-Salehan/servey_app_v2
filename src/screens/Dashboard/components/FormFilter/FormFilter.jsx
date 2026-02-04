import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../../constants/colors';
import { formFilterStyles as styles } from './FormFilter.styles';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Forms', icon: 'list' },
  { id: 'active', label: 'Active', icon: 'check-circle' },
  { id: 'pending', label: 'Pending', icon: 'pending' },
  { id: 'completed', label: 'Completed', icon: 'done-all' },
  { id: 'draft', label: 'Drafts', icon: 'drafts' },
  { id: 'priority', label: 'High Priority', icon: 'priority-high' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First', icon: 'arrow-downward' },
  { id: 'oldest', label: 'Oldest First', icon: 'arrow-upward' },
  { id: 'deadline', label: 'Deadline', icon: 'event' },
  { id: 'progress', label: 'Progress', icon: 'trending-up' },
];

export const FormFilter = ({ 
  activeFilter, 
  activeSort, 
  onFilterChange, 
  onSortChange,
  filterCount = 0 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const handleFilterSelect = (filterId) => {
    onFilterChange(filterId);
    setShowFilters(false);
  };

  const handleSortSelect = (sortId) => {
    onSortChange(sortId);
    setShowSort(false);
  };

  const getActiveFilterLabel = () => {
    const filter = FILTER_OPTIONS.find(f => f.id === activeFilter);
    return filter ? filter.label : 'All Forms';
  };

  const getActiveSortLabel = () => {
    const sort = SORT_OPTIONS.find(s => s.id === activeSort);
    return sort ? sort.label : 'Newest First';
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterCount > 0 && styles.filterButtonActive
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Icon 
            name="filter-list" 
            size={20} 
            color={filterCount > 0 ? COLORS.primary : COLORS.text.secondary} 
          />
          <Text style={[
            styles.filterButtonText,
            filterCount > 0 && styles.filterButtonTextActive
          ]}>
            {getActiveFilterLabel()}
            {filterCount > 0 && ` (${filterCount})`}
          </Text>
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSort(true)}
        >
          <Icon name="sort" size={20} color={COLORS.text.secondary} />
          <Text style={styles.sortButtonText}>{getActiveSortLabel()}</Text>
          <Icon name="expand-more" size={16} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Forms</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {FILTER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    activeFilter === option.id && styles.optionItemActive
                  ]}
                  onPress={() => handleFilterSelect(option.id)}
                >
                  <View style={styles.optionContent}>
                    <Icon 
                      name={option.icon} 
                      size={20} 
                      color={activeFilter === option.id ? COLORS.primary : COLORS.text.secondary} 
                    />
                    <Text style={[
                      styles.optionText,
                      activeFilter === option.id && styles.optionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {activeFilter === option.id && (
                    <Icon name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSort}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSort(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSort(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSort(false)}>
                <Icon name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    activeSort === option.id && styles.optionItemActive
                  ]}
                  onPress={() => handleSortSelect(option.id)}
                >
                  <View style={styles.optionContent}>
                    <Icon 
                      name={option.icon} 
                      size={20} 
                      color={activeSort === option.id ? COLORS.primary : COLORS.text.secondary} 
                    />
                    <Text style={[
                      styles.optionText,
                      activeSort === option.id && styles.optionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {activeSort === option.id && (
                    <Icon name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};