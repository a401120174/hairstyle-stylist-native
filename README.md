# AI 髮型設計師 App

這是一個基於 React Native 和 Expo 的 AI 髮型變換應用程式，具有現代髮廊風格的用戶界面。

## 功能特點

### 第一階段功能
- **照片選擇**：支援相機拍照和從相冊選擇照片
- **髮型選擇**：水平捲動的髮型風格選擇列表
- **現代設計**：明亮潔白的現代髮廊風格界面
- **跨平台**：適用於 iOS 和 Android 手機

### 界面設計
- 🎨 **現代髮廊風格**：使用明亮潔白的配色方案
- 📱 **響應式布局**：適配不同螢幕尺寸
- 🎭 **卡片式設計**：髮型選擇採用精美的卡片設計
- ✨ **陰影效果**：現代化的陰影和圓角設計

## 技術架構

- **框架**：React Native with Expo
- **路由**：Expo Router
- **圖片處理**：expo-image-picker
- **圖標**：@expo/vector-icons (Ionicons)
- **語言**：TypeScript

## 快速開始

### 安裝依賴
\`\`\`bash
npm install
\`\`\`

### 啟動開發伺服器
\`\`\`bash
npx expo start
\`\`\`

### 在不同平台上運行
- **iOS 模擬器**：按 `i`
- **Android 模擬器**：按 `a`
- **Web 瀏覽器**：按 `w`
- **實體裝置**：使用 Expo Go 掃描 QR 碼

## 專案結構

\`\`\`
app/
├── _layout.tsx          # 應用程式佈局
└── index.tsx           # 主頁面（髮型選擇界面）

assets/                  # 靜態資源
__tests__/              # 測試文件
\`\`\`

## 開發規劃

### 已完成 ✅
- [x] 基礎專案結構設置
- [x] 照片選擇功能（相機 + 相冊）
- [x] 髮型選擇列表
- [x] 現代髮廊風格 UI 設計
- [x] 響應式布局

### 後續開發計劃 🚧
- [ ] AI 髮型變換核心功能
- [ ] 更多髮型樣式選項
- [ ] 髮型預覽效果
- [ ] 儲存和分享功能
- [ ] 髮型歷史記錄
- [ ] 用戶偏好設置

## 設計理念

這個應用程式的設計靈感來自現代髮廊，採用：
- **極簡主義**：乾淨簡潔的界面
- **溫馨友好**：讓用戶感到舒適的配色
- **專業感**：體現髮型設計的專業性
- **易用性**：直觀的操作流程

## 貢獻

歡迎提交 Issues 和 Pull Requests 來改善這個應用程式！

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
