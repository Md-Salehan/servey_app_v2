import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../../constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getColors = type => {
  switch (type) {
    case 'error':
      return {
        bg: COLORS.errorLight,
        text: COLORS.error,
        button: COLORS.error,
      };
    case 'success':
      return {
        bg: COLORS.successLight,
        text: COLORS.success,
        button: COLORS.success,
      };
    case 'info':
      return { bg: COLORS.infoLight, text: COLORS.info, button: COLORS.info };
    default:
      return {
        bg: COLORS.warningLight,
        text: COLORS.warning,
        button: COLORS.warning,
      };
  }
};

const InfoBar = ({ type, title,infoIcon, showAction, actionTitle, onAction }) => {
  const colors = getColors(type);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.bg,
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      
    },
    infoText: { fontSize: 14, color: colors.text, flex: 1, marginRight: 4 },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.button,
      borderRadius: 4,
    },
    actionTitleStyle: {
      fontSize: 14,
      color: COLORS.text.inverse,
      fontWeight: '600',
    },
    infoIcon: {
      marginRight: 8,
    },
  });

  return (
    <View style={styles.container}>
      {infoIcon && (
        <View style={styles.infoIcon}>
          {infoIcon === 'loading' ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Icon name={infoIcon} size={20} color={colors.text} />
          )}
        </View>
      )}

      <Text style={styles.infoText}>
        {title || 'Failed to sync with server. Showing cached data.'}
      </Text>
      {showAction && actionTitle && (
        <TouchableOpacity onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionTitleStyle}>{actionTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

InfoBar.propTypes = {
  type: PropTypes.oneOf(['warning', 'error', 'success', 'info']),
  title: PropTypes.string,
  infoIcon: PropTypes.string,
  showAction: PropTypes.bool,
  actionTitle: PropTypes.string,
  onAction: PropTypes.func,
};

InfoBar.defaultProps = {
  type: 'warning',
  showAction: false,
  infoIcon: null,
};

export default InfoBar;
