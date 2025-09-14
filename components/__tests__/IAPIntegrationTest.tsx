/**
 * IAP 整合測試組件
 * 用於測試完整的 iOS 內購流程
 */
import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContextAnonymous';
import { useInAppPurchases } from '../../hooks/useInAppPurchases';

export default function IAPIntegrationTest() {
  const { 
    credits, 
    handleIAPPurchase, 
    restoreIAPPurchases, 
    refreshCredits,
    apiError,
    loading
  } = useAuth();
  
  const iap = useInAppPurchases();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // 測試完整購買流程
  const testFullPurchaseFlow = async () => {
    addTestResult('開始測試完整購買流程...');
    
    try {
      // 1. 嘗試購買 10 點數包
      addTestResult('步驟 1: 發起 IAP 購買');
      const purchaseResult = await iap.purchaseProduct('credits_10');
      
      if (purchaseResult.success && purchaseResult.receiptData) {
        addTestResult('步驟 2: IAP 購買成功，開始驗證收據');
        
        // 2. 使用 AuthContext 驗證購買
        const verified = await handleIAPPurchase('credits_10', purchaseResult.receiptData);
        
        if (verified) {
          addTestResult('步驟 3: 收據驗證成功');
          
          // 3. 刷新點數
          await refreshCredits();
          addTestResult(`步驟 4: 點數已更新，當前餘額: ${credits.balance}`);
          
          Alert.alert('測試成功', '完整 IAP 流程測試通過！');
        } else {
          addTestResult('步驟 3: 收據驗證失敗');
          Alert.alert('測試失敗', '收據驗證環節失敗');
        }
      } else {
        addTestResult(`步驟 2: IAP 購買失敗 - ${purchaseResult.error}`);
        Alert.alert('測試失敗', `IAP 購買失敗: ${purchaseResult.error}`);
      }
    } catch (error) {
      addTestResult(`測試異常: ${error}`);
      Alert.alert('測試異常', `${error}`);
    }
  };

  // 測試恢復購買
  const testRestorePurchases = async () => {
    addTestResult('開始測試恢復購買...');
    
    try {
      const restored = await restoreIAPPurchases();
      
      if (restored) {
        addTestResult('恢復購買成功');
        await refreshCredits();
        addTestResult(`恢復後點數餘額: ${credits.balance}`);
        Alert.alert('測試成功', '恢復購買測試通過！');
      } else {
        addTestResult('恢復購買失敗');
        Alert.alert('測試失敗', '恢復購買功能失敗');
      }
    } catch (error) {
      addTestResult(`恢復購買異常: ${error}`);
      Alert.alert('測試異常', `${error}`);
    }
  };

  // 清除測試結果
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IAP 整合測試</Text>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>當前點數餘額: {credits.balance}</Text>
        <Text style={styles.infoText}>載入中: {loading ? '是' : '否'}</Text>
        {apiError && (
          <Text style={styles.errorText}>API 錯誤: {apiError}</Text>
        )}
      </View>

      <View style={styles.buttonSection}>
        <Button
          title="測試完整購買流程"
          onPress={testFullPurchaseFlow}
          disabled={loading}
        />
        
        <Button
          title="測試恢復購買"
          onPress={testRestorePurchases}
          disabled={loading}
        />
        
        <Button
          title="刷新點數"
          onPress={refreshCredits}
          disabled={loading}
        />
        
        <Button
          title="清除測試結果"
          onPress={clearResults}
        />
      </View>

      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>測試結果:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 5,
  },
  buttonSection: {
    gap: 10,
    marginBottom: 20,
  },
  resultsSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 3,
    fontFamily: 'monospace',
  },
});