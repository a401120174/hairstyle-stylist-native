# Firebase 認證設定指南

## 🔥 Firebase 專案設定

您已經成功整合了 Firebase 認證系統！現在需要完成以下配置步驟：

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱，例如 "hairstyle-stylist"
4. 選擇是否啟用 Google Analytics（可選）
5. 完成專案建立

### 2. 新增 React Native 應用程式

1. 在 Firebase 專案中，點擊「新增應用程式」
2. 選擇 iOS 和 Android 圖示
3. 按照指引完成設定

### 3. 獲取 Firebase 配置

1. 在專案設定中找到「您的應用程式」部分
2. 複製 Firebase 配置物件
3. 將配置貼到 `config/firebase.ts` 檔案中，替換現有的佔位符

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

### 4. 設定 Google 登入

#### 4.1 在 Firebase Console 中：
1. 前往「Authentication」> 「Sign-in method」
2. 啟用「Google」登入提供者
3. 設定專案的公開名稱

#### 4.2 在 Google Cloud Console 中：
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的 Firebase 專案
3. 前往「API 和服務」>「憑證」
4. 建立 OAuth 2.0 用戶端 ID：
   - 應用程式類型：Web 應用程式
   - 授權的重新導向 URI：`https://auth.expo.io/@your-username/your-app-slug`

#### 4.3 更新 Google 登入配置：
在 `hooks/useGoogleSignIn.ts` 中更新：

```typescript
const clientId = "your-google-client-id.apps.googleusercontent.com";
// 和
client_secret: 'your-google-client-secret',
// 和
scheme: 'your-app-scheme', // 例如：com.yourcompany.hairstylestylist
```

### 5. 設定 App Scheme

在 `app.json` 中添加：

```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "your-app-scheme"
            }
          ],
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    }
  }
}
```

## 🚀 使用方式

配置完成後，您的應用程式將具備以下功能：

1. **自動認證檢查**：應用程式啟動時自動檢查用戶登入狀態
2. **Google 登入**：用戶可以使用 Google 帳號快速登入
3. **持久化登入**：用戶登入狀態會在應用程式重啟後保持
4. **個人資料管理**：顯示用戶資訊和登出功能

## 📁 檔案結構

```
├── config/
│   └── firebase.ts          # Firebase 配置
├── contexts/
│   └── AuthContext.tsx      # 認證狀態管理
├── hooks/
│   └── useGoogleSignIn.ts   # Google 登入邏輯
├── components/
│   ├── LoginScreen.tsx      # 登入畫面
│   └── ProfileScreen.tsx    # 個人資料畫面
└── app/
    ├── _layout.tsx          # 根佈局（包含 AuthProvider）
    ├── index.tsx            # 主頁面（包含認證檢查）
    └── profile.tsx          # 個人資料路由
```

## ⚠️ 重要注意事項

1. **安全性**：在生產環境中，Google Client Secret 應該儲存在後端，而非前端
2. **測試**：在實際設備上測試 Google 登入功能
3. **錯誤處理**：實作完整的錯誤處理和用戶反饋
4. **許可權**：確保應用程式具有網路存取許可權

## 🔧 故障排除

如果遇到問題：

1. **檢查 Firebase 配置**：確保所有配置值都正確
2. **檢查 Google Cloud Console**：確保 OAuth 設定正確
3. **檢查網路連線**：確保設備可以存取 Firebase 服務
4. **查看控制台日誌**：檢查任何錯誤訊息

完成這些設定後，您的髮型造型師應用程式就具備完整的 Firebase 認證功能了！