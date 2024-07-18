import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, TouchableWithoutFeedback, Animated, Easing, Image } from 'react-native';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from '@firebase/auth';
import Button from '../UI/Button';
import Divider from '../UI/Divider';
import Input from '../UI/Input';
import { useTheme } from '../contexts/ThemeContext';
import Typography from '../UI/Typography';
import googleIcon from '../assets/google-icon.png';
import Loader from '../UI/Loader';
import alertIcon from '../assets/alert-icon.png';

const LogInScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [getStartedShown, setGetStartedShown] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showNext, setShowNext] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(900)).current;
  const errorSlideAnim = useRef(new Animated.Value(-30)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;

  const submit = async () => {
    if (username && password) {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, username + '@example.com', password);
        navigation.dispatch(
          CommonActions.reset({
              index: 0,
              routes: [{ name: 'HomeTabs' }],
          })
      );
        setLoading(false);
      } catch (error) {
        setErrorMessage('Make sure you enter valid username and password.');
        Animated.parallel([
          Animated.timing(errorSlideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(errorFadeAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
        setLoading(false);
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
      setUsername('');
      setPassword('');
      setGetStartedShown(false);
      setFirstName('');
      setLastName('');
      setShowNext(false);
      setErrorMessage('');
      slideAnim.setValue(900);
      fadeAnim2.setValue(1);
      errorSlideAnim.setValue(-30);
      errorFadeAnim.setValue(0);
    }, [])
  );

  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.backgroundColors.main2,
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
      borderRadius: 35,
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
      marginBottom: -5,
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
      {loading && <Loader />}
      {getStartedShown && (
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
      )}
      <View style={styles.headerContainer}>
        <Typography weight={600} headline={true}>Welcome Back! 👋</Typography>
        <Typography weight={600} body={true}>Please enter your information below</Typography>
        {errorMessage !== '' && (
          <Animated.View style={{ transform: [{ translateY: errorSlideAnim }], opacity: errorFadeAnim, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: 20, position: 'relative', top: 165 }}>
            <Image style={{ width: 25, height: 25 }} source={alertIcon} />
            <Typography width={280} color={theme.colors.main}>{errorMessage}</Typography>
          </Animated.View>
        )}
      </View>
      <View style={styles.formContainer}>
        <View>
          <Input autoCapitalize={false} keyboardType="email-address" includeLabel={true} label='Username' placeholder="Enter your username" value={username} onChangeText={setUsername} />
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
                <Input autoCapitalize={true} includeLabel={true} label='First Name' placeholder="Ex. Mary" value={firstName} onChangeText={setFirstName} />
              </View>
              <View>
                <Input autoCapitalize={true} includeLabel={true} label='Last Name' placeholder="Ex. Sue" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
            <Button onPress={handleNext} highlight={true}>Next</Button>
            <Divider top={-5} bottom={-5} includeOr={true} />
            <Button onPress={handleBackdropPress} highlight={false}>
              Close
            </Button>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

export default LogInScreen;
