/**
 * 个人资料页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserInfo } from '@/lib/api/user';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfileDetailPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, refreshUserInfo, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (userInfo) {
      console.log('📋 个人资料页面 - 用户信息:', userInfo);
    }
  }, [authLoading, isLoggedIn, navigate, userInfo]);

  const handleFieldClick = (field: string) => {
    const currentValue = userInfo?.[field] || '';
    setEditValue(currentValue);
    setEditingField(field);
  };

  const handleSave = async () => {
    if (!editingField) return;

    setLoading(true);
    try {
      const updateData: any = {};
      updateData[editingField] = editValue;

      console.log('💾 更新用户信息:', updateData);
      const res = await updateUserInfo(updateData);
      console.log('✅ 更新响应:', res);
      
      if (res.code === 200) {
        alert(t('updateSuccess'));
        setEditingField(null);
        await refreshUserInfo();
      } else {
        alert(res.message || t('updateFailed'));
      }
    } catch (err: any) {
      console.error('❌ 更新失败:', err);
      alert(err.message || t('updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderField = (label: string, field: string, editable: boolean = true) => {
    // 字段映射：处理可能的字段名差异
    let value = '';
    if (field === 'username') {
      value = userInfo?.username || userInfo?.name || '';
    } else {
      value = userInfo?.[field] || '';
    }
    const displayValue = value || t('fillIn');
    const isReadOnly = !editable;

    return (
      <div
        key={field}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          cursor: isReadOnly ? 'default' : 'pointer',
          backgroundColor: '#1a1f2e'
        }}
        onClick={() => !isReadOnly && handleFieldClick(field)}
      >
        <span style={{ fontSize: '14px', color: '#fff' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '14px', 
            color: value ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)' 
          }}>
            {displayValue}
          </span>
          {!isReadOnly && (
            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>›</span>
          )}
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C1017', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {t('loading')}
      </div>
    );
  }
  if (!isLoggedIn) return null;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0C1017', 
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
        background: '#0C1017'
      }}>
        {/* 返回按钮 */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <img 
            onClick={() => navigate(-1)} 
            src="https://www.xpj00000.vip/indexImg/icon_header_arrow.f02628bc.png" 
            alt="返回"
            style={{ 
              width: '24px', 
              height: '24px', 
              cursor: 'pointer',
              position: 'absolute',
              left: '20px'
            }} 
          />
          <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('profileTitle')}</h2>
        </div>

        {/* 内容区域 - 深色卡片 */}
        <div style={{ 
          background: '#1a1f2e', 
          marginTop: '10px',
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden'
        }}>
        {/* 用户名 - 只读 */}
        {renderField(t('username'), 'username', false)}
        
        {/* 真实姓名 - 只读 */}
        {renderField(t('realname'), 'realname', false)}

        {/* 手机号码 - 可编辑 */}
        {renderField(t('phoneNumber'), 'phone', true)}

        {/* 电子邮箱 - 可编辑 */}
        {renderField(t('email'), 'email', true)}

        {/* 分隔线 */}
        <div style={{ 
          height: '1px', 
          background: 'rgba(255,255,255,0.1)', 
          margin: '0 15px' 
        }}></div>

        {/* Facebook - 可编辑 */}
        {renderField(t('facebook'), 'facebook', true)}

        {/* Line - 可编辑 */}
        {renderField(t('line'), 'line', true)}
      </div>

      {/* 编辑弹窗 */}
      {editingField && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998
            }}
            onClick={handleCancel}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#1a1f2e',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px',
              zIndex: 9999,
              maxHeight: '50vh'
            }}
          >
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px',
                color: '#fff'
              }}>
                {editingField === 'phone' ? t('phoneNumber') : 
                 editingField === 'email' ? t('email') :
                 editingField === 'facebook' ? t('facebook') :
                 editingField === 'line' ? t('line') : editingField}
              </label>
              <input
                type={editingField === 'email' ? 'email' : editingField === 'phone' ? 'tel' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={editingField === 'phone' ? t('enterPhoneNumber') : 
                 editingField === 'email' ? t('enterEmail') :
                 editingField === 'facebook' ? t('enterFacebook') :
                 editingField === 'line' ? t('enterLine') : editingField}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: loading ? '#666' : '#ffc53e',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
