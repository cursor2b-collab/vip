import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

/** 忘记账号/密码页：邮箱验证码验证后设置新密码（Supabase） */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'verify' | 'setPassword'>('verify');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; type: 'error' | 'success'; message: string }>({ show: false, type: 'error', message: '' });

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const t = setInterval(() => setCodeCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [codeCountdown]);

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.show, toast.message]);

  const handleSendCode = async () => {
    const e = email.trim();
    if (!e) {
      setToast({ show: true, type: 'error', message: '请输入邮箱' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setToast({ show: true, type: 'error', message: '请输入有效的邮箱地址' });
      return;
    }
    setLoading(true);
    try {
      await sendEmailOtp(e);
      setCodeCountdown(60);
      setToast({ show: true, type: 'success', message: '验证码已发送，请查收邮件' });
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

  const handleConfirm = async () => {
    const e = email.trim();
    const c = code.trim();
    if (!e) {
      setToast({ show: true, type: 'error', message: '请输入邮箱' });
      return;
    }
    if (!c) {
      setToast({ show: true, type: 'error', message: '请输入验证码' });
      return;
    }
    setLoading(true);
    try {
      await verifyEmailOtp(e, c);
      setStep('setPassword');
      setToast({ show: true, type: 'success', message: '验证成功，请设置新密码' });
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: err?.message || '验证码错误或已过期' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setToast({ show: true, type: 'error', message: '请输入至少6位新密码' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ show: true, type: 'error', message: '两次输入的密码不一致' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message || '修改密码失败');
      setToast({ show: true, type: 'success', message: '密码已修改，请使用新密码登录' });
      setTimeout(() => {
        supabase.auth.signOut().catch(() => {});
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: err?.message || '修改密码失败' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#151A23',
        color: '#fff',
        padding: '24px 20px',
        boxSizing: 'border-box'
      }}
    >
      {/* 顶部栏：返回 + 标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          padding: '8px 0'
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1
          }}
        >
          ‹
        </button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>忘记账号/密码</h1>
        <div style={{ width: 32 }} />
      </div>

      {step === 'verify' && (
        <>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '20px' }}>
            您可通过接收验证码方式找回账号或修改密码
          </p>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px' }}>邮箱</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                paddingLeft: '12px',
                paddingRight: '16px',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(199,218,255,0.08)',
                borderRadius: '12px'
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                autoComplete="email"
                style={{
                  flex: 1,
                  height: '100%',
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

          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px' }}>验证码</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                paddingLeft: '12px',
                paddingRight: '8px',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(199,218,255,0.08)',
                borderRadius: '12px'
              }}
            >
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码"
                maxLength={6}
                style={{
                  flex: 1,
                  height: '100%',
                  fontSize: '16px',
                  color: '#fff',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  caretColor: '#ffc53e'
                }}
              />
              <button
                type="button"
                className="count-down"
                onClick={handleSendCode}
                disabled={loading || codeCountdown > 0 || !email.trim()}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '96px',
                  height: '36px',
                  borderRadius: '8px',
                  background: loading || codeCountdown > 0 || !email.trim() ? 'rgba(199,218,255,0.05)' : '#ffc53e',
                  boxShadow: loading || codeCountdown > 0 || !email.trim() ? 'none' : 'inset 0 0 13px 0 rgba(255,46,0,.45), 0 0 10px 0 rgba(255,46,0,.25)',
                  color: loading || codeCountdown > 0 || !email.trim() ? 'hsla(0,0%,100%,.25)' : 'rgba(0,0,0,.85)',
                  fontWeight: 600,
                  border: 'none',
                  fontSize: '13px',
                  cursor: loading || codeCountdown > 0 || !email.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {codeCountdown > 0 ? `${codeCountdown}秒` : '获取验证码'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => navigate('/service')}
              style={{ background: 'none', border: 'none', color: '#ffc53e', fontSize: '14px', cursor: 'pointer', padding: '4px 0' }}
            >
              无法获取验证码?联系客服
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              width: '100%',
              height: '50px',
              borderRadius: '12px',
              background: '#ffc53e',
              color: '#000',
              fontWeight: 600,
              border: 'none',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            确定
          </button>
        </>
      )}

      {step === 'setPassword' && (
        <>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '20px' }}>
            请设置您的新登录密码
          </p>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px' }}>新密码</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                paddingLeft: '12px',
                paddingRight: '16px',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(199,218,255,0.08)',
                borderRadius: '12px'
              }}
            >
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                autoComplete="new-password"
                style={{
                  flex: 1,
                  height: '100%',
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

          <div style={{ marginBottom: '24px' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px' }}>确认密码</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                paddingLeft: '12px',
                paddingRight: '16px',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(199,218,255,0.08)',
                borderRadius: '12px'
              }}
            >
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                autoComplete="new-password"
                style={{
                  flex: 1,
                  height: '100%',
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

          <button
            type="button"
            onClick={handleSetPassword}
            disabled={loading}
            style={{
              width: '100%',
              height: '50px',
              borderRadius: '12px',
              background: '#ffc53e',
              color: '#000',
              fontWeight: 600,
              border: 'none',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            完成
          </button>
        </>
      )}

      {/* Toast */}
      {toast.show && (
        <div
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
          <p style={{ margin: 0, padding: '0 5px', fontSize: '14px', lineHeight: 1.5, textAlign: 'center' }}>{toast.message}</p>
        </div>
      )}
    </div>
  );
}
