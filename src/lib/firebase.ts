import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    browserLocalPersistence,
    getAuth,
    getReactNativePersistence,
    initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyA2Xgs0xE-aZXvgHp0NciknHsWb9rScCFg',
  authDomain: 'sliit-library-booking.firebaseapp.com',
  projectId: 'sliit-library-booking',
  storageBucket: 'sliit-library-booking.firebasestorage.app',
  messagingSenderId: '402508580407',
  appId: '1:402508580407:web:2d04d0eac2273e603e61b2',
};

const alreadyInitialized = getApps().length > 0;

export const app = alreadyInitialized
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = alreadyInitialized
  ? getAuth(app)
  : initializeAuth(app, {
      persistence:
        Platform.OS === 'web'
          ? browserLocalPersistence
          : getReactNativePersistence(AsyncStorage),
    });

export const db = getFirestore(app);