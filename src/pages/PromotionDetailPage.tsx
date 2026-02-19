/**
 * 优惠活动详情页面 - 正确版本
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getActivityDetail, applyActivity } from '@/lib/api/activity';
import { getCaptcha } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function PromotionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { userInfo } = useAuth();
  const [activityInfo, setActivityInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaKey, setCaptchaKey] = useState('');

  
  const convertDate = (isoDate: any) => {
    if (isoDate == null || isoDate === '') return '-';
    try {
      const date = new Date(isoDate);
      if (Number.isNaN(date.getTime())) return '-';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}.${minutes}.${seconds}`;
    } catch {
      return '-';
    }
  };

  const refreshCaptcha = useCallback(async () => {
    try {
      const res = await getCaptcha();
      if (res.code === 200 && res.data) {
        const img = res.data.img || res.data.image || '';
        setCaptchaImage(img.startsWith('data:') ? img : 'data:image/png;base64,' + img);
        setCaptchaKey(res.data.key || res.data.captcha_key || '');
      }
    } catch (err) {
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadActivityDetail(id);
      // 页面加载时获取验证码
      refreshCaptcha();
    }
  }, [id]);

  const loadActivityDetail = async (activityId: string) => {
    setLoading(true);
    try {
      const res = await getActivityDetail(activityId);
      if (res.code === 200) {
        setActivityInfo(res.data);
      } else {
        alert(res.message || '获取活动详情失败');
        navigate(-1);
      }
    } catch (err: any) {
      alert('获取活动详情失败');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!activityInfo?.id) {
      alert('活动ID无效');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      navigate('/login');
      return;
    }

    if (!userInfo?.name && !userInfo?.username) {
      alert('无法获取用户信息，请重新登录');
      navigate('/login');
      return;
    }

    if (!captchaCode) {
      alert('请输入验证码');
      return;
    }

    if (!captchaKey) {
      alert('验证码已过期，请刷新验证码');
      await refreshCaptcha();
      return;
    }

    setApplying(true);
    try {
      const memberName = userInfo.name || userInfo.username || '';
      
      // 构建申请参数
      const applyParams: any = {
        member_name: memberName,
        captcha: captchaCode,
        key: captchaKey
      };

      // 根据 hall_field 动态添加字段
      if (activityInfo.hall_field) {
        const hallFields = activityInfo.hall_field.split(',').map((f: string) => f.trim());
        
        // 如果 hall_field 中包含其他字段，可以根据需要添加
        // 目前只处理 member_name，其他字段可能需要用户输入或从其他地方获取
      }
      
      const res = await applyActivity(activityInfo.id, applyParams);
      
      if (res.code === 200) {
        alert(res.message || '申请成功');
        setCaptchaCode('');
        await refreshCaptcha();
      } else {
        const errorMessage = res.message || '申请失败';
        
        // 如果是验证码相关错误，自动刷新验证码
        if (errorMessage.includes('验证码') || errorMessage.includes('过期') || errorMessage.includes('captcha')) {
          await refreshCaptcha();
          alert('验证码错误或已过期，已自动刷新，请重新输入验证码后再次申请');
        } else {
          alert(errorMessage);
        }
        setCaptchaCode('');
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || '申请失败，请重试';
      
      // 如果是验证码相关错误，自动刷新验证码
      if (errorMessage.includes('验证码') || errorMessage.includes('过期') || errorMessage.includes('captcha')) {
        await refreshCaptcha();
        alert('验证码错误或已过期，已自动刷新，请重新输入验证码后再次申请');
      } else {
        alert(errorMessage);
      }
      setCaptchaCode('');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#151a23', padding: '16px' }}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '18px' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!activityInfo) {
    return (
      <div style={{ minHeight: '100vh', background: '#151a23', padding: '16px' }}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '18px' }}>
          活动不存在
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', paddingBottom: '80px' }}>
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
        <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center', color: '#fff' }}>活动详情</h2>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* 标题和时间 */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: '#fff', fontSize: '24px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.4 }}>
            {activityInfo.title}
          </p>
          <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
            {convertDate(activityInfo.start_date ?? activityInfo.start_at)}
          </p>
        </div>

        {/* 全局样式 */}
        <style>{`
          .activity-content {
            color: #fff !important;
            font-size: 16px;
            line-height: 1.8;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
            box-sizing: border-box;
            background-color: transparent !important;
          }
          .activity-content * {
            color: #fff !important;
            max-width: 100% !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            box-sizing: border-box !important;
            background-color: transparent !important;
          }
          .activity-content p {
            color: #fff !important;
            margin: 10px 0;
            background-color: transparent !important;
          }
          .activity-content div {
            color: #fff !important;
            max-width: 100% !important;
            background-color: transparent !important;
          }
          .activity-content span {
            color: #fff !important;
            background-color: transparent !important;
          }
          .activity-content img {
            max-width: 100% !important;
            height: auto !important;
            display: block;
          }
          .activity-content table {
            max-width: 100% !important;
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            margin: 15px 0 !important;
            font-size: 14px !important;
            background-color: rgba(255,255,255,0.05) !important;
          }
          .activity-content td,
          .activity-content th {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            padding: 8px !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            text-align: center !important;
            background-color: rgba(255,255,255,0.05) !important;
            color: #fff !important;
          }
          .activity-content .van-divider {
            border-color: rgba(255,255,255,0.3) !important;
            color: #fff !important;
            margin: 20px auto !important;
            background-color: transparent !important;
            display: block !important;
            width: 50% !important;
            text-align: center !important;
          }
          .activity-content .tables {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: auto !important;
            background-color: transparent !important;
          }
          .activity-content .at-font-red {
            color: #ff6b6b !important;
          }
        `}</style>

        {/* 活动说明 (content) */}
        {activityInfo.content && (
          <div style={{ marginBottom: '20px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            <div
              className="activity-content"
              dangerouslySetInnerHTML={{ __html: activityInfo.content }}
            />
          </div>
        )}

        {/* 申请描述 (apply_desc) - 包含表格 */}
        {activityInfo.apply_desc && (
          <div style={{ marginBottom: '20px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            <div
              className="activity-content"
              dangerouslySetInnerHTML={{ __html: activityInfo.apply_desc }}
            />
          </div>
        )}

        {/* 规则内容 (rule_content) */}
        {activityInfo.rule_content && (
          <div style={{ marginBottom: '20px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            <div
              className="activity-content"
              dangerouslySetInnerHTML={{ __html: activityInfo.rule_content }}
            />
          </div>
        )}

        {/* 备注 (memo) - 兼容旧字段 */}
        {activityInfo.memo && (
          <div style={{ marginBottom: '20px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            <div
              className="activity-content"
              dangerouslySetInnerHTML={{ __html: activityInfo.memo }}
            />
          </div>
        )}

        {/* 验证码输入 */}
        <div style={{ margin: '30px 0', padding: '0 20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%',
            height: '44px',
            paddingLeft: '12px',
            paddingRight: '16px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(199, 218, 255, 0.08)',
            borderRadius: '12px',
            position: 'relative',
            transition: 'border-color 0.3s ease'
          }}>
            <input
              type="text"
              placeholder="请输入验证码"
              value={captchaCode}
              onChange={(e) => setCaptchaCode(e.target.value)}
              maxLength={4}
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
              <span
                onClick={refreshCaptcha}
                style={{
                  cursor: 'pointer',
                  color: '#999',
                  marginLeft: '10px',
                  fontSize: '14px'
                }}
              >
                验证码
              </span>
            )}
          </div>
        </div>

        {/* 申请按钮 */}
        <div
          onClick={!applying ? handleApply : undefined}
          style={{
            margin: '20px auto',
            display: 'block',
            width: '50%',
            height: '45px',
            lineHeight: '45px',
            fontSize: '16px',
            background: 'linear-gradient(224deg, #ffdf91, #ffcb4c)',
            borderRadius: '4px',
            color: '#482000',
            textAlign: 'center',
            fontWeight: 700,
            cursor: applying ? 'not-allowed' : 'pointer',
            opacity: applying ? 0.7 : 1
          }}
        >
          {applying ? '申请中...' : '点我申请'}
        </div>
      </div>
    </div>
  );
}
