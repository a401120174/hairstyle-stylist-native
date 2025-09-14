import { useState, useCallback } from 'react';
import { ApiService, ApiError } from '../services/api';

export interface UseApiErrorResult {
  apiError: string | null;
  clearApiError: () => void;
  handleApiError: (error: any) => void;
}

/**
 * API 錯誤管理 Hook
 * 負責處理 API 錯誤狀態的統一管理
 */
export function useApiError(): UseApiErrorResult {
  const [apiError, setApiError] = useState<string | null>(null);

  const clearApiError = useCallback(() => {
    setApiError(null);
  }, []);

  const handleApiError = useCallback((error: any) => {
    console.error('API Error:', error);
    
    if (error instanceof ApiError) {
      setApiError(error.userMessage);
      return;
    }
    
    if (error.message) {
      setApiError(error.message);
    } else {
      setApiError('發生未知錯誤');
    }
  }, []);

  return {
    apiError,
    clearApiError,
    handleApiError,
  };
}