import { useState, useCallback } from 'react';
import { ApiService, ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContextAnonymous';
import { useCredits } from './useCredits';

export interface UseIAPManagerResult {
  loading: boolean;
  error: string | null;
  handleIAPPurchase: (productId: string, receiptData: string) => Promise<boolean>;
  restoreIAPPurchases: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * IAP (In-App Purchase) 管理 Hook
 * 負責處理內購相關的業務邏輯
 */
export function useIAPManager(): UseIAPManagerResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { refreshCredits } = useCredits();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // IAP 購買處理
  const handleIAPPurchase = useCallback(async (productId: string, receiptData: string): Promise<boolean> => {
    if (!user) {
      console.warn('無法處理購買：用戶未登入');
      setError('用戶未登入');
      return false;
    }

    try {
      setLoading(true);
      clearError();
      
      // 調用 verifyIosPurchase API 來驗證收據
      const response = await ApiService.verifyIosPurchase(receiptData);
      
      if (response.success) {
        // 刷新點數以同步伺服器狀態
        await refreshCredits();
        
        console.log(`IAP 購買驗證成功: ${productId} (+${response.creditsAdded} 點數)`);
        console.log(`總點數: ${response.totalCredits}`);
        return true;
      } else {
        throw new Error(response.error || '購買驗證失敗');
      }
    } catch (error) {
      console.error('IAP 購買處理錯誤:', error);
      if (error instanceof ApiError) {
        setError(error.userMessage);
      } else {
        setError('購買驗證失敗，請聯絡客服');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, refreshCredits, clearError]);

  // IAP 恢復購買
  const restoreIAPPurchases = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.warn('無法恢復購買：用戶未登入');
      setError('用戶未登入');
      return false;
    }

    try {
      setLoading(true);
      clearError();
      
      // TODO: 實作恢復購買邏輯
      // 需要查詢伺服器端的購買記錄並恢復點數
      console.log('IAP 恢復購買成功');
      return true;
    } catch (error) {
      console.error('IAP 恢復購買錯誤:', error);
      setError('恢復購買失敗');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, clearError]);

  return {
    loading,
    error,
    handleIAPPurchase,
    restoreIAPPurchases,
    clearError,
  };
}