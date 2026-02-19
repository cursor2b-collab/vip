import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { register, getCaptcha, getLanguages, getUserInfo } from '@/lib/api';
import { translations, LanguageCode } from '@/i18n/translations';

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
  const [formData, setFormData] = useState({
    name: '', password: '', confirmPass: '', realname: '', paypassword: '', lang: '', code: '', key: ''
  });
  const [captchaImage, setCaptchaImage] = useState('');
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const secondImageRef = useRef<HTMLImageElement>(null);

  const refreshCaptcha = useCallback(async () => {
    try {
      const res = await getCaptcha();
      if (res.code === 200 && res.data) {
        const img = res.data.img || res.data.image || '';
        setCaptchaImage(img.startsWith('data:') ? img : 'data:image/png;base64,' + img);
        setFormData((prev) => ({ ...prev, key: res.data.key || res.data.captcha_key || '' }));
      }
    } catch (err) {
      console.error('获取验证码失败', err);
    }
  }, []);

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

  useEffect(() => {
    refreshCaptcha();
    fetchLanguages();
  }, [refreshCaptcha, fetchLanguages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.password || !formData.confirmPass || !formData.paypassword) {
      setError(t('fillAllRequired'));
      return;
    }
    if (formData.password !== formData.confirmPass) {
      setError(t('passwordMismatchRegister'));
      return;
    }
    if (!formData.lang) {
      setError(t('selectCurrency'));
      return;
    }
    if (!formData.code) {
      setError(t('enterCodeError'));
      return;
    }

    // 自动生成默认姓名（从用户1、用户2、用户3中随机选择）
    const defaultNames = ['用户1', '用户2', '用户3'];
    const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)];
    
    // 确保lang值是从API获取的语言列表中的有效值
    const validLang = languages.length > 0 && languages.find(l => l.value === formData.lang) 
      ? formData.lang 
      : (languages.length > 0 ? languages[0].value : 'zh_cn');
    
    const registerData = {
      ...formData,
      realname: randomName,
      lang: validLang // 确保使用有效的lang值
    };
    
    console.log('📝 注册数据准备:', {
      ...registerData,
      password: '***',
      confirmPass: '***',
      paypassword: '***'
    });

    setLoading(true);
    try {
      const res = await register(registerData);
      console.log('📝 注册接口完整返回:', JSON.stringify(res, null, 2));
      
      if (res.code === 200) {
        // 响应拦截器已经返回了response.data，所以res就是响应体
        // 尝试多种可能的token位置
        const token = res.data?.api_token || 
                     res.data?.access_token || 
                     res.data?.token ||
                     (res.data && typeof res.data === 'string' ? res.data : null) ||
                     res.api_token ||
                     res.access_token ||
                     res.token;
        
        console.log('🔑 提取的token:', token ? '存在' : '不存在');
        console.log('📦 res结构:', {
          code: res.code,
          message: res.message,
          hasData: !!res.data,
          dataType: typeof res.data,
          dataKeys: res.data && typeof res.data === 'object' ? Object.keys(res.data) : 'N/A'
        });
        
        if (token) {
          // 保存token（参考Vue实现）
          sessionStorage.setItem('token', token);
          localStorage.setItem('token', token);
          
          // 获取用户信息并保存（参考Vue的getUserInfo实现）
          try {
            const userRes = await getUserInfo();
            if (userRes.code === 200 && userRes.data) {
              const userData = {
                ...userRes.data,
                username: userRes.data.username || userRes.data.name,
                balance: userRes.data.balance || userRes.data.money || 0
              };
              localStorage.setItem('userInfo', JSON.stringify(userData));
            }
          } catch (userErr) {
            console.error('获取用户信息失败:', userErr);
          }
          
          // 刷新AuthContext状态（参考Vue的changToken和getUserInfo）
          await refreshUserInfo();
          
          // 触发自定义事件，通知AuthContext更新状态
          window.dispatchEvent(new Event('authStateChange'));
          
          // 延迟1秒后跳转（参考Vue的setTimeout 1000ms）
          setTimeout(() => {
            // 使用window.location.href强制刷新页面，确保状态更新
            window.location.href = '/';
          }, 1000);
        } else {
          console.error('❌ 注册成功但未找到token，完整响应:', res);
          // 即使没有token，也尝试跳转，可能后端返回格式不同
          alert(t('registerSuccess'));
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } else {
        setError(res.message || t('registerFailed'));
        setFormData((prev) => ({ ...prev, code: '' }));
        refreshCaptcha();
      }
    } catch (err: any) {
      let errorMessage = t('registerFailed');
      if (err?.errors) {
        const firstError = Object.values(err.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] as string : firstError as string;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setFormData((prev) => ({ ...prev, code: '' }));
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      overflow: 'auto',
      background: '#151A23',
      position: 'relative',
      zIndex: 0
    }}>
      {/* 背景图片 */}
      <img
        src="https://www.xpj00000.vip/loginImg/87bc66971059d160dc4cd5c29f4a44c4.png"
        alt="背景"
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
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            minWidth: '120px'
          }}>
            {(['zh_cn', 'ja', 'id', 'vi', 'th', 'zh_hk'] as LanguageCode[]).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setShowLanguageMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: language === lang ? 'rgba(255, 197, 62, 0.2)' : 'transparent',
                  border: 'none',
                  color: language === lang ? '#ffc53e' : '#fff',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                {translations[lang]?.langChina || lang}
              </button>
            ))}
          </div>
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
            <div onClick={() => navigate('/login')} style={{
              padding: '8px 20px',
              margin: '0 8px',
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer'
            }}>
              {t('accountLogin')}
            </div>
            <div style={{
              padding: '8px 20px',
              margin: '0 8px',
              fontSize: '18px',
              color: '#fff',
              cursor: 'pointer',
              position: 'relative',
              fontWeight: 500
            }}>
              {t('accountRegister')}
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
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ marginTop: '360px', padding: '0 20px', position: 'relative', zIndex: 10 }}>

        {/* 表单 */}
        <div>
          {error && (
            <div style={{
              marginBottom: '15px',
              padding: '10px',
              background: 'rgba(217, 28, 28, 0.1)',
              border: '1px solid rgba(217, 28, 28, 0.3)',
              borderRadius: '4px',
              color: '#d91c1c',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* 账号 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
              width: '100%',
              height: '44px',
              paddingLeft: '12px',
              paddingRight: '16px',
              background: 'rgba(0, 0, 0, 0.45098039215686275)',
              border: focusedInput === 'name' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
              borderRadius: '12px',
              position: 'relative',
              transition: 'border-color 0.3s ease'
            }}>
              <img src="https://www.xpj00000.vip/loginImg/account.png" style={{ width: '28px', flexShrink: 0, marginRight: '15px' }} alt="账号" />
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                placeholder={t('enterAccount')}
                maxLength={19}
                autoComplete="username"
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
              height: '44px',
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

          {/* 确认密码 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
              width: '100%',
              height: '44px',
              paddingLeft: '12px',
              paddingRight: '16px',
              background: 'rgba(0, 0, 0, 0.45098039215686275)',
              border: focusedInput === 'confirmPass' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
              borderRadius: '12px',
              position: 'relative',
              transition: 'border-color 0.3s ease'
            }}>
              <img src="https://www.xpj00000.vip/loginImg/password.png" style={{ width: '28px', flexShrink: 0, marginRight: '15px' }} alt="确认密码" />
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

          {/* 取款密码 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
              width: '100%',
              height: '44px',
              paddingLeft: '12px',
              paddingRight: '16px',
              background: 'rgba(0, 0, 0, 0.45098039215686275)',
              border: focusedInput === 'paypassword' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
              borderRadius: '12px',
              position: 'relative',
              transition: 'border-color 0.3s ease'
            }}>
              <img src="https://www.xpj00000.vip/loginImg/password.png" style={{ width: '28px', flexShrink: 0, marginRight: '15px' }} alt="取款密码" />
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
                  flex: 1,
                  height: '100%',
                  fontSize: '16px',
                  color: focusedInput === 'paypassword' ? 'hsla(0,0%,100%,.8509803921568627)' : '#fff',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  caretColor: '#ffc53e'
                }}
              />
            </div>
          </div>

          {/* 验证码 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
              width: '100%',
              height: '44px',
              paddingLeft: '12px',
              paddingRight: '16px',
              background: 'rgba(0, 0, 0, 0.45098039215686275)',
              border: focusedInput === 'code' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
              borderRadius: '12px',
              position: 'relative',
              transition: 'border-color 0.3s ease'
            }}>
              <img src="https://www.xpj00000.vip/loginImg/recommend.png" style={{ width: '28px', flexShrink: 0, marginRight: '15px' }} alt="验证码" />
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px', marginRight: '15px' }}>|</div>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                onFocus={() => setFocusedInput('code')}
                onBlur={() => setFocusedInput(null)}
                placeholder={t('enterCode')}
                maxLength={4}
                style={{
                  flex: 1,
                  height: '100%',
                  fontSize: '16px',
                  color: focusedInput === 'code' ? 'hsla(0,0%,100%,.8509803921568627)' : '#fff',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  caretColor: '#ffc53e'
                }}
              />
              {captchaImage ? (
                <img
                  src={captchaImage}
                  onClick={refreshCaptcha}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    cursor: 'pointer',
                    height: '36px',
                    width: 'auto',
                    background: '#0C0E13',
                    padding: '2px',
                    borderRadius: '4px',
                    mixBlendMode: 'screen'
                  }}
                  alt="验证码"
                />
              ) : (
                <span onClick={refreshCaptcha} style={{ cursor: 'pointer', color: '#999', marginLeft: '10px' }}>
                  {t('clickGetCode')}
                </span>
              )}
            </div>
          </div>

          {/* 注册按钮 */}
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
              height: '44px',
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
            {loading ? t('registering') : t('registerNow')}
          </button>

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
  );
}
