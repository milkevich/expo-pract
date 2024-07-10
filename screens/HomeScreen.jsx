import { collection, query, where, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { db } from '../firebaseConfig';
import { useUser } from '../contexts/AuthContext';

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [noUser, setNoUser] = useState(false);
  const { user } = useUser();

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

  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      {userData ? (
        <Text>{userData.firstName}</Text>
      ) : (
        <Text>{noUser ? 'No user data found' : 'Loading...'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
