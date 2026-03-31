import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import RecordEntryScreen from '../screens/RecordEntry/RecordEntryScreen';
import PreviewEntryScreen from '../screens/PreviewEntry/PreviewEntry';
import DataInspectorScreen from '../screens/DataInspector/DataInspectorScreen';
import PendingSubmissionsScreen from '../screens/PendingSubmissions/PendingSubmissionsScreen';
import SelectLocationScreen from '../screens/SelectLocation/SelectLocationScreen';
import { ROUTES } from '../constants/routes';
import SubmissionService from '../services/submissionService';
import { database } from '../database';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const submissionService = new SubmissionService(database);
  submissionService.startQueueProcessor();
  // Clean up on app close
  useEffect(() => {
    return () => {
      submissionService.stopQueueProcessor();
    };
  }, []);

  return (
    <Stack.Navigator
      // screenOptions={{
      //   headerStyle: {
      //     backgroundColor: '#1890ff',
      //   },
      //   headerTintColor: '#fff',
      //   headerTitleStyle: {
      //     fontWeight: 'bold',
      //   },
      // }}
      screenOptions={{
        headerShown: false, // Hide header for custom design
        cardStyle: { backgroundColor: 'transparent' },
        cardOverlayEnabled: true,
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
          overlayStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
              extrapolate: 'clamp',
            }),
          },
        }),
      }}
    >
      <Stack.Screen
        name={ROUTES.DASHBOARD}
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name={ROUTES.RECORD_ENTRY}
        component={RecordEntryScreen}
        options={{ title: 'Record Entry' }}
      />
      <Stack.Screen
        name={ROUTES.PREVIEW_ENTRY} // Add this screen
        component={PreviewEntryScreen}
        options={{ title: 'Preview' }}
      />
      <Stack.Screen
        name={ROUTES.DATA_INSPECTOR} // Add this route
        component={DataInspectorScreen}
        options={{ title: 'Data Inspector' }}
      />
      <Stack.Screen
        name={ROUTES.PENDING_SUBMISSIONS} // Add this route
        component={PendingSubmissionsScreen}
        options={{ title: 'Pending Submissions' }}
      />
      <Stack.Screen
        name={ROUTES.SELECT_LOCATION} // Add this route
        component={SelectLocationScreen}
        options={{ title: 'Select Location' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
