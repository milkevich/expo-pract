import React, { useState, useRef } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar, FlatList, Dimensions, Modal, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import arrowIcon from '../assets/arrow-icon.png';
import attachIcon from '../assets/attach-icon.png';
import sendIcon from '../assets/send-icon.png';
import sendIconDark from '../assets/send-icon-dark.png';
import deleteIcon from '../assets/delete-icon.png';
import tagUserIcon from '../assets/tag-user-icon.png';
import Input from '../UI/Input';
import * as ImagePicker from 'expo-image-picker';
import Paginator from '../components/Paginator';
import UserList from '../components/UsersList';
import { db, storage } from '../firebaseConfig';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useUser } from '../contexts/AuthContext';
import shortid from 'shortid';
import { Timestamp, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import Loader from '../UI/Loader';

const { width, height } = Dimensions.get('window');

const CreatePost = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const route = useRoute();
    const { user } = useUser()
    const { userData } = route.params;
    const [photos, setPhotos] = useState([]);
    const [aspectRatio, setAspectRatio] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [fadeVisible, setFadeVisible] = useState(false);
    const [usersListVisible, setUsersListVisible] = useState(false);
    const [collaboratedUser, setCollaboratedUser] = useState(null);
    const [postText, setPostText] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scrollX = useRef(new Animated.Value(0)).current;
    const [loading, setLoading] = useState(false)

    const pickImage = async () => {
        if (photos.length >= 3) {
            alert('You can only upload a maximum of 3 photos.');
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 3 - photos.length,
        });

        if (!result.canceled) {
            const firstImage = photos.length === 0;
            if (firstImage) {
                const { width, height } = result.assets[0];
                setAspectRatio(width / height);
            }
            setPhotos((prevPhotos) => [...prevPhotos, ...result.assets]);
        }
    };

    const deleteImage = () => {
        setPhotos(photos.filter((_, i) => i !== currentIndex));
        setModalVisible(false);
        setFadeVisible(false);
    };

    const viewabilityConfig = useRef({
        viewAreaCoveragePercentThreshold: 50,
    });

    const handleViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const renderItem = ({ item, index }) => (
        <View key={index} style={{ position: 'relative' }}>
            <Image
                style={[
                    styles.imagePreview,
                    {
                        aspectRatio: aspectRatio,
                        height: aspectRatio > 1 ? 320 / aspectRatio : 400,
                        minWidth: width > 390 ? 317 : 314,
                        maxWidth: 314,
                        maxHeight: 400,
                        borderTopRightRadius: index + 1 === photos.length ? 15 : 0,
                        borderBottomRightRadius: index + 1 === photos.length ? 15 : 0,
                        borderBottomLeftRadius: index === 0 ? 15 : 0,
                        borderTopLeftRadius: index === 0 ? 15 : 0,
                    },
                ]}
                source={{ uri: item.uri }}
            />
        </View>
    );

    const openModal = () => {
        setModalVisible(true);
        setFadeVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setFadeVisible(false);
        });
        setModalVisible(false);
    };

    const handleOpenUsersList = () => {
        setUsersListVisible(true);
        setFadeVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleCloseUsersList = (selectedUser) => {
        setUsersListVisible(false);
        setCollaboratedUser(selectedUser);
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setFadeVisible(false);
        });
    };

    const handleSelectUser = (user) => {
        console.log('Selected user:', user);
        handleCloseUsersList(user);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.backgroundColors.main,
        },
        contentContainer: {
            padding: 21,
            backgroundColor: theme.backgroundColors.main,
            display: 'flex',
            gap: 15,
            paddingTop: 80,
        },
        fixedHeader: {
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            padding: 17,
            backgroundColor: theme.backgroundColors.main2,
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'row',
            gap: 15,
            alignItems: 'center',
            zIndex: 10,
            margin: 21,
        },
        arrowIcon: {
            transform: [{ rotate: '180deg' }],
            width: 21,
            height: 21,
            position: 'relative',
            marginBottom: -5,
            top: 9,
            left: 9,
        },
        attachIcon: {
            width: 21,
            height: 21,
            position: 'relative',
            marginBottom: -5,
            top: 9,
            left: 9,
        },
        buttonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        imagePreviewContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        imageContainer: {
            position: 'relative',
        },
        imagePreview: {
            maxWidth: 320,
            maxHeight: 400,
            width: '100%',
            height: '100%',
            borderRadius: 15,
        },
        deleteIcon: {
            position: 'absolute',
            top: 5,
            right: 5,
            width: 20,
            height: 20,
        },
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            width: 351,
            backgroundColor: theme.backgroundColors.main2,
            padding: 17,
            borderRadius: 20,
            display: 'flex',
            gap: 19,
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: fadeVisible ? 'flex' : 'none',
            zIndex: 100,
        },
        paginatorContainer: {
            position: 'absolute',
            bottom: -42.5,
            width: '100%',
            alignItems: 'center',
            opacity: photos.length === 1 ? 0 : 1,
        },
        userImageWrapper: {
            width: 25,
            height: 25,
            borderRadius: 10.5,
            position: 'absolute',
            left: 22.5,
            bottom: -3,
            borderWidth: 3,
            borderColor: theme.backgroundColors.main2,
            backgroundColor: theme.backgroundColors.main2,
            justifyContent: 'center',
            alignItems: 'center',
        },
        userImage: {
            width: 19.5,
            height: 19.5,
            borderRadius: 7.5,
        },
    });

    const share = async (e) => {
        e.preventDefault();

        const postId = shortid.generate();
        const postRef = doc(db, 'posts', postId);
        const userRef = doc(db, 'users', user.uid);
        const collaboraterRef = collaboratedUser ? doc(db, 'users', collaboratedUser.id) : null;

        try {
            const userDoc = await getDoc(userRef);
            const userPosts = userDoc.exists() ? userDoc.data().posts || 0 : 0;

            let collaboraterPosts = 0;
            if (collaboraterRef) {
                const collaboraterDoc = await getDoc(collaboraterRef);
                collaboraterPosts = collaboraterDoc.exists() ? collaboraterDoc.data().posts || 0 : 0;
            }

            if (photos.length > 0) {
                setLoading(true)
                const photoUrls = await Promise.all(photos.map(async (photo) => {
                    const storageRef = ref(storage, `images/${shortid.generate()}`);
                    const response = await fetch(photo.uri);
                    const blob = await response.blob();
                    const uploadTask = uploadBytesResumable(storageRef, blob);

                    await new Promise((resolve, reject) => {
                        uploadTask.on(
                            'state_changed',
                            null,
                            (error) => {
                                console.error('Upload error:', error);
                                reject(error);
                            },
                            async () => {
                                try {
                                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                    resolve(downloadURL);
                                } catch (error) {
                                    console.error('Error getting download URL:', error);
                                    reject(error);
                                }
                            }
                        );
                    });

                    return await getDownloadURL(uploadTask.snapshot.ref);
                }));

                await updateDoc(userRef, {
                    posts: userPosts + 1
                });

                if (collaboraterRef) {
                    await updateDoc(collaboraterRef, {
                        posts: collaboraterPosts + 1
                    });
                }

                await setDoc(postRef, {
                    author: collaboratedUser ? [user.uid, collaboratedUser.id] : [user.uid],
                    text: postText,
                    likes: 0,
                    comments: [],
                    date: Timestamp.now(),
                    imgs: photoUrls,
                    id: postId,
                });
                setPostText('');
                setPhotos([]);
                navigation.goBack();
            } else if (postText.trim() !== '') {
                setLoading(true)
                await updateDoc(userRef, {
                    posts: userPosts + 1
                });

                if (collaboraterRef) {
                    await updateDoc(collaboraterRef, {
                        posts: collaboraterPosts + 1
                    });
                }

                await setDoc(postRef, {
                    author: collaboratedUser ? [user.uid, collaboratedUser.id] : [user.uid],
                    text: postText,
                    likes: 0,
                    comments: [],
                    date: Timestamp.now(),
                    id: postId,
                });
                setPostText('');
                setPhotos([]);
                navigation.goBack();
            }

        } catch (error) {
            console.error('Error sharing post:', error);
        }
    };
    return (
        <>
        {loading && <Loader/>}
            <View style={styles.container}>
                <StatusBar barStyle='dark-content' />
                <View style={{ width: width - 42, backgroundColor: theme.backgroundColors.main, height: 80, marginLeft: 21 }} />
                <View style={styles.fixedHeader}>
                    <Button width={39} height={39} onPress={() => navigation.goBack()}>
                        <Image style={styles.arrowIcon} source={arrowIcon} />
                    </Button>
                    <View>
                        <Typography weight='SemiBold' headline={true} size={16}>Create a new post</Typography>
                        <Typography weight='Medium' headline={false} size={14}>Enter text or Upload media content</Typography>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={{ padding: 17, backgroundColor: theme.backgroundColors.main2, borderRadius: 20, display: 'flex', gap: 13 }}>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ display: 'flex', flexDirection: 'row', gap: 13 }}>
                                {userData?.photoURL && (
                                    <>
                                        <Image style={{ width: 39, height: 39, borderRadius: 15 }} source={{ uri: userData.photoURL }} />
                                        {collaboratedUser?.photoURL && (
                                            <View style={styles.userImageWrapper}>
                                                <Image style={styles.userImage} source={{ uri: collaboratedUser.photoURL }} />
                                            </View>
                                        )}
                                    </>
                                )}
                                <View>
                                    <Typography headline={true} color={theme.colors.main} size={16}>{userData?.firstName} {collaboratedUser ? `with ${collaboratedUser.firstName}` : userData.lastName}</Typography>
                                    <Typography weight='Medium' headline={false} color={theme.colors.third} size={14}>@{userData?.username}</Typography>
                                </View>
                            </View>
                            <View>
                                <Button onPress={handleOpenUsersList} width={39} height={39}>
                                    <View style={{ marginBottom: -4, }}>
                                        <Image style={{ width: 21, height: 21 }} source={tagUserIcon} />
                                    </View>
                                </Button>
                            </View>
                        </View>
                        <Input value={postText} onChangeText={setPostText} multiline={true} placeholder='Enter text' />
                        <View style={styles.buttonContainer}>
                            <Button width={39} height={39} onPress={pickImage}>
                                <Image style={styles.attachIcon} source={attachIcon} />
                            </Button>
                            <Button highlight={postText.trim() !== '' || photos.length !== 0 ? true : false} width={39} height={39} onPress={share}>
                                <Image style={styles.attachIcon} source={postText.trim() !== '' || photos.length !== 0 ? sendIcon : sendIconDark} />
                            </Button>
                        </View>
                    </View>
                    <View style={{ padding: 17, paddingTop: 6, backgroundColor: theme.backgroundColors.main2, borderRadius: 20, display: photos.length !== 0 ? 'flex' : 'none', gap: 13 }}>
                        <View style={{ borderRadius: 15, overflow: 'hidden', marginTop: 15 }}>
                            <FlatList
                                horizontal
                                data={photos}
                                renderItem={renderItem}
                                keyExtractor={(item, index) => index.toString()}
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled={photos.length !== 1}
                                bounces={photos.length !== 1}
                                onViewableItemsChanged={handleViewableItemsChanged}
                                viewabilityConfig={viewabilityConfig.current}
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                    { useNativeDriver: false }
                                )}
                            />
                            <View style={styles.paginatorContainer}>
                                <Paginator data={photos} scrollX={scrollX} />
                            </View>
                        </View>
                        <View style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row' }}>
                            <Button width={100} height={39} onPress={openModal}>
                                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: -4, marginLeft: 6, gap: 9 }}>
                                    <View>
                                        <Image style={{ width: 21, height: 21 }} source={deleteIcon} />
                                    </View>
                                    <Typography size={14} headline={true}>Delete</Typography>
                                </View>
                            </Button>
                        </View>
                    </View>
                </ScrollView>
                <Modal
                    transparent={true}
                    visible={modalVisible}
                    animationType='slide'
                    onRequestClose={closeModal}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Image style={{ width: 317, height: 317, borderRadius: 15 }} source={photos[currentIndex]} />
                            <View style={{ display: 'flex', gap: 5 }}>
                                <Typography size={16} headline={true}>Are you sure you want to delete this image?</Typography>
                                <Typography weight='Medium' size={14} headline={false}>You won’t be able to access it, the changes are not being saved</Typography>
                            </View>
                            <View style={styles.modalButtons}>
                                <Button width={150} height={45} onPress={closeModal}>
                                    Cancel
                                </Button>
                                <Button width={150} height={45} highlight={true} onPress={deleteImage}>
                                    Delete
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    transparent={true}
                    visible={usersListVisible}
                    animationType='slide'
                    onRequestClose={handleCloseUsersList}
                >
                    <UserList collaboratedUser={collaboratedUser} onClose={handleCloseUsersList} onSelectUser={handleSelectUser} />
                </Modal>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            </View>
        </>
    );
};

export default CreatePost;
