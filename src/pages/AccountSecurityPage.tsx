/**
 * 账户与安全页面
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { setDrawingPwd, modifyDrawingPwd, modifyPassword } from '@/lib/api/password';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AccountSecurityPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'login' | 'drawing'>('login');
  const [loginForm, setLoginForm] = useState({
    oldpassword: '',
    password: '',
    password_confirmation: ''
  });
  const [drawingForm, setDrawingForm] = useState({
    old_qk_pwd: '',
    qk_pwd: '',
    qk_pwd_confirmation: ''
  });
  const [isFirstSet, setIsFirstSet] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleLoginPassword = async () => {
    if (!loginForm.oldpassword || !loginForm.password || !loginForm.password_confirmation) {
      alert(t('fillCompleteInfo'));
      return;
    }
    if (loginForm.password !== loginForm.password_confirmation) {
      alert(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await modifyPassword(loginForm);
      if (res.code === 200) {
        alert(t('updateSuccess'));
        setLoginForm({ oldpassword: '', password: '', password_confirmation: '' });
      } else {
        alert(res.message || t('modifyFailed'));
      }
    } catch (err: any) {
      alert(err.message || t('modifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDrawingPassword = async () => {
    if (isFirstSet) {
      if (!drawingForm.qk_pwd || !drawingForm.qk_pwd_confirmation) {
        alert(t('fillCompleteInfo'));
        return;
      }
      if (drawingForm.qk_pwd !== drawingForm.qk_pwd_confirmation) {
        alert(t('passwordMismatch'));
        return;
      }

      setLoading(true);
      try {
        const res = await setDrawingPwd({
          qk_pwd: drawingForm.qk_pwd,
          qk_pwd_confirmation: drawingForm.qk_pwd_confirmation
        });
        if (res.code === 200) {
          alert(t('setSuccess'));
          setIsFirstSet(false);
          setDrawingForm({ old_qk_pwd: '', qk_pwd: '', qk_pwd_confirmation: '' });
        } else {
          alert(res.message || t('setFailed'));
        }
      } catch (err: any) {
        alert(err.message || t('setFailed'));
      } finally {
        setLoading(false);
      }
    } else {
      if (!drawingForm.old_qk_pwd || !drawingForm.qk_pwd || !drawingForm.qk_pwd_confirmation) {
        alert(t('fillCompleteInfo'));
        return;
      }
      if (drawingForm.qk_pwd !== drawingForm.qk_pwd_confirmation) {
        alert(t('passwordMismatch'));
        return;
      }

      setLoading(true);
      try {
        const res = await modifyDrawingPwd(drawingForm);
        if (res.code === 200) {
          alert(t('updateSuccess'));
          setDrawingForm({ old_qk_pwd: '', qk_pwd: '', qk_pwd_confirmation: '' });
        } else {
          alert(res.message || t('modifyFailed'));
        }
      } catch (err: any) {
        alert(err.message || t('modifyFailed'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'rgb(12, 16, 23)', 
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      {/* PC端居中容器 */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
        minHeight: '100vh',
        background: 'rgb(12, 16, 23)'
      }}>
        {/* 头部 */}
        <div style={{ 
          padding: '15px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          display: 'flex', 
          alignItems: 'center',
          position: 'relative'
        }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              cursor: 'pointer', 
              background: 'transparent', 
              border: 'none', 
              padding: 0,
              position: 'absolute',
              left: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: '#fff' }} />
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', flex: 1, textAlign: 'center' }}>{t('accountSecurityTitle')}</h1>
        </div>

        {/* 内容区域 */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('login')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'login' ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: activeTab === 'login' ? '#000' : '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {t('loginPassword')}
        </button>
        <button
          onClick={() => setActiveTab('drawing')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'drawing' ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: activeTab === 'drawing' ? '#000' : '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {t('withdrawPassword')}
        </button>
      </div>

      {activeTab === 'login' ? (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t('oldPassword')}</label>
            <input
              type="password"
              value={loginForm.oldpassword}
              onChange={(e) => setLoginForm({ ...loginForm, oldpassword: e.target.value })}
              placeholder={t('enterOldPassword')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t('newPassword')}</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder={t('enterNewPassword')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t('confirmNewPassword')}</label>
            <input
              type="password"
              value={loginForm.password_confirmation}
              onChange={(e) => setLoginForm({ ...loginForm, password_confirmation: e.target.value })}
              placeholder={t('enterNewPasswordAgain')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={handleLoginPassword}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #ffd700, #ff8c00)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? t('modifying') : t('modifyLoginPassword')}
          </button>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
          {isFirstSet ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>提款密码</label>
                <input
                  type="password"
                  value={drawingForm.qk_pwd}
                  onChange={(e) => setDrawingForm({ ...drawingForm, qk_pwd: e.target.value })}
                  placeholder="请设置提款密码"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t('confirmWithdrawPassword')}</label>
                <input
                  type="password"
                  value={drawingForm.qk_pwd_confirmation}
                  onChange={(e) => setDrawingForm({ ...drawingForm, qk_pwd_confirmation: e.target.value })}
                  placeholder={t('enterWithdrawPasswordAgain')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={handleDrawingPassword}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? t('setting') : t('setWithdrawPasswordBtn')}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>原提款密码</label>
                <input
                  type="password"
                  value={drawingForm.old_qk_pwd}
                  onChange={(e) => setDrawingForm({ ...drawingForm, old_qk_pwd: e.target.value })}
                  placeholder="请输入原提款密码"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t('newWithdrawPassword')}</label>
                <input
                  type="password"
                  value={drawingForm.qk_pwd}
                  onChange={(e) => setDrawingForm({ ...drawingForm, qk_pwd: e.target.value })}
                  placeholder={t('enterNewWithdrawPassword')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t('confirmNewWithdrawPassword')}</label>
                <input
                  type="password"
                  value={drawingForm.qk_pwd_confirmation}
                  onChange={(e) => setDrawingForm({ ...drawingForm, qk_pwd_confirmation: e.target.value })}
                  placeholder={t('enterNewWithdrawPasswordAgain')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={handleDrawingPassword}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? t('modifying') : t('modifyWithdrawPassword')}
              </button>
            </>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

