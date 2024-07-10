import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Button, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import Input from '../UI/Input';
import { useTheme } from '../contexts/ThemeContext';


const SignUpScreen = () => {
  const theme = useTheme()

  const route = useRoute();
  const { firstName, lastName } = route.params;
  const [photo, setPhoto] = useState(null);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setPhoto(result.assets[0]); 
    }
  };

  const navigation = useNavigation();

  const handleReset = () => {
    navigation.navigate('LogIn');
  };


const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
      borderStartColor: theme.backgroundColors.main2
    },
    title: {
      fontSize: 24,
      marginBottom: 16,
      textAlign: 'center',
    },
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    button: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#007bff',
      borderRadius: 5,
      paddingHorizontal: 16,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
    },
    resetText: {
      color: '#007bff',
      textAlign: 'center',
      marginTop: 16,
    },
  });  

  return (
    <View style={styles.container}>
        <Text>{firstName} {lastName}</Text>
      <TouchableOpacity onPress={handleReset}>
        <Text style={styles.resetText}>Already have an account?</Text>
      </TouchableOpacity>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {photo && <View style={{ width: 80, height: 80, borderRadius: 100, overflow: "hidden", position: "relative", top: 0}}><Image source={{ uri: photo.uri }} style={{ width: 80, height: 80, marginTop: 10, alignItems: "center", justifyContent: "center", position: "relative", top: -10 }} /></View>}
      <TouchableOpacity style={styles.button} onPress={() => onSignUp({ photo })}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpScreen;