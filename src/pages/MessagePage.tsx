/**
 * 我的消息页面
 * - 所有通知：公告 + 站内信合并
 * - 优惠通知：公告 type=activity
 * - 系统推送：公告 type=system
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMessageList, readMessage, deleteMessage, Message } from '@/lib/api/message';

type TabType = 'all' | 'promo' | 'system';

const TABS: { key: TabType; label: string }[] = [
  { key: 'all', label: '所有通知' },
  { key: 'promo', label: '优惠通知' },
  { key: 'system', label: '系统推送' },
];

export default function MessagePage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const loadMessages = useCallback(async (type: TabType) => {
    setLoading(true);
    setError('');
    try {
      const res = await getMessageList({ page: 1, limit: 200, type });
      const list = res.data?.data ?? [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('加载消息失败:', err);
      setError(err?.message || '加载失败，请稍后重试');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadMessages(activeTab);
  }, [authLoading, isLoggedIn, activeTab, loadMessages]);

  const handleRead = async (id: number, source?: 'notice' | 'message') => {
    try {
      await readMessage(id, source ?? 'notice');
      // 更新本地状态，不重新请求
      setMessages(prev => prev.map(m =>
        m.id === id && m.source === (source ?? 'notice')
          ? { ...m, is_read: 1 }
          : m
      ));
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  };

  const handleDelete = async (id: number, source?: 'notice' | 'message') => {
    if (source === 'notice') return; // 公告不可删除
    if (!window.confirm('确定要删除这条消息吗？')) return;
    try {
      const res = await deleteMessage(id);
      if ((res as any)?.code === 0 || (res as any)?.code === 200) {
        setMessages(prev => prev.filter(m => !(m.id === id && m.source === 'message')));
      }
    } catch (err: any) {
      console.error('删除失败:', err);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(12, 16, 23)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        加载中...
      </div>
    );
  }
  if (!isLoggedIn) return null;

  const unreadCount = messages.filter(m => m.is_read === 0).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(12, 16, 23)',
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
        minHeight: '100vh',
        background: 'rgb(12, 16, 23)',
      }}>
        {/* 头部 */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, position: 'absolute', left: '20px', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: '#fff' }} />
          </button>
          <h1 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            我的消息
            {unreadCount > 0 && (
              <span style={{ fontSize: '11px', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 'normal' }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <button
            onClick={() => loadMessages(activeTab)}
            style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, position: 'absolute', right: '20px', display: 'flex', alignItems: 'center' }}
            title="刷新"
          >
            <RefreshCw className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* Tab */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '0 16px',
        }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === key ? '2px solid #eab308' : '2px solid transparent',
                color: activeTab === key ? '#eab308' : 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                fontWeight: activeTab === key ? 600 : 400,
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 内容 */}
        <div style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              <div style={{ fontSize: '14px' }}>加载中...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ef4444' }}>
              <div style={{ fontSize: '14px', marginBottom: '12px' }}>{error}</div>
              <button
                onClick={() => loadMessages(activeTab)}
                style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
              >
                重新加载
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#555' }}>
              <Bell style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px' }}>暂无消息</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map(message => (
                <div
                  key={`${message.source ?? 'notice'}-${message.id}`}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: message.is_read === 0
                      ? 'rgba(234,179,8,0.05)'
                      : 'rgba(255,255,255,0.04)',
                    border: message.is_read === 0
                      ? '1px solid rgba(234,179,8,0.2)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* 标题行 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: message.is_read === 0 ? 600 : 400, flex: 1, lineHeight: '1.4' }}>
                      {message.title || '（无标题）'}
                    </div>
                    {message.is_read === 0 && (
                      <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '8px', flexShrink: 0 }}>
                        未读
                      </span>
                    )}
                  </div>

                  {/* 内容 */}
                  {message.content && (
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px', lineHeight: '1.5' }}>
                      {message.content.replace(/<[^>]+>/g, '').slice(0, 100)}
                      {message.content.length > 100 ? '...' : ''}
                    </div>
                  )}

                  {/* 底部：时间 + 操作 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#555' }}>
                      {message.created_at}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {message.is_read === 0 && (
                        <button
                          onClick={() => handleRead(message.id, message.source)}
                          style={{ padding: '3px 10px', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '4px', color: '#eab308', fontSize: '11px', cursor: 'pointer' }}
                        >
                          标记已读
                        </button>
                      )}
                      {message.source === 'message' && (
                        <button
                          onClick={() => handleDelete(message.id, message.source)}
                          style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
