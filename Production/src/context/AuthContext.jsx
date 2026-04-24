import { createContext, useState, useEffect, useRef } from 'react';
import { authAPI, walletAPI } from '../utils/api'; // 👈 ต้องตรงกับชื่อที่ export ในไฟล์ api.js

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [profileUpdateTag, setProfileUpdateTag] = useState(Date.now());
  const isFetching = useRef(false);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    if (isFetching.current) return; // ป้องกัน double call
    isFetching.current = true;
    try {
      const data = await authAPI.getProfile(token);
      // Ensure we get the user object even if wrapped in { user: ... } or { data: ... }
      const userData = data.user || data.data || data;
      
      // Normalization: Ensure coinBalance is populated from alternative fields if missing
      let balance = Number(userData.coinBalance ?? userData.balance ?? userData.coins ?? 0);

      // 🔄 Global Fallback: If balance is 0, recalculate from transaction history
      // This fixes the issue where the backend profile doesn't include monetary stats
      if (balance === 0) {
        try {
          const txs = await walletAPI.getTransactions(token);
          if (txs && txs.length > 0) {
             balance = txs.reduce((acc, tx) => {
               const amt = Number(tx.amount) || 0;
               const isPositive = ['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type);
               const isNegative = ['PAY_JOB', 'WITHDRAW'].includes(tx.type);
               return isPositive ? acc + amt : (isNegative ? acc - amt : acc);
             }, 0);
          }
        } catch (e) {
            console.warn("Global balance recalculation failed:", e);
        }
      }
      
      userData.coinBalance = balance > 0 ? balance : 0;
      
      setUser(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
    } catch (error) {
      const status = error.response?.status;
      // 🕵️ Only logout if it's explicitly 401 (Unauthorized)
      if (status === 401) {
        console.warn('🔑 Session expired. Logging out...');
        logout();
      } else {
        // Network error, 500, or server restarting - DO NOT logout.
        // We keep the last known 'user' from localStorage if possible.
        console.warn('📡 Network/Server error during profile fetch:', error.message);
        
        const cachedUser = localStorage.getItem('userInfo');
        if (cachedUser && !user) {
           try {
             setUser(JSON.parse(cachedUser));
           } catch (e) {}
        }
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
      setProfileUpdateTag(Date.now());
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      if (data.token) {
        setToken(data.token);
        const userData = data.user;
        let balance = userData.coinBalance ?? userData.balance ?? userData.coins ?? 0;
        
        // 🔄 Global Fallback on Login
        if (balance === 0) {
            try {
              const { walletAPI } = await import('../utils/api.js');
              const txs = await walletAPI.getTransactions(data.token);
              if (txs && txs.length > 0) {
                 balance = txs.reduce((acc, tx) => {
                   const amt = Number(tx.amount) || 0;
                   const isPositive = ['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type);
                   const isNegative = ['PAY_JOB', 'WITHDRAW'].includes(tx.type);
                   return isPositive ? acc + amt : (isNegative ? acc - amt : acc);
                 }, 0);
              }
            } catch (e) {}
        }
        
        userData.coinBalance = balance > 0 ? balance : 0;
        setUser(userData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: 'Invalid server response' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Email หรือ Password ไม่ถูกต้อง' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userToken'); // 👈 เพิ่มการลบตัวนี้ด้วย
    localStorage.removeItem('userInfo');
  };

  const updateUser = (newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('userInfo', JSON.stringify(updated));
      return updated;
    });
    setProfileUpdateTag(Date.now());
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, fetchProfile, updateUser, profileUpdateTag, loading }}>
      {children}
    </AuthContext.Provider>
  );
};