import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContextAnonymous';
import { useInAppPurchases, CREDITS_PRODUCTS } from '../hooks/useInAppPurchases';
import { useDailyCredits, useRewardCredits } from '../hooks/useCreditsManager';

export default function CreditsStoreScreen() {
  const { user, credits, refreshCredits, isAnonymous, handleIAPPurchase, restoreIAPPurchases } = useAuth();
  const iap = useInAppPurchases();
  const { canClaimDaily, claimDailyCredits, claiming } = useDailyCredits();
  const rewardActions = useRewardCredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [dailyClaimable, setDailyClaimable] = useState(false);

  useEffect(() => {
    checkDailyClaimable();
  }, []);

  useEffect(() => {
    // 點數餘額動畫
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [credits.balance]);

  const checkDailyClaimable = async () => {
    const claimable = await canClaimDaily();
    setDailyClaimable(claimable);
  };

  const handlePurchase = async (productId: string) => {
    try {
      setPurchasing(productId);
      
      // 使用 IAP hook 進行購買
      const result = await iap.purchaseProduct(productId as any);
      
      if (result.success && result.receiptData) {
        // 使用 AuthContext 的 IAP 處理方法
        const processed = await handleIAPPurchase(productId, result.receiptData);
        
        if (processed) {
          if (isAnonymous) {
            // 匿名用戶購買
            Alert.alert(
              '購買成功！',
              `已獲得 ${result.credits} 點數！\n\n您目前使用匿名帳戶，建議註冊正式帳戶以保護您的購買記錄。`,
              [
                { text: '稍後', style: 'cancel' },
                { 
                  text: '了解更多', 
                  onPress: () => {
                    // 這裡可以導航到帳戶升級說明頁面
                    console.log('導航到帳戶升級頁面');
                  }
                }
              ]
            );
          } else {
            // 正式用戶購買
            Alert.alert(
              '購買成功',
              '點數已添加到您的帳戶！',
              [{ text: '確定' }]
            );
          }
          await refreshCredits();
        } else {
          throw new Error('購買驗證失敗');
        }
      } else {
        Alert.alert(
          '購買失敗',
          result.error || '購買過程中發生錯誤，請稍後再試',
          [{ text: '確定' }]
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        '購買失敗',
        '購買過程中發生錯誤，請稍後再試',
        [{ text: '確定' }]
      );
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      // 使用 IAP hook 恢復購買
      const iapResult = await iap.restorePurchases();
      
      if (iapResult.success) {
        // 使用 AuthContext 的恢復購買方法
        const processed = await restoreIAPPurchases();
        
        if (processed) {
          const message = iapResult.message || '已恢復您之前的購買記錄';
          Alert.alert(
            '恢復成功',
            message,
            [{ text: '確定' }]
          );
          await refreshCredits();
        } else {
          throw new Error('恢復購買驗證失敗');
        }
      } else {
        Alert.alert(
          '恢復失敗',
          iapResult.error || '無法恢復購買記錄，請稍後再試',
          [{ text: '確定' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        '恢復失敗',
        '恢復購買記錄時發生錯誤',
        [{ text: '確定' }]
      );
    }
  };

  const handleDailyClaim = async () => {
    const success = await claimDailyCredits();
    if (success) {
      setDailyClaimable(false);
      await refreshCredits();
    }
  };

  const renderCreditsPackage = (productId: string, popular?: boolean) => {
    const product = iap.getProduct(productId as any);
    const creditsInfo = CREDITS_PRODUCTS[productId as keyof typeof CREDITS_PRODUCTS];
    const isPurchasing = purchasing === productId;

    if (!product || !creditsInfo) return null;

    const totalCredits = creditsInfo.credits + creditsInfo.bonus;
    const bonusPercentage = creditsInfo.bonus > 0 ? Math.round((creditsInfo.bonus / creditsInfo.credits) * 100) : 0;

    return (
      <View style={[styles.packageCard, popular && styles.popularPackage]}>
        {popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>熱門</Text>
          </View>
        )}
        
        <View style={styles.packageHeader}>
          <Ionicons name="diamond" size={32} color="#FFD700" />
          <Text style={styles.packageCredits}>{totalCredits}</Text>
          <Text style={styles.packageCreditsLabel}>點數</Text>
        </View>

        {creditsInfo.bonus > 0 && (
          <View style={styles.bonusContainer}>
            <Text style={styles.bonusText}>
              基礎 {creditsInfo.credits} + 贈送 {creditsInfo.bonus}
            </Text>
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusBadgeText}>+{bonusPercentage}%</Text>
            </View>
          </View>
        )}

        <Text style={styles.packagePrice}>{product.price}</Text>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            popular && styles.popularPurchaseButton,
            isPurchasing && styles.purchasingButton,
          ]}
          onPress={() => handlePurchase(productId)}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[
              styles.purchaseButtonText,
              popular && styles.popularPurchaseButtonText,
            ]}>
              購買
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderRewardAction = (title: string, description: string, credits: number, action: () => void, icon: string) => {
    return (
      <TouchableOpacity style={styles.rewardCard} onPress={action}>
        <View style={styles.rewardIcon}>
          <Ionicons name={icon as any} size={24} color="#8B5CF6" />
        </View>
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardTitle}>{title}</Text>
          <Text style={styles.rewardDescription}>{description}</Text>
        </View>
        <View style={styles.rewardCredits}>
          <Text style={styles.rewardCreditsText}>+{credits}</Text>
          <Ionicons name="diamond-outline" size={16} color="#FFD700" />
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Ionicons name="person-outline" size={64} color="#9CA3AF" />
          <Text style={styles.notLoggedInText}>請先登入以購買點數</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 標題和餘額 */}
        <View style={styles.header}>
          <Text style={styles.title}>點數商店</Text>
          <Animated.View style={[styles.balanceContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="diamond" size={24} color="#FFD700" />
            <Text style={styles.balanceText}>{credits.balance}</Text>
            <Text style={styles.balanceLabel}>點數</Text>
          </Animated.View>
        </View>

        {/* 每日免費點數 */}
        {credits.features.dailyFreeCredits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>每日免費</Text>
            <TouchableOpacity
              style={[styles.dailyRewardCard, !dailyClaimable && styles.dailyRewardCardDisabled]}
              onPress={handleDailyClaim}
              disabled={!dailyClaimable || claiming}
            >
              <View style={styles.dailyRewardIcon}>
                <Ionicons name="gift" size={32} color={dailyClaimable ? "#10B981" : "#9CA3AF"} />
              </View>
              <View style={styles.dailyRewardInfo}>
                <Text style={styles.dailyRewardTitle}>
                  {dailyClaimable ? "領取每日免費點數" : "今日已領取"}
                </Text>
                <Text style={styles.dailyRewardSubtitle}>每天免費獲得 3 點數</Text>
              </View>
              {claiming && <ActivityIndicator color="#10B981" />}
            </TouchableOpacity>
          </View>
        )}

        {/* 購買點數包 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>購買點數</Text>
          <View style={styles.packagesContainer}>
            {renderCreditsPackage('credits_10')}
            {renderCreditsPackage('credits_50')}
            {renderCreditsPackage('credits_100', true)}
            {renderCreditsPackage('credits_250')}
          </View>
        </View>

        {/* 免費獲得點數 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>免費獲得</Text>
          {renderRewardAction(
            "分享應用",
            "分享給朋友獲得獎勵",
            2,
            rewardActions.shareApp,
            "share-outline"
          )}
          {renderRewardAction(
            "評分應用",
            "在App Store給我們評分",
            5,
            rewardActions.rateApp,
            "star-outline"
          )}
          {renderRewardAction(
            "完善資料",
            "完成個人資料設定",
            3,
            rewardActions.completeProfile,
            "person-outline"
          )}
        </View>

        {/* 恢復購買 */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
        >
          <Text style={styles.restoreButtonText}>恢復購買</Text>
        </TouchableOpacity>

        {/* 使用說明 */}
        <View style={styles.usageInfo}>
          <Text style={styles.usageTitle}>點數使用說明</Text>
          <View style={styles.usageItem}>
            <Text style={styles.usageText}>• 基礎髮型變化：1 點數</Text>
          </View>
          <View style={styles.usageItem}>
            <Text style={styles.usageText}>• 高級髮型變化：2 點數</Text>
          </View>
          <View style={styles.usageItem}>
            <Text style={styles.usageText}>• AI智能推薦：3 點數</Text>
          </View>
          <View style={styles.usageItem}>
            <Text style={styles.usageText}>• 高解析度輸出：2 點數</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 4,
    opacity: 0.9,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  dailyRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dailyRewardCardDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dailyRewardIcon: {
    marginRight: 16,
  },
  dailyRewardInfo: {
    flex: 1,
  },
  dailyRewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dailyRewardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  packagesContainer: {
    gap: 16,
  },
  packageCard: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    position: 'relative',
  },
  popularPackage: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F8FAFF',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  packageCredits: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  packageCreditsLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bonusText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  bonusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 16,
  },
  purchaseButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  popularPurchaseButton: {
    backgroundColor: '#7C3AED',
  },
  purchasingButton: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  popularPurchaseButtonText: {
    color: '#fff',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  rewardCredits: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rewardCreditsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginRight: 4,
  },
  restoreButton: {
    margin: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  usageInfo: {
    margin: 24,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  usageItem: {
    marginBottom: 8,
  },
  usageText: {
    fontSize: 14,
    color: '#6B7280',
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  notLoggedInText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});