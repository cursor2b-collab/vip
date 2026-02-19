import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/** 注册成功页：展示用户名/密码、限时福利、进入首页（与截图一致） */
export default function RegisterSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [displayUsername, setDisplayUsername] = useState('');
  const [displayPassword, setDisplayPassword] = useState('');
  const [isEmailSignup, setIsEmailSignup] = useState(false);

  useEffect(() => {
    const state = location.state as { username?: string; password?: string; isEmail?: boolean } | null;
    if (state?.username != null) {
      setDisplayUsername(state.username);
      setDisplayPassword(state.password ?? '');
      setIsEmailSignup(!!state.isEmail);
      return;
    }
    const raw = localStorage.getItem('userInfo');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setDisplayUsername(u.username || u.name || u.email || '');
        setDisplayPassword(u._registerPassword ?? '');
        setIsEmailSignup(!!u._isEmailSignup);
      } catch (_) {}
    }
  }, [location.state]);

  const handleGoHome = () => {
    sessionStorage.setItem('hasVisited', 'false');
    navigate('/', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d1320 0%, #151a28 100%)',
        backgroundImage: 'url(/images/login/8028.png), linear-gradient(180deg, #0d1320 0%, #151a28 100%)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
        backgroundSize: '100% auto',
        color: '#fff',
        padding: '24px 20px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ textAlign: 'center', margin: '20px 0 8px' }}>
        <img src="/images/login/zc.png" alt="注册成功" style={{ maxWidth: '65%', height: 'auto', display: 'inline-block' }} />
      </div>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <img src="/images/login/111.png" alt="恭喜您获得「限时福利」" style={{ maxWidth: '100%', height: 'auto', display: 'inline-block' }} />
      </div>

      {/* 首存福利 + 立即存款 - 背景卡片 */}
      <div
        style={{
          backgroundImage: 'url(/images/gaming/55.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '100% 100%',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}
      >
        <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden' }}>
          <img src="/images/login/sc.png" alt="首存即送" style={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'middle' }} />
        </div>
        <button
          type="button"
          onClick={() => navigate('/deposit')}
          style={{
            width: '100%',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'block'
          }}
        >
          <img src="/images/gaming/image(7).png" alt="立即存款" style={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'middle' }} />
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
        存款每满500即送1次博饼机会
      </p>

      {/* 账户信息 */}
      <div
        style={{
          background: 'rgba(0,0,0,0.35)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>用户名</span>
          <div style={{ color: '#fff', fontSize: '16px', marginTop: '4px' }}>{displayUsername || '-'}</div>
        </div>
        <div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>密码</span>
          <div style={{ color: '#fff', fontSize: '16px', marginTop: '4px' }}>
            {isEmailSignup ? '使用验证码登录' : (displayPassword ? '••••••••' : '-')}
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>
          温馨提示：您可截图保存用户名和密码
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoHome}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffc53e',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          width: '100%',
          padding: '12px'
        }}
      >
        进入首页
        <span style={{ fontSize: '18px' }}>›</span>
      </button>
    </div>
  );
}
