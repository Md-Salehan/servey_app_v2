import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../../constants/colors';
import { formCardStyles as styles } from './FormCard.styles';

const STATUS_CONFIG = {
  active: {
    color: COLORS.success,
    icon: 'check-circle',
    label: 'Active',
  },
  pending: {
    color: COLORS.warning,
    icon: 'pending',
    label: 'Pending',
  },
  completed: {
    color: COLORS.primary,
    icon: 'done-all',
    label: 'Completed',
  },
  draft: {
    color: COLORS.gray[400],
    icon: 'drafts',
    label: 'Draft',
  },
  archived: {
    color: COLORS.gray[500],
    icon: 'archive',
    label: 'Archived',
  },
};

export const FormCard = React.memo(({ 
  form, 
  index, 
  onPress, 
  animation = {} 
}) => {
  const statusConfig = STATUS_CONFIG[form.status] || STATUS_CONFIG.draft;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Icon name={statusConfig.icon} size={14} color={COLORS.surface} />
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>

          {form.priority === 'high' && (
            <View style={styles.priorityBadge}>
              <Icon name="priority-high" size={14} color={COLORS.error} />
              <Text style={styles.priorityText}>High Priority</Text>
            </View>
          )}
        </View>

        <Text style={styles.formTitle} numberOfLines={1}>
          {form.title}
        </Text>
        
        <Text style={styles.formDescription} numberOfLines={2}>
          {form.description}
        </Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Icon name="assignment" size={16} color={COLORS.gray[500]} />
            <Text style={styles.metaText}>
              {form.totalFields || 0} {form.totalFields === 1 ? 'field' : 'fields'}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Icon name="schedule" size={16} color={COLORS.gray[500]} />
            <Text style={styles.metaText}>
              {form.estimatedTime || '15'} min
            </Text>
          </View>
          
          {form.deadline && (
            <View style={styles.metaItem}>
              <Icon name="event" size={16} color={COLORS.gray[500]} />
              <Text style={styles.metaText}>
                Due {form.deadline}
              </Text>
            </View>
          )}
        </View>
        
        {(form.completionRate !== undefined && form.completionRate !== null) && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercent}>{form.completionRate}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${form.completionRate}%`, backgroundColor: COLORS.primary },
                ]}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});