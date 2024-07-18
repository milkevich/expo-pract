import { collection, query, where, getDocs } from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Animated, Easing, ScrollView } from 'react-native';
import { db } from '../firebaseConfig';
import { useUser } from '../contexts/AuthContext';
import Feed from '../components/Feed';
import { useTheme } from '../contexts/ThemeContext';
import Typography from '../UI/Typography';
import { useNavigation } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [noUser, setNoUser] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState('foryou');
  const { user } = useUser();
  const theme = useTheme();
  const navigation = useNavigation()
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const forYouAnim = useRef(new Animated.Value(0)).current;
  const followingAnim = useRef(new Animated.Value(width)).current;

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

  useEffect(() => {
    Animated.timing(indicatorPosition, {
      toValue: selectedFeed === 'foryou' ? 0 : 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [selectedFeed]);

  const leftPosition = indicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [17, width - 210],
  });

  const handleFeedChange = (feed) => {
    if (feed !== selectedFeed) {
      if (feed === 'foryou') {
        setSelectedFeed(feed);
        Animated.parallel([
          Animated.timing(forYouAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(followingAnim, {
            toValue: width,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start()
      } else {
        setSelectedFeed(feed);
        Animated.parallel([
          Animated.timing(forYouAnim, {
            toValue: -width,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(followingAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 21,
      backgroundColor: theme.backgroundColors.main,
      height: height,
      width: '100%',
      gap: 10,
    },
    contentContainer: {
      backgroundColor: theme.backgroundColors.main,
      display: 'flex',
      gap: 15,
      paddingTop: 65,
      paddingBottom: 70,
      minHeight: height,
    },
    tabIndicator: {
      position: 'absolute',
      width: 149,
      backgroundColor: theme.colors.main,
      height: 39,
      borderRadius: 15,
      top: 17,
    },
    feedContainer: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    animatedView: {
      width: '100%',
      height: '100%',
    }
  });

  return (
    <View style={styles.container}>
      <View style={{ height: 36 }} />
      <View style={{ backgroundColor: theme.backgroundColors.main2, width: '100%', padding: 17, flexDirection: 'row', justifyContent: 'space-between', borderRadius: 20, position: 'relative', zIndex: 10, marginBottom: -60 }}>
        <TouchableOpacity onPress={() => handleFeedChange('foryou')} style={{ height: 39, alignItems: 'center', justifyContent: 'center', width: 149, zIndex: 10 }}>
          <Typography color={selectedFeed === 'foryou' ? theme.colors.main2 : theme.colors.secondary} headline={true} size={14}>For you</Typography>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFeedChange('following')} style={{ height: 39, alignItems: 'center', justifyContent: 'center', width: 149, zIndex: 10 }}>
          <Typography color={selectedFeed === 'following' ? theme.colors.main2 : theme.colors.secondary} headline={true} size={14}>Following</Typography>
        </TouchableOpacity>
        <Animated.View style={[styles.tabIndicator, { left: leftPosition }]} />
      </View>
      <View style={{flex: 1, position: 'relative'}}>
        <Animated.View style={[styles.feedContainer, { transform: [{ translateX: forYouAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
            <Feed following={false} allPosts={true} />
          </ScrollView>
        </Animated.View>
        <Animated.View style={[styles.feedContainer, { transform: [{ translateX: followingAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
            <Feed allPosts={false} following={true} />
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}
