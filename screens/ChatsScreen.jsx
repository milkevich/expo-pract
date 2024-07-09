import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function ChatsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>Chats Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
