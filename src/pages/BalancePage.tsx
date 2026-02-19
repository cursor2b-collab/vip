/**
 * 额度转换页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getServerBalance, getServerBalanceAll, getServerTransferAll, gameTransferIn, gameTransferOut, toBetPlayerId, getCurrency } from '@/lib/api/game';
import { DEFAULT_PLATFORMS } from '@/lib/platforms';

interface GameApi {
  id: number;
  api_name: string;
  title: string;
  icon_url?: string;
  [key: string]: any;
}

export default function BalancePage() {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, refreshUserInfo, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [gameApis, setGameApis] = useState<GameApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState<{ [key: string]: boolean }>({});
  const [balances, setBalances] = useState<{ [key: string]: number }>({});
  const [refreshing, setRefreshing] = useState<{ [key: string]: boolean }>({});
  const [accountType, setAccountType] = useState<'money' | 'fs_money'>('money'); // 'money' 账户余额, 'fs_money' 反水账户
  const [balanceAllLoading, setBalanceAllLoading] = useState(false); // 一键查询中
  const [transferAllLoading, setTransferAllLoading] = useState(false); // 一键回收中

  const playerId = toBetPlayerId(userInfo?.username ?? userInfo?.id ?? null);
  const currency = getCurrency();

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (playerId) loadPlatformsAndBalances();
  }, [authLoading, isLoggedIn, navigate, userInfo, playerId]);

  // 添加旋转动画keyframes
  useEffect(() => {
    const styleId = 'refresh-spin-animation';
    if (document.getElementById(styleId)) {
      return; // 样式已存在，不需要重复添加
    }
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  /** 平台列表与后台 #/lottery/game-list 一致：使用 DEFAULT_PLATFORMS；余额从 server/balanceAll 填充 */
  const loadPlatformsAndBalances = async () => {
    if (!playerId) return;
    setLoading(true);
    setBalanceAllLoading(true);
    try {
      const apis: GameApi[] = DEFAULT_PLATFORMS.map((p, i) => ({
        id: i,
        api_name: p.code,
        title: p.name
      }));
      setGameApis(apis);

      const res = await getServerBalanceAll({ playerId, currency });
      const next: { [key: string]: number } = {};
      if (res.code === 200 && res.data && typeof res.data === 'object') {
        apis.forEach((api) => {
          const key = api.api_name.toLowerCase();
          const val = res.data![key] ?? res.data![api.api_name];
          next[api.api_name] = val != null ? Number(val) : 0;
        });
      } else {
        apis.forEach((api) => { next[api.api_name] = 0; });
      }
      setBalances(next);
    } catch (e) {
      console.error('加载平台列表失败:', e);
      setGameApis([]);
      setBalances({});
    } finally {
      setLoading(false);
      setBalanceAllLoading(false);
    }
  };

  const loadAllBalances = async (apis?: GameApi[]) => {
    const list = apis ?? gameApis;
    if (!playerId || list.length === 0) return;
    setBalanceAllLoading(true);
    try {
      const res = await getServerBalanceAll({ playerId, currency });
      if (res.code === 200 && res.data) {
        const next: { [key: string]: number } = {};
        list.forEach((api) => {
          const key = String(api.api_name || '').toLowerCase();
          const val = res.data![key] ?? res.data![api.api_name];
          next[api.api_name] = val != null ? Number(val) : 0;
        });
        setBalances(next);
      }
    } catch (e) {
      console.error('一键查询失败:', e);
    } finally {
      setBalanceAllLoading(false);
    }
  };

  const handleTransferIn = async (apiName: string) => {
    if (transferring[apiName]) return;
    
    const amount = prompt(t('enterTransferAmount').replace('{name}', apiName));
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert(t('enterValidAmount'));
      return;
    }

    setTransferring({ ...transferring, [apiName]: true });
    try {
      const res = await gameTransferIn(apiName, parseFloat(amount));
      if (res.code === 200 || res.status === 'success') {
        alert(t('transferInSuccess'));
        if (refreshUserInfo) {
          await refreshUserInfo(true);
        }
        // 刷新该接口的余额
        await refreshBalance(apiName);
      } else {
        alert(res.message || t('transferInFailed'));
      }
    } catch (error: any) {
      console.error('转入失败:', error);
      alert(error.message || error.response?.data?.message || t('transferOutFailedRetry'));
    } finally {
      setTransferring({ ...transferring, [apiName]: false });
    }
  };

  const handleTransferOut = async (apiName: string) => {
    if (transferring[apiName]) return;
    
    // 记录转出前的余额
    const beforeBalance = userInfo?.money !== undefined && userInfo?.money !== null 
      ? userInfo.money 
      : (userInfo?.balance || 0);
    console.log('💰 转出前账户余额:', beforeBalance);
    
    let apiBalance = 0;
    try {
      const platType = String(apiName || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      const balanceRes = await getServerBalance({ playerId, platType, currency });
      if (balanceRes.code === 200 && balanceRes.data) {
        const b = balanceRes.data.balance;
        apiBalance = b != null ? Number(b) : 0;
        console.log('💰 接口余额:', apiBalance);
      }
    } catch (error) {
      console.warn('获取接口余额失败:', error);
    }
    
    if (apiBalance <= 0) {
      alert(t('apiBalanceZero'));
      return;
    }
    
    if (!window.confirm(t('confirmTransferOut').replace('{name}', apiName).replace('{amount}', apiBalance.toFixed(2)))) {
      return;
    }
    
    setTransferring({ ...transferring, [apiName]: true });
    try {
      const res = await gameTransferOut(apiName);
      console.log('🔄 转出完整响应:', JSON.stringify(res, null, 2));
      
      if (res.code === 200 && res.status !== 'error') {
        console.log('✅ 转出接口返回成功，开始刷新余额...');
        console.log('💰 转出金额:', res.data?.money || res.money || apiBalance);
        
        // 等待后端处理完成（数据库更新需要时间，特别是文件锁释放后）
        console.log('⏳ 等待后端处理完成...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 先刷新该接口的余额（应该变为0）
        console.log('🔄 刷新接口余额...');
        await refreshBalance(apiName);
        
        // 再次等待
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 强制刷新用户信息（中心钱包余额）多次，确保获取最新
        if (refreshUserInfo) {
          console.log('🔄 第1次刷新用户信息（中心钱包余额）...');
          await refreshUserInfo(true);
          
          // 等待状态更新
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          console.log('🔄 第2次刷新用户信息（中心钱包余额）...');
          await refreshUserInfo(true);
          
          // 再次等待
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('🔄 第3次刷新用户信息（中心钱包余额）...');
          await refreshUserInfo(true);
          
          // 最后一次等待，确保状态更新
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // 再次刷新接口余额，确认已转出
        console.log('🔄 最后刷新接口余额，确认已转出...');
        await refreshBalance(apiName);
        
        // 显示成功提示，并提示用户刷新页面查看最新余额
        alert(t('transferOutSuccess').replace('{amount}', apiBalance.toFixed(2)));
      } else {
        const errorMsg = res.message || t('transferOutFailed');
        console.error('❌ 转出失败:', errorMsg);
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ 转出异常:', error);
      const errorMsg = error.message || error.response?.data?.message || t('transferOutFailedRetry');
      alert(errorMsg);
    } finally {
      setTransferring({ ...transferring, [apiName]: false });
    }
  };

  const refreshBalance = async (apiName: string) => {
    if (refreshing[apiName] || !playerId) return;
    const platType = String(apiName || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    setRefreshing({ ...refreshing, [apiName]: true });
    try {
      const res = await getServerBalance({ playerId, platType, currency });
      if (res.code === 200 && res.data) {
        const b = res.data.balance;
        setBalances((prev) => ({ ...prev, [apiName]: b != null ? Number(b) : 0 }));
      }
    } catch (error) {
      console.error(`刷新${apiName}余额失败:`, error);
    } finally {
      setRefreshing({ ...refreshing, [apiName]: false });
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(12, 16, 23)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {t('loading')}
      </div>
    );
  }
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div style={{ 
      height: '100vh',
      minHeight: '100vh', 
      background: 'rgb(12, 16, 23)', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      overflowX: 'hidden'
    }}>
      {/* PC端居中容器：固定高度，内容区可滚动 */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        height: '100%',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
        background: 'rgb(12, 16, 23)',
        overflow: 'hidden',
        overflowX: 'hidden'
      }}>
        {/* 头部 */}
        <div style={{ 
          flexShrink: 0,
          padding: '15px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          display: 'flex', 
          alignItems: 'center',
          position: 'relative'
        }}>
          <button 
            type="button"
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
              justifyContent: 'center',
              touchAction: 'manipulation'
            }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: '#fff' }} />
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', flex: 1, textAlign: 'center' }}>{t('balanceTitle')}</h1>
        </div>

        {/* 内容区域：可上下滑动，touchAction 避免触摸与点击冲突 */}
        <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowX: 'hidden', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', padding: '20px' }}>

      {/* 钱包余额显示：使用图片背景 */}
      <div style={{ 
        backgroundImage: 'url(/images/newimg/1.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderRadius: '12px', 
        padding: '16px', 
        marginBottom: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        minHeight: '82px'
      }}>
        {/* 余额显示：标签与金额横向对齐 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', color: '#999' }}>
            {accountType === 'money' ? t('accountBalance') : t('rebateAccount')}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc53e' }}>
            ¥{accountType === 'money'
              ? (userInfo?.money !== undefined && userInfo?.money !== null
                  ? userInfo.money
                  : (userInfo?.balance !== undefined && userInfo?.balance !== null
                     ? userInfo.balance
                     : 0)).toFixed(2)
              : (userInfo?.fs_money || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* 一键查询 / 一键回收 */}
      {gameApis.length > 0 && playerId && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => loadAllBalances()}
            disabled={balanceAllLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'rgba(74, 158, 255, 0.2)',
              color: '#fff',
              border: '1px solid rgba(74, 158, 255, 0.5)',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: balanceAllLoading ? 'not-allowed' : 'pointer',
              opacity: balanceAllLoading ? 0.7 : 1,
              touchAction: 'manipulation'
            }}
          >
            {balanceAllLoading ? t('loading') : t('balanceOneClickQuery')}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (transferAllLoading || !playerId) return;
              setTransferAllLoading(true);
              try {
                const res = await getServerTransferAll({ playerId, currency });
                if (res.code === 200 && res.data) {
                  const total = res.data.balanceAll ?? 0;
                  if (refreshUserInfo) await refreshUserInfo(true);
                  await loadAllBalances();
                  alert(total > 0 ? t('transferOutSuccess').replace('{amount}', Number(total).toFixed(2)) : t('apiBalanceZero'));
                } else {
                  alert(res.message || t('transferOutFailed'));
                }
              } catch (e: any) {
                alert(e?.message || t('transferOutFailedRetry'));
              } finally {
                setTransferAllLoading(false);
              }
            }}
            disabled={transferAllLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'rgba(255, 197, 62, 0.2)',
              color: '#ffc53e',
              border: '1px solid rgba(255, 197, 62, 0.5)',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: transferAllLoading ? 'not-allowed' : 'pointer',
              opacity: transferAllLoading ? 0.7 : 1,
              touchAction: 'manipulation'
            }}
          >
            {transferAllLoading ? t('loading') : t('balanceOneClickRecall')}
          </button>
        </div>
      )}

      {/* 游戏接口列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>{t('loading')}</div>
      ) : gameApis.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>{t('noGameApis')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {gameApis.map((api) => (
            <div
              key={api.api_name}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '14px', textAlign: 'center', color: '#fff' }}>
                {api.title || api.api_name}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#999',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>余额: {balances[api.api_name] !== undefined ? `¥${balances[api.api_name].toFixed(2)}` : 'N/A'}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    refreshBalance(api.api_name);
                  }}
                  disabled={refreshing[api.api_name]}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4A9EFF',
                    cursor: refreshing[api.api_name] ? 'not-allowed' : 'pointer',
                    padding: '2px 4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: refreshing[api.api_name] ? 0.6 : 1,
                    width: '20px',
                    height: '20px',
                    touchAction: 'manipulation'
                  }}
                  title={t('refreshBalance')}
                >
                  <RefreshCw 
                    size={16} 
                    style={{
                      animation: refreshing[api.api_name] ? 'spin 1s linear infinite' : 'none',
                      transformOrigin: 'center'
                    }}
                  />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTransferIn(api.api_name);
                  }}
                  disabled={transferring[api.api_name]}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#ffc53e',
                    color: '#151A23',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: transferring[api.api_name] ? 'not-allowed' : 'pointer',
                    opacity: transferring[api.api_name] ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    touchAction: 'manipulation'
                  }}
                >
                  {t('transferIn')}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTransferOut(api.api_name);
                  }}
                  disabled={transferring[api.api_name]}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: transferring[api.api_name] ? 'not-allowed' : 'pointer',
                    opacity: transferring[api.api_name] ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    touchAction: 'manipulation'
                  }}
                >
                  {t('transferOut')}
                </button>
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

