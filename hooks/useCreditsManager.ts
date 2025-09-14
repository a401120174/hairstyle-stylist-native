import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContextAnonymous';
import { USAGE_COSTS } from './useInAppPurchases';

export type UsageType = keyof typeof USAGE_COSTS;

interface UseCreditsManagerResult {
  attemptUsage: (type: UsageType, customCost?: number) => Promise<boolean>;
  canUse: (type: UsageType, customCost?: number) => boolean;
  getCost: (type: UsageType) => number;
  showInsufficientCreditsAlert: (requiredCredits: number) => void;
}

export function useCreditsManager(): UseCreditsManagerResult {
  const { credits, spendCredits, canAfford } = useAuth();

  const getCost = (type: UsageType): number => {
    return USAGE_COSTS[type];
  };

  const canUse = (type: UsageType, customCost?: number): boolean => {
    const cost = customCost || getCost(type);
    return canAfford(cost);
  };

  const showInsufficientCreditsAlert = (requiredCredits: number) => {
    Alert.alert(
      '點數不足',
      `此功能需要 ${requiredCredits} 點數，您目前有 ${credits.balance} 點數。\n\n是否前往購買點數？`,
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
  };

  const getUsageDescription = (type: UsageType): string => {
    const descriptions = {
      BASIC_HAIRSTYLE: '基礎髮型變化',
      PREMIUM_HAIRSTYLE: '高級髮型變化',
      AI_RECOMMENDATION: 'AI智能推薦',
      HD_EXPORT: '高解析度輸出',
      STYLE_COMPARISON: '髮型對比',
    };
    return descriptions[type];
  };

  const attemptUsage = async (type: UsageType, customCost?: number): Promise<boolean> => {
    const cost = customCost || getCost(type);
    const description = getUsageDescription(type);

    // 檢查是否有足夠點數
    if (!canAfford(cost)) {
      showInsufficientCreditsAlert(cost);
      return false;
    }

    try {
      // 扣除點數
      const success = await spendCredits(cost, description);
      
      if (success) {
        // 顯示成功提示（可選）
        // Alert.alert('成功', `已使用 ${cost} 點數進行${description}`);
        return true;
      } else {
        Alert.alert('錯誤', '扣除點數失敗，請稍後再試');
        return false;
      }
    } catch (error) {
      console.error('Usage attempt error:', error);
      Alert.alert('錯誤', '處理請求時發生錯誤');
      return false;
    }
  };

  return {
    attemptUsage,
    canUse,
    getCost,
    showInsufficientCreditsAlert,
  };
}

// 每日免費點數Hook
export function useDailyCredits() {
  const { credits, addCredits } = useAuth();
  const [claiming, setClaiming] = useState(false);

  const canClaimDaily = async (): Promise<boolean> => {
    if (!credits.features.dailyFreeCredits) return false;
    
    try {
      const lastClaim = await AsyncStorage.getItem('lastDailyClaim');
      if (!lastClaim) return true;
      
      const lastClaimDate = new Date(lastClaim);
      const today = new Date();
      
      return lastClaimDate.toDateString() !== today.toDateString();
    } catch (error) {
      console.error('Error checking daily claim:', error);
      return false;
    }
  };

  const claimDailyCredits = async (): Promise<boolean> => {
    const canClaim = await canClaimDaily();
    if (!canClaim || claiming) return false;

    try {
      setClaiming(true);
      
      const dailyAmount = 3; // 每日免費3點
      await addCredits(dailyAmount, '每日免費點數');
      
      // 記錄領取時間
      await AsyncStorage.setItem('lastDailyClaim', new Date().toISOString());
      
      Alert.alert(
        '領取成功！',
        `您已獲得 ${dailyAmount} 點免費點數！`,
        [{ text: '確定' }]
      );
      
      return true;
    } catch (error) {
      console.error('Daily credits claim error:', error);
      Alert.alert('錯誤', '領取每日點數失敗');
      return false;
    } finally {
      setClaiming(false);
    }
  };

  return {
    canClaimDaily,
    claimDailyCredits,
    claiming,
  };
}

// 獎勵點數Hook（觀看廣告、分享等）
export function useRewardCredits() {
  const { addCredits } = useAuth();

  const rewardForAction = async (action: string, amount: number): Promise<void> => {
    try {
      await addCredits(amount, `${action}獎勵`);
      
      Alert.alert(
        '獲得獎勵！',
        `完成${action}，獲得 ${amount} 點數！`,
        [{ text: '確定' }]
      );
    } catch (error) {
      console.error('Reward credits error:', error);
    }
  };

  const rewardActions = {
    shareApp: () => rewardForAction('分享應用', 2),
    rateApp: () => rewardForAction('評分應用', 5),
    watchAd: () => rewardForAction('觀看廣告', 1),
    completeProfile: () => rewardForAction('完善個人資料', 3),
    firstHairstyle: () => rewardForAction('首次使用髮型功能', 5),
  };

  return rewardActions;
}