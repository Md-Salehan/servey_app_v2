import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Login/LoginScreen';
import RegisterScreen from '../screens/Register/RegisterScreen';
import OTPScreen from '../screens/OTP/OTPScreen'; // Add this import
import { ROUTES } from '../constants/routes';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.LOGIN}
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
        name={ROUTES.LOGIN}
        component={LoginScreen}
      />
      <Stack.Screen
        name={ROUTES.OTP}
        component={OTPScreen}
      />
      <Stack.Screen
        name={ROUTES.REGISTER}
        component={RegisterScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;