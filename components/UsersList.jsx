import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/AuthContext';
import { useReload } from '../contexts/ReloadContext';

const UserList = ({ onClose, onSelectUser, collaboratedUser, postsFrom = null }) => {
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(collaboratedUser !== null ? collaboratedUser : null);
    const { height } = Dimensions.get('window');
    const { user } = useUser();
    const { usersData } = useReload();

    useEffect(() => {
        if (postsFrom) {
            const userDetails = usersData[postsFrom];
            if (userDetails) {
                setAuthorDetails(userDetails);
            }
        }
    }, [postsFrom, usersData]);

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
        userContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 17,
            backgroundColor: theme.backgroundColors.main2,
            borderRadius: 15,
            gap: 5,
            justifyContent: 'space-between',
            marginBottom: 10,
        },
        userImage: {
            width: 39,
            height: 39,
            borderRadius: 15,
            marginRight: 10,
        },
    });

    useEffect(() => {
        setSelectedUser(collaboratedUser);
        const fetchUsers = async () => {
            try {
                const usersCollectionRef = collection(db, 'users');
                const usersListQuery = query(usersCollectionRef, where('uid', '!=', user.uid));
                const querySnapshot = await getDocs(usersListQuery);
                const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(usersList);
            } catch (error) {
                console.error('Error fetching users: ', error);
            }
        };

        fetchUsers();
    }, [user.uid]);

    useEffect(() => {
        setSelectedUser(collaboratedUser);
    }, [collaboratedUser]);

    const handleToggleSelectedUser = (item) => {
        if (selectedUser?.id === item.id) {
            setSelectedUser(null);
        } else {
            setSelectedUser(item);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleToggleSelectedUser(item)}>
            <View style={[styles.userContainer, { opacity: selectedUser?.id !== item.id && selectedUser !== null ? 0.3 : 1 }]}>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                    <Image source={{ uri: item.photoURL }} style={styles.userImage} />
                    <View>
                        <Typography weight='SemiBold' size={16} color={theme.colors.main}>{item.firstName} {item.lastName}</Typography>
                        <Typography weight='Medium' size={14} color={theme.colors.third}>@{item.username}</Typography>
                    </View>
                </View>
                <Button onPress={() => handleToggleSelectedUser(item)} width={39} height={39}>
                    {selectedUser?.id === item.id &&
                        <View style={{ width: 21, height: 21, backgroundColor: theme.colors.third, borderRadius: 7.5, marginTop: -6 }} />
                    }
                </Button>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={{ padding: 17, backgroundColor: theme.backgroundColors.main2, borderRadius: 15 }}>
                <Typography size={16} headline={true}>Collaborate with{selectedUser ? ` ${selectedUser?.firstName}` : '...'}</Typography>
                <Typography size={14} headline={false}>Pick a user you want to collaborate with</Typography>
            </View>
            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
            <View style={{ padding: 17, backgroundColor: theme.backgroundColors.main2, borderRadius: 20 }}>
                <Button highlight={selectedUser ? true : false} onPress={() => onClose(selectedUser)}>
                    {selectedUser ? 'Collaborate' : 'Close'}
                </Button>
            </View>
        </View>
    );
};

export default UserList;
