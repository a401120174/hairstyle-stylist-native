import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContextAnonymous';

export interface CreditTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  timestamp: Date;
  productId?: string;
}

export interface UseTransactionHistoryResult {
  transactions: CreditTransaction[];
  loading: boolean;
  addTransaction: (transaction: Omit<CreditTransaction, 'id' | 'timestamp'>) => Promise<void>;
  getTransactionHistory: () => Promise<CreditTransaction[]>;
  clearHistory: () => Promise<void>;
}

const TRANSACTIONS_STORAGE_KEY = '@hairstyle_app_transactions';

/**
 * 交易記錄管理 Hook
 * 負責處理點數交易記錄的存儲和查詢
 */
export function useTransactionHistory(): UseTransactionHistoryResult {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const addTransaction = useCallback(async (transactionData: Omit<CreditTransaction, 'id' | 'timestamp'>) => {
    if (!user) return;

    try {
      const transaction: CreditTransaction = {
        ...transactionData,
        id: `${transactionData.type}_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
      };

      const existingTransactions = await getTransactionHistory();
      const newTransactions = [transaction, ...existingTransactions].slice(0, 100); // 保留最近100筆
      
      await AsyncStorage.setItem(`${TRANSACTIONS_STORAGE_KEY}_${user.uid}`, JSON.stringify(newTransactions));
      setTransactions(newTransactions);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  }, [user]);

  const getTransactionHistory = useCallback(async (): Promise<CreditTransaction[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      const transactions = await AsyncStorage.getItem(`${TRANSACTIONS_STORAGE_KEY}_${user.uid}`);
      if (transactions) {
        const parsed = JSON.parse(transactions);
        const formattedTransactions = parsed.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        }));
        setTransactions(formattedTransactions);
        return formattedTransactions;
      }
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      await AsyncStorage.removeItem(`${TRANSACTIONS_STORAGE_KEY}_${user.uid}`);
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing transaction history:', error);
    }
  }, [user]);

  return {
    transactions,
    loading,
    addTransaction,
    getTransactionHistory,
    clearHistory,
  };
}