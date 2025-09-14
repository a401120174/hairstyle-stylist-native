# 🚀 API 實作完成指南

## 📋 已實作功能

### ✅ 1. Firebase Functions 配置
- **文件**: `config/firebase.ts`
- **功能**: 
  - 支持開發環境 Emulator 連接
  - 生產環境 Functions 配置
  - 自動環境檢測

### ✅ 2. API 服務層
- **文件**: `services/api.ts`
- **功能**:
  - `getUserCredits()` - 獲取用戶點數
  - `tryHairstyle()` - 髮型生成 API
  - 完整錯誤處理
  - 重試機制

### ✅ 3. 更新的認證系統
- **文件**: `contexts/AuthContextAnonymous.tsx`
- **新增功能**:
  - `generateHairstyle()` - 整合 API 的髮型生成
  - `apiError` - API 錯誤狀態管理
  - 伺服器端點數同步

### ✅ 4. API Hook
- **文件**: `hooks/useHairstyleGenerator.ts`, `hooks/useCredits.ts`
- **提供的 Hook**:
  - `useHairstyleGenerator()` - 髮型生成專用
  - `useCredits()` - 點數管理

### ✅ 5. 更新的主界面
- **文件**: `app/index.tsx`
- **改進**:
  - 使用新的 `useHairstyleGenerator` Hook
  - 即時點數顯示
  - 生成結果展示

## 🔧 使用方法

### 基本 API 調用

```typescript
import { ApiService } from '../services/api';

// 獲取用戶點數
try {
  const response = await ApiService.getUserCredits();
  console.log('用戶點數:', response.credits);
} catch (error) {
  console.error('獲取點數失敗:', error.userMessage);
}

// 髮型生成
try {
  const response = await ApiService.tryHairstyle();
  console.log('生成的圖片:', response.imageUrl);
  console.log('剩餘點數:', response.creditsLeft);
} catch (error) {
  console.error('髮型生成失敗:', error.userMessage);
}
```

### 使用 Hook

```typescript
import { useHairstyleGenerator } from '../hooks/useHairstyleGenerator';

function HairstyleComponent() {
  const { 
    generate, 
    loading, 
    generatedImage,
    canGenerate,
    currentCredits 
  } = useHairstyleGenerator();

  const handleGenerate = async () => {
    const imageUrl = await generate();
    if (imageUrl) {
      console.log('髮型生成成功:', imageUrl);
    }
  };

  return (
    <View>
      <Text>剩餘點數: {currentCredits}</Text>
      <TouchableOpacity 
        onPress={handleGenerate}
        disabled={!canGenerate || loading}
      >
        <Text>{loading ? '生成中...' : '生成髮型'}</Text>
      </TouchableOpacity>
      {generatedImage && (
        <Image source={{ uri: generatedImage }} />
      )}
    </View>
  );
}
```

### 在 AuthContext 中使用

```typescript
import { useAuth } from '../contexts/AuthContextAnonymous';

function CreditsDisplay() {
  const { 
    credits, 
    generateHairstyle, 
    apiError, 
    clearApiError 
  } = useAuth();

  const handleGenerate = async () => {
    try {
      const result = await generateHairstyle();
      console.log('生成結果:', result);
    } catch (error) {
      console.error('生成失敗:', error);
    }
  };

  return (
    <View>
      <Text>點數餘額: {credits.balance}</Text>
      {apiError && (
        <View>
          <Text>錯誤: {apiError}</Text>
          <TouchableOpacity onPress={clearApiError}>
            <Text>清除錯誤</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity onPress={handleGenerate}>
        <Text>生成髮型</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## 🛠️ 配置需求

### 1. Firebase 項目設置
更新 `config/firebase.ts` 中的配置：

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};
```

### 2. 開發環境 Emulator
啟動 Firebase Emulator：

```bash
# 在項目根目錄運行
firebase emulators:start
```

確保以下服務運行：
- Auth Emulator: `http://127.0.0.1:9099`
- Functions Emulator: `http://127.0.0.1:5001`

### 3. 依賴檢查
確保安裝了所需的 Firebase 依賴：

```bash
npm install firebase @react-native-async-storage/async-storage
```

## 🧪 測試建議

### 1. API 連接測試
```typescript
import { testApiConnection } from '../services/api';

// 在 App 啟動時測試連接
useEffect(() => {
  testApiConnection().then(connected => {
    console.log('API 連接狀態:', connected ? '成功' : '失敗');
  });
}, []);
```

### 2. 點數同步測試
```typescript
import { useCredits } from '../hooks/useCredits';

function TestCredits() {
  const { refreshCredits, loading } = useCredits();
  
  return (
    <TouchableOpacity onPress={refreshCredits} disabled={loading}>
      <Text>刷新點數</Text>
    </TouchableOpacity>
  );
}
```

## 🔍 故障排除

### 常見問題

1. **Functions Emulator 連接失敗**
   - 確保 Emulator 正在運行
   - 檢查端口 5001 是否被佔用

2. **認證失敗**
   - 確保 Auth Emulator 運行在 9099 端口
   - 檢查匿名認證是否啟用

3. **API 調用超時**
   - 檢查網路連接
   - 確認 Firebase 項目配置正確

### 調試技巧

```typescript
// 開啟詳細日志
console.log('Firebase app initialized:', app);
console.log('Functions instance:', functions);
console.log('Auth instance:', auth);
```

## 🚀 下一步

1. **內購驗證 API** - 實作 iOS/Android 內購驗證
2. **圖片上傳** - 添加用戶照片上傳功能  
3. **結果保存** - 實作髮型結果保存與歷史記錄
4. **推送通知** - 添加髮型生成完成通知

---

**📞 需要幫助？**
如果遇到任何問題，請檢查：
1. Firebase Console 設置
2. Emulator 運行狀態
3. 網路連接
4. 日志輸出