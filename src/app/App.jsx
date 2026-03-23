// App.tsx
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { store } from './store';
import RootNavigator from '../navigation/RootNavigator';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import { database, initializeDatabase } from '../database';
import {resetDatabaseIfNeeded} from '../database/devReset'
import { COLORS } from '../constants/colors';

const App = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

   useEffect(() => {
    // 🔥 run once in development
    // resetDatabaseIfNeeded();
  }, []);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log('📦 Initializing database...');
        await initializeDatabase();
        console.log('✅ Database initialized successfully');
        setIsDbReady(true);
      } catch (error) {
        console.error('❌ Database initialization failed:', error);
        setDbError(error.message);
      }
    };

    setupDatabase();
  }, []);

  // Show loading screen while database initializes
  if (!isDbReady && !dbError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.text.secondary }}>
            Initializing app...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Show error screen if database initialization fails
  if (dbError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.error, marginBottom: 12 }}>
            Initialization Failed
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.text.secondary, textAlign: 'center' }}>
            {dbError}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <Provider store={store}>
      <DatabaseProvider database={database}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </SafeAreaProvider>
      </DatabaseProvider>
    </Provider>
  );
};

export default App;