import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Typography from '../UI/Typography';
import Button from '../UI/Button';
import { useUser } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import userIcon from '../assets/user-placeholder-icon.jpeg';
import sendIcon from '../assets/plus-icon.png';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Feed from '../components/Feed';
import Skeleton from '../UI/Skeleton';
import { signOut } from '@firebase/auth';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [noUser, setNoUser] = useState(false);
  const { user } = useUser();
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = createStyles(theme);


  useEffect(() => {
    let unsubscribe;

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);

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

    if (user && user.uid) {
      fetchUserData();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleLogOut = () => {
    navigation.dispatch(
      CommonActions.reset({
          index: 0,
          routes: [{ name: 'LogIn' }],
      })
  );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {userData ?
          <View style={styles.profileContainer}>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 18 }}>
              <View style={styles.profileImageContainer}>
                {userData?.photoURL && (
                  <Image style={styles.profileImage} source={{ uri: userData.photoURL }} />
                )}
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
                    <Typography textAlign='center' weight='Bold' headline={true} color={theme.colors.main} size={14}>{userData?.followers.length}</Typography>
                    <Typography weight='Medium' headline={false} color={theme.colors.third} size={14}>Followers</Typography>
                  </View>
                  <View>
                    <Typography textAlign='center' weight='Bold' headline={true} color={theme.colors.main} size={14}>{userData?.followings.length}</Typography>
                    <Typography weight='Medium' headline={false} color={theme.colors.third} size={14}>Following</Typography>
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
            <Button onPress={() => navigation.navigate('Edit')} width={150}>Edit</Button>
            <Button onPress={handleLogOut} width={150}>Log Out</Button>
          </View> :
          <View style={{ marginTop: -14 }}>
            <Skeleton height={80} />
          </View>
        }
        {userData ?
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
          :
          <View style={{ marginTop: -14 }}>
            <Skeleton height={72} />
          </View>
        }

        {userData?.posts === 0 ?
          <View style={styles.noPostsContainer}>
            <Typography color={theme.colors.secondary} textAlign='center'>
              No posts yet.
            </Typography>
          </View>
          : <Feed postsFrom={user.uid} />}
      </ScrollView>
    </View>
  );
}


const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColors.main,
    paddingBottom: 30,
    paddingTop: 49,
  },
  contentContainer: {
    padding: 21,
    backgroundColor: theme.backgroundColors.main,
    display: 'flex',
    gap: 15,
    paddingBottom: 50,
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
    height: '100%',
    justifyContent: 'center',
  },
});