import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  // 請在Firebase Console中獲取您的配置
  // 暫時使用佔位符，實際使用時請替換為您的Firebase專案配置
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// 檢查是否為開發環境
const isDev = __DEV__;

// 初始化Firebase App
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 初始化Auth
let auth: Auth;
try {
  auth = getAuth(app);
} catch (error) {
  // 對於React Native，使用initializeAuth
  auth = initializeAuth(app);
}

// 初始化Functions
const functions: Functions = getFunctions(app);

// 初始化Firestore
const firestore: Firestore = getFirestore(app);

// 開發環境連接到Emulator
if (isDev) {
  // 連接Auth Emulator
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  } catch (error) {
    console.log('Auth emulator already connected or not available');
  }
  
  // 連接Functions Emulator
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  } catch (error) {
    console.log('Functions emulator already connected or not available');
  }

  // 連接Firestore Emulator
  try {
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  } catch (error) {
    console.log('Firestore emulator already connected or not available');
  }
}

export { auth, functions, firestore };
export default app;