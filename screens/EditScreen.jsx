import React, { useEffect, useState } from 'react';
import { Dimensions, View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import { useTheme } from '../contexts/ThemeContext';
import arrowIcon from '../assets/arrow-icon.png';
import userPlaceholder from '../assets/user-placeholder-icon.jpeg';
import { useNavigation } from '@react-navigation/native';
import Input from '../UI/Input';
import { useUser } from '../contexts/AuthContext';
import { db, storage } from '../firebaseConfig'; 
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getAuth, updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { useReload } from '../contexts/ReloadContext';
import * as Haptics from 'expo-haptics';


const { width, height } = Dimensions.get('window');

const EditScreen = () => {
    const [userData, setUserData] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [photoURL, setPhotoURL] = useState(null);

    const theme = useTheme();
    const navigation = useNavigation();
    const { user } = useUser();
    const auth = getAuth();
    const { setReload, setUsersData } = useReload();

    useEffect(() => {
        let unsubscribe;

        const fetchUserData = async () => {
            try {
                const userRef = doc(db, 'users', user.uid);

                unsubscribe = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        setUserData(data);
                        setFirstName(data.firstName || '');
                        setLastName(data.lastName || '');
                        setUsername(data.username || '');
                        setPhotoURL(data.photoURL || userPlaceholder);
                    } else {
                        console.log('User data not found');
                    }
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        if (user && user.uid) {
            fetchUserData();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user]);

    const uploadImage = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading image: ', error);
            return null;
        }
    };

    const handleSave = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            let updatedPhotoURL = photoURL;
            if (photoURL && !photoURL.startsWith('https://')) {
                updatedPhotoURL = await uploadImage(photoURL);
            }

            const userRef = doc(db, 'users', user.uid);

            const updatedData = {
                firstName,
                lastName,
                username,
                photoURL: updatedPhotoURL || userPlaceholder,
            };

            await updateDoc(userRef, updatedData);

            if (username !== user.email) {
                await updateEmail(user, `${username}@example.com`);
            }

            if (newPassword) {
                await updatePassword(user, newPassword);
            }

            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`,
                photoURL: updatedPhotoURL || userPlaceholder,
            });

            setUsersData(prev => ({
                ...prev,
                [user.uid]: updatedData
            }));

            setReload(prev => !prev); 
            Alert.alert('Profile updated', 'Your profile has been updated successfully.');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'There was an error updating your profile. Please try again.');
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setPhotoURL(result.assets[0].uri);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 21,
            backgroundColor: theme.backgroundColors.main,
            height: height,
            position: 'absolute',
            width: '100%',
            bottom: 0,
            borderRadius: 35,
            gap: 10,
            paddingTop: 39,
        },
        contentContainer: {
            backgroundColor: theme.backgroundColors.main,
            display: 'flex',
            gap: 15,
            paddingTop: 49,
        },
    });

    return (
        <View style={styles.container}>
            <View style={{ height: 49 }} />
            <View style={{ backgroundColor: theme.backgroundColors.main2, padding: 17, borderRadius: 20, flexDirection: 'row', gap: 14, marginTop: 20, position: 'absolute', zIndex: 10, marginLeft: 21, width: '100%', top: 49 }}>
                <Button onPress={() => navigation.goBack()} highlight={false} width={39} height={39}>
                    <Image style={{ transform: 'rotate(180deg)', width: 21, height: 21, marginBottom: -5 }} source={arrowIcon} />
                </Button>
                <View>
                    <Typography size={16} headline={true}>Edit your profile</Typography>
                    <Typography size={14} headline={false}>After you're done press save</Typography>
                </View>
            </View>
            <ScrollView style={styles.contentContainer}>
                <View style={{ gap: 15 }}>
                    <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 17, backgroundColor: theme.backgroundColors.main2, borderRadius: 20, height: 74, marginTop: 20, marginBottom: 10 }}>
                        <Button width={100} onPress={pickImage}>Edit</Button>
                        <View style={{ width: 100, height: 100, backgroundColor: theme.backgroundColors.main2, borderRadius: 35 }}>
                            <View style={{ width: 83, height: 83, backgroundColor: theme.backgroundColors.secondary, borderRadius: 30, marginTop: 7.5, marginLeft: 7.5 }}>
                                <Image style={{ width: 71, height: 71, borderRadius: 25, marginTop: 6, marginLeft: 6, borderWidth: 5, borderColor: theme.colors.main2 }} source={{ uri: photoURL }} />
                            </View>
                        </View>
                        <Button width={100} onPress={() => setPhotoURL(null)}>Delete</Button>
                    </View>
                    <View style={{ backgroundColor: theme.backgroundColors.main2, padding: 17, borderRadius: 20 }}>
                        <Input value={username.toLowerCase()} onChangeText={setUsername} marginBottom={20} includeLabel={true} label='Username' />
                        <Input value={firstName} onChangeText={setFirstName} marginBottom={20} includeLabel={true} label='First name' />
                        <Input value={lastName} onChangeText={setLastName} includeLabel={true} label='Last name' />
                    </View>
                    <View style={{ backgroundColor: theme.backgroundColors.main2, padding: 17, borderRadius: 20 }}>
                        <Input value={newPassword} onChangeText={setNewPassword} marginBottom={20} password={true} placeholder='Enter your new password' includeLabel={true} label='Password' />
                        <Input value={password} onChangeText={setPassword} password={true} placeholder='Enter your current password' />
                    </View>
                </View>
            </ScrollView>
            <View style={{ height: 49 }} />
            <View style={{ padding: 17, backgroundColor: theme.backgroundColors.main2, borderRadius: 20, position: 'absolute', width: '100%', marginLeft: 21, bottom: 21 }}>
                <Button onPress={handleSave}>Save</Button>
            </View>
        </View>
    );
}

export default EditScreen;
