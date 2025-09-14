// Hooks 統一導出文件
// 這個文件提供了一個統一的入口點來導入所有的 hooks

// 核心 hooks
export { useCredits } from './useCredits';
export { useApiError } from './useApiError';

// 主要功能 hooks
export { useHairstyleGenerator } from './useHairstyleGenerator';

// 業務邏輯 hooks
export { useTransactionHistory } from './useTransactionHistory';
export { useIAPManager } from './useIAPManager';
export { useInAppPurchases } from './useInAppPurchases';

// 導出類型
export type { UseHairstyleGeneratorResult } from './useHairstyleGenerator';
export type { UserCredits, UseCreditsResult } from './useCredits';
export type { UseApiErrorResult } from './useApiError';
export type { CreditTransaction, UseTransactionHistoryResult } from './useTransactionHistory';
export type { UseIAPManagerResult } from './useIAPManager';