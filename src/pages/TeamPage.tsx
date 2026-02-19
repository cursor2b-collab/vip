/**
 * 推广赚钱（超级合伙人）页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  getInviteLinkList, 
  createInviteLink, 
  getTeamFdInfo, 
  getTeamReport,
  addTeamMember,
  getMyInviteCodeFromSupabase,
  getInviteRegisterUrl
} from '@/lib/api/team';
import { USE_SUPABASE_AUTH } from '@/lib/supabase';
import { getCaptcha as getAuthCaptcha } from '@/lib/api/auth';

interface InviteLink {
  id: number;
  code: string;
  url: string;
  status: number;
  created_at: string;
  [key: string]: any;
}

interface TeamStats {
  effective_friends?: number; // 有效好友
  commission?: number; // 佣金
  total_commission?: number; // 累计佣金
  net_profit?: number; // 净盈利
}

interface CommissionRate {
  level: number;
  rate: number;
  [key: string]: any;
}

export default function TeamPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [inviteLink, setInviteLink] = useState<InviteLink | null>(null);
  const [stats, setStats] = useState<TeamStats>({});
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [addFriendForm, setAddFriendForm] = useState({
    name: '',
    password: '',
    code: '',
    key: ''
  });
  const [captchaImg, setCaptchaImg] = useState('');

  // 生成前端邀请链接
  const getFrontendInviteUrl = (code: string): string => {
    const frontendDomain = window.location.origin;
    return `${frontendDomain}/Register?i=${code}`;
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (userInfo?.invite_code && !inviteLink) {
      console.log('📝 从用户信息中获取邀请码:', userInfo.invite_code);
      setInviteLink({
        id: 0,
        code: userInfo.invite_code,
        url: '',
        status: 1,
        created_at: ''
      });
    }
    loadData();
  }, [authLoading, isLoggedIn, userInfo]);

  // 调试：监听 inviteLink 变化
  useEffect(() => {
    console.log('📌 inviteLink 状态更新:', inviteLink);
    if (inviteLink) {
      console.log('📌 邀请码:', inviteLink.code);
      console.log('📌 邀请链接:', inviteLink.url);
    } else {
      console.log('⚠️ inviteLink 为空');
    }
  }, [inviteLink]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 先加载佣金规则（需要用于创建邀请链接）
      console.log('💰 加载佣金规则...');
      let agentRates: any = null;
      const fdRes = await getTeamFdInfo();
      console.log('💰 佣金规则响应:', fdRes);
      if (fdRes.code === 200 && fdRes.data?.agent_rates) {
        agentRates = fdRes.data.agent_rates;
        // agent_rates是数组，格式: [{api_name: 'xxx', rate: 0.08}, ...]
        if (Array.isArray(agentRates)) {
          // 提取一级、二级、三级返点比例（如果有的话）
          // 这里假设rates数组中的第一个是一级，第二个是二级，第三个是三级
          setCommissionRates([
            { level: 1, rate: agentRates[0]?.rate || 0 },
            { level: 2, rate: agentRates[1]?.rate || 0 },
            { level: 3, rate: agentRates[2]?.rate || 0 }
          ]);
        } else {
          // 如果不是数组，尝试从对象中提取
          const rates = agentRates;
          setCommissionRates([
            { level: 1, rate: rates.level1 || rates.first || 0 },
            { level: 2, rate: rates.level2 || rates.second || 0 },
            { level: 3, rate: rates.level3 || rates.third || 0 }
          ]);
        }
      }

      // 加载邀请链接
      console.log('🔗 加载邀请链接...');
      try {
        if (USE_SUPABASE_AUTH) {
          // 仅 Supabase：从 userInfo 或 RPC 获取邀请码，拼接前端注册链接
          let code = userInfo?.invite_code;
          if (!code) {
            code = await getMyInviteCodeFromSupabase() ?? undefined;
          }
          if (code) {
            const url = getInviteRegisterUrl(code);
            setInviteLink({
              id: 0,
              code,
              url,
              status: 1,
              created_at: ''
            });
          }
        } else {
          const linkRes = await getInviteLinkList();
          console.log('🔗 邀请链接响应:', linkRes);

          if (linkRes.code === 200) {
            let links: any[] = [];
            if (Array.isArray(linkRes.data)) {
              links = linkRes.data;
            } else if (linkRes.data?.data && Array.isArray(linkRes.data.data)) {
              links = linkRes.data.data;
            } else if (linkRes.data?.list && Array.isArray(linkRes.data.list)) {
              links = linkRes.data.list;
            } else if (linkRes.data?.links && Array.isArray(linkRes.data.links)) {
              links = linkRes.data.links;
            }

            if (links.length > 0) {
              const firstLink = links[0];
              setInviteLink({
                id: firstLink.id || 0,
                code: firstLink.code || firstLink.invite_code || '',
                url: firstLink.url || '',
                status: firstLink.status || 1,
                created_at: firstLink.created_at || ''
              });
            } else {
              const ratesToSend = agentRates || [];
              const createRes = await createInviteLink({
                rates: ratesToSend,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
              });
              if (createRes.code === 200) {
                const newLink = createRes.data?.data || createRes.data || createRes;
                if (newLink) {
                  setInviteLink({
                    id: newLink.id || 0,
                    code: newLink.code || newLink.invite_code || '',
                    url: newLink.url || '',
                    status: newLink.status || 1,
                    created_at: newLink.created_at || ''
                  });
                } else if (userInfo?.invite_code) {
                  setInviteLink({
                    id: 0,
                    code: userInfo.invite_code,
                    url: getInviteRegisterUrl(userInfo.invite_code),
                    status: 1,
                    created_at: ''
                  });
                }
              } else if (userInfo?.invite_code) {
                setInviteLink({
                  id: 0,
                  code: userInfo.invite_code,
                  url: getInviteRegisterUrl(userInfo.invite_code),
                  status: 1,
                  created_at: ''
                });
              } else {
                alert(createRes.message || t('createInviteLinkFailed'));
              }
            }
          } else if (userInfo?.invite_code) {
            setInviteLink({
              id: 0,
              code: userInfo.invite_code,
              url: getInviteRegisterUrl(userInfo.invite_code),
              status: 1,
              created_at: ''
            });
          }
        }
      } catch (linkErr: any) {
        console.error('❌ 加载邀请链接异常:', linkErr);
        if (userInfo?.invite_code) {
          setInviteLink({
            id: 0,
            code: userInfo.invite_code,
            url: getInviteRegisterUrl(userInfo.invite_code),
            status: 1,
            created_at: ''
          });
        }
      }

      // 加载统计数据
      console.log('📊 加载统计数据...');
      // 添加 created_at 参数（当前时间）
      const reportRes = await getTeamReport({
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      console.log('📊 统计响应:', reportRes);
      if (reportRes.code === 200 && reportRes.data) {
        setStats({
          effective_friends: reportRes.data.effective_friends || reportRes.data.friends_count || 0,
          commission: reportRes.data.commission || reportRes.data.today_commission || 0,
          total_commission: reportRes.data.total_commission || reportRes.data.accumulated_commission || 0,
          net_profit: reportRes.data.net_profit || reportRes.data.profit || 0
        });
      }
    } catch (err: any) {
      console.error('❌ 加载数据失败:', err);
      alert(err.message || t('loadDataFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(t('copySuccess'));
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(t('copySuccess'));
      } catch (e) {
        alert(t('copyFailed'));
      }
      document.body.removeChild(textArea);
    }
  };

  const handleGenerateQRCode = () => {
    if (!inviteLink?.code) {
      alert(t('getInviteLinkFirst'));
      return;
    }
    // 使用前端邀请链接生成二维码
    const frontendUrl = getFrontendInviteUrl(inviteLink.code);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(frontendUrl)}`;
    setQrCodeUrl(qrUrl);
    setShowQRCode(true);
  };

  const handleShowAddFriend = async () => {
    setShowAddFriend(true);
    // 加载验证码
    try {
      const res = await getAuthCaptcha();
      if (res.code === 200) {
        setCaptchaImg(res.data?.img || res.data?.image || '');
        setAddFriendForm({ ...addFriendForm, key: res.data?.key || res.data?.captcha_key || '' });
      }
    } catch (err) {
      console.error('加载验证码失败:', err);
    }
  };

  const handleAddFriend = async () => {
    if (!addFriendForm.name || !addFriendForm.password || !addFriendForm.code) {
      alert(t('fillCompleteInfo'));
      return;
    }
    try {
      console.log('➕ 添加好友:', addFriendForm);
      const res = await addTeamMember({
        name: addFriendForm.name,
        password: addFriendForm.password,
        code: addFriendForm.code,
        key: addFriendForm.key
      });
      console.log('➕ 添加好友响应:', res);
      if (res.code === 200) {
        alert(t('addSuccess'));
        setShowAddFriend(false);
        setAddFriendForm({ name: '', password: '', code: '', key: '' });
        loadData();
      } else {
        alert(res.message || t('addFailed'));
      }
    } catch (err: any) {
      console.error('❌ 添加好友失败:', err);
      alert(err.message || t('addFailed'));
    }
  };

  const refreshCaptcha = async () => {
    try {
      const res = await getAuthCaptcha();
      if (res.code === 200) {
        setCaptchaImg(res.data?.img || res.data?.image || '');
        setAddFriendForm({ ...addFriendForm, key: res.data?.key || res.data?.captcha_key || '' });
      }
    } catch (err) {
      console.error('刷新验证码失败:', err);
    }
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
        {/* 头部 */}
        <div style={{ 
          padding: '15px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative',
          background: '#1a1f2e'
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
          <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('teamTitle')}</h2>
          <button
            onClick={() => alert('帮助信息')}
            style={{
              position: 'absolute',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: 0,
              width: '24px',
              height: '24px'
            }}
          >
            ?
          </button>
        </div>

      {/* Banner */}
      <div style={{ width: '100%', marginBottom: '20px' }}>
        <img 
          src="https://www.xpj00000.vip/indexImg/banner.2ace6e21.png" 
          alt="banner"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* 流程步骤 */}
      <div style={{ 
        background: '#1a1f2e', 
        margin: '0 15px 20px', 
        borderRadius: '12px', 
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <img 
              src="https://www.xpj00000.vip/indexImg/icon4.005002c7.png" 
              alt={t('sendInvite')}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h5 style={{ margin: '5px 0', fontSize: '14px' }}>{t('sendInvite')}</h5>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t('inviteFriends')}</p>
        </div>
        <div style={{ display: 'flex', gap: '5px', margin: '0 10px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <img 
              src="https://www.xpj00000.vip/indexImg/icon3.0e5420be.png" 
              alt={t('friendRegister')}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h5 style={{ margin: '5px 0', fontSize: '14px' }}>{t('friendRegister')}</h5>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t('andBet')}</p>
        </div>
        <div style={{ display: 'flex', gap: '5px', margin: '0 10px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <img 
              src="https://www.xpj00000.vip/indexImg/icon2.3853dc25.png" 
              alt={t('getReward')}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h5 style={{ margin: '5px 0', fontSize: '14px' }}>{t('getReward')}</h5>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t('betRatioReward')}</p>
        </div>
      </div>

      {/* 邀请链接和邀请码 */}
      <div style={{ 
        background: '#1a1f2e', 
        margin: '0 15px 20px', 
        borderRadius: '12px', 
        padding: '20px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{t('myInviteLink')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              flex: 1, 
              fontSize: '12px', 
              color: 'rgba(255,255,255,0.9)',
              wordBreak: 'break-all',
              padding: '8px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px'
            }}>
              {inviteLink?.code ? getFrontendInviteUrl(inviteLink.code) : t('loading')}
            </span>
            <button
              onClick={() => inviteLink?.code && handleCopy(getFrontendInviteUrl(inviteLink.code))}
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t('copy')}
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{t('myInviteCode')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              flex: 1, 
              fontSize: '14px', 
              color: '#fff',
              fontWeight: 'bold',
              padding: '8px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px'
            }}>
              {inviteLink?.code || t('loading')}
            </span>
            <button
              onClick={() => inviteLink?.code && handleCopy(inviteLink.code)}
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t('copy')}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handleGenerateQRCode}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {t('generateQRCode')}
          </button>
          <button
            onClick={handleShowAddFriend}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {t('manualAddFriend')}
          </button>
        </div>
      </div>

      {/* 好友奖励 */}
      <div style={{ 
        background: '#1a1f2e', 
        margin: '0 15px 20px', 
        borderRadius: '12px', 
        padding: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{t('friendReward')}</h3>
          <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)' }}>›</span>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '15px',
          textAlign: 'center'
        }}>
          <div>
            <h4 style={{ margin: '0 0 5px', fontSize: '18px', color: '#ffc53e' }}>
              {stats.effective_friends || 0}人
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t('effectiveFriends')}</p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px', fontSize: '18px', color: '#ffc53e' }}>
              {stats.commission || 0}
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t('commission')}</p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px', fontSize: '18px', color: '#ffc53e' }}>
              {stats.total_commission || 0}
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t('totalCommission')}</p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px', fontSize: '18px', color: '#ffc53e' }}>
              {stats.net_profit || 0}
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t('netProfit')}</p>
          </div>
        </div>
      </div>

      {/* 二维码弹窗 */}
      {showQRCode && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9998
            }}
            onClick={() => setShowQRCode(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#1a1f2e',
              borderRadius: '20px',
              padding: '20px',
              zIndex: 9999,
              minWidth: '300px',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{t('qrCode')}</h3>
              <button
                onClick={() => setShowQRCode(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: 0,
                  width: '30px',
                  height: '30px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '15px' }}>
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt={t('qrCode')} 
                  style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
                />
              )}
            </div>
            <button
              onClick={() => {
                if (qrCodeUrl) {
                  const link = document.createElement('a');
                  link.href = qrCodeUrl;
                  link.download = 'qrcode.png';
                  link.click();
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {t('longPressSaveQRCode')}
            </button>
          </div>
        </>
      )}

      {/* 手动添加好友弹窗 */}
      {showAddFriend && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9998
            }}
            onClick={() => setShowAddFriend(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#1a1f2e',
              borderRadius: '20px',
              padding: '20px',
              zIndex: 9999,
              minWidth: '100%',
              maxWidth: '100%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{t('fillFriendInfo')}</h3>
              <button
                onClick={() => setShowAddFriend(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: 0,
                  width: '30px',
                  height: '30px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#fff' }}>
                {t('friendAccount')}
              </label>
              <input
                type="text"
                value={addFriendForm.name}
                onChange={(e) => setAddFriendForm({ ...addFriendForm, name: e.target.value })}
                placeholder={t('enterFriendAccount')}
                maxLength={11}
                minLength={5}
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
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#fff' }}>
                {t('enterPassword').replace('请输入', '')}
              </label>
              <input
                type="password"
                value={addFriendForm.password}
                onChange={(e) => setAddFriendForm({ ...addFriendForm, password: e.target.value })}
                placeholder={t('enterFriendPassword')}
                maxLength={16}
                minLength={6}
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
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#fff' }}>
                {t('captcha')}
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={addFriendForm.code}
                  onChange={(e) => setAddFriendForm({ ...addFriendForm, code: e.target.value })}
                  placeholder={t('enterCaptcha')}
                  maxLength={5}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <img
                  src={captchaImg}
                  alt={t('captcha')}
                  onClick={refreshCaptcha}
                  style={{
                    height: '40px',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleAddFriend}
              disabled={!addFriendForm.name || !addFriendForm.password || !addFriendForm.code}
              style={{
                width: '100%',
                padding: '12px',
                background: (!addFriendForm.name || !addFriendForm.password || !addFriendForm.code) 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'linear-gradient(135deg, #ffd700, #ff8c00)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: (!addFriendForm.name || !addFriendForm.password || !addFriendForm.code) 
                  ? 'not-allowed' 
                  : 'pointer'
              }}
            >
              {t('submit')}
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
