import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1890ff',
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#1890ff',
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#1890ff',
    fontSize: 14,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginBottom: 8,
  },
});