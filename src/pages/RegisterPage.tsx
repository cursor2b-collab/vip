import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { register, getSystemConfig, getLanguages, USE_SUPABASE_AUTH, registerWithSupabase, sendEmailOtp, verifyEmailOtp, saveBackendToken } from '@/lib/api';
import SliderCaptcha from '@/components/SliderCaptcha';
import { translations, LanguageCode } from '@/i18n/translations';
import { PageLoader } from '@/components/PageLoader';

interface LanguageOption {
  value: string;
  label: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUserInfo } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  // 非 Supabase 模式下强制使用账号注册（后端不支持邮箱 OTP）
  const [registerTab, setRegisterTab] = useState<'email' | 'account'>(USE_SUPABASE_AUTH ? 'email' : 'account');
  const [formData, setFormData] = useState({
    name: '', password: '', confirmPass: '', realname: '', paypassword: '', lang: '', code: '', key: '', inviteCode: '',
    email: '', emailCode: ''
  });
  const [codeSent, setCodeSent] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [sliderKey, setSliderKey] = useState(() => Math.random().toString(36).slice(2));
  const [sliderVerified, setSliderVerified] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ show: boolean; type: 'error' | 'success'; message: string }>({ show: false, type: 'error', message: '' });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const secondImageRef = useRef<HTMLImageElement>(null);

  const languageWrapperRef = useRef<HTMLDivElement>(null);

  const [isInviteCodeRequired, setIsInviteCodeRequired] = useState('');
  const [inviteCodeExpanded, setInviteCodeExpanded] = useState(false);


  function getUrlParams() {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      id: searchParams.get('i')
    };
  }


  // 获取系统配置并设置邀请码是否必填；始终从 URL ?i= 读取邀请码（代理链接）
  useEffect(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlInviteCode = searchParams.get('i') || '';
      if (urlInviteCode) {
        setFormData((prev) => ({ ...prev, inviteCode: urlInviteCode }));
      }
      const fetchSiteName = async () => {
        try {
          const res = await getSystemConfig('register');
          if (res.code === 200 && res.data) {
            let val = res.data.isInviteCodeRequired_mobile;
            if (val === undefined && res.data.register_setting_json) {
              try {
                const setting = JSON.parse(res.data.register_setting_json);
                val = setting?.isInviteCodeRequired_mobile;
              } catch (_) {}
            }
            setIsInviteCodeRequired(val === '1' || val === true ? '1' : '');
            if (urlInviteCode) {
              setFormData((prev) => ({ ...prev, inviteCode: urlInviteCode }));
            }
          }
        } catch (error) {
          console.error('❌ 获取网站名称失败:', error);
        }
      };
      fetchSiteName();
    }, []);

  const refreshSliderCaptcha = useCallback(() => {
    setSliderKey(Math.random().toString(36).slice(2));
    setSliderVerified(false);
  }, []);

interface Language {
  code: LanguageCode;
  nameKey: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'zh_cn', nameKey: 'langChina', flag: '🇨🇳' },
  { code: 'ja', nameKey: 'langJapan', flag: '🇯🇵' },
  { code: 'id', nameKey: 'langIndonesia', flag: '🇮🇩' },
  { code: 'vi', nameKey: 'langVietnam', flag: '🇻🇳' },
  { code: 'th', nameKey: 'langThailand', flag: '🇹🇭' },
  { code: 'zh_hk', nameKey: 'langHongKong', flag: '🇭🇰' },
];


  const fetchLanguages = useCallback(async () => {
    try {
      const res = await getLanguages();
      console.log('📋 获取语言/币种列表响应:', res);
      
      if (res.code === 200 && res.data) {
        const list = res.data.list || {};
        const langArray = Object.entries(list).map(([value, label]) => ({ value, label: String(label) }));
        setLanguages(langArray);
        
        // 使用API返回的第一个可用语言作为默认值
        // 或者优先使用'zh_cn'（如果存在）
        const defaultLang = langArray.find(l => l.value === 'zh_cn')?.value || 
                           (langArray.length > 0 ? langArray[0].value : 'zh_cn');
        
        console.log('✅ 设置默认语言:', defaultLang, '可用列表:', langArray.map(l => l.value));
        setFormData((prev) => ({ ...prev, lang: defaultLang }));
      } else {
        // 如果API返回失败，使用默认值
        console.warn('⚠️ 获取语言列表失败，使用默认值 zh_cn');
        setFormData((prev) => ({ ...prev, lang: 'zh_cn' }));
      }
    } catch (err) {
      console.error('❌ 获取币种列表异常:', err);
      // 即使获取失败，也设置默认值为人民币
      setFormData((prev) => ({ ...prev, lang: 'zh_cn' }));
    }
  }, []);


  // 点击外部关闭下拉菜单
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          languageWrapperRef.current &&
          !languageWrapperRef.current.contains(event.target as Node)
        ) {
          setShowLanguageMenu(false);
        }
      };
  
      if (showLanguageMenu) {
        document.addEventListener('mousedown', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showLanguageMenu]);
    
    const currentLang = languages.find(lang => lang.code === language) || languages[0];
    
    const handleLanguageSelect = (code: LanguageCode) => {
      setShowLanguageMenu(false);
      setLanguage(code);
    };



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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setToast(prev => ({ ...prev, show: false }));
  };

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
      setCodeSent(true);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(prev => ({ ...prev, show: false }));

    if (registerTab === 'email') {
      if (!USE_SUPABASE_AUTH) {
        setToast({ show: true, type: 'error', message: '邮箱注册需开启 Supabase 认证' });
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
        const inviteCode = (formData.inviteCode || new URLSearchParams(window.location.search).get('i') || '').trim();
        if (user?.id && inviteCode) {
          const { supabase } = await import('@/lib/supabase');
          await supabase.rpc('complete_invite_registration', {
            p_user_id: user.id,
            p_invite_code: inviteCode
          });
        }
        sessionStorage.setItem('token', access_token);
        localStorage.setItem('token', access_token);
        const userData = {
          id: user.id,
          user_id: user.id,
          username: user.email?.split('@')[0] ?? user.id?.slice(0, 8),
          name: user.email ?? '',
          email: user.email,
          money: 0,
          balance: 0,
          _isEmailSignup: true,
          ...user.user_metadata
        };
        localStorage.setItem('userInfo', JSON.stringify(userData));
        await refreshUserInfo(true);
        window.dispatchEvent(new Event('authStateChange'));
        navigate('/register/success', { state: { username: email, password: '', isEmail: true }, replace: true });
        return;
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err?.message || '验证码错误或已过期' });
        setLoading(false);
        return;
      }
    }

    if (!formData.name || !formData.password) {
      setToast({ show: true, type: 'error', message: t('fillAllRequired') });
      return;
    }
    if (!sliderVerified) {
      setToast({ show: true, type: 'error', message: '请先完成滑块验证' });
      return;
    }
    if (!USE_SUPABASE_AUTH && formData.confirmPass && formData.password !== formData.confirmPass) {
      setToast({ show: true, type: 'error', message: t('passwordMismatchRegister') });
      return;
    }
    if (!USE_SUPABASE_AUTH && isInviteCodeRequired === '1' && !formData.inviteCode) {
      setToast({ show: true, type: 'error', message: t('inviteCode') + ' ' + t('isRequired') });
      return;
    }

    setLoading(true);
    try {
      if (USE_SUPABASE_AUTH) {
        const realname = (formData.realname || formData.name || '').trim() || undefined;
        const urlCode = new URLSearchParams(window.location.search).get('i') || '';
        const inviteCode = (formData.inviteCode || urlCode || '').trim() || undefined;
        const { access_token, user } = await registerWithSupabase(
          formData.name.trim(),
          formData.password,
          { realname, inviteCode }
        );
        sessionStorage.setItem('token', access_token);
        localStorage.setItem('token', access_token);
        // 同步注册到后端 MySQL + 获取后端 JWT，用于游戏接口鉴权
        try {
          const backendToken = await syncBackendAccount(formData.name.trim(), formData.password);
          if (backendToken) saveBackendToken(backendToken);
        } catch { /* 静默忽略 */ }
        const username = user.email?.split('@')[0] ?? user.id?.slice(0, 8);
        const userData = {
          id: user.id,
          user_id: user.id,
          username,
          name: user.user_metadata?.nickname || user.user_metadata?.realname || username,
          email: user.email,
          money: 0,
          balance: 0,
          ...user.user_metadata
        };
        localStorage.setItem('userInfo', JSON.stringify(userData));
        await refreshUserInfo(true);
        window.dispatchEvent(new Event('authStateChange'));
        navigate('/register/success', { state: { username, password: formData.password, isEmail: false }, replace: true });
        return;
      }

    const res = await register(formData);
      // register() 已统一返回 {code:200, message, data:{token, username, ...}} 格式
      if (res.code === 200) {
        const token: string = res.data?.token || res.data?.access_token || res.data?.api_token || '';
        if (token) {
          sessionStorage.setItem('token', token);
          localStorage.setItem('token', token);
          saveBackendToken(token);  // 游戏接口专用 token
          const d = res.data ?? {};
          const savedUsername = d.username || formData.name;
          const userData = {
            id: d.id ?? d.user_id ?? '',
            user_id: d.id ?? d.user_id ?? '',
            username: savedUsername,
            name: d.nickname ?? savedUsername,
            nickname: d.nickname ?? savedUsername,
            balance: 0,
            money: 0,
          };
          localStorage.setItem('userInfo', JSON.stringify(userData));
          await refreshUserInfo(true);
          window.dispatchEvent(new Event('authStateChange'));
          navigate('/register/success', { state: { username: savedUsername, password: formData.password, isEmail: false }, replace: true });
        } else {
          // token 为空但 code=200，直接跳转登录
          setToast({ show: true, type: 'success', message: '注册成功，请登录' });
          setTimeout(() => navigate('/login'), 1000);
        }
      } else {
        setToast({ show: true, type: 'error', message: res.message || t('registerFailed') });
        setFormData((prev) => ({ ...prev, code: '' }));
        refreshSliderCaptcha();
      }
    } catch (err: any) {
      let errorMessage = t('registerFailed');
      if (err?.errors) {
        const firstError = Object.values(err.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] as string : firstError as string;
      } else if (err?.message) {
        const msg = err.message;
        if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('rate_limit')) {
          errorMessage = '注册请求过于频繁，请稍后再试。管理员可在 Supabase 控制台关闭「确认邮件」以避免此限制。';
        } else {
          errorMessage = msg;
        }
      }
      setToast({ show: true, type: 'error', message: errorMessage });
      setFormData((prev) => ({ ...prev, code: '' }));
      refreshSliderCaptcha();
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
      {/* 语言切换按钮 - 右上角 */}
      <div style={{
        position: 'fixed',
        top: '15px',
        right: '15px',
        zIndex: 1000
      }}>

        <div
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 12px',
            cursor: 'pointer',
            width: 'fit-content'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block' }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>

        {/* <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>{translations[language]?.langChina || '中文'}</span>
          <span>▼</span>
        </button> */}

      {/* 语言选择抽屉 */}
        
          {showLanguageMenu && (
        <>
          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}</style>
          {/* 遮罩层 */}
          <div
            onClick={() => setShowLanguageMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9998,
              animation: 'fadeIn 0.3s ease'
            }}
          />
          {/* 抽屉内容 */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#000',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              zIndex: 9999,
              maxHeight: '80vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s ease',
              transform: 'translateY(0)'
            }}
          >
            {/* 头部 */}
            <div style={{
              background: '#000',
              padding: '20px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>
                {t('footerLanguage')}
              </h2>
              <button
                onClick={() => setShowLanguageMenu(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: 0,
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* 语言列表 */}
            <div style={{ padding: '10px 20px 20px 20px' }}>
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '16px',
                    background: language === lang.code ? 'rgba(255, 197, 62, 0.15)' : 'transparent',
                    borderRadius: '8px',
                    marginBottom: '2px',
                    transition: 'background 0.2s',
                    border: language === lang.code ? '1px solid rgba(255, 197, 62, 0.3)' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (language !== lang.code) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language !== lang.code) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '24px', lineHeight: 1 }}>{lang.flag}</span>
                    <div>
                      <div style={{ color: '#fff', fontSize: '16px', fontWeight: language === lang.code ? '600' : '400' }}>
                        {t(lang.nameKey)}
                      </div>
                      <div style={{ color: '#999', fontSize: '12px', marginTop: '2px' }}>
                        {lang.code.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {language === lang.code && (
                    <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      </div>
      
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
              onClick={() => navigate('/login')}
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
              账号登录
            </div>
            <div
              onClick={() => { setRegisterTab('account'); setToast(prev => ({ ...prev, show: false })); }}
              style={{
                padding: '8px 20px',
                margin: '0 8px',
                fontSize: '18px',
                color: registerTab === 'account' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                position: 'relative',
                fontWeight: registerTab === 'account' ? 500 : 400
              }}
            >
              账号注册
              {registerTab === 'account' && (
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
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ marginTop: '330px', padding: '0 20px', position: 'relative', zIndex: 10 }}>

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

        <div>
          {registerTab === 'email' ? (
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', fontSize: '12px', color: '#48b989' }}>
                  <img src="/images/pay/usdt.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  支持USDT存取款
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
              {/* 推荐码 - 默认收起，点击展开 */}
              <div style={{ marginBottom: '12px' }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setInviteCodeExpanded((v) => !v)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setInviteCodeExpanded((v) => !v); }}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%', height: '50px',
                    paddingLeft: '12px', paddingRight: '16px', background: 'transparent',
                    border: 'none', outline: 'none', boxShadow: 'none',
                    borderRadius: '12px', cursor: 'pointer'
                  }}
                >
                  <img src="/images/newimg/71c4f1.avif" alt="" style={{ width: '22px', height: '24px', marginRight: '8px', objectFit: 'contain' }} />
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginRight: '8px' }}>推荐码</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{inviteCodeExpanded ? '▲' : '▼'}</span>
                </div>
                {inviteCodeExpanded && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      name="inviteCode"
                      value={formData.inviteCode}
                      onChange={handleChange}
                      onFocus={() => setFocusedInput('inviteCode')}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="请输入推荐码(可选)"
                      style={{
                        width: '100%', height: '50px', paddingLeft: '12px', paddingRight: '16px',
                        background: 'rgba(0, 0, 0, 0.45)', border: focusedInput === 'inviteCode' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.08)',
                        borderRadius: '12px', fontSize: '16px', color: '#fff', outline: 0, caretColor: '#ffc53e', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
          {/* 账号 - login-input 样式与参考一致 */}
          <div style={{ marginBottom: '12px' }}>
            <div
              className="login-input"
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'row',
                width: '100%',
                height: '50px',
                paddingLeft: '12px',
                paddingRight: '16px',
                background: 'rgba(0, 0, 0, 0.4509803922)',
                border: focusedInput === 'name' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725)',
                borderRadius: '12px',
                position: 'relative',
                transition: 'border-color 0.3s ease'
              }}
            >
              <div className="icon" style={{ flexShrink: 0, marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <img src="https://www.xpj00000.vip/loginImg/account.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} alt="账号" />
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                placeholder="请输入B开头6-11位数字或字母账号"
                maxLength={11}
                autoComplete="off"
                className="input loginName"
                style={{
                  flex: 1,
                  height: '100%',
                  minWidth: 0,
                  fontSize: '16px',
                  color: '#fff',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  caretColor: '#ffc53e'
                }}
              />
            </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', fontSize: '12px', color: '#48b989' }}>
                  <img src="/images/pay/usdt.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  支持USDT存取款
                </div>
          </div>

          {/* 密码 - login-input 样式与参考一致 */}
          <div style={{ marginBottom: '12px' }}>
            <div
              className="login-input"
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'row',
                width: '100%',
                height: '50px',
                paddingLeft: '12px',
                paddingRight: '16px',
                background: 'rgba(0, 0, 0, 0.4509803922)',
                border: focusedInput === 'password' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725)',
                borderRadius: '12px',
                position: 'relative',
                transition: 'border-color 0.3s ease'
              }}
            >
              <div className="icon" style={{ flexShrink: 0, marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <img src="https://www.xpj00000.vip/loginImg/password.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} alt="密码" />
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                placeholder={registerTab === 'account' ? '请输入登录密码' : t('enterPassword')}
                maxLength={32}
                autoComplete="new-password"
                className="input"
                style={{
                  flex: 1,
                  height: '100%',
                  minWidth: 0,
                  fontSize: '16px',
                  color: '#fff',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  caretColor: '#ffc53e'
                }}
              />
            </div>
          </div>

          {/* 确认密码 - 账号注册且 Supabase 时不显示，login-input 样式 */}
          {(!USE_SUPABASE_AUTH || registerTab !== 'account') && (
          <div style={{ marginBottom: '12px' }}>
            <div
              className="login-input"
              style={{
                display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row',
                width: '100%', height: '50px', paddingLeft: '12px', paddingRight: '16px',
                background: 'rgba(0, 0, 0, 0.4509803922)', border: focusedInput === 'confirmPass' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725)',
                borderRadius: '12px', position: 'relative', transition: 'border-color 0.3s ease'
              }}
            >
              <div className="icon" style={{ flexShrink: 0, marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <img src="https://www.xpj00000.vip/loginImg/password.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} alt="确认密码" />
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="password"
                name="confirmPass"
                value={formData.confirmPass}
                onChange={handleChange}
                onFocus={() => setFocusedInput('confirmPass')}
                onBlur={() => setFocusedInput(null)}
                placeholder={t('enterPasswordAgain')}
                maxLength={32}
                autoComplete="new-password"
                style={{
                  flex: 1,
                  height: '100%',
                  fontSize: '16px',
                  color: focusedInput === 'confirmPass' ? 'hsla(0,0%,100%,.8509803921568627)' : '#fff',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  caretColor: '#ffc53e'
                }}
              />
            </div>
          </div>
          )}

          {/* 真实姓名 - 已隐藏，注册时自动生成默认值 */}
          <div style={{ display: 'none' }}>
            <input
              type="text"
              name="realname"
              value={formData.realname}
              onChange={handleChange}
              placeholder="请输入真实姓名"
              maxLength={32}
            />
          </div>

          {/* 币种选择 - 已隐藏，默认选择人民币 */}
          <div style={{ display: 'none' }}>
            <select
              name="lang"
              value={formData.lang}
              onChange={handleChange}
              title="选择币种"
            >
              <option value="zh_cn">人民币</option>
            </select>
          </div>

          {/* 取款密码 - 账号注册且 Supabase 时不显示，login-input 样式 */}
          {(!USE_SUPABASE_AUTH || registerTab !== 'account') && (
          <div style={{ marginBottom: '12px' }}>
            <div
              className="login-input"
              style={{
                display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row',
                width: '100%', height: '50px', paddingLeft: '12px', paddingRight: '16px',
                background: 'rgba(0, 0, 0, 0.4509803922)', border: focusedInput === 'paypassword' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725)',
                borderRadius: '12px', position: 'relative', transition: 'border-color 0.3s ease'
              }}
            >
              <div className="icon" style={{ flexShrink: 0, marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <img src="https://www.xpj00000.vip/loginImg/password.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} alt="取款密码" />
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="password"
                name="paypassword"
                value={formData.paypassword}
                onChange={handleChange}
                onFocus={() => setFocusedInput('paypassword')}
                onBlur={() => setFocusedInput(null)}
                placeholder={t('enterWithdrawPassword6')}
                maxLength={6}
                style={{
                  flex: 1, height: '100%', minWidth: 0, fontSize: '16px', color: '#fff',
                  background: 'transparent', border: 0, outline: 0, caretColor: '#ffc53e'
                }}
              />
            </div>
          </div>
          )}

          {/* 邀请码 - 账号注册也显示（代理链接 ?i= 会预填） */}
          {true && (
          <div style={{ marginBottom: '12px' }}>
            <div
              className="login-input"
              style={{
                display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row',
                width: '100%', height: '50px', paddingLeft: '12px', paddingRight: '16px',
                background: 'rgba(0, 0, 0, 0.4509803922)', border: focusedInput === 'inviteCode' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725)',
                borderRadius: '12px', position: 'relative', transition: 'border-color 0.3s ease'
              }}
            >
              <div className="icon" style={{ flexShrink: 0, marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <img src="https://www.xpj00000.vip/loginImg/password.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} alt="邀请码" />
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                onFocus={() => setFocusedInput('inviteCode')}
                onBlur={() => setFocusedInput(null)}
                placeholder={isInviteCodeRequired === '1' ? t('inviteCode') + ' *' : t('inviteCode') + ' (' + t('optional') + ')'}
                style={{
                  flex: 1, height: '100%', minWidth: 0, fontSize: '16px', color: '#fff',
                  background: 'transparent', border: 0, outline: 0, caretColor: '#ffc53e'
                }}
              />
            </div>
          </div>
          )}

          {/* 滑块验证码（纯前端验证，无需后端接口）*/}
          <div style={{ marginBottom: '12px', width: '100%' }}>
            <SliderCaptcha
              captchaKey={sliderKey}
              tip={t('slideToVerify') || '向右滑动完成验证'}
              successTip={t('verifySuccess') || '验证成功'}
              fullWidth
              onSuccess={() => setSliderVerified(true)}
              onRefresh={refreshSliderCaptcha}
            />
          </div>

          </>
          )}

          {/* 创建账户按钮 - 邮箱注册/账号注册共用 */}
          <button
            type="submit"
            onClick={!loading ? handleRegister : undefined}
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
            {loading ? (registerTab === 'email' ? '验证中...' : t('registering')) : '创建账户'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            已有凯发账户?
            <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#ffc53e', cursor: 'pointer', padding: '0 4px', fontSize: '14px' }}>立即登录</button>
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
                width: '166px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(199, 218, 255, 0.050980392156862744)',
                color: 'hsla(0, 0%, 100%, 0.8509803921568627)',
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
                gap: '8px'
              }}
            >
              <img
                src="https://ik.imagekit.io/gpbvknoim/gg.avif"
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
                width: '166px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(199, 218, 255, 0.050980392156862744)',
                color: 'hsla(0, 0%, 100%, 0.8509803921568627)',
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
                gap: '8px'
              }}
            >
              <img
                src="https://ik.imagekit.io/gpbvknoim/kfsy.avif"
                alt="service"
                style={{ width: '20px', height: '20px' }}
              />
              {t('contactService')}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
