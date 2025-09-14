import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContextAnonymous';
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

export interface UseCreditsResult {
  credits: UserCredits;
  loading: boolean;
  spendCredits: (amount: number, description: string) => Promise<boolean>;
  addCredits: (amount: number, description: string, productId?: string) => Promise<void>;
  refreshCredits: () => Promise<void>;
  canAfford: (cost: number) => boolean;
}

const CREDITS_STORAGE_KEY = '@hairstyle_app_credits';

/**
 * 基礎點數管理 Hook
 * 只負責核心的點數狀態和操作，避免循環依賴
 */
export function useCredits(): UseCreditsResult {
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(false);

  // 保存點數到本地存儲
  const saveUserCredits = useCallback(async (userId: string, creditsData: UserCredits) => {
    try {
      await AsyncStorage.setItem(`${CREDITS_STORAGE_KEY}_${userId}`, JSON.stringify(creditsData));
    } catch (error) {
      console.error('Error saving user credits:', error);
    }
  }, []);

  // 從服務器和本地加載點數
  const loadUserCredits = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      
      // 優先從伺服器獲取點數
      try {
        const response = await ApiService.getUserCredits();
        if (response.success) {
          const serverCredits: UserCredits = {
            balance: response.credits,
            totalEarned: response.credits,
            totalSpent: 0,
            lastUpdated: new Date(),
            features: {
              dailyFreeCredits: false,
              doubleCreditsBoost: false,
            },
          };
          setCredits(serverCredits);
          await saveUserCredits(userId, serverCredits);
          return;
        }
      } catch (error) {
        console.warn('Failed to load credits from server, using local storage:', error);
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
        // 新用戶送初始點數
        const initialCredits: UserCredits = {
          balance: 5,
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
    } finally {
      setLoading(false);
    }
  }, [saveUserCredits]);

  // 在用戶登入時自動加載點數
  useEffect(() => {
    if (user) {
      loadUserCredits(user.uid);
    }
  }, [user, loadUserCredits]);

  // 刷新點數
  const refreshCredits = useCallback(async () => {
    if (user) {
      await loadUserCredits(user.uid);
    }
  }, [user, loadUserCredits]);

  // 消費點數
  const spendCredits = useCallback(async (amount: number, description: string): Promise<boolean> => {
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
      return true;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  }, [user, credits, saveUserCredits]);

  // 添加點數
  const addCredits = useCallback(async (amount: number, description: string, productId?: string) => {
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
    } catch (error) {
      console.error('Error adding credits:', error);
    }
  }, [user, credits, saveUserCredits]);

  // 檢查是否能夠支付
  const canAfford = useCallback((cost: number): boolean => {
    return credits.balance >= cost;
  }, [credits.balance]);

  return {
    credits,
    loading,
    spendCredits,
    addCredits,
    refreshCredits,
    canAfford,
  };
}