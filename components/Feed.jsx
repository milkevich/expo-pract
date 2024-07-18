import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, Animated, Modal, Alert } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, getDoc, doc, increment, updateDoc, deleteDoc, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { useUser } from '../contexts/AuthContext';
import Typography from '../UI/Typography';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../UI/Button';
import userIcon from '../assets/user-placeholder-icon.jpeg';
import shareIcon from '../assets/share-icon.png';
import heartIcon from '../assets/heart-icon.png';
import heartIconFilled from '../assets/heart-icon-filled.png';
import commentsIcon from '../assets/comment-icon.png';
import Paginator from '../components/Paginator';
import { format, isBefore, subDays, subYears } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommentSection from './CommentSection';
import { useBackdrop } from '../contexts/BackDropContext';
import { useReload } from '../contexts/ReloadContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Skeleton from '../UI/Skeleton';
import deleteIcon from '../assets/delete-icon.png';

const { width, height } = Dimensions.get('window');

const Feed = ({ postsFrom, allPosts, following }) => {
    const [posts, setPosts] = useState([]);
    const { user } = useUser();
    const [aspectRatio, setAspectRatio] = useState(null);
    const theme = useTheme();
    const scrollX = useRef(new Animated.Value(0)).current;
    const [liked, setLiked] = useState({});
    const { showBackdrop, hideBackdrop } = useBackdrop();
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [commentSectionShown, setCommentSectionShown] = useState(false);
    const [authorDetails, setAuthorDetails] = useState(null);
    const { reload, setReload } = useReload();
    const navigation = useNavigation();
    const [followings, setFollowings] = useState([]);
    const [userData, setUserData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const getRelativeTime = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (isBefore(date, subYears(now, 1))) {
            return format(date, 'MMMM d, yyyy');
        }

        if (isBefore(date, subDays(now, 7))) {
            return format(date, 'MMMM d');
        }

        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 },
        ];

        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }

        return 'just now';
    };

    useEffect(() => {
        const fetchAuthor = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', postsFrom));
                if (userDoc.exists()) {
                    setAuthorDetails({ id: postsFrom, ...userDoc.data() });
                } else {
                    console.error('No such document!');
                }
            } catch (error) {
                console.error('Error fetching author details:', error);
            }
        };

        if (postsFrom) {
            fetchAuthor();
        }
    }, [postsFrom, reload]);

    useEffect(() => {
        const fetchUserPosts = async () => {
            try {
                let postsQuery;
                if (postsFrom && !allPosts && !following) {
                    postsQuery = query(collection(db, 'posts'), where('author', 'array-contains', postsFrom), orderBy('date', 'desc'));
                } else if (allPosts && !postsFrom && !following) {
                    postsQuery = query(collection(db, 'posts'), orderBy('date', 'desc'));
                } else if (following) {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const userDetails = userDoc.exists() ? userDoc.data() : null;
    
                    if (userDetails && userDetails.followings && userDetails.followings.length > 0) {
                        postsQuery = query(collection(db, 'posts'), where('author', 'array-contains-any', userDetails.followings), orderBy('date', 'desc'));
                    } else {
                        console.log('No following users found');
                        setPosts('none');
                        return;
                    }
                }
    
                const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
                    if (!snapshot.empty) {
                        const postsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        console.log("Fetched posts: ", postsList);
    
                        const updatedPostsList = await Promise.all(postsList.map(async post => {
                            const mainUserDetails = await fetchUserDetails(post.author[0]);
                            const collaboratorDetails = post.author.length > 1 ? await fetchUserDetails(post.author[1]) : null;
                            return { ...post, mainUserDetails, collaboratorDetails };
                        }));
    
                        console.log("Updated posts list: ", updatedPostsList);
                        setPosts(updatedPostsList);
    
                        const likedStatus = {};
                        updatedPostsList.forEach(post => {
                            if (post.likedBy) {
                                likedStatus[post.id] = post.likedBy.includes(user.uid);
                            } else {
                                likedStatus[post.id] = false;
                            }
                        });
                        setLiked(likedStatus);
                    } else {
                        console.log("No posts found");
                        setPosts([]);
                    }
                });
    
                return unsubscribe;
            } catch (error) {
                console.error('Error fetching user posts:', error);
            }
        };
    
        if (user && user.uid) {
            fetchUserPosts();
        }
    }, [user, postsFrom, reload, allPosts, following]);
    
    

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [user.uid]);

    const fetchUserDetails = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return userDoc.exists() ? { id: userId, ...userDoc.data() } : null;
        } catch (error) {
            console.error('Error fetching user details:', error);
            return null;
        }
    };

    const handleViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const { width, height } = viewableItems[0].item;
            if (width && height) {
                setAspectRatio(width / height);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        viewAreaCoveragePercentThreshold: 50,
    }).current;

    const renderItem = ({ item, index, post }) => (
        <View key={index} style={{ position: 'relative' }}>
            <Image
                style={[
                    styles.imagePreview,
                    {
                        aspectRatio: aspectRatio || 1,
                        height: aspectRatio > 1 ? 320 / aspectRatio : 400,
                        minWidth: width > 390 ? 317 : 314,
                        maxWidth: 314,
                        maxHeight: 400,
                        borderTopRightRadius: index + 1 === post.imgs?.length ? 15 : 0,
                        borderBottomRightRadius: index + 1 === post.imgs?.length ? 15 : 0,
                        borderBottomLeftRadius: index === 0 ? 15 : 0,
                        borderTopLeftRadius: index === 0 ? 15 : 0,
                    },
                ]}
                source={{ uri: item }}
            />
        </View>
    );

    const styles = StyleSheet.create({
        postContainer: {
            padding: 17,
            backgroundColor: '#fff',
            borderRadius: 20,
            marginBottom: 14,
            gap: 17,
        },
        authorContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            justifyContent: 'space-between',
        },
        authorImage: {
            width: 39,
            height: 39,
            borderRadius: 15,
            marginRight: 10,
        },
        authorDetails: {
            flexDirection: 'column',
            marginLeft: 5,
        },
        postText: {
            fontSize: 14,
            color: '#333',
            marginTop: -5,
            fontWeight: 'regular'
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
        imagePreview: {
            maxWidth: 320,
            maxHeight: 400,
            width: '100%',
            height: '100%',
            borderRadius: 15,
        },
        paginatorContainer: {
            position: 'absolute',
            bottom: -35.5,
            width: '100%',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: theme.backgroundColors.main2,
            padding: 21,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'absolute',
            width: width - 42,
            marginLeft: 21,
            bottom: -180,
            height: 150
        },
    });

    const handleLikePost = async (postId) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
            const isLiked = liked[postId];
            const updatedLikes = { ...liked, [postId]: !isLiked };
            const postIndex = posts.findIndex(post => post.id === postId);
            const updatedPosts = [...posts];
            const post = updatedPosts[postIndex];
    
            if (isLiked) {
                post.likes -= 1;
                post.likedBy = post.likedBy.filter(uid => uid !== user.uid);
            } else {
                post.likes += 1;
                if (!post.likedBy) {
                    post.likedBy = [];
                }
                post.likedBy.push(user.uid);
            }
            setLiked(updatedLikes);
            setPosts(updatedPosts);
    
            const postRef = doc(db, 'posts', postId);
            const likesUpdate = isLiked ? increment(-1) : increment(1);
    
            await updateDoc(postRef, {
                likes: likesUpdate,
                likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });
    
        } catch (error) {
            console.error('Error liking post:', error);
            alert('Something went wrong');
        }
    };
    

    const handleCloseCommentSection = async () => {
        hideBackdrop();
        setCommentSectionShown(false);
        setSelectedPostId(null);
    };

    const handleOpenCommentsSection = async (postId, author) => {
        setSelectedPostId(postId);
        setAuthorDetails(author);
        showBackdrop();
        setCommentSectionShown(true);
    };

    const handleNavigateToCollaborator = async (userId) => {
        if(userId !== user.uid) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('UsersProfile', { userId }); 
        }
    };

    useEffect(() => {
        const fetchFollowings = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userDetails = userDoc.exists() ? userDoc.data() : null;

                if (userDetails && userDetails.followings) {
                    const newFollowings = userDetails.followings;

                    if (JSON.stringify(newFollowings) !== JSON.stringify(followings)) {
                        setFollowings(newFollowings);
                        setReload(prev => !prev); 
                    }
                }
            } catch (error) {
                console.error('Error fetching followings:', error);
            }
        };

        const interval = setInterval(fetchFollowings, 1000);

        return () => clearInterval(interval);
    }, [user.uid, followings]);

    const handleDeletePost = async (post) => {
        const postRef = doc(db, 'posts', post?.id);
    
        try {
            await deleteDoc(postRef);
            hideBackdrop();
            setModalVisible(false);
            
            const mainUserRef = doc(db, 'users', post.author[0]);
            await updateDoc(mainUserRef, {
                posts: increment(-1)
            });
    
            if (post.author.length > 1) {
                const collaboratorRef = doc(db, 'users', post.author[1]);
                await updateDoc(collaboratorRef, {
                    posts: increment(-1)
                });
            }
    
        } catch (error) {
            console.error('Error deleting post:', error);
            Alert.alert('Error', 'Unable to delete the post. Please try again.');
        }
    };
    

    return (
        <View>
            {following && posts === 'none' && (
                <View style={{ height: height - 300, alignItems: 'center', justifyContent: 'center' }}>
                    <Typography>You're not following anyone</Typography>
                </View>
            )}
            {!posts && posts.length > 0 &&
                <View style={{ position: 'absolute' }}>
                    <Skeleton height={200} />
                    <Skeleton height={300} />
                    <Skeleton height={300} />
                </View>
            }
            {following && posts === 'none' ? null : posts.length > 0 ? posts.map(post => (
                <View key={post.id}>
                    <Modal
                        transparent={true}
                        visible={commentSectionShown && selectedPostId === post.id}
                        animationType='slide'
                        onRequestClose={handleCloseCommentSection}
                        statusBarTranslucent={true}
                    >
                        <CommentSection author={postsFrom === user.uid ? userData?.firstName : authorDetails?.firstName} post={post.id} onClose={handleCloseCommentSection} />
                    </Modal>
                    <Modal
                        transparent={true}
                        visible={modalVisible}
                        animationType='slide'
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={{ height: height * 0.75 }}>
                            <View style={styles.modalContent}>
                                <Button color={'rgba(255, 0, 0, 0.1)'} width={'100%'} onPress={() => handleDeletePost(post)}><Text style={{ color: 'rgb(235, 15, 0)' }}>Delete</Text></Button>
                                <Button width={'100%'} onPress={() => {
                                    setModalVisible(false)
                                    hideBackdrop()
                                }}>Close</Button>
                            </View>
                        </View>
                    </Modal>
                    <View style={styles.postContainer}>
                        {post.mainUserDetails && (
                            <View style={styles.authorContainer}>
                                <View style={{ display: 'flex', flexDirection: 'row' }}>
                                    <Image style={styles.authorImage} source={{ uri: post.mainUserDetails.photoURL || userIcon }} />
                                    {post.collaboratorDetails?.photoURL && (
                                        <View style={styles.userImageWrapper}>
                                            <Image style={styles.userImage} source={{ uri: post.collaboratorDetails.photoURL || userIcon }} />
                                        </View>
                                    )}
                                    <View style={styles.authorDetails}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity
                                                activeOpacity={1}
                                                onPress={() => {
                                                    if (post.mainUserDetails && post.mainUserDetails?.uid !== user.uid) {
                                                        handleNavigateToCollaborator(post.mainUserDetails?.id);
                                                    }
                                                }}
                                            >
                                                <Typography headline={true} size={16}>
                                                    {post.collaboratorDetails ? `${post.mainUserDetails?.firstName} and` : `${post.mainUserDetails?.firstName} ${post.mainUserDetails?.lastName}`}
                                                </Typography>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                activeOpacity={1}
                                                onPress={() => {
                                                    if (post.collaboratorDetails && post.collaboratorDetails?.uid !== user.uid) {
                                                        handleNavigateToCollaborator(post.collaboratorDetails?.id);
                                                    }
                                                }}
                                            >
                                                <Typography headline={true} size={16}>
                                                    {post.collaboratorDetails ? ` ${post.collaboratorDetails?.firstName}` : ``}
                                                </Typography>
                                            </TouchableOpacity>
                                        </View>
                                        <Typography weight='Medium' headline={false} size={14}>{getRelativeTime(new Date(post.date.seconds * 1000))}</Typography>
                                    </View>
                                </View>
                                {!allPosts && !following && postsFrom === user.uid &&
                                    <Button onPress={() => {
                                        setModalVisible(!modalVisible)
                                        showBackdrop()
                                    }} width={39} height={39}>
                                        <View><Text style={{ letterSpacing: 1.1, marginLeft: 2, fontWeight: 900, fontSize: 12 }}>...</Text></View>
                                    </Button>
                                }
                            </View>
                        )}
                        {post.imgs && post.imgs.length > 0 && (
                            <View style={{ borderRadius: 15, overflow: 'hidden', marginTop: -10, marginBottom: post.text === '' && -30 }}>
                                <FlatList
                                    horizontal
                                    data={post.imgs}
                                    renderItem={({ item, index }) => renderItem({ item, index, post })}
                                    keyExtractor={(item, index) => index.toString()}
                                    showsHorizontalScrollIndicator={false}
                                    pagingEnabled={post.imgs.length !== 1}
                                    bounces={post.imgs.length !== 1}
                                    onViewableItemsChanged={handleViewableItemsChanged}
                                    viewabilityConfig={viewabilityConfig}
                                    onScroll={Animated.event(
                                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                        { useNativeDriver: false }
                                    )}
                                />
                                <View style={styles.paginatorContainer}>
                                    <Paginator data={post.imgs} scrollX={scrollX} />
                                </View>
                            </View>
                        )}
                        <Text style={styles.postText}>{post.text}</Text>
                        <View style={{ flexDirection: 'row', gap: 14, borderRadius: 15, height: 39, alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', gap: 14, padding: 9, paddingRight: 18, paddingLeft: 12, backgroundColor: theme.backgroundColors.main, borderRadius: 15, height: 39, maxWidth: 150, alignItems: 'center' }}>
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={async () => {
                                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        handleLikePost(post?.id);
                                    }}
                                    style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}
                                >
                                    <Image style={{ width: 21, height: 21 }} source={liked[post.id] ? heartIconFilled : heartIcon} />
                                    <Typography size={14} headline={true} weight='SemiBold'>{post.likes}</Typography>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={async () => {
                                        handleOpenCommentsSection(post.id, post.mainUserDetails);
                                    }}
                                    style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}
                                >
                                    <Image style={{ width: 19, height: 19 }} source={commentsIcon} />
                                    <Typography size={14} headline={true} weight='SemiBold'>{post.comments.length}</Typography>
                                </TouchableOpacity>
                            </View>
                            <Button width={39} height={39}>
                                <Image style={{ width: 21, height: 21, marginBottom: -5 }} source={shareIcon} />
                            </Button>
                        </View>
                    </View>
                </View>
            )) :
                (posts === 'none' || (!posts.length > 0 && following)) ?
                    <View style={{ height: postsFrom === user.uid ? 350 : height - 300, alignItems: 'center', justifyContent: 'center' }}>
                        <Typography>No posts found</Typography>
                    </View>
                    :
                    (
                        <View style={{ height: postsFrom === user.uid ? 350 : height - 300, alignItems: 'center', justifyContent: 'center' }}>
                            <Typography>No posts found</Typography>
                        </View>
                    )}
        </View>
    );    
};

export default Feed;
