/**
 * 我的消息页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMessageList, readMessage, deleteMessage, Message } from '@/lib/api/message';

export default function MessagePage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadMessages();
  }, [authLoading, isLoggedIn]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await getMessageList({ page: 1, limit: 50 });
      if (res.code === 200) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error('加载消息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id: number) => {
    try {
      await readMessage(id);
      loadMessages();
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条消息吗？')) return;
    try {
      const res = await deleteMessage(id);
      if (res.code === 200) {
        alert('删除成功');
        loadMessages();
      } else {
        alert(res.message || '删除失败');
      }
    } catch (err: any) {
      alert(err.message || '删除失败');
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
          <h1 style={{ margin: 0, fontSize: '20px', flex: 1, textAlign: 'center' }}>我的消息</h1>
        </div>

        {/* 内容区域 */}
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无消息</div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              style={{
                padding: '15px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '10px',
                background: message.is_read === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div style={{ fontSize: '16px', fontWeight: message.is_read === 0 ? 'bold' : 'normal' }}>
                  {message.title}
                </div>
                {message.is_read === 0 && (
                  <span style={{ fontSize: '10px', background: '#f87171', color: '#fff', padding: '2px 6px', borderRadius: '10px' }}>
                    未读
                  </span>
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>{message.content}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#999' }}>{message.created_at}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {message.is_read === 0 && (
                    <button
                      onClick={() => handleRead(message.id)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      标记已读
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(message.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#f87171',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

