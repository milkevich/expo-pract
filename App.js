import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileScreen from './screens/ProfileScreen';
import DetailsScreen from './screens/DetailsScreen';
import ChatsScreen from './screens/ChatsScreen';
import ChatsFilled from './assets/icons/chatsFilled';
import ChatsOutlined from './assets/icons/chatsOutlined';
import UserFilled from './assets/icons/userFilled';
import UserOutlined from './assets/icons/userOutlined';
import HomeFilled from './assets/icons/homeFilled';
import HomeOutlined from './assets/icons/homeOutlined';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const Tab = createBottomTabNavigator();

const App = () => {
  const theme = useTheme(); 

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
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
        })}
        tabBarOptions={{
          activeTintColor: theme.colors.main,
          inactiveTintColor: theme.colors.secondary,
          showLabel: false, 
        }}
      >
        <Tab.Screen name="You" component={ProfileScreen} />
        <Tab.Screen name="Chats" component={ChatsScreen} />
        <Tab.Screen name="Home" component={DetailsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
