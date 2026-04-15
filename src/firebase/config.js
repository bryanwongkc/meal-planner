import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDd1qUOFVP52fKBQPd47r6oiAapW_vmS94',
  authDomain: 'meal-planner-5d76d.firebaseapp.com',
  projectId: 'meal-planner-5d76d',
  storageBucket: 'meal-planner-5d76d.firebasestorage.app',
  messagingSenderId: '1016584211867',
  appId: '1:1016584211867:web:d1be473a582436b604e53e',
  measurementId: 'G-NV2Z5JK5VQ'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db, firebaseConfig };
