import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import RecordEntryScreen from '../screens/RecordEntry/RecordEntryScreen';
import { ROUTES } from '../constants/routes';

const Stack = createStackNavigator();

const MainNavigator = () => {
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
    </Stack.Navigator>
  );
};

export default MainNavigator;
