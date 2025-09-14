# 🎨 AI 換髮型 App - API 文檔

這份文檔詳細介紹了 AI 換髮型 App 後端提供的所有 API 端點以及前端調用方式。

## 📋 目錄

- [環境配置](#環境配置)
- [API 概覽](#api-概覽)
- [認證方式](#認證方式)
- [核心 API](#核心-api)
  - [getUserCredits - 獲取用戶點數](#getuserCredits---獲取用戶點數)
  - [tryHairstyle - 嘗試髮型](#tryhairstyle---嘗試髮型)
- [內購相關 API](#內購相關-api)
  - [verifyIosPurchase - iOS 內購驗證](#verifyiospurchase---ios-內購驗證)
  - [verifyAndroidPurchase - Android 內購驗證](#verifyandroidpurchase---android-內購驗證)
- [管理員 API](#管理員-api)
  - [addCreditsToUser - 管理員加點](#addcreditstouser---管理員加點)
- [錯誤處理](#錯誤處理)
- [使用範例](#使用範例)

## 🛠️ 環境配置

### 開發環境
- **Base URL**: `http://127.0.0.1:5001/demo-hairstyle-app/us-central1`
- **Firebase Auth**: `http://127.0.0.1:9099`
- **Firestore**: `http://127.0.0.1:8080`
- **管理界面**: `http://127.0.0.1:4000`

### 生產環境
- **Base URL**: `https://us-central1-[YOUR_PROJECT_ID].cloudfunctions.net`
- **Region**: `us-central1`

## 📊 API 概覽

| API 名稱 | 功能 | 狀態 | 需要認證 |
|---------|------|------|----------|
| `getUserCredits` | 獲取用戶點數和基本信息 | ✅ 可用 | 是 |
| `tryHairstyle` | 嘗試 AI 換髮型功能 | ✅ 可用 | 是 |
| `verifyIosPurchase` | iOS 內購驗證 | 🚧 開發中 | 是 |
| `verifyAndroidPurchase` | Android 內購驗證 | 🚧 開發中 | 是 |
| `addCreditsToUser` | 管理員手動加點 | 🚧 開發中 | 是 |

## 🔐 認證方式

所有 API 都需要用戶通過 Firebase Authentication 登入。在前端調用時，Firebase SDK 會自動處理認證令牌。

### React Native (Expo) 設置

```javascript
// firebase.config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  // 你的 Firebase 配置
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// 開發環境連接到 Emulator
if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

## 🎯 核心 API

### `getUserCredits` - 獲取用戶點數

獲取用戶當前的點數餘額和基本資料。

#### 📝 功能描述
- 檢查用戶當前點數餘額
- 返回用戶基本信息（email、顯示名稱等）
- 如果是新用戶，自動創建帳戶並給予 5 個免費點數
- 更新用戶最後活動時間

#### 📤 請求參數
無需參數

#### 📥 回應格式
```typescript
interface GetUserCreditsResponse {
  success: boolean;
  credits: number;
  userInfo: {
    email?: string;
    displayName?: string;
    createdAt?: string;
    lastUsed?: string;
  };
}
```

#### 🔧 前端調用範例

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.config';

const getUserCredits = httpsCallable(functions, 'getUserCredits');

async function fetchUserCredits() {
  try {
    const result = await getUserCredits();
    const { credits, userInfo } = result.data;
    
    console.log(`用戶點數: ${credits}`);
    console.log('用戶信息:', userInfo);
    
    return { credits, userInfo };
  } catch (error) {
    console.error('獲取用戶點數失敗:', error);
    throw error;
  }
}

// React Native 組件中使用
const CreditsDisplay = () => {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const { credits } = await fetchUserCredits();
        setCredits(credits);
      } catch (error) {
        Alert.alert('錯誤', '無法獲取點數信息');
      } finally {
        setLoading(false);
      }
    };

    loadCredits();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View>
      <Text>剩餘點數: {credits}</Text>
    </View>
  );
};
```

---

### `tryHairstyle` - 嘗試髮型

扣除 1 個點數並生成 AI 髮型圖片（目前為 MVP 版本，返回模擬圖片）。

#### 📝 功能描述
- 驗證用戶是否有足夠點數（至少 1 點）
- 使用 Firestore Transaction 安全扣除 1 點
- 返回生成的髮型圖片 URL（目前為模擬圖片）
- 返回扣點後的餘額

#### 📤 請求參數
無需參數（未來可能會添加髮型參數）

#### 📥 回應格式
```typescript
interface TryHairstyleResponse {
  success: boolean;
  imageUrl: string;
  creditsLeft: number;
}
```

#### 🔧 前端調用範例

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.config';

const tryHairstyle = httpsCallable(functions, 'tryHairstyle');

async function generateHairstyle() {
  try {
    const result = await tryHairstyle();
    const { imageUrl, creditsLeft } = result.data;
    
    console.log('生成的髮型圖片:', imageUrl);
    console.log('剩餘點數:', creditsLeft);
    
    return { imageUrl, creditsLeft };
  } catch (error) {
    if (error.code === 'functions/failed-precondition') {
      throw new Error('點數不足，請先購買點數');
    } else if (error.code === 'functions/unauthenticated') {
      throw new Error('請先登入');
    } else {
      throw new Error('生成髮型失敗，請稍後再試');
    }
  }
}

// React Native 組件中使用
const HairstyleGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [credits, setCredits] = useState(0);

  const handleTryHairstyle = async () => {
    setLoading(true);
    try {
      const { imageUrl, creditsLeft } = await generateHairstyle();
      setGeneratedImage(imageUrl);
      setCredits(creditsLeft);
      Alert.alert('成功', '髮型生成完成！');
    } catch (error) {
      Alert.alert('錯誤', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={handleTryHairstyle} 
        disabled={loading}
        style={styles.button}
      >
        <Text>{loading ? '生成中...' : '嘗試新髮型'}</Text>
      </TouchableOpacity>
      
      {generatedImage && (
        <Image source={{ uri: generatedImage }} style={styles.image} />
      )}
      
      <Text>剩餘點數: {credits}</Text>
    </View>
  );
};
```

## 💳 內購相關 API

### `verifyIosPurchase` - iOS 內購驗證

**狀態**: 🚧 開發中

驗證 iOS App Store 內購收據並為用戶帳戶添加點數。

#### 📤 計劃請求參數
```typescript
{
  receiptData: string; // App Store 收據數據
}
```

#### 📥 計劃回應格式
```typescript
{
  success: boolean;
  creditsAdded?: number;
  totalCredits?: number;
  error?: string;
}
```

#### 🔧 前端調用範例（計劃中）
```javascript
// 計劃實現
const verifyIosPurchase = httpsCallable(functions, 'verifyIosPurchase');

async function handleIosPurchase(receiptData) {
  try {
    const result = await verifyIosPurchase({ receiptData });
    // 處理購買結果
  } catch (error) {
    // 處理錯誤
  }
}
```

---

### `verifyAndroidPurchase` - Android 內購驗證

**狀態**: 🚧 開發中

驗證 Google Play Store 內購並為用戶帳戶添加點數。

#### 📤 計劃請求參數
```typescript
{
  purchaseToken: string; // Google Play 購買令牌
  productId: string;     // 產品 ID
}
```

#### 📥 計劃回應格式
```typescript
{
  success: boolean;
  creditsAdded?: number;
  totalCredits?: number;
  error?: string;
}
```

## 👨‍💼 管理員 API

### `addCreditsToUser` - 管理員加點

**狀態**: 🚧 開發中

允許管理員手動為指定用戶添加點數（用於客戶服務或測試）。

#### 📤 計劃請求參數
```typescript
{
  userId: string;   // 目標用戶 ID
  credits: number;  // 要添加的點數
  reason?: string;  // 添加原因（可選）
}
```

## ⚠️ 錯誤處理

### 常見錯誤代碼

| 錯誤代碼 | 描述 | 解決方案 |
|---------|------|----------|
| `functions/unauthenticated` | 用戶未登入 | 引導用戶登入 |
| `functions/failed-precondition` | 點數不足 | 引導用戶購買點數 |
| `functions/internal` | 服務器內部錯誤 | 稍後重試或聯絡客服 |

### 錯誤處理最佳實踐

```javascript
const handleApiCall = async (apiFunction, params = {}) => {
  try {
    const result = await apiFunction(params);
    return result.data;
  } catch (error) {
    let userMessage = '發生未知錯誤';
    
    switch (error.code) {
      case 'functions/unauthenticated':
        userMessage = '請先登入您的帳戶';
        // 導航到登入頁面
        break;
      case 'functions/failed-precondition':
        userMessage = '點數不足，請先購買點數';
        // 導航到購買頁面
        break;
      case 'functions/internal':
        userMessage = '服務暫時不可用，請稍後再試';
        break;
      default:
        userMessage = error.message || '發生未知錯誤';
    }
    
    Alert.alert('錯誤', userMessage);
    throw error;
  }
};
```