import { useTheme } from '../contexts/ThemeContext';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function ChatsScreen() {

  const theme = useTheme(); 

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColors.main,
      color: theme.colors.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text>Chats Screen</Text>
      <View></View>
    </View>
  );
}
