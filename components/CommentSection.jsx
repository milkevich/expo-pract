import React, { useEffect, useState } from 'react';
import Input from '../UI/Input';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import { View, StyleSheet, Dimensions, Image, ScrollView, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import crossIcon from '../assets/plus-icon-black.png';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import sendIcon from '../assets/send-icon.png';
import userIcon from '../assets/user-placeholder-icon.jpeg';
import { useUser } from '../contexts/AuthContext';
import { format, isBefore, subDays, subYears } from 'date-fns';

const CommentSection = ({ post, onClose, author }) => {
    const theme = useTheme();
    const { height } = Dimensions.get('window');
    const { user } = useUser();
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 21,
            backgroundColor: theme.backgroundColors.main,
            height: height * 0.75,
            position: 'absolute',
            width: '100%',
            bottom: 0,
            borderRadius: 35,
            gap: 10,
        },
        contentContainer: {
            backgroundColor: theme.backgroundColors.main,
            display: 'flex',
            gap: 15,
            paddingTop: 60,
        },
        fixedHeader: {
            position: 'absolute',
            top: 7,
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
        fixedFooter: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 17,
            backgroundColor: theme.backgroundColors.main2,
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'row',
            gap: 15,
            alignItems: 'center',
            zIndex: 10,
            margin: 21,
            zIndex: 12
        },
        crossIcon: {
            transform: [{ rotate: '135deg' }],
            width: 21,
            height: 21,
            position: 'relative',
            marginBottom: -5,
            top: 9,
            left: 9,
        },
        commentContainer: {
            marginBottom: 10,
            padding: 17,
            backgroundColor: theme.backgroundColors.main2,
            borderRadius: 15,
        },
        commentText: {
            marginLeft: 10,
            flex: 1,
        },
        userImage: {
            width: 39,
            height: 39,
            borderRadius: 15,
        },
    });

    const fetchComments = async () => {
        try {
            const postRef = doc(db, 'posts', post);
            const postDoc = await getDoc(postRef);
            if (postDoc.exists()) {
                const postData = postDoc.data();
                const commentsWithDetails = await Promise.all(postData.comments.map(async comment => {
                    const userRef = doc(db, 'users', comment.authorId);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        return {
                            ...comment,
                            authorName: `${userData.firstName} ${userData.lastName}`,
                            authorPhotoURL: userData.photoURL || userIcon,
                            username: userData.username,
                            email: userData.email,
                        };
                    } else {
                        return {
                            ...comment,
                            authorName: 'Unknown User',
                            authorPhotoURL: userIcon,
                            username: 'unknown',
                            email: 'unknown',
                        };
                    }
                }));
                setComments(commentsWithDetails);
            }
        } catch (error) {
            console.error('Error fetching comments: ', error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const handleAddComment = async () => {
        if (commentText.trim() === '') {
            return;
        }

        const newComment = {
            text: commentText,
            authorId: user.uid,
            timestamp: new Date(),
        };

        try {
            const postRef = doc(db, 'posts', post);
            await updateDoc(postRef, {
                comments: arrayUnion(newComment),
            });

            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            let userData;
            if (userDoc.exists()) {
                userData = userDoc.data();
            }

            const commentWithDetails = {
                ...newComment,
                authorName: `${userData.firstName} ${userData.lastName}`,
                authorPhotoURL: userData.photoURL || userIcon,
                username: userData.username,
            };

            setComments([...comments, commentWithDetails]);
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment: ', error);
        }
    };

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

    return (
        <View style={styles.container}>
            <View style={{ backgroundColor: theme.backgroundColors.main, height: 20 }} />
            <View style={styles.fixedHeader}>
                <Button width={39} height={39} onPress={() => onClose()}>
                    <Image style={styles.crossIcon} source={crossIcon} />
                </Button>
                <View>
                    <Typography weight='SemiBold' headline={true} size={16}>Comment on {author}'s post</Typography>
                    <Typography weight='Medium' headline={false} size={14}>Enter text in the input below</Typography>
                </View>
            </View>
            <View style={styles.fixedFooter}>
                <View style={{ width: '83%', zIndex: 200 }}>
                    <Input
                        placeholder='Enter text'
                        value={commentText}
                        onChangeText={setCommentText}
                    />
                </View>
                <Button highlight={true} width={39} height={39} onPress={handleAddComment}>
                    <Image style={{ width: 21, height: 21, marginTop: -5 }} source={sendIcon} />
                </Button>
            </View>
            <View style={{ backgroundColor: theme.backgroundColors.main, height: 70, position: "absolute", bottom: 0, right: 0, width: '110%', zIndex: 10 }} />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.contentContainer}>
                <View style={{ paddingBottom: 140 }}>
                    <View style={{ alignItems: 'center', justifyContent: 'center', height: height * 0.375, display: comments.length ? 'none' : 'flex' }}>
                        <Typography color={theme.colors.secondary} weight='SemiBold'>{comments && comments.length === 0 && 'No comments'}</Typography>
                    </View>
                    {comments.map((comment, index) => (
                        <View key={index} style={styles.commentContainer}>
                            <View style={{ display: 'flex', flexDirection: 'row' }}>
                                <Image source={{ uri: comment.authorPhotoURL }} style={styles.userImage} />
                                <View style={styles.commentText}>
                                    <Typography weight='SemiBold' headline={true} size={14}>{comment.authorName}</Typography>
                                    <Typography weight='Medium' headline={false} size={12}>{getRelativeTime(new Date(comment.timestamp.seconds * 1000))}</Typography>
                                </View>
                                {comment.authorId === user.uid &&
                                    <Button width={39} height={39}>
                                        <View><Text style={{ letterSpacing: 1.1, marginLeft: 2, fontWeight: 900, fontSize: 12 }}>...</Text></View>
                                    </Button>
                                }
                            </View>
                            <View style={{marginTop: 15}}>
                                <Typography weight='Medium' headline={true} size={14}>{comment.text}</Typography>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default CommentSection;
