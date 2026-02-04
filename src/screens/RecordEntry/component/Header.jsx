import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../../constants/colors';

const Header = ({ navigation, formTitle, appId, formId, fieldValues={}, totalNumFormComp }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.formTitle}>{formTitle || 'Record Entry'}</Text>
        <Text style={styles.formSubtitle}>
          Fields completed: {Object.values(fieldValues).filter(v => v).length} /{' '}
          {totalNumFormComp}
        </Text>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontFamily: 'System',
  },
  headerContent: {
    flex: 1,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
    fontFamily: 'System',
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'System',
  },
});
