// src/components/ErrorBoundary/ErrorBoundary.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10, color: '#ff4d4f' }}>
            Something went wrong
          </Text>
          <Text style={{ marginBottom: 20, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#1890ff',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 6,
            }}
            onPress={this.handleRetry}
          >
            <Text style={{ color: '#fff' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;