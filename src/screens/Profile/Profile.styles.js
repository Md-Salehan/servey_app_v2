// src/screens/Profile/Profile.styles.js
import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '400',
  },

  // Profile Header - Shopify Minimal
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: '500',
    color: COLORS.text.inverse,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userDesignation: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
    color: COLORS.text.disabled,
    marginBottom: 8,
  },
  userBadge: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  userBadgeText: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },

  // Section Styles - Shopify Cards
  section: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },

  // Field Styles - Shopify Clean
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fieldValue: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  fieldHelper: {
    fontSize: 12,
    color: COLORS.text.disabled,
    marginTop: 4,
  },
  fieldDescription: {
    fontSize: 12,
    color: COLORS.text.disabled,
    marginTop: 4,
  },

  // Text Input Styles - Shopify Minimal
  textInput: {
    paddingVertical: 10,
    paddingHorizontal: 0,
    fontSize: 15,
    color: COLORS.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    lineHeight: 22,
  },
  textInputFocused: {
    borderBottomColor: COLORS.primary,
    borderBottomWidth: 2,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Date Picker Styles - Shopify Minimal
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.text.primary,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.text.disabled,
  },

  // Dropdown Styles - Shopify Minimal
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownText: {
    fontSize: 15,
    color: COLORS.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.gray[50],
  },
  dropdownItemText: {
    fontSize: 15,
    color: COLORS.text.primary,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Location Button Styles - Shopify Minimal
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    color: COLORS.text.primary,
    flex: 1,
  },

  // Toggle Styles - Shopify Minimal
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  // Action Button Styles - Shopify Clean
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  destructiveAction: {
    borderBottomWidth: 0,
  },
  destructiveText: {
    color: COLORS.error,
  },

  // Logout Button - Shopify Minimal
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.error,
    marginLeft: 8,
  },

  // Edit Toggle Styles - Shopify Clean
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  editButtonText: {
    color: COLORS.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: COLORS.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Dummy Avatar Collection - Shopify Colors
  dummyAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatar1: {
    backgroundColor: '#008060', // Shopify green
  },
  avatar2: {
    backgroundColor: '#5E8E3E', // Forest green
  },
  avatar3: {
    backgroundColor: '#B98900', // Gold
  },
  avatar4: {
    backgroundColor: '#007B8F', // Teal
  },
  avatar5: {
    backgroundColor: '#9E6B52', // Brown
  },
  avatar6: {
    backgroundColor: '#B6465F', // Rose
  },
  avatar7: {
    backgroundColor: '#4A7B9D', // Blue
  },
  avatar8: {
    backgroundColor: '#8F5E9E', // Purple
  },
});