import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import Input from '../UI/Input';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../UI/Button';
import arrow from '../assets/arrow-icon.png';
import Typography from '../UI/Typography';
import userIcon from '../assets/user-placeholder-icon.jpeg';
import plusIcon from '../assets/plus-icon.png';
import { useUser } from '../contexts/AuthContext';
import { createUserWithEmailAndPassword, updateProfile } from '@firebase/auth';
import { auth, db, storage } from '../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import Loader from '../UI/Loader';

const SignUpScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [stepCount, setStepCount] = useState(1);
    const [loading, setLoading] = useState(false)
    const theme = useTheme();
    const route = useRoute();
    const { setUser } = useUser();
    const { firstName, lastName } = route.params;
    const [photo, setPhoto] = useState(null);
    const fadeAnim = useState(new Animated.Value(1))[0];
    const slideAnim = useState(new Animated.Value(0))[0];
    const navigation = useNavigation();

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

        if (!result.canceled) {
            setPhoto(result.assets[0]);
        }
    };

    const handleReset = () => {
        navigation.navigate('LogIn');
    };

    const isValidUsername = (username) => {
        const usernamePattern = /^[a-zA-Z0-9_]{3,}$/;
        return usernamePattern.test(username);
    };

    const isValidPassword = (password) => {
        return password.length >= 6;
    };

    const generateEmailFromUsername = (username) => {
        return `${username}@example.com`;
    };

    const nextStep = () => {
        if (isValidUsername(username) && isValidPassword(password)) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 300,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setStepCount(stepCount + 1);
                fadeAnim.setValue(0);
                slideAnim.setValue(100);
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        } else {
            let errorMessage = 'Please enter valid information:';
            if (!isValidUsername(username)) {
                errorMessage += '\n- Username should be at least 3 characters long and contain no spaces (use underscores).';
            }
            if (!isValidPassword(password)) {
                errorMessage += '\n- Password should be at least 6 characters long.';
            }
            alert(errorMessage);
        }
    };

    const prevStep = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 100,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start(() => {
            setStepCount(stepCount - 1);
            fadeAnim.setValue(0);
            slideAnim.setValue(-100);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const submit = async () => {
        if (stepCount === 2 && isValidPassword(password) && isValidUsername(username)) {
            setLoading(true)
            try {
                const email = generateEmailFromUsername(username);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                const date = new Date().getTime();
                const extension = photo.uri.split('.').pop();
                const storageRef = ref(storage, `${date}.${extension}`);

                const response = await fetch(photo.uri);
                const blob = await response.blob();

                const uploadTask = uploadBytesResumable(storageRef, blob);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        //  add progress 
                    },
                    (error) => {
                        console.error("Error uploading file:", error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log("File available at:", downloadURL);

                        await updateProfile(user, {
                            photoURL: downloadURL,
                        });

                        const userRef = doc(db, "users", user.uid);
                        await setDoc(userRef, {
                            uid: user.uid,
                            firstName,
                            lastName,
                            username,
                            password,
                            photoURL: downloadURL,
                            followers: 0,
                            followings: 0,
                            posts: 0,
                            online: true
                        });

                        await setUser({
                            uid: user.uid,
                            firstName,
                            lastName,
                            username,
                            password,
                            photoURL: downloadURL,
                            followers: 0,
                            followings: 0,
                            posts: 0,
                        });

                        console.log("User document created in Firestore with ID:", user.uid);
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            })
                        );
                    }
                );

            } catch (error) {
                console.error("Error creating user:", error);
            setLoading(false)
            }
        } else {
            setLoading(false)
            let errorMessage = 'Please enter valid information:';
            if (!isValidUsername(username)) {
                errorMessage += '\n- Username should be at least 3 characters long and contain no spaces (use underscores).';
            }
            if (!isValidPassword(password)) {
                errorMessage += '\n- Password should be at least 6 characters long.';
            }
            alert(errorMessage);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 41,
            paddingTop: 80,
            backgroundColor: theme.backgroundColors.main2,
        },
        header: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20,
        },
        formContainer: {
            flex: 1,
            justifyContent: 'center',
        },
        uploadContainer: {
            flex: 1,
            justifyContent: 'center',
            position: 'relative',
            left: 80,
        },
        nextButton: {
            marginBottom: 20,
        },
    });

    return (
        <View style={styles.container}>
            {loading && <Loader/>}
            <View style={styles.header}>
                <Button height={50} width={50} onPress={stepCount === 1 ? handleReset : prevStep}>
                    <View>
                        <Image style={{ width: 20, height: 20, transform: [{ rotate: '180deg' }], marginBottom: -5 }} source={arrow} />
                    </View>
                </Button>
                <View style={{ marginTop: -3 }}>
                    <Typography headline={true}>{stepCount === 1 ? 'Register' : 'Upload'}</Typography>
                    <Typography body={true}>{stepCount === 1 ? 'Enter your information below' : 'Please upload your picture'}</Typography>
                </View>
            </View>
            {stepCount === 1 ?
                <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                    <View>
                        <Input transparent={true} autoCapitalize={false} includeLabel={true} label='Username' placeholder="Create a username" value={username} onChangeText={setUsername} />
                    </View>
                    <View>
                        <Input transparent={true} autoCapitalize={false} includeLabel={true} label='Password' placeholder="Enter your password" value={password} onChangeText={setPassword} password={true} />
                    </View>
                </Animated.View>
                :
                <Animated.View style={[styles.uploadContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                    <TouchableOpacity style={{ zIndex: 10, marginBottom: -177.5, marginLeft: 55 }} onPress={pickImage}>
                        <View style={{ backgroundColor: theme.backgroundColors.secondary, width: 53, height: 53, borderRadius: 20, borderWidth: 7, borderColor: theme.backgroundColors.main2 }}>
                            <Image style={{ width: 18, height: 18, marginLeft: 10, marginTop: 10 }} source={plusIcon} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage}>
                        <View style={{ width: 155, height: 155, borderRadius: 47.5, overflow: "hidden", position: "relative", top: 0, backgroundColor: theme.backgroundColors.secondary }}>
                            <Image source={photo ? { uri: photo.uri } : userIcon} style={{ width: 140, height: 140, marginTop: 7.5, marginLeft: 7.5, alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10, borderRadius: 40, borderWidth: 4, borderColor: theme.colors.main2 }} />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            }
            <View style={styles.nextButton}>
                <Button onPress={stepCount === 1 ? nextStep : submit} highlight={true}>{stepCount === 1 ? 'Next' : 'Sign Up'}</Button>
            </View>
        </View>
    );
};

export default SignUpScreen;
