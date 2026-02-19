import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { login, USE_SUPABASE_AUTH, loginWithSupabase, loginWithBackend, sendEmailOtp, verifyEmailOtp, saveBackendToken } from '@/lib/api';
import SliderCaptcha from '@/components/SliderCaptcha';
import { PageLoader } from '@/components/PageLoader';

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshUserInfo } = useAuth();
  const { t } = useLanguage();
  const [loginTab, setLoginTab] = useState<'account' | 'email'>('account');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '', code: '', key: '', email: '', emailCode: '' });
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [sliderKey, setSliderKey] = useState(() => Math.random().toString(36).slice(2));
  const [sliderVerified, setSliderVerified] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: 'error' | 'success'; message: string }>({ show: false, type: 'error', message: '' });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const secondImageRef = useRef<HTMLImageElement>(null);

  const resetSlider = useCallback(() => {
    setSliderKey(Math.random().toString(36).slice(2));
    setSliderVerified(false);
  }, []);

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const t = setInterval(() => setCodeCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [codeCountdown]);

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.show, toast.message]);

  const handleSendCode = async () => {
    const email = (formData.email || '').trim();
    if (!email) {
      setToast({ show: true, type: 'error', message: '请输入邮箱账户' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({ show: true, type: 'error', message: '请输入有效的邮箱地址' });
      return;
    }
    setToast(prev => ({ ...prev, show: false }));
    setLoading(true);
    try {
      await sendEmailOtp(email);
      setCodeCountdown(60);
      setToast({ show: true, type: 'success', message: '验证码已发送' });
    } catch (err: any) {
      const msg = err?.message || '';
      const friendly = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('rate_limit')
        ? '发送验证码过于频繁，请稍后再试'
        : (msg || '发送验证码失败');
      setToast({ show: true, type: 'error', message: friendly });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setToast(prev => ({ ...prev, show: false }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(prev => ({ ...prev, show: false }));

    if (loginTab === 'email') {
      if (!USE_SUPABASE_AUTH) {
        setToast({ show: true, type: 'error', message: '邮箱登录需开启 Supabase 认证' });
        return;
      }
      const email = (formData.email || '').trim();
      const code = (formData.emailCode || '').trim();
      if (!email) {
        setToast({ show: true, type: 'error', message: '请输入邮箱账户' });
        return;
      }
      if (!code) {
        setToast({ show: true, type: 'error', message: '请输入验证码' });
        return;
      }
      setLoading(true);
      try {
        const { access_token, user } = await verifyEmailOtp(email, code);
        sessionStorage.setItem('token', access_token);
        localStorage.setItem('token', access_token);
        const userData = {
          id: user.id,
          user_id: user.id,
          username: user.email?.split('@')[0] ?? user.id?.slice(0, 8),
          name: user.email ?? '',
          email: user.email,
          money: user.user_metadata?.money ?? user.user_metadata?.balance ?? 0,
          balance: user.user_metadata?.balance ?? user.user_metadata?.money ?? 0,
          ...user.user_metadata
        };
        localStorage.setItem('userInfo', JSON.stringify(userData));
        await refreshUserInfo(true);
        window.dispatchEvent(new Event('authStateChange'));
        setToast({ show: true, type: 'success', message: '登录成功' });
        setTimeout(() => { sessionStorage.setItem('hasVisited', 'false'); window.location.href = '/'; }, 800);
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err?.message || '验证码错误或已过期' });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!formData.name || !formData.password) {
      setToast({ show: true, type: 'error', message: t('enterAccountAndPassword') });
      return;
    }
    if (loginTab === 'account' && !sliderVerified) {
      setToast({ show: true, type: 'error', message: '请先完成滑块验证' });
      return;
    }

    setLoading(true);
    try {
      if (USE_SUPABASE_AUTH) {
        const { access_token, user } = await loginWithSupabase(formData.name.trim(), formData.password);
        sessionStorage.setItem('token', access_token);
        localStorage.setItem('token', access_token);
        // 同步获取后端 JWT，用于游戏接口（/api/v1/game/enter）鉴权
        try {
          const backendToken = await loginWithBackend(formData.name.trim(), formData.password);
          if (backendToken) saveBackendToken(backendToken);
        } catch { /* 静默忽略，不影响主登录流程 */ }
        const userData = {
          id: user.id,
          user_id: user.id,
          username: user.email?.split('@')[0] ?? user.id?.slice(0, 8),
          name: user.user_metadata?.nickname || user.user_metadata?.realname || user.email?.split('@')[0] || user.id,
          email: user.email,
          money: user.user_metadata?.money ?? user.user_metadata?.balance ?? 0,
          balance: user.user_metadata?.balance ?? user.user_metadata?.money ?? 0,
          ...user.user_metadata
        };
        localStorage.setItem('userInfo', JSON.stringify(userData));
        await refreshUserInfo(true);
        window.dispatchEvent(new Event('authStateChange'));
        setToast({ show: true, type: 'success', message: '登录成功' });
        setTimeout(() => { sessionStorage.setItem('hasVisited', 'false'); window.location.href = '/'; }, 800);
        return;
      }

      const res: any = await login(formData);
      // login() 已统一返回 {code:200, message, data:{token,...}} 格式
      const token: string = res?.data?.token || res?.data?.access_token || res?.data?.api_token || '';
      const isSuccess = res?.code === 200 && !!token;

      if (isSuccess) {
          // 保存主 token 和 backend_token（游戏接口使用 backend_token 优先）
          sessionStorage.setItem('token', token);
          localStorage.setItem('token', token);
          saveBackendToken(token);

          // 从响应中直接构建用户信息（避免再次网络请求）
          const d = res?.data ?? {};
          const userInfo = {
            id: d.id ?? d.user_id ?? '',
            user_id: d.id ?? d.user_id ?? '',
            username: d.username ?? formData.name,
            name: d.nickname ?? d.username ?? formData.name,
            nickname: d.nickname ?? d.username ?? formData.name,
            balance: Number(d.balance ?? d.money ?? 0),
            money: Number(d.money ?? d.balance ?? 0),
          };
          localStorage.setItem('userInfo', JSON.stringify(userInfo));

          await refreshUserInfo(true);
          window.dispatchEvent(new Event('authStateChange'));
          setToast({ show: true, type: 'success', message: '登录成功' });
          setTimeout(() => {
            sessionStorage.setItem('hasVisited', 'false');
            window.location.href = '/';
          }, 800);
      } else {
        const errorMsg = res?.message || t('loginFailed');
        setToast({ show: true, type: 'error', message: errorMsg });
        setFormData((prev) => ({ ...prev, code: '', key: '' }));
        setTimeout(() => resetSlider(), 300);
      }
    } catch (err: any) {
      let errorMsg = err?.response?.data?.message || err?.message || t('loginFailed');
      if (typeof errorMsg === 'string' && (
        errorMsg.includes('Permission denied') ||
        errorMsg.includes('could not be opened') ||
        errorMsg.includes('storage/logs') ||
        errorMsg.includes('failed to open stream')
      )) {
        errorMsg = '服务器配置异常（日志权限），请联系管理员处理';
      }
      setToast({ show: true, type: 'error', message: errorMsg });
      console.error('登录异常:', err);
      setFormData((prev) => ({ ...prev, code: '', key: '' }));
      setTimeout(() => resetSlider(), 300);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageLoader loading={loading} />
      <div style={{
        width: '100%',
        minHeight: '100vh',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
        background: '#151A23',
        position: 'relative',
        zIndex: 0
      }}>
      {/* 背景图片 - 随内容流排布，非全屏 */}
      <img
        src="/images/newimg/bg.avif"
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      {/* 第二张图片容器 - 用于定位标签栏 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1
      }}>
        <img
          ref={secondImageRef}
          src="https://www.xpj00000.vip/loginImg/header_bg.png"
          alt="背景"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            position: 'relative',
            zIndex: 1
          }}
        />
        
        {/* Tab 切换 - 固定在第二张图片中间缝隙区域 */}
        <div style={{
          position: 'absolute',
          top: '90%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px 0',
          lineHeight: 1,
          color: '#fff',
          zIndex: 5,
          pointerEvents: 'none'
        }}>
          <div style={{ 
            pointerEvents: 'auto', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '100%'
          }}>
            <div
              onClick={() => { setLoginTab('account'); setToast(prev => ({ ...prev, show: false })); }}
              style={{
                padding: '8px 20px',
                margin: '0 8px',
                fontSize: '18px',
                color: loginTab === 'account' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                position: 'relative',
                fontWeight: loginTab === 'account' ? 500 : 400
              }}
            >
              {t('accountLogin')}
              {loginTab === 'account' && (
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '200px',
                  height: '22px',
                  backgroundImage: 'url(/images/newimg/daaf2.avif)',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  zIndex: -1,
                  pointerEvents: 'none'
                }} />
              )}
            </div>
            <div
              onClick={() => navigate('/register')}
              style={{
                padding: '8px 20px',
                margin: '0 8px',
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                position: 'relative',
                fontWeight: 400
              }}
            >
              账号注册
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ marginTop: '360px', padding: '0 20px', position: 'relative', zIndex: 2 }}>

        {/* Toast 居中提示 */}
        {toast.show && (
          <div
            className="toast-container"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              zIndex: 9999,
              boxSizing: 'border-box',
              minWidth: '160px',
              maxWidth: '280px',
              padding: '16px 20px 20px',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              background: 'rgba(0,0,0,0.85)',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '100%', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <img src={toast.type === 'error' ? '/images/login/77.png' : '/images/login/66.png'} alt="" style={{ width: '44px', height: '35px', objectFit: 'contain' }} />
            </div>
            <p style={{ margin: 0, padding: '0 5px', fontSize: '14px', lineHeight: 1.5, textAlign: 'center' }}>
              {toast.message}
            </p>
          </div>
        )}

        {/* 表单 */}
        <div>
          {loginTab === 'email' ? (
            <>
              {/* 邮箱 */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', width: '100%', height: '50px',
                  paddingLeft: '12px', paddingRight: '16px', background: 'rgba(0, 0, 0, 0.45)',
                  border: focusedInput === 'email' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.08)',
                  borderRadius: '12px', transition: 'border-color 0.3s ease'
                }}>
                  <img src="/images/login/blo.png" alt="" style={{ width: '24px', height: '24px', marginRight: '12px', objectFit: 'contain' }} />
                  <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="推荐使用谷歌邮箱"
                    autoComplete="email"
                    style={{
                      flex: 1, height: '100%', fontSize: '16px', color: '#fff', background: 'transparent',
                      border: 0, outline: 0, caretColor: '#ffc53e'
                    }}
                  />
                </div>
              </div>
              {/* 验证码 */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', width: '100%', height: '50px',
                  paddingLeft: '12px', paddingRight: '8px', background: 'rgba(0, 0, 0, 0.45)',
                  border: focusedInput === 'emailCode' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.08)',
                  borderRadius: '12px', transition: 'border-color 0.3s ease'
                }}>
                  <input
                    type="text"
                    name="emailCode"
                    value={formData.emailCode}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('emailCode')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="请输入验证码"
                    maxLength={6}
                    style={{
                      flex: 1, height: '100%', fontSize: '16px', color: '#fff', background: 'transparent',
                      border: 0, outline: 0, caretColor: '#ffc53e'
                    }}
                  />
                  <button
                    type="button"
                    className="count-down"
                    onClick={handleSendCode}
                    disabled={loading || codeCountdown > 0 || !(formData.email || '').trim()}
                    style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      width: '96px', height: '36px', borderRadius: '8px',
                      background: (loading || codeCountdown > 0 || !(formData.email || '').trim()) ? 'rgba(199,218,255,0.05)' : '#ffc53e',
                      boxShadow: (loading || codeCountdown > 0 || !(formData.email || '').trim()) ? 'none' : 'inset 0 0 13px 0 rgba(255,46,0,.45), 0 0 10px 0 rgba(255,46,0,.25)',
                      color: (loading || codeCountdown > 0 || !(formData.email || '').trim()) ? 'hsla(0,0%,100%,.25)' : 'rgba(0,0,0,.85)',
                      fontWeight: 600, border: 'none', fontSize: '13px', cursor: (loading || codeCountdown > 0 || !(formData.email || '').trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {codeCountdown > 0 ? `${codeCountdown}秒` : '获取验证码'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {}}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ffc53e',
                      fontFamily: '"Source Han Sans SC", "Noto Sans SC", "PingFang SC", sans-serif',
                      fontSize: '15px',
                      padding: '4px 0',
                      cursor: 'pointer'
                    }}
                  >
                    无法获取验证码?
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
          {/* 用户名 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
              width: '100%',
              height: '50px',
              paddingLeft: '12px',
              paddingRight: '16px',
              background: 'rgba(0, 0, 0, 0.45098039215686275)',
              border: focusedInput === 'name' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
              borderRadius: '12px',
              position: 'relative',
              transition: 'border-color 0.3s ease'
            }}>
              <img src="https://www.xpj00000.vip/loginImg/account.png" style={{ width: '28px', flexShrink: 0, marginRight: '15px' }} alt="用户名" />
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                placeholder={t('enterAccount')}
                maxLength={50}
                style={{
                  flex: 1,
                  height: '100%',
                  fontSize: '16px',
                  color: focusedInput === 'name' ? 'hsla(0,0%,100%,.8509803921568627)' : '#fff',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  caretColor: '#ffc53e'
                }}
              />
            </div>
          </div>

          {/* 密码 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
              width: '100%',
              height: '50px',
              paddingLeft: '12px',
              paddingRight: '16px',
              background: 'rgba(0, 0, 0, 0.45098039215686275)',
              border: focusedInput === 'password' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
              borderRadius: '12px',
              position: 'relative',
              transition: 'border-color 0.3s ease'
            }}>
              <img src="https://www.xpj00000.vip/loginImg/password.png" style={{ width: '28px', flexShrink: 0, marginRight: '15px' }} alt="密码" />
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                placeholder={t('enterPassword')}
                maxLength={32}
                autoComplete="new-password"
                style={{
                  flex: 1,
                  height: '100%',
                  fontSize: '16px',
                  color: focusedInput === 'password' ? 'hsla(0,0%,100%,.8509803921568627)' : '#fff',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  caretColor: '#ffc53e'
                }}
              />
            </div>
          </div>

          {loginTab === 'account' && USE_SUPABASE_AUTH && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('/login/forgot')}
                style={{ background: 'none', border: 'none', color: '#ffc53e', fontSize: '14px', cursor: 'pointer', padding: 0 }}
              >
                忘记账号 / 密码?
              </button>
            </div>
          )}

          {/* 滑块验证码（纯前端验证，无需后端接口）*/}
          {loginTab === 'account' && (
            <div style={{ marginBottom: '12px', width: '100%' }}>
              <SliderCaptcha
                captchaKey={sliderKey}
                tip={t('slideToVerify') || '向右滑动完成验证'}
                successTip={t('verifySuccess') || '验证成功'}
                fullWidth
                onSuccess={() => setSliderVerified(true)}
                onRefresh={resetSlider}
              />
            </div>
          )}

          </>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            onClick={!loading ? handleLogin : undefined}
            disabled={loading}
            style={{
              WebkitTextSizeAdjust: 'none',
              textSizeAdjust: 'none',
              margin: '32px 0 0 0',
              padding: 0,
              boxSizing: 'border-box',
              fontFamily: 'PingFang SC',
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              width: '100%',
              height: '50px',
              borderRadius: '12px',
              background: '#ffc53e',
              boxShadow: 'inset 0 0 13px 0 rgba(255, 46, 0, 0.45098039215686275), 0 0 10px 0 rgba(255, 46, 0, 0.25098039215686274)',
              color: 'rgba(0, 0, 0, 0.8509803921568627)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.3s ease'
            }}
          >
            {loading ? t('loggingIn') : t('loginNow')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            还没有账户？
            <button type="button" onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: '#ffc53e', cursor: 'pointer', padding: '0 4px', fontSize: '14px', fontWeight: 500 }}>立即注册</button>
          </p>

          {/* 服务按钮组 */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '20px'
          }}>
            <div
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '200px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(199, 218, 255, 0.050980392156862744)',
                color: 'hsla(0, 0%, 100%, 0.8509803921568627)',
                fontSize: '16px',
                fontWeight: 400,
                cursor: 'pointer',
                gap: '8px'
              }}
            >
              <img
                src="/images/newimg/gg.avif"
                alt="tour"
                style={{ width: '20px', height: '20px' }}
              />
              {t('goShopping')}
            </div>
            <div
              onClick={() => navigate('/service')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '200px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(199, 218, 255, 0.050980392156862744)',
                color: 'hsla(0, 0%, 100%, 0.8509803921568627)',
                fontSize: '16px',
                fontWeight: 400,
                cursor: 'pointer',
                gap: '8px'
              }}
            >
              <img
                src="/images/newimg/kfsy.avif"
                alt="service"
                style={{ width: '20px', height: '20px' }}
              />
              {t('contactService')}
            </div>
          </div>
        </div>

        {/* 底部安全说明 */}
        <img
          src="https://www.xpj00000.vip/loginImg/ag-logo.webp"
          alt="安全加密说明"
          style={{
            display: 'block',
            width: '150px',
            maxWidth: '50%',
            margin: '30px auto 20px',
            height: 'auto'
          }}
        />
      </div>
    </div>
    </>
  );
}
