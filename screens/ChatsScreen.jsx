import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, FlatList, Modal, Dimensions, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { collection, doc, getDocs, query, setDoc, where, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../contexts/AuthContext';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import userIcon from '../assets/user-placeholder-icon.jpeg';
import Input from '../UI/Input';
import { useNavigation } from '@react-navigation/native';
import { useReload } from '../contexts/ReloadContext';
import Skeleton from '../UI/Skeleton';
import newChatIcon from '../assets/new-chat-icon.png';
import { useBackdrop } from '../contexts/BackDropContext';

const { height, width } = Dimensions.get('window');

export default function ChatsScreen() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useUser();
  const { reload } = useReload();
  const { showBackdrop, hideBackdrop } = useBackdrop();
  const [newChatVisible, setNewChatVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollectionRef = collection(db, 'users');
        const usersListQuery = query(usersCollectionRef, where('uid', '!=', user.uid));
        const querySnapshot = await getDocs(usersListQuery);
        const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error('Error fetching users: ', error);
      }
    };

    fetchUsers();
  }, [user.uid, reload]);

  const handleUserSearch = (text) => {
    setSearchQuery(text);
    setFilteredUsers(users.filter(user =>
      user.firstName.toLowerCase().includes(text.toLowerCase()) ||
      user.lastName.toLowerCase().includes(text.toLowerCase()) ||
      user.username.toLowerCase().includes(text.toLowerCase())
    ));
  };

  const handleChatSearch = (text) => {
    setChatSearchQuery(text);
    const newFilteredChats = chats.filter(chat => {
      const otherUserId = chat.users.find(uid => uid !== user.uid);
      const otherUser = users.find(u => u.uid === otherUserId);
      return otherUser &&
        (otherUser.firstName.toLowerCase().includes(text.toLowerCase()) ||
          otherUser.lastName.toLowerCase().includes(text.toLowerCase()) ||
          otherUser.username.toLowerCase().includes(text.toLowerCase()));
    });
    setFilteredChats(newFilteredChats);
  };

  useEffect(() => {
    handleChatSearch(chatSearchQuery);
  }, [chatSearchQuery, chats]);

  useEffect(() => {
    setFilteredChats(chats);
  }, [chats]);

  const renderUserItem = ({ item }) => {
    return (
      <TouchableOpacity style={{ marginTop: 15 }} onPress={() => handleToggleSelectedUser(item)}>
        <View style={styles.userContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flexDirection: 'row' }}>
              <Image source={{ uri: item?.photoURL || userIcon }} style={styles.userImage} />
              <View style={styles.userInfo}>
                <Typography overflow={true} width={150} weight='SemiBold' size={16} color={theme.colors.main}>{item.firstName} {item.lastName}</Typography>
                <Typography overflow={true} width={150} weight='Medium' size={14} color={theme.colors.third}>@{item.username}</Typography>
              </View>
            </View>
            <Button onPress={() => handleToggleSelectedUser(item)} width={39} height={39}>
              {selectedUser?.id === item.id &&
                <View style={{ width: 21, height: 21, backgroundColor: theme.colors.third, borderRadius: 7.5, marginTop: -6 }} />
              }
            </Button>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleToggleSelectedUser = (item) => {
    if (selectedUser?.id === item.id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(item);
    }
  };

  const openModal = () => {
    showBackdrop();
    setNewChatVisible(true);
  };

  const closeModal = () => {
    hideBackdrop();
    setNewChatVisible(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColors.main,
      gap: 14,
      padding: 21,
    },
    userContainer: {
      padding: 17,
      backgroundColor: theme.backgroundColors.main2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderRadius: 20,
    },
    userImage: {
      width: 39,
      height: 39,
      borderRadius: 15,
    },
    userInfo: {
      marginLeft: 10,
    },
    fixedHeader: {
      position: 'absolute',
      top: 38,
      left: 0,
      right: 0,
      padding: 17,
      backgroundColor: theme.backgroundColors.main2,
      borderRadius: 20,
      display: 'flex',
      alignItems: 'center',
      zIndex: 10,
      margin: 21,
      height: 82,
    },
    contentContainer: {
      backgroundColor: theme.backgroundColors.main,
      display: 'flex',
      gap: 15,
      paddingTop: 120,
      width: '100%',
    },
    modalContent: {
      flex: 1,
      backgroundColor: theme.backgroundColors.main,
      padding: 21,
      height: height * 0.65,
      maxHeight: height * 0.65,
      minHeight: height * 0.65,
      position: 'absolute',
      width: '100%',
      bottom: 0,
      borderRadius: 35
    },
    chatContainer: {
      padding: 17,
      backgroundColor: theme.backgroundColors.main2,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    chatImage: {
      width: 39,
      height: 39,
      borderRadius: 15,
      marginRight: 10,
    },
  });

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
      console.error('Error checking/creating chat: ', error);
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('users', 'array-contains', user.uid));
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedChats = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const chatId = doc.id;
          if (chatId.includes(user.uid)) {
            fetchedChats.push({ id: chatId, ...data });
          }
        });
  
        fetchedChats.sort((a, b) => {
          const aLastMessageDate = a.messages.length ? a.messages[a.messages.length - 1].date.toDate() : new Date(0);
          const bLastMessageDate = b.messages.length ? b.messages[b.messages.length - 1].date.toDate() : new Date(0);
          return bLastMessageDate - aLastMessageDate;
        });
  
        setChats(fetchedChats);
        setFilteredChats(fetchedChats);
      });
  
      return () => unsubscribe();
    };
  
    fetchChats();
  }, [user.uid]);
  

  const formatTime = (timestamp) => {
    const date = timestamp?.toDate();
    const now = new Date();
    const timeDifference = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (timestamp && timeDifference > oneDay) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear().toString().slice(-2);
      return `${month < 10 ? '0' : ''}${month}/${day < 10 ? '0' : ''}${day}/${year}`;
    } else if (timestamp && timeDifference < oneDay){
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
      return strTime;
    }
  };

  const renderChatItem = ({ item }) => {
    const otherUserId = item.users.find(uid => uid !== user.uid);
    const otherUser = users.find(u => u.uid === otherUserId);
    const lastMessage = item.messages[item.messages.length - 1];

    const getMessagePreview = (message) => {
      if (message?.text) {
        return message.text;
      } else if (message?.waveform && message.waveform.length > 0) {
        return 'Voice message';
      } else if (message?.photos && message.photos.length > 0) {
        return 'Photos sent';
      } else {
        return 'Start a conversation';
      }
    };

    return (
      <TouchableOpacity
        style={styles.chatContainer}
        onPress={() => navigation.navigate('Chat', { chatId: item.id, userId: otherUserId })}
      >
        <Image source={{ uri: otherUser?.photoURL || userIcon }} style={styles.chatImage} />
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: width - 132 }}>
            <Typography overflow={true} width={150} weight='SemiBold' size={16} color={theme.colors.main}>
              {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User'}
            </Typography>
            <Typography textAlign='right' size={14}>
              {formatTime(lastMessage?.date)}
            </Typography>
          </View>
          <Typography overflow={true} width={150} weight='Medium' size={14} color={theme.colors.third}>
            {getMessagePreview(lastMessage)}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        visible={newChatVisible}
        animationType='slide'
        onRequestClose={closeModal}
      >
        <View style={styles.modalContent}>
          <View style={{ padding: 17, backgroundColor: theme.backgroundColors.main2, borderRadius: 20, marginBottom: -10 }}>
            <Input
              placeholder="Search for users"
              value={searchQuery}
              onChangeText={handleUserSearch}
            />
          </View>
          {filteredUsers.length === 0 && users.length > 0 &&
            <View style={{ marginTop: 20, width: '100%', alignItems: 'center', justifyContent: 'center', height: '70%' }}>
              <Typography>No users found</Typography>
            </View>
          }
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
          />
          <View style={{ position: 'absolute', bottom: 21, left: 21, width: '100%' }}>
            <View style={{ padding: 17, borderRadius: 15, backgroundColor: theme.backgroundColors.main2 }}>
              <Button
                onPress={selectedUser !== null ? () => goToChat(selectedUser?.id) : closeModal}
                style={{ alignSelf: 'center', marginTop: 20 }}
                highlight={selectedUser !== null ? true : false}
              >
                {selectedUser !== null ? 'Next' : 'Close'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.fixedHeader}>
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ width: '83%' }}>
            <Input placeholder='Search for chats' value={chatSearchQuery} onChangeText={handleChatSearch} />
          </View>
          <Button onPress={openModal} highlight={true} width={39} height={39}>
            <Image style={{ width: 21, height: 21, marginTop: -5, marginLeft: -1 }} source={newChatIcon} />
          </Button>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ height: 135 }} />
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
        />
        {chats && filteredChats && filteredChats.length === 0 && 
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: height * 0.7
          }}>
            <Typography>No chats found</Typography>
          </View>
        }
        {chats && chats.length === 0 &&
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: height * 0.7
          }}>
            <Typography>You have no active chats</Typography>
          </View>
        }
      </ScrollView>
    </View>
  );
}
