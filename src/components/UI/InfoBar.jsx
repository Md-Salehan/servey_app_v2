import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../../constants/colors';

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

const InfoBar = ({ type, title, showAction, actionTitle, onAction }) => {
  const colors = getColors(type);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.bg,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
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
  });

  return (
    <View style={styles.container}>
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
  showAction: PropTypes.bool,
  actionTitle: PropTypes.string,
  onAction: PropTypes.func,
};

InfoBar.defaultProps = {
  type: 'warning',
  showAction: false,
};

export default InfoBar;
