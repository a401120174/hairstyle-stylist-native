import { useState, useEffect } from 'react';
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
import { useInAppPurchases } from '../hooks';
import { useCredits } from '../hooks/useCredits';
import { useIAPManager } from '../hooks/useIAPManager';

// 從原文件直接導入產品常量
const CREDITS_PRODUCTS = {
  credits_10: {
    id: 'credits_10',
    credits: 10,
    price: '$0.99',
    bonus: 0,
    title: '基礎點數包',
    description: '10 點數'
  },
  credits_50: {
    id: 'credits_50',
    credits: 50,
    price: '$4.99',
    bonus: 10,
    title: '熱門點數包',
    description: '50 點數 + 10 點數'
  },
  credits_100: {
    id: 'credits_100',
    credits: 100,
    price: '$9.99',
    bonus: 25,
    title: '超值點數包',
    description: '100 點數 + 25 點數'
  },
  credits_250: {
    id: 'credits_250',
    credits: 250,
    price: '$19.99',
    bonus: 75,
    title: '豪華點數包',
    description: '250 點數 + 75 點數'
  },
};

export default function CreditsStoreScreen() {
  const { user, isAnonymous } = useAuth();
  const { credits, refreshCredits } = useCredits();
  const { handleIAPPurchase, restoreIAPPurchases } = useIAPManager();
  const iap = useInAppPurchases();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

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

  const handlePurchase = async (productId: string) => {
    try {
      setPurchasing(productId);
      
      // 使用 IAP hook 進行購買
      const result = await iap.purchaseProduct(productId as any);
      
      if (result.success && result.receiptData) {
        // 使用 AuthContext 的 IAP 處理方法
        const processed = await handleIAPPurchase(productId, result.receiptData);
        
        if (processed) {
          Alert.alert(
            '購買成功',
            '點數已添加到您的帳戶！',
            [{ text: '確定' }]
          )
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