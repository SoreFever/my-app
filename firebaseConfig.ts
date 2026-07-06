// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth,getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyASFCcLhir5InwMifQprO49zWXpV9DX8Xo",

  authDomain: "my-app-e1171.firebaseapp.com",

  projectId: "my-app-e1171",

  storageBucket: "my-app-e1171.firebasestorage.app",

  messagingSenderId: "336685731311",

  appId: "1:336685731311:web:0570c764d3d063f2053a1a",

  measurementId: "G-RY7X4TH4HL"

};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);