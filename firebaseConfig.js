import { getAuth } from "@firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyCsrIaSvA2A2r26-4MK7xwCEWmPqMchN00",
  authDomain: "expo-pract-chat.firebaseapp.com",
  projectId: "expo-pract-chat",
  storageBucket: "expo-pract-chat.appspot.com",
  messagingSenderId: "887489224773",
  appId: "1:887489224773:web:ab39a2ff32ad140db2032c",
  measurementId: "G-7D8M5HNCNL"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore()