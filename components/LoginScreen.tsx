import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

export default function LoginScreen() {
  const { signInWithGoogle, loading } = useGoogleSignIn();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const result = await signInWithGoogle();
      
      if (!result.success) {
        Alert.alert(
          '登入失敗',
          result.error || '登入過程中發生錯誤，請稍後再試',
          [{ text: '確定' }]
        );
      }
      // 成功的話，AuthContext會自動處理用戶狀態更新
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        '登入失敗',
        '登入過程中發生錯誤，請稍後再試',
        [{ text: '確定' }]
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo區域 */}
        <View style={styles.logoContainer}>
          <Ionicons name="cut" size={60} color="#8B5CF6" />
          <Text style={styles.title}>髮型造型師</Text>
          <Text style={styles.subtitle}>發現最適合您的髮型</Text>
        </View>

        {/* 登入按鈕區域 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.googleButton, (loading || isSigningIn) && styles.disabledButton]}
            onPress={handleGoogleSignIn}
            disabled={loading || isSigningIn}
          >
            {(loading || isSigningIn) ? (
              <ActivityIndicator color="#666" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.googleButtonText}>使用 Google 登入</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity 
            style={styles.guestButton}
            onPress={() => {
              // 這裡可以實作訪客模式
              Alert.alert('功能開發中', '訪客模式即將推出');
            }}
          >
            <Ionicons name="person-outline" size={24} color="#8B5CF6" />
            <Text style={styles.guestButtonText}>以訪客身份繼續</Text>
          </TouchableOpacity>
        </View>

        {/* 底部說明 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            登入即表示您同意我們的{' '}
            <Text style={styles.linkText}>服務條款</Text>
            {' '}和{' '}
            <Text style={styles.linkText}>隱私政策</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 12,
  },
  footer: {
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#8B5CF6',
    textDecorationLine: 'underline',
  },
});