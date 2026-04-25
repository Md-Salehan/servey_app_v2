import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../../constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Header = ({ navigation, formTitle, totalNumFormComp, toggeleLocationValidation, checkSubmitLocationAllowed }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <Text style={styles.formTitle}>
          {totalNumFormComp > 1 ? 'Review Entries' : 'Review Entry'}
        </Text>

        <Text style={styles.formSubtitle}>
          Form: {formTitle || 'Untitled Form'}
        </Text>
      </View>

      {/* <TouchableOpacity 
      onPress={toggeleLocationValidation}
      >
        <Icon name="location-on" size={24} color={checkSubmitLocationAllowed ? COLORS.primary : COLORS.text.secondary} />
      </TouchableOpacity> */}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
