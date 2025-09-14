import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ApiService, ApiError, retryApiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContextAnonymous';

export interface UseApiServiceResult {
  // 狀態
  loading: boolean;
  error: string | null;
  
  // 方法
  getUserCredits: () => Promise<void>;
  tryHairstyle: () => Promise<{ imageUrl: string; creditsLeft: number } | null>;
  clearError: () => void;
  
  // 工具方法
  handleApiError: (error: any) => void;
  retryWithAlert: <T>(
    apiCall: () => Promise<T>,
    successMessage?: string,
    retries?: number
  ) => Promise<T | null>;
}

export function useApiService(): UseApiServiceResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshCredits, clearApiError } = useAuth();

  const clearError = useCallback(() => {
    setError(null);
    clearApiError();
  }, [clearApiError]);

  const handleApiError = useCallback((error: any) => {
    console.error('API Service Error:', error);
    
    if (error instanceof ApiError) {
      setError(error.userMessage);
      return;
    }
    
    if (error.message) {
      setError(error.message);
    } else {
      setError('發生未知錯誤');
    }
  }, []);

  const getUserCredits = useCallback(async () => {
    setLoading(true);
    clearError();
    
    try {
      await refreshCredits();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [refreshCredits, clearError, handleApiError]);

  const tryHairstyle = useCallback(async (): Promise<{ imageUrl: string; creditsLeft: number } | null> => {
    setLoading(true);
    clearError();
    
    try {
      const response = await ApiService.tryHairstyle();
      
      if (response.success) {
        // 刷新點數狀態
        await refreshCredits();
        
        return {
          imageUrl: response.imageUrl,
          creditsLeft: response.creditsLeft,
        };
      } else {
        throw new Error('髮型生成失敗');
      }
    } catch (error) {
      handleApiError(error);
      
      // 顯示錯誤提示
      if (error instanceof ApiError) {
        Alert.alert('錯誤', error.userMessage);
      } else {
        Alert.alert('錯誤', '髮型生成失敗，請稍後再試');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshCredits, clearError, handleApiError]);

  const retryWithAlert = useCallback(async <T>(
    apiCall: () => Promise<T>,
    successMessage?: string,
    retries: number = 3
  ): Promise<T | null> => {
    setLoading(true);
    clearError();
    
    try {
      const result = await retryApiCall(apiCall, retries);
      
      if (successMessage) {
        Alert.alert('成功', successMessage);
      }
      
      return result;
    } catch (error) {
      handleApiError(error);
      
      Alert.alert(
        '操作失敗',
        error instanceof ApiError ? error.userMessage : '操作失敗，請稍後再試',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '重試',
            onPress: () => retryWithAlert(apiCall, successMessage, retries),
          },
        ]
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleApiError]);

  return {
    loading,
    error,
    getUserCredits,
    tryHairstyle,
    clearError,
    handleApiError,
    retryWithAlert,
  };
}

// 專門用於髮型生成的 Hook
export function useHairstyleGenerator() {
  const { generateHairstyle, canAfford, credits, apiError, clearApiError } = useAuth();
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async (): Promise<string | null> => {
    // 檢查點數
    if (!canAfford(1)) {
      Alert.alert(
        '點數不足',
        `此功能需要 1 點數，您目前有 ${credits.balance} 點數。\n\n是否前往購買點數？`,
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '購買點數',
            onPress: () => {
              // 這裡可以導航到點數商店
              console.log('Navigate to credits store');
            },
          },
        ]
      );
      return null;
    }

    setLoading(true);
    clearApiError();
    
    try {
      const result = await generateHairstyle();
      setGeneratingImage(result.imageUrl);
      
      Alert.alert(
        '生成成功！',
        `髮型已生成完成！剩餘點數：${result.creditsLeft}`,
        [{ text: '確定' }]
      );
      
      return result.imageUrl;
    } catch (error) {
      console.error('Hairstyle generation error:', error);
      
      Alert.alert(
        '生成失敗',
        error instanceof Error ? error.message : '髮型生成失敗，請稍後再試',
        [{ text: '確定' }]
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [generateHairstyle, canAfford, credits.balance, clearApiError]);

  const clearGeneratedImage = useCallback(() => {
    setGeneratingImage(null);
  }, []);

  return {
    generate,
    loading,
    generatedImage: generatingImage,
    clearGeneratedImage,
    canGenerate: canAfford(1),
    creditsNeeded: 1,
    currentCredits: credits.balance,
    apiError,
    clearApiError,
  };
}

// 用於點數管理的 Hook
export function useCreditsAPI() {
  const { credits, refreshCredits, apiError, clearApiError } = useAuth();
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await refreshCredits();
    } catch (error) {
      console.error('Credits refresh error:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshCredits]);

  return {
    credits,
    loading,
    refresh,
    apiError,
    clearApiError,
  };
}