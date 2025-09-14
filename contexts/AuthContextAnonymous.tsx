import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useInAppPurchases, CREDITS_PRODUCTS, USAGE_COSTS } from '../hooks/useInAppPurchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService, ApiError } from '../services/api';

export interface UserCredits {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: Date;
  features: {
    dailyFreeCredits: boolean;
    doubleCreditsBoost: boolean;
  };
}

interface CreditTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  timestamp: Date;
  productId?: string;
}

interface AuthContextType {
  user: User | null;
  credits: UserCredits;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  spendCredits: (amount: number, description: string) => Promise<boolean>;
  addCredits: (amount: number, description: string, productId?: string) => Promise<void>;
  getTransactionHistory: () => Promise<CreditTransaction[]>;
  canAfford: (cost: number) => boolean;
  initializeAnonymousUser: () => Promise<void>;
  isAnonymous: boolean;
  // 新增 API 相關方法
  generateHairstyle: () => Promise<{ imageUrl: string; creditsLeft: number }>;
  apiError: string | null;
  clearApiError: () => void;
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

const CREDITS_STORAGE_KEY = '@hairstyle_app_credits';
const TRANSACTIONS_STORAGE_KEY = '@hairstyle_app_transactions';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [credits, setCredits] = useState<UserCredits>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    lastUpdated: new Date(),
    features: {
      dailyFreeCredits: false,
      doubleCreditsBoost: false,
    },
  });

  const iap = useInAppPurchases();

  // 清除 API 錯誤
  const clearApiError = () => {
    setApiError(null);
  };

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
        await loadUserCredits(user.uid);
        await refreshCreditsStatus();
      } else {
        // 沒有用戶時自動創建匿名用戶
        await initializeAnonymousUser();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserCredits = async (userId: string) => {
    try {
      // 優先從伺服器獲取點數
      try {
        const response = await ApiService.getUserCredits();
        if (response.success) {
          const serverCredits: UserCredits = {
            balance: response.credits,
            totalEarned: response.credits, // 這裡可能需要調整，看 API 是否提供
            totalSpent: 0, // 這裡可能需要調整，看 API 是否提供
            lastUpdated: new Date(),
            features: {
              dailyFreeCredits: false,
              doubleCreditsBoost: false,
            },
          };
          setCredits(serverCredits);
          await saveUserCredits(userId, serverCredits);
          clearApiError();
          return;
        }
      } catch (error) {
        console.warn('Failed to load credits from server, using local storage:', error);
        if (error instanceof ApiError) {
          setApiError(error.userMessage);
        }
      }

      // 備用：從本地存儲加載
      const storedCredits = await AsyncStorage.getItem(`${CREDITS_STORAGE_KEY}_${userId}`);
      
      if (storedCredits) {
        const parsedCredits = JSON.parse(storedCredits);
        setCredits({
          ...parsedCredits,
          lastUpdated: new Date(parsedCredits.lastUpdated),
        });
      } else {
        // 新用戶送初始點數（這應該由伺服器處理，但作為備用）
        const initialCredits: UserCredits = {
          balance: 5, // 送5點初始點數
          totalEarned: 5,
          totalSpent: 0,
          lastUpdated: new Date(),
          features: {
            dailyFreeCredits: false,
            doubleCreditsBoost: false,
          },
        };
        setCredits(initialCredits);
        await saveUserCredits(userId, initialCredits);
      }
    } catch (error) {
      console.error('Error loading user credits:', error);
    }
  };

  const saveUserCredits = async (userId: string, creditsData: UserCredits) => {
    try {
      await AsyncStorage.setItem(`${CREDITS_STORAGE_KEY}_${userId}`, JSON.stringify(creditsData));
    } catch (error) {
      console.error('Error saving user credits:', error);
    }
  };

  const saveTransaction = async (userId: string, transaction: CreditTransaction) => {
    try {
      const existingTransactions = await getTransactionHistory();
      const newTransactions = [transaction, ...existingTransactions].slice(0, 100); // 保留最近100筆
      await AsyncStorage.setItem(`${TRANSACTIONS_STORAGE_KEY}_${userId}`, JSON.stringify(newTransactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const spendCredits = async (amount: number, description: string): Promise<boolean> => {
    if (!user) return false;
    
    if (credits.balance < amount) {
      return false;
    }

    try {
      const newCredits = {
        ...credits,
        balance: credits.balance - amount,
        totalSpent: credits.totalSpent + amount,
        lastUpdated: new Date(),
      };

      setCredits(newCredits);
      await saveUserCredits(user.uid, newCredits);

      // 記錄交易
      const transaction: CreditTransaction = {
        id: `spend_${Date.now()}_${Math.random()}`,
        type: 'spend',
        amount,
        description,
        timestamp: new Date(),
      };
      await saveTransaction(user.uid, transaction);

      return true;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  };

  const addCredits = async (amount: number, description: string, productId?: string) => {
    if (!user) return;

    try {
      const newCredits = {
        ...credits,
        balance: credits.balance + amount,
        totalEarned: credits.totalEarned + amount,
        lastUpdated: new Date(),
      };

      setCredits(newCredits);
      await saveUserCredits(user.uid, newCredits);

      // 記錄交易
      const transaction: CreditTransaction = {
        id: `earn_${Date.now()}_${Math.random()}`,
        type: 'earn',
        amount,
        description,
        timestamp: new Date(),
        productId,
      };
      await saveTransaction(user.uid, transaction);
    } catch (error) {
      console.error('Error adding credits:', error);
    }
  };

  const getTransactionHistory = async (): Promise<CreditTransaction[]> => {
    if (!user) return [];

    try {
      const transactions = await AsyncStorage.getItem(`${TRANSACTIONS_STORAGE_KEY}_${user.uid}`);
      if (transactions) {
        const parsed = JSON.parse(transactions);
        return parsed.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  };

  const canAfford = (cost: number): boolean => {
    return credits.balance >= cost;
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setCredits({
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        lastUpdated: new Date(),
        features: {
          dailyFreeCredits: false,
          doubleCreditsBoost: false,
        },
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshCredits = async () => {
    if (user) {
      await loadUserCredits(user.uid);
    }
  };

  const generateHairstyle = async (): Promise<{ imageUrl: string; creditsLeft: number }> => {
    try {
      clearApiError();
      const response = await ApiService.tryHairstyle();
      
      if (response.success) {
        // 更新本地點數狀態
        const newCredits = {
          ...credits,
          balance: response.creditsLeft,
          totalSpent: credits.totalSpent + 1,
          lastUpdated: new Date(),
        };
        setCredits(newCredits);
        
        if (user) {
          await saveUserCredits(user.uid, newCredits);
          
          // 記錄交易
          const transaction: CreditTransaction = {
            id: `hairstyle_${Date.now()}_${Math.random()}`,
            type: 'spend',
            amount: 1,
            description: '髮型生成',
            timestamp: new Date(),
          };
          await saveTransaction(user.uid, transaction);
        }
        
        return {
          imageUrl: response.imageUrl,
          creditsLeft: response.creditsLeft,
        };
      } else {
        throw new Error('髮型生成失敗');
      }
    } catch (error) {
      console.error('Generate hairstyle error:', error);
      if (error instanceof ApiError) {
        setApiError(error.userMessage);
        throw new Error(error.userMessage);
      }
      throw error;
    }
  };

  const refreshCreditsStatus = async () => {
    // 從伺服器同步點數狀態
    if (user) {
      try {
        const response = await ApiService.getUserCredits();
        if (response.success) {
          const newCredits = {
            ...credits,
            balance: response.credits,
            lastUpdated: new Date(),
          };
          setCredits(newCredits);
          await saveUserCredits(user.uid, newCredits);
        }
      } catch (error) {
        console.warn('Failed to refresh credits from server:', error);
      }
    }
  };

  const value = {
    user,
    credits,
    loading,
    signOut,
    refreshCredits,
    spendCredits,
    addCredits,
    getTransactionHistory,
    canAfford,
    initializeAnonymousUser,
    isAnonymous: user?.isAnonymous || false,
    generateHairstyle,
    apiError,
    clearApiError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}