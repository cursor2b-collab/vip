import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getUserInfo, USE_SUPABASE_AUTH } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

interface UserInfo {
  username?: string;
  name?: string;
  balance?: number;
  money?: number;
  [key: string]: any;
}

interface AuthContextType {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  loading: boolean;
  refreshUserInfo: (forceRefresh?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserInfo = useCallback(async (forceRefresh = false) => {
    if (USE_SUPABASE_AUTH) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoggedIn(false);
        setUserInfo(null);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setLoading(false);
        return;
      }
      localStorage.setItem('token', session.access_token);
      sessionStorage.setItem('token', session.access_token);
      const res = await getUserInfo();
      if (res?.code === 200 && res?.data) {
        const userData: UserInfo = {
          ...res.data,
          username: res.data.username || res.data.name,
          balance: res.data.balance ?? res.data.money ?? 0,
          money: res.data.money ?? res.data.balance ?? 0
        };
        setUserInfo(userData);
        setIsLoggedIn(true);
        localStorage.setItem('userInfo', JSON.stringify(userData));
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      setUserInfo(null);
      setLoading(false);
      return;
    }

    // 获取缓存（用于 API 失败时保留登录状态）
    const getCachedUserData = (): UserInfo | null => {
      try {
        const raw = localStorage.getItem('userInfo');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    // 立即用缓存更新状态（登录后或页面刷新时快速显示已登录）
    if (!forceRefresh) {
      const cached = getCachedUserData();
      if (cached) {
        setUserInfo(cached);
        setIsLoggedIn(true);
        setLoading(false);
      }
    }

    try {
      let res: any = null;
      const res2 = await getUserInfo();
      if (res2 !== null && typeof res2 === 'object' && !Array.isArray(res2)) {
        res = res2;
      } else if (typeof res2 === 'string') {
        const str = res2.replace(/\{"lang":"zh_cn"\}/g, '').trim();
        if (str && (str.startsWith('{') || str.startsWith('['))) {
          try {
            res = JSON.parse(str);
          } catch (_) {
            console.warn('getUserInfo 返回的字符串解析失败，非 JSON 格式');
            const cached = getCachedUserData();
            if (cached) { setUserInfo(cached); setIsLoggedIn(true); }
            setLoading(false);
            return;
          }
        }
      }
      if (res == null) {
        const cached = getCachedUserData();
        if (cached) { setUserInfo(cached); setIsLoggedIn(true); }
        setLoading(false);
        return;
      }

      // status === 'error' 或 code !== 200：仅在明确 token 失效时清除，否则保留缓存状态
      if (res.status === 'error') {
        const msg = (res.message || '').toLowerCase();
        const isAuthError = /token|未授权|未登录|请登录|登录过期/i.test(msg);
        if (isAuthError) {
          setIsLoggedIn(false);
          setUserInfo(null);
        } else {
          const cached = getCachedUserData();
          if (cached) { setUserInfo(cached); setIsLoggedIn(true); }
        }
      } else if (res.code === 200 && res.data) {
        const balanceValue = res.data.money !== undefined && res.data.money !== null 
                            ? res.data.money 
                            : (res.data.balance !== undefined && res.data.balance !== null 
                               ? res.data.balance 
                               : 0);
        
        const userData: UserInfo = {
          ...res.data,
          username: res.data.username || res.data.name,
          balance: balanceValue,
          is_trans_on: res.data.is_trans_on !== undefined ? res.data.is_trans_on : userInfo?.is_trans_on
        };
        setUserInfo(userData);
        setIsLoggedIn(true);
        localStorage.setItem('userInfo', JSON.stringify(userData));
      } else {
        const cached = getCachedUserData();
        if (cached) { setUserInfo(cached); setIsLoggedIn(true); }
      }
    } catch (err) {
      console.error('❌ 获取用户信息异常:', err);
      const cached = getCachedUserData();
      if (cached) {
        setUserInfo(cached);
        setIsLoggedIn(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    const hadToken = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('backend_token');
    sessionStorage.removeItem('backend_token');
    localStorage.removeItem('userInfo');
    setIsLoggedIn(false);
    setUserInfo(null);
    if (USE_SUPABASE_AUTH && hadToken) {
      try {
        supabase.auth.signOut().catch(() => {});
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (USE_SUPABASE_AUTH) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          localStorage.setItem('token', session.access_token);
          sessionStorage.setItem('token', session.access_token);
          refreshUserInfo();
        } else {
          setIsLoggedIn(false);
          setUserInfo(null);
          setLoading(false);
        }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        try {
          if (!session?.access_token) {
            logout();
          } else {
            localStorage.setItem('token', session.access_token);
            sessionStorage.setItem('token', session.access_token);
            refreshUserInfo();
          }
        } catch (e) {
          console.warn('[Auth] onAuthStateChange 处理异常', e);
        }
      });
      return () => subscription.unsubscribe();
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      const cachedUserInfo = localStorage.getItem('userInfo');
      if (cachedUserInfo) {
        try {
          const userData = JSON.parse(cachedUserInfo);
          setUserInfo(userData);
          setIsLoggedIn(true);
          setLoading(false);
        } catch (e) {
          console.error('解析缓存的用户信息失败:', e);
          refreshUserInfo();
        }
      } else {
        refreshUserInfo();
      }
    } else {
      setIsLoggedIn(false);
      setUserInfo(null);
      setLoading(false);
    }
  }, [refreshUserInfo, logout]);

  // 监听storage变化，实现跨标签页同步
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          refreshUserInfo();
        } else {
          logout();
        }
      }
    };

    // 监听自定义事件，用于同标签页内通知
    const handleAuthChange = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const cachedUserInfo = localStorage.getItem('userInfo');
        if (cachedUserInfo) {
          try {
            const userData = JSON.parse(cachedUserInfo);
            setUserInfo(userData);
            setIsLoggedIn(true);
            setLoading(false);
          } catch (e) {
            console.error('解析缓存的用户信息失败:', e);
            setLoading(true);
            refreshUserInfo();
          }
        } else {
          setLoading(true);
          refreshUserInfo();
        }
      } else {
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChange', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, [refreshUserInfo, logout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userInfo, loading, refreshUserInfo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

