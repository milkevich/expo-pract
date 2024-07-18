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
import { AuthProvider } from './contexts/AuthContext';
import CreatePost from './screens/CreatePost';
import BrowseScreen from './screens/BrowseScreen';
import BrowseFilled from './assets/icons/browseFilled'
import BrowseOutlined from './assets/icons/browseOutlined'
import OtherUsersProfile from './screens/OtherUsersProfile';
import { BackdropProvider } from './contexts/BackDropContext';
import EditScreen from './screens/EditScreen';
import { ReloadProvider } from './contexts/ReloadContext';
import Chat from './screens/Chat';

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
          } else if (route.name === 'Browse') {
            IconComponent = focused ? BrowseFilled : BrowseOutlined;
          }

          return <IconComponent width={size} height={size} fill={color} />;
        },
        tabBarActiveTintColor: theme.colors.main,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: 'rgba(0, 0, 0, 0.25)',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          overflow: 'hidden',
          position: 'absolute',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const App = () => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const theme = useTheme();
  const { status } = useStatusBar();

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
          <Stack.Screen name="CreatePost" component={CreatePost} options={{ headerShown: false }} />
          <Stack.Screen name="UsersProfile" component={OtherUsersProfile} options={{ headerShown: false }} />
          <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Edit" component={EditScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default () => (

  <BackdropProvider>
    <AuthProvider>
      <StatusBarProvider>
        <ThemeProvider>
          <ReloadProvider>
            <App />
          </ReloadProvider>
        </ThemeProvider>
      </StatusBarProvider>
    </AuthProvider>
  </BackdropProvider>

);
