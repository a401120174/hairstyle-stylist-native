import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ApiService } from '../services/api';
import { useCredits } from './useCredits';
import { useApiError } from './useApiError';

export interface UseHairstyleGeneratorResult {
  // 生成相關狀態
  generate: () => Promise<string | null>;
  loading: boolean;
  generatedImage: string | null;
  clearGeneratedImage: () => void;
  
  // 點數檢查
  canGenerate: boolean;
  creditsNeeded: number;
  currentCredits: number;
  
  // 錯誤處理
  apiError: string | null;
  clearApiError: () => void;
}

/**
 * 專門用於髮型生成的 Hook
 * 負責處理髮型生成的完整業務邏輯，包括：
 * - 點數檢查
 * - 髮型生成
 * - 結果處理
 * - 錯誤處理
 */
export function useHairstyleGenerator(): UseHairstyleGeneratorResult {
  const { credits, canAfford, spendCredits } = useCredits();
  const { apiError, clearApiError, handleApiError } = useApiError();
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
      // 先扣除點數
      const spendSuccess = await spendCredits(1, '髮型生成');
      if (!spendSuccess) {
        throw new Error('扣除點數失敗');
      }

      // 調用 API
      const response = await ApiService.tryHairstyle();
      
      if (response.success) {
        setGeneratingImage(response.imageUrl);
        
        Alert.alert(
          '生成成功！',
          `髮型已生成完成！剩餘點數：${credits.balance - 1}`,
          [{ text: '確定' }]
        );
        
        return response.imageUrl;
      } else {
        throw new Error('髮型生成失敗');
      }
    } catch (error) {
      console.error('Hairstyle generation error:', error);
      handleApiError(error);
      
      Alert.alert(
        '生成失敗',
        error instanceof Error ? error.message : '髮型生成失敗，請稍後再試',
        [{ text: '確定' }]
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [canAfford, credits.balance, clearApiError, spendCredits, handleApiError]);

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