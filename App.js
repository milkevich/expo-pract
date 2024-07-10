import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, StatusBar } from 'react-native';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LogInScreen from './screens/LogInScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatsScreen from './screens/ChatsScreen';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ChatsFilled from './assets/icons/chatsFilled';
import ChatsOutlined from './assets/icons/chatsOutlined';
import UserFilled from './assets/icons/userFilled';
import UserOutlined from './assets/icons/userOutlined';
import HomeFilled from './assets/icons/homeFilled';
import HomeOutlined from './assets/icons/homeOutlined';
import { StatusBarProvider, useStatusBar } from './contexts/StatusBarContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const fetchFonts = () => {
  return Font.loadAsync({
    'Inter-Thin': require('./assets/fonts/Inter-Thin.ttf'),
    'Inter-ExtraLight': require('./assets/fonts/Inter-ExtraLight.ttf'),
    'Inter-Light': require('./assets/fonts/Inter-Light.ttf'),
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('./assets/fonts/Inter-ExtraBold.ttf'),
    'Inter-Black': require('./assets/fonts/Inter-Black.ttf'),
  });
};

const HomeTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'You') {
            IconComponent = focused ? UserFilled : UserOutlined;
          } else if (route.name === 'Chats') {
            IconComponent = focused ? ChatsFilled : ChatsOutlined;
          } else if (route.name === 'Home') {
            IconComponent = focused ? HomeFilled : HomeOutlined;
          }

          return <IconComponent width={size} height={size} fill={color} />;
        },
        tabBarActiveTintColor: theme.colors.main,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const App = () => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const theme = useTheme();
  const {status} = useStatusBar()

  if (!fontLoaded) {
    return (
      <AppLoading
        startAsync={fetchFonts}
        onFinish={() => setFontLoaded(true)}
        onError={(err) => console.log(err)}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle={`${status}-content`} />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LogIn">
          <Stack.Screen name="LogIn" component={LogInScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default () => (
  <StatusBarProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StatusBarProvider>
);
