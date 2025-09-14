import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { User } from 'firebase/auth';

export interface FirestoreUserCredits {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: any; // Firestore timestamp
  transactions: CreditTransaction[];
}

export interface CreditTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  timestamp: any; // Firestore timestamp
  productId?: string;
}

export class FirestoreCreditsService {
  /**
   * 獲取用戶在 Firestore 中的點數資料
   */
  static async getUserCredits(user: User): Promise<FirestoreUserCredits | null> {
    try {
      const userDoc = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        return docSnap.data() as FirestoreUserCredits;
      } else {
        // 如果用戶不存在，創建初始記錄
        const initialCredits: FirestoreUserCredits = {
          balance: 5, // 初始贈送點數
          totalEarned: 5,
          totalSpent: 0,
          lastUpdated: serverTimestamp(),
          transactions: [{
            id: `initial_${Date.now()}`,
            type: 'earn',
            amount: 5,
            description: '新用戶贈送點數',
            timestamp: serverTimestamp(),
          }]
        };
        
        await setDoc(userDoc, initialCredits);
        return initialCredits;
      }
    } catch (error) {
      console.error('Error getting user credits from Firestore:', error);
      return null;
    }
  }

  /**
   * 扣除點數（在 Firestore 中）
   */
  static async spendCredits(
    user: User, 
    amount: number, 
    description: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      const userDoc = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDoc);
      
      if (!docSnap.exists()) {
        return { success: false, error: '用戶資料不存在' };
      }
      
      const currentData = docSnap.data() as FirestoreUserCredits;
      
      if (currentData.balance < amount) {
        return { success: false, error: '點數不足' };
      }
      
      // 創建新的交易記錄
      const newTransaction: CreditTransaction = {
        id: `spend_${Date.now()}_${Math.random()}`,
        type: 'spend',
        amount,
        description,
        timestamp: serverTimestamp(),
      };
      
      // 更新點數和交易記錄
      const newBalance = currentData.balance - amount;
      const newTotalSpent = currentData.totalSpent + amount;
      
      await updateDoc(userDoc, {
        balance: newBalance,
        totalSpent: newTotalSpent,
        lastUpdated: serverTimestamp(),
        transactions: [...(currentData.transactions || []), newTransaction].slice(-100) // 保留最近100筆
      });
      
      return { success: true, newBalance };
    } catch (error) {
      console.error('Error spending credits in Firestore:', error);
      return { success: false, error: '扣點失敗' };
    }
  }

  /**
   * 增加點數（在 Firestore 中）
   */
  static async addCredits(
    user: User, 
    amount: number, 
    description: string, 
    productId?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      const userDoc = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDoc);
      
      if (!docSnap.exists()) {
        // 如果用戶不存在，先創建
        await this.getUserCredits(user);
      }
      
      // 創建新的交易記錄
      const newTransaction: CreditTransaction = {
        id: `earn_${Date.now()}_${Math.random()}`,
        type: 'earn',
        amount,
        description,
        timestamp: serverTimestamp(),
        productId,
      };
      
      // 使用 increment 來安全地增加點數
      await updateDoc(userDoc, {
        balance: increment(amount),
        totalEarned: increment(amount),
        lastUpdated: serverTimestamp(),
      });
      
      // 獲取更新後的數據來添加交易記錄
      const updatedDoc = await getDoc(userDoc);
      const updatedData = updatedDoc.data() as FirestoreUserCredits;
      
      await updateDoc(userDoc, {
        transactions: [...(updatedData.transactions || []), newTransaction].slice(-100)
      });
      
      return { success: true, newBalance: updatedData.balance };
    } catch (error) {
      console.error('Error adding credits in Firestore:', error);
      return { success: false, error: '加點失敗' };
    }
  }

  /**
   * 同步本地和 Firestore 的點數資料
   */
  static async syncCredits(user: User): Promise<FirestoreUserCredits | null> {
    try {
      return await this.getUserCredits(user);
    } catch (error) {
      console.error('Error syncing credits:', error);
      return null;
    }
  }

  /**
   * 獲取交易歷史
   */
  static async getTransactionHistory(user: User): Promise<CreditTransaction[]> {
    try {
      const userDoc = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreUserCredits;
        return data.transactions || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }
}