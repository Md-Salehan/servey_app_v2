import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headerActions: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});