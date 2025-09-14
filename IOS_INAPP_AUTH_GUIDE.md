# iOS 內購認證策略指南

## 🍎 Apple Sign In + 訂閱模式

### 核心概念
- 使用 Apple Sign In 作為主要認證方式
- 通過內購訂閱來解鎖高級功能
- 符合 Apple App Store 審核政策

### 架構設計

```
用戶認證流程：
1. Apple Sign In 登入 → 獲得基礎帳號
2. 購買訂閱 → 解鎖高級功能
3. 驗證收據 → 確認訂閱狀態
4. 同步到後端 → 跨設備同步
```

## 📱 實作方案

### 方案一：Apple Sign In + 訂閱制
```typescript
// 用戶狀態結構
interface User {
  appleId: string;
  email?: string;
  displayName?: string;
  subscriptionStatus: 'free' | 'premium' | 'expired';
  subscriptionExpiry?: Date;
}
```

**優點：**
- 完全符合Apple政策
- 用戶體驗流暢
- 自動處理訂閱管理

**缺點：**
- 需要後端驗證收據
- Apple抽成30%

### 方案二：免費使用 + 高級功能內購
```typescript
// 功能解鎖狀態
interface FeatureAccess {
  basicHairstyles: boolean; // 免費
  premiumHairstyles: boolean; // 需購買
  aiRecommendations: boolean; // 需購買
  exportHighRes: boolean; // 需購買
}
```

**優點：**
- 降低進入門檻
- 靈活的付費模式
- 可以單次購買

**缺點：**
- 管理複雜度較高
- 需要精細的功能控制

### 方案三：試用期 + 訂閱制
```typescript
// 試用狀態管理
interface TrialStatus {
  isTrialActive: boolean;
  trialStartDate: Date;
  trialEndDate: Date;
  hasUsedTrial: boolean;
}
```

**優點：**
- 用戶可以先體驗
- 轉換率較高
- 符合訂閱應用常見模式

## 🔧 技術實作重點

### 1. Apple Sign In 整合
```bash
# 安裝必要套件
npm install expo-apple-authentication
```

### 2. 內購系統整合
```bash
# 安裝內購套件
npm install expo-in-app-purchases
```

### 3. 收據驗證
- 本地驗證（基礎檢查）
- 服務器端驗證（安全性）
- Apple Server-to-Server 通知

### 4. 狀態同步
- 本地存儲訂閱狀態
- 雲端同步（iCloud或自建後端）
- 跨設備一致性

## 🚀 推薦架構

對於髮型造型師應用，建議採用：

**Apple Sign In + 分層訂閱制**

```
免費版功能：
- 基礎髮型選擇（5-10種）
- 基本照片處理
- 低解析度輸出

高級版功能：
- 完整髮型庫（50+種）
- AI智能推薦
- 高解析度輸出
- 無浮水印
- 優先客服支援
```

## 📋 實作檢查清單

### 前端實作
- [ ] Apple Sign In 整合
- [ ] 內購商品配置
- [ ] 訂閱狀態檢查
- [ ] 功能權限控制
- [ ] 錯誤處理

### 後端實作
- [ ] 收據驗證服務
- [ ] 用戶訂閱狀態管理
- [ ] Webhook 處理
- [ ] 跨平台同步

### App Store 配置
- [ ] 內購商品設定
- [ ] 訂閱群組配置
- [ ] 價格分級設定
- [ ] 本地化描述

## ⚠️ 注意事項

### Apple 政策合規
1. 數位內容必須使用內購
2. 不能引導用戶到外部支付
3. 訂閱必須提供取消選項
4. 價格必須清楚標示

### 技術考量
1. 收據驗證安全性
2. 離線狀態處理
3. 家庭共享支援
4. 恢復購買功能

### 用戶體驗
1. 清楚的價值主張
2. 流暢的購買流程
3. 透明的計費說明
4. 簡單的取消流程