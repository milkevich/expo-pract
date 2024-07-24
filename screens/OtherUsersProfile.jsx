import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Image, ScrollView, Dimensions, Animated, Easing, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import { useUser } from '../contexts/AuthContext';
import { arrayUnion, arrayRemove, doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import userIcon from '../assets/user-placeholder-icon.jpeg';
import sendIcon from '../assets/send-icon.png';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feed from '../components/Feed';
import arrowIcon from '../assets/arrow-icon.png';
import Skeleton from '../UI/Skeleton';

const { width, height } = Dimensions.get('window');

export default function OtherUsersProfile() {
    const [userData, setUserData] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [noUser, setNoUser] = useState(false);
    const { user } = useUser();
    const navigation = useNavigation();
    const theme = useTheme();
    const route = useRoute();
    const { userId } = route.params;
    const headerRef = useRef(null);
    const [isHeaderInPosition, setIsHeaderInPosition] = useState(false);
    const fadeAnimGoBack = useRef(new Animated.Value(1)).current;
    const fadeAnimUser = useRef(new Animated.Value(0)).current;
    const styles = createStyles(theme, isHeaderInPosition);


    const goToChat = async (selectedUserId) => {
        const chatId = user.uid < selectedUserId ? user.uid + selectedUserId : selectedUserId + user.uid;
        const chatRef = doc(db, 'chats', chatId);
    
        try {
          const chatDoc = await getDoc(chatRef);
    
          if (!chatDoc.exists()) {
            await setDoc(chatRef, {
              messages: [],
              users: [user.uid, selectedUserId],
            });
          }
    
          navigation.navigate('Chat', { chatId, userId: selectedUserId });
          hideBackdrop();
          setNewChatVisible(false);
          console.log('Chat checked/created successfully');
        } catch (error) {
        }
      };


    useEffect(() => {
        let unsubscribe;

        const fetchUserData = async () => {
            try {
                const userRef = doc(db, 'users', userId ? userId : user.uid);

                unsubscribe = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setUserData(doc.data());
                    } else {
                        console.log('User data not found');
                        setNoUser(true);
                    }
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
                setNoUser(true);
            }
        };

        const fetchCurrentUserData = async () => {
            try {
                const userRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setCurrentUserData(docSnap.data());
                } else {
                    console.log('Current user data not found');
                }
            } catch (error) {
                console.error('Error fetching current user data:', error);
            }
        };

        if (user && user.uid) {
            fetchUserData();
            fetchCurrentUserData();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user]);

    const measurePos = () => {
        if (headerRef.current) {
            headerRef.current.measure((x, y, width, height, pageX, pageY) => {
                if (pageY <= 17) {
                    setIsHeaderInPosition(true);
                    Animated.timing(fadeAnimGoBack, {
                        toValue: 0,
                        duration: 100,
                        useNativeDriver: true,
                    }).start();
                    setTimeout(() => {
                        Animated.timing(fadeAnimUser, {
                            toValue: 1,
                            duration: 200,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }).start();
                    }, 100);
                } else {
                    setIsHeaderInPosition(false);
                    Animated.parallel([
                        Animated.timing(fadeAnimGoBack, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(fadeAnimUser, {
                            toValue: 0,
                            duration: 0,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
            });
        }
    };

    useEffect(() => {
        const interval = setInterval(measurePos, 300);

        return () => clearInterval(interval);
    }, []);

    const handleFollowUser = async () => {
        const usersFollowersRef = doc(db, 'users', userId);
        const currentUserRef = doc(db, 'users', user.uid);

        const updatedCurrentUserData = { ...currentUserData };
        const updatedUserData = { ...userData };

        if (currentUserData.followings.includes(userId)) {
            updatedCurrentUserData.followings = updatedCurrentUserData.followings.filter(following => following !== userId);
            updatedUserData.followers = updatedUserData.followers.filter(follower => follower !== user.uid);

            setCurrentUserData(updatedCurrentUserData);
            setUserData(updatedUserData);

            try {
                await updateDoc(usersFollowersRef, {
                    followers: arrayRemove(user.uid)
                });
                await updateDoc(currentUserRef, {
                    followings: arrayRemove(userId)
                });
            } catch (error) {
                alert('Error updating followers');
            }
        } else {
            updatedCurrentUserData.followings.push(userId);
            updatedUserData.followers.push(user.uid);

            setCurrentUserData(updatedCurrentUserData);
            setUserData(updatedUserData);

            try {
                await updateDoc(usersFollowersRef, {
                    followers: arrayUnion(user.uid)
                });
                await updateDoc(currentUserRef, {
                    followings: arrayUnion(userId)
                });
            } catch (error) {
                alert('Error updating followers');
            }
        }
    }

    return (
        <>
            <View style={styles.container}>
                <View style={{ width: '100%', backgroundColor: theme.backgroundColors.main, height: 39 }} />
                <View style={styles.fixedHeader}>
                    <Button width={39} height={39} onPress={() => navigation.goBack()}>
                        <Image style={styles.arrowIcon} source={arrowIcon} />
                    </Button>

                    <Animated.View style={{ flexDirection: 'row', opacity: fadeAnimGoBack, position: 'absolute', left: 70 }}>
                        <View style={{ marginRight: 10 }}>
                            <Typography textAlign="left" weight="SemiBold" headline={true} size={16}>
                                Go back
                            </Typography>
                            <Typography textAlign="left" weight="Medium" headline={false} size={14}>
                                Press the button or swipe left
                            </Typography>
                        </View>
                    </Animated.View>

                    <Animated.View style={{ flexDirection: 'row', opacity: fadeAnimUser }}>
                        <View style={{ marginRight: 10 }}>
                            <Typography textAlign="right" weight="SemiBold" headline={true} size={16}>
                                {userData?.firstName} {userData?.lastName}
                            </Typography>
                            <Typography textAlign="right" weight="Medium" headline={false} size={14}>
                                @{userData?.username}
                            </Typography>
                        </View>
                        <Image style={{ width: 39, height: 39, borderRadius: 15 }} source={{ uri: userData?.photoURL }} />
                    </Animated.View>
                </View>
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    {userData ?
                        <View style={styles.profileContainer}>
                            <View ref={headerRef} style={{ display: 'flex', flexDirection: 'row', gap: 18 }}>
                                <View style={styles.profileImageContainer}>
                                    {userData?.photoURL && (
                                        <Image style={styles.profileImage} source={{ uri: userData.photoURL }} />
                                    )}
                                </View>
                                <View style={{ display: 'flex', gap: 13 }}>
                                    <View>
                                        <Typography headline={true} color={theme.colors.main} size={16}>
                                            {userData?.firstName} {userData?.lastName}
                                        </Typography>
                                        <Typography weight="Medium" headline={false} color={theme.colors.third} size={14}>
                                            @{userData?.username}
                                        </Typography>
                                    </View>
                                    <View style={{ display: 'flex', flexDirection: 'row', gap: 24 }}>
                                        <View>
                                            <Typography
                                                textAlign="center"
                                                weight="Bold"
                                                headline={true}
                                                color={theme.colors.main}
                                                size={14}
                                            >
                                                {userData?.posts}
                                            </Typography>
                                            <Typography weight="Medium" headline={false} color={theme.colors.third} size={14}>
                                                Posts
                                            </Typography>
                                        </View>
                                        <View>
                                            <Typography
                                                textAlign="center"
                                                weight="Bold"
                                                headline={true}
                                                color={theme.colors.main}
                                                size={14}
                                            >
                                                {userData?.followers ? userData.followers.length : 0}
                                            </Typography>
                                            <Typography weight="Medium" headline={false} color={theme.colors.third} size={14}>
                                                Followers
                                            </Typography>
                                        </View>
                                        <View>
                                            <Typography
                                                textAlign="center"
                                                weight="Bold"
                                                headline={true}
                                                color={theme.colors.main}
                                                size={14}
                                            >
                                                {userData?.followings ? userData.followings.length : 0}
                                            </Typography>
                                            <Typography weight="Medium" headline={false} color={theme.colors.third} size={14}>
                                                Following
                                            </Typography>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        :
                        <View style={{ marginTop: -13 }}>
                            <Skeleton height={120} />
                        </View>
                    }
                    {userData ?
                        <View style={styles.buttonsContainer}>
                            <Button onPress={handleFollowUser} highlight={currentUserData?.followings.includes(userId) ? false : true} width={150}>
                                {currentUserData?.followings.includes(userId) ? 'Following' : 'Follow'}
                            </Button>
                            <Button onPress={() => goToChat(userData.uid)} width={150}>Message</Button>
                        </View>
                        :
                        <View style={{ marginTop: -14 }}>
                            <Skeleton height={80} />
                        </View>
                    }

                    {userData?.posts === 0 ? (
                        <View style={styles.noPostsContainer}>
                            <Typography color={theme.colors.secondary} textAlign="center">
                                No posts yet
                            </Typography>
                        </View>
                    ) : (
                        <Feed postsFrom={userId ? userId : user.uid} />
                    )}
                </ScrollView>
            </View>
        </>
    );
}

const createStyles = (theme, isHeaderInPosition) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.backgroundColors.main,
        paddingTop: 80,
    },
    contentContainer: {
        padding: 21,
        backgroundColor: theme.backgroundColors.main,
        display: 'flex',
        gap: 15,
        paddingTop: 30,
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
    profileContainer: {
        padding: 17,
        paddingBottom: 20,
        backgroundColor: theme.backgroundColors.main2,
        borderRadius: 20,
    },
    profileImageContainer: {
        width: 83,
        height: 83,
        borderRadius: 30,
        backgroundColor: theme.backgroundColors.secondary,
        position: 'relative',
    },
    profileImage: {
        width: 71,
        height: 71,
        borderWidth: 5,
        borderColor: theme.backgroundColors.main2,
        borderRadius: 25,
        position: 'absolute',
        top: 6,
        left: 6,
    },
    buttonsContainer: {
        padding: 17,
        display: 'flex',
        flexDirection: 'row',
        gap: 15,
        backgroundColor: theme.backgroundColors.main2,
        borderRadius: 20,
    },
    shareContainer: {
        padding: 17,
        display: 'flex',
        flexDirection: 'row',
        gap: 17,
        backgroundColor: theme.backgroundColors.main2,
        borderRadius: 20,
    },
    shareContent: {
        display: 'flex',
        flexDirection: 'row',
        minWidth: 318,
        gap: 13,
    },
    shareImage: {
        width: 39,
        height: 39,
        borderRadius: 15,
    },
    sendButton: {
        position: 'absolute',
        right: 0,
    },
    noPostsContainer: {
        height: '170%',
        justifyContent: 'center',
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
        justifyContent: isHeaderInPosition ? 'space-between' : 'flex-start',
        zIndex: 10,
        margin: 21,
    },
});