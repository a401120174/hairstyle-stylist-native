import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// API 回應類型定義
export interface GetUserCreditsResponse {
  success: boolean;
  credits: number;
  userInfo: {
    email?: string;
    displayName?: string;
    createdAt?: string;
    lastUsed?: string;
  };
}

export interface TryHairstyleResponse {
  success: boolean;
  imageUrl: string;
  creditsLeft: number;
}

export interface VerifyIosPurchaseResponse {
  success: boolean;
  creditsAdded?: number;
  totalCredits?: number;
  error?: string;
}

// API 錯誤類型
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 錯誤處理工具函數
const handleApiError = (error: any): ApiError => {
  console.error('API Error:', error);
  
  let userMessage = '發生未知錯誤';
  
  switch (error.code) {
    case 'functions/unauthenticated':
      userMessage = '請先登入您的帳戶';
      break;
    case 'functions/failed-precondition':
      userMessage = '點數不足，請先購買點數';
      break;
    case 'functions/internal':
      userMessage = '服務暫時不可用，請稍後再試';
      break;
    case 'functions/unavailable':
      userMessage = '網路連接錯誤，請檢查網路連線';
      break;
    case 'functions/deadline-exceeded':
      userMessage = '請求超時，請稍後再試';
      break;
    default:
      userMessage = error.message || '發生未知錯誤';
  }
  
  return new ApiError(error.message, error.code, userMessage);
};

// API 函數實例
// Firebase Functions 調用
const getUserCreditsFunction = httpsCallable(functions, 'getUserCredits');
const tryHairstyleFunction = httpsCallable(functions, 'tryHairstyle');
const verifyIosPurchaseFunction = httpsCallable(functions, 'verifyIosPurchase');

// API 服務類
export class ApiService {
  /**
   * 獲取用戶點數和基本資料
   */
  static async getUserCredits(): Promise<GetUserCreditsResponse> {
    try {
      const result = await getUserCreditsFunction();
      return result.data as GetUserCreditsResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 嘗試髮型功能（扣除 1 點數）
   */
  static async tryHairstyle(): Promise<TryHairstyleResponse> {
    try {
      const result = await tryHairstyleFunction();
      return result.data as TryHairstyleResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 驗證 iOS 內購收據
   */
  static async verifyIosPurchase(receiptData: string): Promise<VerifyIosPurchaseResponse> {
    try {
      const result = await verifyIosPurchaseFunction({ receiptData });
      return result.data as VerifyIosPurchaseResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 工具函數：檢查 API 響應
export const isApiSuccess = (response: any): boolean => {
  return response && response.success === true;
};

// 工具函數：重試機制
export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // 如果是認證錯誤或前置條件失敗，不要重試
      if (error instanceof ApiError && 
          (error.code === 'functions/unauthenticated' || 
           error.code === 'functions/failed-precondition')) {
        throw error;
      }
      
      // 最後一次嘗試，拋出錯誤
      if (i === maxRetries) {
        break;
      }
      
      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// 開發環境專用：測試連接
export const testApiConnection = async (): Promise<boolean> => {
  try {
    await ApiService.getUserCredits();
    return true;
  } catch (error) {
    console.warn('API connection test failed:', error);
    return false;
  }
};