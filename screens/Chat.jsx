import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, Keyboard, Alert, TouchableOpacity, Animated } from 'react-native';
import { db, storage } from '../firebaseConfig';
import { Timestamp, doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot, runTransaction } from 'firebase/firestore';
import { useUser } from '../contexts/AuthContext';
import Input from '../UI/Input';
import Button from '../UI/Button';
import sendIcon from '../assets/send-icon.png';
import arrowIcon from '../assets/arrow-icon.png';
import attachIcon from '../assets/attach-icon.png';
import { useTheme } from '../contexts/ThemeContext';
import Typography from '../UI/Typography';
import shortid from 'shortid';
import * as ImagePicker from 'expo-image-picker';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import crossIcon from '../assets/plus-icon-black.png';
import { debounce } from 'lodash';
import micIcon from '../assets/mic-icon.png'
import { Audio } from 'expo-av';
import stopRecIcon from '../assets/stop-icon.png'
import deleteIcon from '../assets/cross-icon.png'
import playIcon from '../assets/play-icon.png'
import pauseIcon from '../assets/pause-icon.png'

const { height, width } = Dimensions.get('window');

const fetchUserDetails = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { id: userId, ...userDoc.data() };
        } else {
            console.error('No such document!');
            return null;
        }
    } catch (error) {
        if (error.code === 'quota-exceeded') {
            console.error('Quota exceeded:', error);
        } else {
            console.error('Error fetching user details:', error);
        }
        return null;
    }
};

const formatTime = (timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const timeDifference = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (timeDifference > oneDay) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month < 10 ? '0' : ''}${month}/${day < 10 ? '0' : ''}${day}/${year}`;
    } else {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
        return strTime;
    }
};

const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `images/${shortid.generate()}`);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                console.error('Upload failed:', error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                    console.error('Failed to get download URL:', error);
                    reject(error);
                }
            }
        );
    });
};

const generateWaveform = async (uri) => {
    return Array.from({ length: 30 }, () => Math.floor(Math.random() * 100));
};

const Chat = () => {
    const route = useRoute();
    const { userId } = route.params;
    const { user } = useUser();
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);
    const [mainUserDetails, setMainUserDetails] = useState(null);
    const [chat, setChat] = useState(null);
    const [chatId, setChatId] = useState('');
    const [newMessageText, setNewMessageText] = useState('');
    const theme = useTheme();
    const scrollViewRef = useRef();
    const navigation = useNavigation();
    const [photos, setPhotos] = useState([]);
    const [aspectRatio, setAspectRatio] = useState(null);
    const [recording, setRecording] = useState();
    const [recordedMessage, setRecordedMessage] = useState(null);
    const [waveform, setWaveform] = useState([]);
    const [recordedMessagePlaying, setRecordedMessagePlaying] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState(null);
    const [sound, setSound] = useState(null);

    async function startRecording() {
        try {
            const perm = await Audio.requestPermissionsAsync();
            if (perm.status === "granted") {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true
                });
                const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
                setRecording(recording);
            }
        } catch (err) { }
    }

    async function stopRecording() {
        setRecording(undefined);

        await recording.stopAndUnloadAsync();
        const { sound, status } = await recording.createNewLoadedSoundAsync();
        const waveform = await generateWaveform(recording.getURI());
        setWaveform(waveform);
        setRecordedMessage({
            sound: sound,
            duration: getDurationFormatted(status.durationMillis),
            file: recording.getURI(),
            waveform: waveform
        });

        // Set up playback status update
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
                setRecordedMessagePlaying(status.isPlaying);
            }
        });
    }

    function getDurationFormatted(milliseconds) {
        const minutes = milliseconds / 1000 / 60;
        const seconds = Math.round((minutes - Math.floor(minutes)) * 60);
        return seconds < 10 ? `${Math.floor(minutes)}:0${seconds}` : `${Math.floor(minutes)}:${seconds}`
    }

    const handleDoubleTap = async (event, message) => {
        if (event?.nativeEvent?.state === State.ACTIVE && message.senderId !== user.uid) {
            const messageRef = doc(db, 'chats', chatId);
            try {
                const chatDoc = await getDoc(messageRef);

                if (chatDoc.exists()) {
                    const messages = chatDoc.data().messages;
                    const messageIndex = messages.findIndex(m => m.id === message.id);

                    if (messageIndex !== -1) {
                        const currentLikedValue = messages[messageIndex].liked || false;

                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                        messages[messageIndex].liked = !currentLikedValue;

                        await updateDoc(messageRef, {
                            messages: messages
                        });
                    }
                }
            } catch (error) {
                console.error('Error updating liked status: ', error);
            }
        }
    };

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
            quality: 0.5,
            selectionLimit: 3 - photos.length,
        });

        if (!result.canceled) {
            const firstImage = photos.length === 0;
            if (firstImage) {
                const { width, height } = result.assets[0];
                setAspectRatio(width / height);
            }
            setPhotos((prevPhotos) => [...prevPhotos, ...result.assets.map(asset => ({ uri: asset.uri }))]);
        }
    };

    const handleRemovePhoto = (index) => {
        setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const fetchData = async () => {
            const selectedUser = await fetchUserDetails(userId);
            setSelectedUserDetails(selectedUser);

            const currentUser = await fetchUserDetails(user.uid);
            setMainUserDetails(currentUser);
        };

        fetchData();
    }, [userId, user.uid]);

    useEffect(() => {
        const fetchChat = async () => {
            if (selectedUserDetails && mainUserDetails) {
                const chatId = userId < user.uid ? `${userId}${user.uid}` : `${user.uid}${userId}`;
                setChatId(chatId);

                const chatRef = doc(db, 'chats', chatId);
                const unsubscribe = onSnapshot(chatRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setChat(snapshot.data());
                        setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                    } else {
                        setDoc(chatRef, { messages: [], users: [user.uid, userId] });
                        setChat({ messages: [], users: [user.uid, userId] });
                    }
                });

                return () => unsubscribe();
            }
        };

        fetchChat();
    }, [selectedUserDetails, mainUserDetails, userId, user.uid]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    const handleSend = debounce(async () => {
        if (newMessageText.trim() || photos.length > 0 || recordedMessage !== null) {
            const chatRef = doc(db, 'chats', chatId);
            const messageId = shortid.generate();
    
            const photoUrls = await Promise.all(photos.map(photo => uploadImage(photo.uri)));
    
            let voiceMessageUrl = null;
            if (recordedMessage !== null) {
                const response = await fetch(recordedMessage.file);
                const blob = await response.blob();
                const storageRef = ref(storage, `voiceMessages/${shortid.generate()}`);
                const uploadTask = uploadBytesResumable(storageRef, blob);
    
                voiceMessageUrl = await new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log('Upload is ' + progress + '% done');
                        },
                        (error) => {
                            console.error('Upload failed:', error);
                            reject(error);
                        },
                        async () => {
                            try {
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve(downloadURL);
                            } catch (error) {
                                console.error('Failed to get download URL:', error);
                                reject(error);
                            }
                        }
                    );
                });
            }
    
            await runTransaction(db, async (transaction) => {
                const chatDoc = await transaction.get(chatRef);
                if (!chatDoc.exists()) {
                    throw "Document does not exist!";
                }
                const newMessage = {
                    id: messageId,
                    text: newMessageText,
                    senderId: user.uid,
                    date: Timestamp.now(),
                    liked: false,
                    photos: photoUrls,
                    voiceMessage: voiceMessageUrl, // Store the voice message URL
                    waveform: recordedMessage ? recordedMessage.waveform : null, // Store the waveform data
                    duration: recordedMessage ? recordedMessage.duration : null,
                };
                const newMessages = [...chatDoc.data().messages, newMessage];
                transaction.update(chatRef, { messages: newMessages });
            });
    
            setNewMessageText('');
            setPhotos([]);
            setRecordedMessage(null); // Clear the recorded message after sending
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    }, 500);

    const playPauseHandler = async (voiceMessageUrl, messageId) => {
        if (playingMessageId === messageId && sound) {
            if (recordedMessagePlaying) {
                await sound.pauseAsync();
            } else {
                await sound.playAsync();
            }
            setRecordedMessagePlaying(!recordedMessagePlaying);
        } else {
            if (sound) {
                await sound.unloadAsync();
            }
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: voiceMessageUrl });
            setSound(newSound);
            setPlayingMessageId(messageId);
            await newSound.playAsync();
            setRecordedMessagePlaying(true);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setRecordedMessagePlaying(false);
                    setPlayingMessageId(null);
                }
            });
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.backgroundColors.main,
            gap: 14,
            padding: 21,
        },
        mainUserMessage: {
            padding: 17,
            backgroundColor: theme.colors.main,
            borderRadius: 20,
            maxWidth: width * 0.7,
            alignSelf: 'flex-end',
            flexShrink: 1,
            flexGrow: 0,
        },
        mainUserMessageTime: {
            alignSelf: 'flex-end',
            flexShrink: 1,
            flexGrow: 0,
            paddingTop: 10,
        },
        likedMain: {
            alignSelf: 'flex-end',
            flexShrink: 1,
            flexGrow: 0,
            width: 30,
            height: 30,
            backgroundColor: theme.colors.main,
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 1,
            borderRadius: 20,
            marginTop: -15,
        },
        mainUserMessageImg: {
            alignSelf: 'flex-end',
            flexShrink: 1,
            flexGrow: 0,
            paddingBottom: 20,
            paddingTop: 15,
            paddingRight: 7,
        },
        secondUserMessage: {
            padding: 17,
            backgroundColor: theme.backgroundColors.secondary,
            borderRadius: 20,
            maxWidth: width * 0.7,
            alignSelf: 'flex-start',
            flexShrink: 1,
            flexGrow: 0,
        },
        secondUserMessageTime: {
            alignSelf: 'flex-start',
            flexShrink: 1,
            flexGrow: 0,
            paddingTop: 10,
        },
        likedSecond: {
            alignSelf: 'flex-start',
            flexShrink: 1,
            flexGrow: 0,
            width: 30,
            height: 30,
            backgroundColor: theme.backgroundColors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 1,
            borderRadius: 20,
            marginTop: -15,
        },
        secondUserMessageImg: {
            alignSelf: 'flex-start',
            flexShrink: 1,
            flexGrow: 0,
            paddingBottom: 20,
            paddingTop: 15,
            paddingLeft: 7,
        },
        selectedPhotosContainer: {
            flexDirection: 'row',
            marginBottom: photos.length === 0 ? 0 : 10
        },
        selectedPhoto: {
            width: 65,
            height: 65,
            borderRadius: 10,
            marginRight: 20,
        },
        waveformContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '70%',
            backgroundColor: theme.backgroundColors.main,
            borderRadius: 15,
            paddingRight: 15,
            paddingLeft: 5,
            height: 39,
        },
        waveformBar: {
            backgroundColor: theme.colors.main,
            width: 3,
            borderRadius: 2,
        },
        voiceMessageContainerMain: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.backgroundColors.main,
            borderRadius: 15,
            paddingRight: 15,
            paddingLeft: 5,
            height: 39,
            marginTop: 10,
            maxWidth: 250,
            alignSelf: 'flex-end',
            flexShrink: 1,
            flexGrow: 0,
            padding: 17
        },
    });

    const handleNavigateToCollaborator = (userId) => {
        navigation.navigate('UsersProfile', { userId })
    }

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior='height'
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View style={{ height: 60 }} />
                <View style={{ backgroundColor: theme.backgroundColors.main2, padding: 17, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', marginTop: 42, position: 'absolute', width: '100%', zIndex: 100 }}>
                    <Button onPress={() => navigation.goBack()} width={39} height={39}>
                        <Image style={{ width: 21, height: 21, transform: [{ rotate: '180deg' }], marginTop: -4 }} source={arrowIcon} />
                    </Button>
                    <TouchableOpacity onPress={() => handleNavigateToCollaborator(selectedUserDetails.uid)} style={{ flexDirection: 'row', gap: 14 }}>
                        <View>
                            <Typography overflow={true} width={180} textAlign='right' size={16} headline={true}>
                                {selectedUserDetails?.firstName} {selectedUserDetails?.lastName}
                            </Typography>
                            <Typography overflow={true} width={180} textAlign='right' size={14}>
                                @{selectedUserDetails?.username}
                            </Typography>
                        </View>
                        <Image style={{ width: 39, height: 39, borderRadius: 15 }} source={{ uri: selectedUserDetails?.photoURL }} />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: photos.length !== 0 ? 150 : 70, paddingTop: 70 }}
                    ref={scrollViewRef}
                >
                    {chat?.messages.length === 0 && (
                        <View style={{ alignItems: 'center', justifyContent: 'center', height: height * 0.68 }}>
                            <Typography>Start a conversation!</Typography>
                        </View>
                    )}
                    <View style={{ gap: 10 }}>
                        {chat &&
                            chat.messages.map((message, index) => (
                                <TapGestureHandler
                                    key={index}
                                    onHandlerStateChange={(event) => handleDoubleTap(event, message)}
                                    numberOfTaps={2}
                                >
                                    <View>
                                        <View style={message.senderId === user.uid ? styles.mainUserMessageImg : styles.secondUserMessageImg}>
                                            {message.photos && message.photos.length === 1 &&
                                                <Image style={{ height: 250, width: 200, borderRadius: 20, marginLeft: -7, marginRight: -7, marginBottom: message.text === '' ? -20 : 0 }} source={{ uri: message.photos[0] }} />
                                            }
                                            {message.photos && message.photos.length === 2 &&
                                                <View style={{ position: 'relative', height: 400, width: 250 }}>
                                                    <Image style={{ height: 225, width: 190, borderRadius: 20, position: 'absolute', transform: [{ rotate: '-1.5deg' }], right: 0 }} source={{ uri: message.photos[1] }} />
                                                    <Image style={{ height: 225, width: 190, borderRadius: 20, position: 'absolute', zIndex: 10, bottom: 0, left: 0, transform: [{ rotate: '1.5deg' }] }} source={{ uri: message.photos[0] }} />
                                                </View>
                                            }
                                            {message.photos && message.photos.length === 3 &&
                                                <View style={{ position: 'relative', height: 600, width: 250 }}>
                                                    <Image style={{ height: 225, width: 190, borderRadius: 20, position: 'absolute', transform: [{ rotate: '-1.5deg' }], left: 0 }} source={{ uri: message.photos[2] }} />
                                                    <Image style={{ height: 225, width: 190, borderRadius: 20, position: 'absolute', transform: [{ rotate: '3.5deg' }], zIndex: 10, bottom: 180, right: 0, }} source={{ uri: message.photos[1] }} />
                                                    <Image style={{ height: 225, width: 190, borderRadius: 20, position: 'absolute', zIndex: 10, bottom: 0, left: 0, transform: [{ rotate: '-4.5deg' }] }} source={{ uri: message.photos[0] }} />
                                                </View>
                                            }
                                        </View>
                                        {message.voiceMessage && (
                                            <View style={message.senderId === user.uid ? styles.voiceMessageContainerMain : styles.voiceMessageContainerSecond}>
                                                <Button width={39} height={39} onPress={() => playPauseHandler(message.voiceMessage, message.id)}>
                                                    <Image style={{ width: 21, height: 21, marginTop: -5 }} source={playingMessageId === message.id && recordedMessagePlaying ? pauseIcon : playIcon} />
                                                </Button>
                                                <View style={styles.waveformContainer}>
                                                    {message.waveform && message.waveform.map((value, index) => (
                                                        <View key={index} style={[styles.waveformBar, { height: value * 0.25, minHeight: 5 }]} />
                                                    ))}
                                                </View>
                                                <Text>{message.duration}</Text>
                                            </View>
                                        )}
                                        <View style={[message.senderId === user.uid ? styles.mainUserMessage : styles.secondUserMessage, { display: message.text !== '' ? 'flex' : 'none', marginBottom: message.text === '' && message.photos.length > 0 && 0, marginTop: message.photos?.length === 0 ? -30 : 0 }]}>
                                            <Typography textAlign='left' color={message.senderId === user.uid ? theme.colors.main2 : theme.colors.main}>
                                                {message.text}
                                            </Typography>
                                        </View>
                                        <View style={[message.senderId === user.uid ? styles.likedMain : styles.likedSecond, { display: message.liked ? 'flex' : 'none' }]}>
                                            <Typography size={12}>❤️</Typography>
                                        </View>
                                        <View style={message.senderId === user.uid ? styles.mainUserMessageTime : styles.secondUserMessageTime}>
                                            <Typography color={theme.colors.third} size={12}>
                                                {formatTime(message.date)}
                                            </Typography>
                                        </View>
                                    </View>
                                </TapGestureHandler>
                            ))}
                    </View>
                </ScrollView>
                <View style={{ width: '100%', backgroundColor: theme.backgroundColors.main2, padding: 17, borderRadius: 20, position: 'absolute', bottom: -21, zIndex: 100 }}>
                    <View style={styles.selectedPhotosContainer}>
                        {photos.map((photo, index) => (
                            <View key={index}>
                                <TouchableOpacity style={{ width: 25, height: 25, backgroundColor: theme.backgroundColors.secondary, alignItems: 'center', justifyContent: 'center', borderRadius: 10, position: 'absolute', zIndex: 10, right: 10, top: -10 }} onPress={() => handleRemovePhoto(index)}>
                                    <Image style={{ width: 15, height: 15, transform: 'rotate(45deg)' }} source={crossIcon} />
                                </TouchableOpacity>
                                <Image style={styles.selectedPhoto} source={{ uri: photo.uri }} />
                            </View>
                        ))}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {!recording && !recordedMessage &&
                            <>
                                <Button onPress={pickImage} width={39} height={39}>
                                    <Image style={{ width: 21, height: 21, marginTop: -5 }} source={attachIcon} />
                                </Button>
                                <View style={{ width: '55%' }}>
                                    <Input noTopPadding={true} multiline={true} value={newMessageText} onChangeText={setNewMessageText} height={39} placeholder='Enter Text' />
                                </View>
                            </>
                        }
                        {recording && !recordedMessage &&
                            <View style={{ width: '70%', backgroundColor: theme.backgroundColors.main, alignItems: 'center', justifyContent: 'center', borderRadius: 15 }}>
                                <Typography size={14}>Recording...</Typography>
                            </View>
                        }
                        {!recording && recordedMessage &&
                            <View style={styles.waveformContainer}>
                                <Button width={39} height={39} onPress={() => {
                                    recordedMessage.sound.replayAsync()
                                }}><Image style={{ width: 21, height: 21, marginTop: -5 }} source={recordedMessagePlaying ? pauseIcon : playIcon} /></Button>
                                {waveform.map((value, index) => (
                                    <View
                                        key={index}
                                        style={[styles.waveformBar, { height: value * 0.25, minHeight: 5 }]}
                                    />
                                ))}
                            </View>
                        }
                        <Button width={39} height={39} highlight={false} onPress={recording ? stopRecording : (!recording && !recordedMessage ? startRecording : () => setRecordedMessage(null))}>
                            <Image style={{ width: 21, height: 21, marginTop: -6, marginLeft: -1 }} source={!recording && !recordedMessage ? micIcon : (!recordedMessage && recording ? stopRecIcon : deleteIcon)} />
                        </Button>
                        <Button width={39} height={39} highlight={true} onPress={handleSend}>
                            <Image style={{ width: 21, height: 21, marginTop: -6, marginLeft: -1 }} source={sendIcon} />
                        </Button>
                    </View>
                </View>
            </KeyboardAvoidingView>
            <View style={{ height: 21 }} />
        </View>
    );
};

export default Chat;
