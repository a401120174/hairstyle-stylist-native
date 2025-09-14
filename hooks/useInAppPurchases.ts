import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// 條件性導入內購模組
let InAppPurchases: any = null;
try {
  if (Platform.OS !== 'web') {
    InAppPurchases = require('expo-in-app-purchases').default;
  }
} catch (error) {
  console.log('InAppPurchases not available:', error);
}

export type ProductId = 
  | 'credits_10' 
  | 'credits_50' 
  | 'credits_100' 
  | 'credits_250';

// 點數產品配置
export const CREDITS_PRODUCTS = {
  credits_10: {
    id: 'credits_10' as ProductId,
    credits: 10,
    price: '$0.99',
    bonus: 0,
    title: '基礎點數包',
    description: '10 點數'
  },
  credits_50: {
    id: 'credits_50' as ProductId,
    credits: 50,
    price: '$4.99',
    bonus: 10,
    title: '熱門點數包',
    description: '50 點數 + 10 點數'
  },
  credits_100: {
    id: 'credits_100' as ProductId,
    credits: 100,
    price: '$9.99',
    bonus: 25,
    title: '超值點數包',
    description: '100 點數 + 25 點數'
  },
  credits_250: {
    id: 'credits_250' as ProductId,
    credits: 250,
    price: '$19.99',
    bonus: 75,
    title: '巨量點數包',
    description: '250 點數 + 75 點數'
  },
};

// 功能使用點數成本
export const USAGE_COSTS = {
  BASIC_HAIRSTYLE: 2,          // 基礎髮型變化
  PREMIUM_HAIRSTYLE: 5,        // 高級髮型變化
  AI_RECOMMENDATION: 3,        // AI智能推薦
  HD_EXPORT: 4,               // 高清導出
  STYLE_COMPARISON: 3,        // 風格比較
};

export type FeatureType = keyof typeof USAGE_COSTS;

interface Product {
  productId: string;
  price: string;
  title: string;
  description: string;
}

interface PurchaseResult {
  success: boolean;
  productId?: string;
  credits?: number;
  error?: string;
}

export function useInAppPurchases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Web環境模擬函數
  const mockPurchase = (productId: ProductId): Promise<PurchaseResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const product = CREDITS_PRODUCTS[productId];
        if (product) {
          resolve({
            success: true,
            productId,
            credits: product.credits + product.bonus
          });
        } else {
          resolve({
            success: false,
            error: '產品不存在'
          });
        }
      }, 1000);
    });
  };

  const initializeStore = async () => {
    if (!InAppPurchases && Platform.OS !== 'web') {
      console.warn('InAppPurchases not available');
      return;
    }

    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Web環境使用模擬數據
        const mockProducts = Object.values(CREDITS_PRODUCTS).map(product => ({
          productId: product.id,
          price: product.price,
          title: product.title,
          description: product.description
        }));
        setProducts(mockProducts);
      } else {
        // 原生環境使用真實IAP
        await InAppPurchases.connectAsync();
        const productIds = Object.keys(CREDITS_PRODUCTS) as ProductId[];
        const result = await InAppPurchases.getProductsAsync(productIds);
        
        if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
          setProducts(result.results || []);
        }
      }
    } catch (error) {
      console.error('初始化商店失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseProduct = async (productId: ProductId): Promise<PurchaseResult> => {
    setIsPurchasing(true);
    
    try {
      if (Platform.OS === 'web') {
        // Web環境使用模擬購買
        return await mockPurchase(productId);
      } else if (InAppPurchases) {
        // 原生環境使用真實IAP
        const result = await InAppPurchases.purchaseItemAsync(productId);
        
        if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
          const product = CREDITS_PRODUCTS[productId];
          return {
            success: true,
            productId,
            credits: product.credits + product.bonus
          };
        } else {
          return {
            success: false,
            error: '購買失敗'
          };
        }
      } else {
        return {
          success: false,
          error: 'IAP服務不可用'
        };
      }
    } catch (error) {
      console.error('購買錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    } finally {
      setIsPurchasing(false);
    }
  };

  const getProduct = (productId: ProductId) => {
    return products.find(p => p.productId === productId);
  };

  const restorePurchases = async () => {
    if (Platform.OS === 'web') {
      console.log('Web環境不支持恢復購買');
      return { success: true, purchases: [] };
    }

    if (!InAppPurchases) {
      return { success: false, error: 'IAP服務不可用' };
    }

    try {
      const result = await InAppPurchases.getPurchaseHistoryAsync();
      if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
        // 處理恢復的購買記錄
        const restoredPurchases = result.results || [];
        console.log('恢復的購買記錄:', restoredPurchases);
        
        // 這裡可以添加將恢復的購買記錄同步到Firebase的邏輯
        // 例如: await syncPurchasesToFirebase(restoredPurchases);
        
        return {
          success: true,
          purchases: restoredPurchases,
          message: `成功恢復 ${restoredPurchases.length} 項購買記錄`
        };
      } else {
        return { 
          success: false, 
          error: '無法恢復購買記錄',
          responseCode: result.responseCode 
        };
      }
    } catch (error) {
      console.error('恢復購買失敗:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '恢復購買失敗' 
      };
    }
  };

  // 新增：同步購買記錄到Firebase的函數
  const syncPurchasesToFirebase = async (purchases: any[]) => {
    try {
      // 這裡實作將購買記錄同步到Firebase的邏輯
      // 可以調用Firebase Cloud Functions或直接寫入Firestore
      console.log('同步購買記錄到Firebase:', purchases);
      
      // 示例：計算總點數並更新用戶帳戶
      let totalCredits = 0;
      for (const purchase of purchases) {
        const product = CREDITS_PRODUCTS[purchase.productId as keyof typeof CREDITS_PRODUCTS];
        if (product) {
          totalCredits += product.credits + product.bonus;
        }
      }
      
      return { success: true, totalCredits };
    } catch (error) {
      console.error('同步購買記錄失敗:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    initializeStore();
    
    // 清理函數
    return () => {
      if (InAppPurchases && Platform.OS !== 'web') {
        InAppPurchases.disconnectAsync();
      }
    };
  }, []);

  return {
    products,
    isLoading,
    isPurchasing,
    purchaseProduct,
    getProduct,
    restorePurchases,
    initializeStore,
    syncPurchasesToFirebase
  };
}