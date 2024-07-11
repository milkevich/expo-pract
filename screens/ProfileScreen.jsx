import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import { useUser } from '../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import userIcon from '../assets/user-placeholder-icon.jpeg';
import sendIcon from '../assets/send-icon.png';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [noUser, setNoUser] = useState(false);
  const { user } = useUser();
  const navigation = useNavigation()


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const usersCollectionRef = collection(db, 'users');
        const usersQuery = query(usersCollectionRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(usersQuery);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setUserData(userDoc.data());
        } else {
          console.log('User data not found');
          setNoUser(true);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setNoUser(true);
      }
    };

    if (user && user.uid) {
      fetchUserData();
    }
  }, [user]);

  const theme = useTheme();

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
    statusIndicator: {
      width: 30,
      height: 30,
      backgroundColor: '#63C75D',
      borderRadius: 50,
      borderWidth: 8,
      borderColor: theme.backgroundColors.main2,
      position: 'absolute',
      bottom: 0,
      right: 0,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
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
      height: '100%',
      justifyContent: 'center',
    },
  });

  return (
    <>
    <View style={{width: '100%', backgroundColor: theme.backgroundColors.main, height: 49}}></View>
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileContainer}>
        <View style={{ display: 'flex', flexDirection: 'row', gap: 18 }}>
          <View style={styles.profileImageContainer}>
            {userData?.photoURL && (
              <Image style={styles.profileImage} source={{ uri: userData.photoURL }} />
            )}
            <View style={styles.statusIndicator} />
          </View>
          <View style={{ display: 'flex', gap: 13 }}>
            <View>
              <Typography headline={true} color={theme.colors.main} size={16}>{userData?.firstName} {userData?.lastName}</Typography>
              <Typography weight='Medium' headline={false} color={theme.colors.third} size={14}>@{userData?.username}</Typography>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 24 }}>
              <View>
                <Typography textAlign='center' weight='Bold' headline={true} color={theme.colors.main} size={14}>{userData?.posts}</Typography>
                <Typography weight='Medium' headline={false} color={theme.colors.third} size={14}>Posts</Typography>
              </View>
              <View>
                <Typography textAlign='center' weight='Bold' headline={true} color={theme.colors.main} size={14}>{userData?.followers}</Typography>
                <Typography weight='Medium' headline={false} color={theme.colors.third} size={14}>Followers</Typography>
              </View>
              <View>
                <Typography textAlign='center' weight='Bold' headline={true} color={theme.colors.main} size={14}>{userData?.followings}</Typography>
                <Typography weight='Medium' headline={false} color={theme.colors.third} size={14}>Following</Typography>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.buttonsContainer}>
        <Button width={150}>Edit</Button>
        <Button width={150}>Share</Button>
      </View>
      <View style={styles.shareContainer}>
        <View style={styles.shareContent}>
          {userData?.photoURL && (
            <Image style={styles.shareImage} source={{ uri: userData.photoURL }} />
          )}
          <View>
            <Typography color={theme.colors.main} weight='SemiBold' size={16}>{userData?.firstName} {userData?.lastName}</Typography>
            <Typography weight='Medium' size={13}>Share text or media content</Typography>
          </View>
          <View style={styles.sendButton}>
            <Button onPress={() => navigation.navigate('CreatePost', { userData })} width={39} height={39} highlight={true}>
              <View style={{ position: 'relative' }}>
                <Image style={{ width: 21, height: 21, position: 'absolute', bottom: -7, left: -10 }} source={sendIcon} />
              </View>
            </Button>
          </View>
        </View>
      </View>
      <View style={styles.noPostsContainer}>
        {userData?.posts === 0 &&
          <Typography color={theme.colors.secondary} textAlign='center'>
            No posts yet.
          </Typography>
        }
      </View>
    </ScrollView>
    </>
  );
}
