import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  // 核心認證狀態
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  
  // 認證操作
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 簡化的認證 Context Provider
 * 只負責核心的認證功能，其他功能已移至專門的 hooks
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 自動創建匿名用戶
  const initializeAnonymousUser = async () => {
    try {
      if (!user) {
        const result = await signInAnonymously(auth);
        console.log('Anonymous user created:', result.user.uid);
        return;
      }
    } catch (error) {
      console.error('Error creating anonymous user:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
      } else {
        // 沒有用戶時自動創建匿名用戶
        await initializeAnonymousUser();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    isAnonymous: user?.isAnonymous || false,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}