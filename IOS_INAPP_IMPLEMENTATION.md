# 🍎 iOS 內購認證完整實作指南

我已經為您完成了iOS內購認證系統的完整實作！以下是詳細的功能說明和配置步驟。

## ✅ 已實作的功能

### 🔐 **Apple Sign In 整合**
- ✅ 原生Apple Sign In支援
- ✅ Firebase認證整合
- ✅ 用戶資料同步
- ✅ nonce安全驗證

### 💰 **內購系統**
- ✅ 訂閱制商品管理
- ✅ 單次購買商品
- ✅ 收據驗證基礎架構
- ✅ 購買狀態同步
- ✅ 恢復購買功能

### 📱 **用戶介面**
- ✅ Apple風格登入畫面
- ✅ 訂閱管理頁面
- ✅ 購買狀態顯示
- ✅ 功能權限控制

## 📋 商品結構設計

### 訂閱商品
```typescript
SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'premium_monthly',     // 月度訂閱
  YEARLY: 'premium_yearly',       // 年度訂閱 (推薦)
}
```

### 單次購買商品
```typescript
PURCHASE_PRODUCTS = {
  PREMIUM_HAIRSTYLES: 'premium_hairstyles_pack',  // 高級髮型包
  AI_RECOMMENDATIONS: 'ai_recommendations',        // AI推薦功能
  HD_EXPORT: 'hd_export_feature',                 // 高解析度輸出
}
```

## 🚀 配置步驟

### 1. App Store Connect 設定

#### 1.1 建立App Record
1. 登入 [App Store Connect](https://appstoreconnect.apple.com)
2. 建立新的App記錄
3. 設定Bundle ID（與Expo配置一致）

#### 1.2 設定內購商品
1. 前往「功能」>「App內購買項目」
2. 建立以下商品：

**訂閱商品：**
- 產品ID: `premium_monthly`
- 類型: 自動續訂訂閱
- 訂閱群組: Premium Features
- 價格: 您設定的月費

- 產品ID: `premium_yearly`
- 類型: 自動續訂訂閱
- 訂閱群組: Premium Features
- 價格: 您設定的年費

**消耗性商品：**
- 產品ID: `premium_hairstyles_pack`
- 類型: 非消耗性
- 價格: 您設定的一次性費用

### 2. Apple Developer 設定

#### 2.1 啟用Apple Sign In
1. 前往 [Apple Developer Portal](https://developer.apple.com)
2. 選擇您的App ID
3. 啟用「Sign In with Apple」能力
4. 重新生成Provisioning Profile

#### 2.2 設定App Services
```json
// app.json
{
  "expo": {
    "ios": {
      "capabilities": {
        "signInWithApple": "Default",
        "inAppPurchase": "Default"
      }
    }
  }
}
```

### 3. Firebase 設定

#### 3.1 啟用Apple登入提供者
1. 前往Firebase Console
2. Authentication > Sign-in method
3. 啟用Apple提供者
4. 配置服務ID（如需要）

#### 3.2 更新Firebase配置
確保 `config/firebase.ts` 中的配置正確。

### 4. 程式碼配置

#### 4.1 更新AuthProvider
在 `app/_layout.tsx` 中使用新的AuthProvider：

```typescript
import { AuthProvider } from '../contexts/AuthContextWithIAP';

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* 您的路由 */}
    </AuthProvider>
  );
}
```

#### 4.2 更新登入畫面
使用新的登入元件：

```typescript
import LoginScreenWithApple from '../components/LoginScreenWithApple';
```

## 🎯 使用流程

### 用戶體驗流程
1. **啟動App** → 檢查認證狀態
2. **未登入** → 顯示Apple/Google登入選項
3. **登入成功** → 檢查訂閱狀態
4. **查看功能** → 根據訂閱狀態顯示可用功能
5. **升級** → 前往訂閱頁面購買

### 開發者測試流程
1. **沙盒測試** → 使用測試帳號
2. **收據驗證** → 實作後端驗證
3. **功能控制** → 根據購買狀態控制功能
4. **審核準備** → 提交App Store審核

## 🔧 關鍵實作細節

### 功能權限控制
```typescript
// 在元件中檢查權限
const { subscription } = useAuth();

if (subscription.features.premiumHairstyles) {
  // 顯示高級髮型
} else {
  // 顯示升級提示
}
```

### 購買流程
```typescript
const iap = useInAppPurchases();

// 購買商品
await iap.purchaseProduct('premium_monthly');

// 恢復購買
await iap.restorePurchases();
```

## ⚠️ 重要注意事項

### 1. Apple審核政策
- ✅ 數位內容必須使用內購
- ✅ 不能引導到外部支付
- ✅ 提供恢復購買功能
- ✅ 清楚標示價格和條款

### 2. 安全性考量
- ✅ 收據驗證應在後端進行
- ✅ 敏感業務邏輯不應在前端
- ✅ 實作防重放攻擊機制

### 3. 用戶體驗
- ✅ 提供免費體驗功能
- ✅ 清楚說明付費價值
- ✅ 簡化購買流程
- ✅ 透明的取消政策

## 📱 測試指南

### 沙盒測試
1. 建立沙盒測試帳號
2. 在測試設備上登入測試帳號
3. 測試購買流程
4. 驗證功能解鎖

### 生產測試
1. TestFlight內部測試
2. 外部測試者驗證
3. 收據驗證服務測試
4. 跨設備同步測試

## 🚀 部署清單

### 開發階段
- [ ] 完成內購商品設定
- [ ] 實作收據驗證後端
- [ ] 測試沙盒購買流程
- [ ] 驗證功能權限控制

### 審核準備
- [ ] 提供測試帳號資訊
- [ ] 準備App審核說明
- [ ] 確認政策合規性
- [ ] 測試恢復購買功能

### 上線後
- [ ] 監控購買轉換率
- [ ] 收集用戶反饋
- [ ] 優化訂閱體驗
- [ ] 分析收入數據

您的iOS內購認證系統已經準備就緒！完成App Store Connect配置後，就可以開始測試完整的購買流程了。