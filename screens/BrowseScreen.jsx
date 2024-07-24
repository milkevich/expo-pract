import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../contexts/AuthContext';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import userIcon from '../assets/user-placeholder-icon.jpeg';
import Input from '../UI/Input';
import { useNavigation } from '@react-navigation/native';
import { useReload } from '../contexts/ReloadContext';
import * as Haptics from 'expo-haptics';
import Skeleton from '../UI/Skeleton';
import { ScrollView } from 'react-native-gesture-handler';

const BrowseScreen = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [followings, setFollowings] = useState([]);
    const theme = useTheme();
    const navigation = useNavigation();
    const { user } = useUser();
    const { reload } = useReload();

    const styles = createStyles(theme);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollectionRef = collection(db, 'users');
                const usersListQuery = query(usersCollectionRef, where('uid', '!=', user.uid));
                const querySnapshot = await getDocs(usersListQuery);
                const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const currentUserRef = doc(db, 'users', user.uid);
                const currentUserSnap = await getDoc(currentUserRef);
                const currentUserData = currentUserSnap.data();
                const userFollowings = currentUserData.followings || [];

                setFollowings(userFollowings);
                setUsers(usersList);
                setFilteredUsers(usersList);
            } catch (error) {
                console.error('Error fetching users: ', error);
            }
        };

        fetchUsers();
    }, [user.uid, reload]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        setFilteredUsers(users.filter(user =>
            user.firstName.toLowerCase().includes(text.toLowerCase()) ||
            user.lastName.toLowerCase().includes(text.toLowerCase()) ||
            user.username.toLowerCase().includes(text.toLowerCase())
        ));
    };

    const handleFollowUnfollow = async (targetUserId) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const currentUserRef = doc(db, 'users', user.uid);
        const targetUserRef = doc(db, 'users', targetUserId);

        const isFollowing = followings.includes(targetUserId);
        const updatedFollowings = isFollowing
            ? followings.filter(following => following !== targetUserId)
            : [...followings, targetUserId];

        setFollowings(updatedFollowings);

        try {
            if (isFollowing) {
                await updateDoc(currentUserRef, {
                    followings: arrayRemove(targetUserId)
                });
                await updateDoc(targetUserRef, {
                    followers: arrayRemove(user.uid)
                });
            } else {
                await updateDoc(currentUserRef, {
                    followings: arrayUnion(targetUserId)
                });
                await updateDoc(targetUserRef, {
                    followers: arrayUnion(user.uid)
                });
            }
        } catch (error) {
            console.error('Error updating follow status: ', error);
            setFollowings(followings);
        }
    };

    const renderItem = ({ item }) => {
        const isFollowing = followings.includes(item.uid);
        return (
            <TouchableOpacity onPress={() => navigation.navigate('UsersProfile', { userId: item.id })}>
                <View style={styles.userContainer}>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                        <Image source={{ uri: item?.photoURL || userIcon }} style={styles.userImage} />
                        <View style={styles.userInfo}>
                            <Typography overflow={true} width={150} weight='SemiBold' size={16} color={theme.colors.main}>{item.firstName} {item.lastName}</Typography>
                            <Typography overflow={true} width={150} weight='Medium' size={14} color={theme.colors.third}>@{item.username}</Typography>
                        </View>
                    </View>
                    <Button
                        highlight={!isFollowing}
                        height={39}
                        width={isFollowing ? 100 : 81}
                        onPress={() => handleFollowUnfollow(item.uid)}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.fixedHeader}>
                <View style={{ width: '100%' }}>
                    <Typography weight='SemiBold' headline={true} size={16}>Search for a user</Typography>
                    <Typography weight='Medium' headline={false} size={14}>Enter the username or their name</Typography>
                    <View style={{ marginTop: 10 }}>
                        <Input placeholder='Enter text' value={searchQuery} onChangeText={handleSearch} />
                    </View>
                </View>
            </View>
            {!filteredUsers.length && users.length > 0 &&
                <View style={{ marginTop: 86 }}>
                    <Skeleton height={68} />
                    <Skeleton height={68} />
                    <Skeleton height={68} />
                    <Skeleton height={68} />
                    <Skeleton height={68} />
                    <Skeleton height={68} />
                    <Skeleton height={68} />
                </View>
            }
            <View style={{ height: 6 }} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <FlatList
                    data={filteredUsers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.contentContainer}
                    ListFooterComponent={<View style={{ height: 59 }} />}
                />
            </ScrollView>
        </View>
    );
};

export default BrowseScreen;


const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.backgroundColors.main,
        padding: 21,
        gap: 14,
        paddingTop: 105,
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
        height: 132,
    },
    contentContainer: {
        backgroundColor: theme.backgroundColors.main,
        display: 'flex',
        gap: 15,
        paddingTop: 85,
        width: '100%',
    },
});
