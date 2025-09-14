import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
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

export { auth };
export default app;