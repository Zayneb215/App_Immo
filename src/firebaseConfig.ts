import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// getReactNativePersistence mawjouda fi runtime mta3 React Native,
// lakin TypeScript ymken ma ychoufhech: n5adhouha b "as any" bech ma yatla3ch error.
const getReactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

// Config mta3 el projet dariimmo-app (nafs el projet mta3 Flutter)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'dariimmo-app-6b7ec.firebaseapp.com',
  projectId: 'dariimmo-app-6b7ec',
  storageBucket: 'dariimmo-app-6b7ec.firebasestorage.app',
  messagingSenderId: '309584466871',
  appId: '1:309584466871:web:fff503bafa6ef7a6e9ce32',
};

const alreadyInit = getApps().length > 0;
const app = alreadyInit ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  if (alreadyInit) return firebaseAuth.getAuth(app); // ki ya3mel Fast Refresh
  try {
    return firebaseAuth.initializeAuth(app, {
      // el user yab9a connecté ki tsakker el app
      persistence: getReactNativePersistence
        ? getReactNativePersistence(AsyncStorage)
        : undefined,
    });
  } catch {
    return firebaseAuth.getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export const storage = getStorage(app); // lel images mta3 el annonces