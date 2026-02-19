import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInfoFromUser } from '@/lib/api/user';
import { getServiceUrl } from '@/lib/api/system';

interface PCHeaderProps {
  isLoggedIn: boolean;
  userInfo: any;
}

/**
 * PC端头部组件
 * 对应 k8_pc 的 Header.vue
 */
export default function PCHeader({ isLoggedIn, userInfo }: PCHeaderProps) {
  const navigate = useNavigate();
  const { refreshUserInfo } = useAuth();
  const [balance, setBalance] = useState<number>(0);

  // 刷新余额
  const refreshBalance = async () => {
    try {
      const res = await getUserInfoFromUser();
      if (res.code === 200 && res.data) {
        const newBalance = res.data.balance || res.data.money || 0;
        setBalance(newBalance);
        if (refreshUserInfo) {
          await refreshUserInfo();
        }
      }
    } catch (error) {
    }
  };

  // 定期刷新余额
  useEffect(() => {
    if (isLoggedIn) {
      refreshBalance();
      const interval = setInterval(() => {
        refreshBalance();
      }, 6300);

      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // 打开客服
  const openKefu = async () => {
    try {
      const res = await getServiceUrl();
      if (res.code === 200 && res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        alert(res.message || '获取客服链接失败');
      }
    } catch (error) {
      alert('打开客服失败，请稍后重试');
    }
  };

  return (
    <header
      style={{
        background: '#1a1a1a',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffcb4c' }}>
        九洲娱乐
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {isLoggedIn && userInfo ? (
          <>
            <div style={{ color: '#fff' }}>
              <span style={{ marginRight: '10px' }}>{userInfo.username || userInfo.name || '用户'}</span>
              <span style={{ color: '#ffcb4c' }}>¥{balance.toFixed(2)}</span>
            </div>
            <button
              onClick={() => navigate('/pc/accountSetting')}
              style={{
                padding: '8px 16px',
                background: '#ffcb4c',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              会员中心
            </button>
            <button
              onClick={openKefu}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #ffcb4c',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              客服
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #ffcb4c',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '8px 16px',
                background: '#ffcb4c',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              注册
            </button>
          </>
        )}
      </div>
    </header>
  );
}

