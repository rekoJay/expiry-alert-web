// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyByqi5fDgE_7gVpue0p6QqcA6UybBMcSjU",
    authDomain: "expiryalertapp.firebaseapp.com",
    projectId: "expiryalertapp",
    storageBucket: "expiryalertapp.firebasestorage.app",
    messagingSenderId: "841698791851",
    appId: "1:841698791851:web:ff8f4f1c467c0ab19e82ee"
  };

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firestore 인스턴스 가져오기
export const db = getFirestore(app);
