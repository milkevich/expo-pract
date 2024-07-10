import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, TouchableWithoutFeedback, Animated, Easing, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from '@firebase/auth';
import Button from '../UI/Button';
import Divider from '../UI/Divider';
import Input from '../UI/Input';
import { useTheme } from '../contexts/ThemeContext';
import Typography from '../UI/Typography';
import googleIcon from '../assets/google-icon.png'

const LogInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [getStartedShown, setGetStartedShown] = useState(false);
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showNext, setShowNext] = useState(false)
  const navigation = useNavigation();
  const theme = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(900)).current;

  const submit = async () => {
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigation.navigate('Home');
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleBackdropPress = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 900,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 0,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => setGetStartedShown(false));
  };

  const showGetStarted = () => {
    setGetStartedShown(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 325,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (getStartedShown) {
      showGetStarted();
    }
  }, [getStartedShown]);

  useFocusEffect(
    useCallback(() => {
      setEmail('');
      setPassword('');
      setGetStartedShown(false);
      setFirstName('');
      setLastName('');
      setShowNext(false);
      slideAnim.setValue(900); 
      fadeAnim2.setValue(1);
    }, [])
  );

  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.backgroundColors.main,
    },
    headerContainer: {
      position: "relative",
      height: 400,
      paddingTop: 80,
      backgroundColor: theme.backgroundColors.secondary,
      padding: 21,
    },
    formContainer: {
      padding: 21,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    },
    getStartedContainer: {
      height: '100%',
      width: '100%',
      position: 'absolute',
      bottom: 0,
      backgroundColor: theme.backgroundColors.main2,
      borderRadius: theme.other.borderRadius.container,
      shadowOffset: 1,
      shadowOpacity: 0.3,
      zIndex: 3,
      padding: 41,
    },
    getStartedContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: 25,
    },
    backdrop: {
      height: '100%',
      width: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      position: 'absolute',
      zIndex: 2,
    },
    googleButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: -5
    },
    googleIcon: {
      width: 20,
      height: 20,
      marginRight: 10,
    },
  });

  const handleNext = () => {
    const namePattern = /^\s*$/;

    if (!namePattern.test(firstName) && !namePattern.test(lastName)) {
      setShowNext(true);
      Animated.parallel([
        Animated.timing(fadeAnim2, {
          toValue: 0,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        navigation.navigate('SignUp', { firstName, lastName });
      }, 400);
    } else {
      alert('Please enter valid first and last names.');
      setShowNext(false);
      Animated.parallel([
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 325,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };


  return (
    <View style={styles.mainContainer}>
      {getStartedShown && (
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
      )}
      <View style={styles.headerContainer}>
        <Typography weight={600} headline={true}>Welcome Back! 👋</Typography>
        <Typography weight={600} body={true}>Please enter your information below</Typography>
      </View>
      <View style={styles.formContainer}>
        <View>
          <Input autoCapitalize={false} keyboardType="email-address" includeLabel={true} label='Email' placeholder="Ex. example@mail.com" value={email} onChangeText={setEmail} />
        </View>
        <View>
          <Input autoCapitalize={false} includeLabel={true} label='Password' placeholder="Enter your password" value={password} onChangeText={setPassword} password={true} />
        </View>
        <Button onPress={submit} highlight={true}>Log In</Button>
        <Divider includeOr={true} />
        <Button onPress={() => setGetStartedShown(true)} highlight={false}>Sign Up</Button>
      </View>
      {getStartedShown && (
        <Animated.View style={[styles.getStartedContainer, { transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[styles.getStartedContent, { opacity: fadeAnim2 }]}>
            <View style={{ marginTop: -10, marginBottom: 20 }}>
              <Typography weight={600} headline={true}>Get Started</Typography>
              <Typography weight={600} body={true}>Please enter your information below</Typography>
            </View>
            <View style={{ display: 'flex', gap: 10 }}>
              <View>
                <Input autoCapitalize={true} includeLabel={true} transparent={true} label='First Name' placeholder="Ex. Mary" value={firstName} onChangeText={setFirstName} />
              </View>
              <View>
                <Input autoCapitalize={true} includeLabel={true} transparent={true} label='Last Name' placeholder="Ex. Sue" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
            <Button onPress={handleNext} highlight={true}>Next</Button>
            <Divider top={-5} bottom={-5} includeOr={true} />
            <Button highlight={false}>
              <View style={styles.googleButtonContainer}>
                <Image source={googleIcon} style={styles.googleIcon} />
                <Text style={{ fontWeight: 600, color: theme.colors.third }}>Continue with Google</Text>
              </View>
            </Button>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

export default LogInScreen;