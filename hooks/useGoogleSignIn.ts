import { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { 
  GoogleAuthProvider, 
  signInWithCredential,
  AuthError
} from 'firebase/auth';
import { auth } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
};

interface GoogleSignInResult {
  success: boolean;
  error?: string;
}

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);

  // 您需要在Google Cloud Console中獲取這些配置
  const clientId = "your-google-client-id.apps.googleusercontent.com";

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'your-app-scheme',
      }),
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: 'offline',
      },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    try {
      setLoading(true);
      
      // 交換授權碼獲取access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: 'your-google-client-secret', // 注意：在生產環境中，這應該在後端完成
          code,
          grant_type: 'authorization_code',
          redirect_uri: AuthSession.makeRedirectUri({
            scheme: 'your-app-scheme',
          }),
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.access_token) {
        // 使用access token獲取用戶信息
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
        );
        const userInfo = await userInfoResponse.json();

        // 創建Firebase credential並登入
        const credential = GoogleAuthProvider.credential(tokens.id_token);
        await signInWithCredential(auth, credential);
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
    try {
      setLoading(true);
      
      if (!request) {
        throw new Error('Google sign in request not ready');
      }

      const result = await promptAsync();
      
      if (result.type !== 'success') {
        return { success: false, error: 'Sign in was cancelled or failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Google sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    } finally {
      // loading 會在 exchangeCodeForToken 中設置為 false
    }
  };

  return {
    signInWithGoogle,
    loading,
  };
}