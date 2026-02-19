/**
 * Telegram 机器人「进入游戏」入口
 * 通过 ?token=xxx 或 ?tg=telegram_user_id 换取 Supabase 魔术链接并自动登录
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function TelegramGamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const tg = searchParams.get('tg');
    if (!token && !tg) {
      setErrorMsg('缺少登录参数，请返回 Telegram 机器人重新点击「进入游戏」');
      setStatus('error');
      return;
    }

    const fn = `${SUPABASE_URL?.replace(/\/$/, '')}/functions/v1/telegram-login?${token ? `token=${token}` : `tg=${tg}`}`;

    fetch(fn, { method: 'GET' })
      .then((res) => res.json())
      .then((data) => {
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
          return;
        }
        setErrorMsg(data.error || '登录失败，请重试');
        setStatus('error');
      })
      .catch((err) => {
        setErrorMsg(err?.message || '网络错误，请稍后重试');
        setStatus('error');
      });
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0C1017',
        color: '#fff',
      }}>
        <div style={{ marginBottom: 16 }}>正在登录...</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0C1017',
      color: '#fff',
      padding: 24,
    }}>
      <p style={{ marginBottom: 16 }}>{errorMsg}</p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '10px 24px',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        返回首页
      </button>
    </div>
  );
}
