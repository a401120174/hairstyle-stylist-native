import { useState, useEffect } from 'react';
import * as InAppPurchases from 'expo-in-app-purchases';

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
  receiptData?: string;
}

interface RestoreResult {
  success: boolean;
  purchases?: any[];
  message?: string;
  error?: string;
}

export function useInAppPurchases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const initializeStore = async () => {
    setIsLoading(true);
    try {
      // 連接到 IAP 服務
      await InAppPurchases.connectAsync();
      
      // 獲取產品信息
      const productIds = Object.keys(CREDITS_PRODUCTS) as ProductId[];
      await InAppPurchases.getProductsAsync(productIds);
      
      // 為了測試目的，使用模擬產品數據
      const mockProducts = Object.values(CREDITS_PRODUCTS).map(product => ({
        productId: product.id,
        price: product.price,
        title: product.title,
        description: product.description
      }));
      
      setProducts(mockProducts);
      console.log('商店初始化成功');
    } catch (error) {
      console.error('初始化商店失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseProduct = async (productId: ProductId): Promise<PurchaseResult> => {
    setIsPurchasing(true);
    
    try {
      // 執行購買
      await InAppPurchases.purchaseItemAsync(productId);
      
      // 如果執行到這裡說明購買成功
      const product = CREDITS_PRODUCTS[productId];
      return {
        success: true,
        productId,
        credits: product.credits + product.bonus,
        receiptData: 'mock_receipt' // 在實際實作時應該從 App Store 獲取真實收據
      };
    } catch (error) {
      console.error('購買錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '購買失敗'
      };
    } finally {
      setIsPurchasing(false);
    }
  };

  const getProduct = (productId: ProductId) => {
    return products.find(p => p.productId === productId);
  };

  const restorePurchases = async (): Promise<RestoreResult> => {
    try {
      // 恢復購買記錄
      await InAppPurchases.getPurchaseHistoryAsync();
      
      // 如果執行到這裡說明恢復成功
      console.log('恢復購買成功');
      
      return {
        success: true,
        purchases: [], // 實際實作時會包含恢復的購買記錄
        message: '成功恢復購買記錄'
      };
    } catch (error) {
      console.error('恢復購買失敗:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '恢復購買失敗' 
      };
    }
  };

  useEffect(() => {
    initializeStore();
    
    // 清理函數
    return () => {
      InAppPurchases.disconnectAsync().catch(error => {
        console.warn('斷開 IAP 連接時出錯:', error);
      });
    };
  }, []);

  return {
    products,
    isLoading,
    isPurchasing,
    purchaseProduct,
    getProduct,
    restorePurchases,
    initializeStore
  };
}