/**
 * 洗码返利页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRebateList, claimRebate, RebateItem } from '@/lib/api/activity';
import { getUserInfo } from '@/lib/api/auth';
import { PageLoader } from '@/components/PageLoader';

export default function RebatePage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [rebateList, setRebateList] = useState<RebateItem[]>([]);
  const [deadtime, setDeadtime] = useState<number>(0);
  const [todayRebate, setTodayRebate] = useState<number>(0);
  const [yesterdayRebate, setYesterdayRebate] = useState<number>(0);
  const [totalRebate, setTotalRebate] = useState<number>(0);
  const [currentSettlable, setCurrentSettlable] = useState<number>(0);
  const [currentSettlableUsdt, setCurrentSettlableUsdt] = useState<number>(0);
  const [weekValidBet, setWeekValidBet] = useState<number>(0);
  const [weekRebateAmount, setWeekRebateAmount] = useState<number>(0);
  const [memberLevel, setMemberLevel] = useState<number>(0);
  const [rebateRates, setRebateRates] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // 等待认证加载完成
    if (authLoading) {
      return;
    }
    
    // 如果认证完成但未登录，跳转到登录页
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    // 已登录，加载数据
    loadRebateData();
  }, [isLoggedIn, authLoading, navigate]);

  const loadRebateData = async () => {
    try {
      setLoading(true);

      try {
        const userInfoRes = await getUserInfo();
        if (userInfoRes?.data?.level !== undefined) {
          setMemberLevel(userInfoRes.data.level || 0);
        }
      } catch (error) {
        console.warn('⚠️ 获取用户信息失败:', error);
      }
      
      const res = await getRebateList();

      if (res) {
        const data = Array.isArray(res.data) ? res.data : [];
        setRebateList(data);
        setDeadtime(res.deadtime || Math.floor(Date.now() / 1000));
        setTodayRebate(res.today || 0);
        setYesterdayRebate(res.yesterday || 0);
        setTotalRebate(res.total || 0);
        
        // 不显示"未配置反水等级"的错误信息，因为系统反水是配置好的
        // 如果用户没有反水数据，只是说明当前没有可领取的返利，不是配置问题
        // 只有当确实是系统错误时才显示错误信息（排除"未配置反水等级"相关错误）
        if (res.status === 'error' && res.message) {
          const errorMsg = res.message;
          if (errorMsg.includes('未配置反水') || errorMsg.includes('反水等级') || errorMsg.includes('fs_level')) {
            setErrorMessage('');
          } else {
            setErrorMessage(errorMsg);
          }
        } else {
          setErrorMessage('');
        }
        
        // 计算当前可结算金额（API 已做字段规范化，此处兼容多种字段名）
        const totalFsMoney = Array.isArray(data)
          ? data.reduce((sum: number, item: any) => {
              const fsMoney = parseFloat(
                item.fs_money ?? item.fsMoney ?? item.rebate_amount ?? item.rebateAmount ?? 0
              );
              return sum + fsMoney;
            }, 0)
          : 0;
        setCurrentSettlable(totalFsMoney);
        setCurrentSettlableUsdt(totalFsMoney);
        
        // 计算本周有效投注和洗码金额
        let weekBet = 0;
        let weekRebate = 0;
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const validBet = parseFloat(
              item.total_valid || 
              item.totalValid || 
              item.valid_bet || 
              item.validBet ||
              0
            );
            const rebate = parseFloat(
              item.fs_money || 
              item.fsMoney || 
              item.rebate_amount || 
              item.rebateAmount ||
              0
            );
            weekBet += validBet;
            weekRebate += rebate;
          });
        }
        setWeekValidBet(weekBet);
        setWeekRebateAmount(weekRebate);
        
        // 从反水数据中提取每个游戏类型的反水率
        const ratesMap: Record<string, number> = {};
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const gameType = item.gameType || item.game_type;
            const rate = parseFloat(item.rate || 0);
            if (gameType && rate > 0) {
              ratesMap[gameType] = rate;
            }
          });
        }
        setRebateRates(Object.entries(ratesMap).map(([gameType, rate]) => ({
          gameType,
          rate
        })));
        
      } else {
        setRebateList([]);
      }
    } catch (_error: any) {
      setRebateList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRebate = async () => {
    if (currentSettlable <= 0) {
      alert('当前没有可结算的洗码返利');
      return;
    }

    if (!window.confirm(`确定要领取 ${currentSettlable.toFixed(2)} 元的洗码返利吗？`)) {
      return;
    }

    try {
      setClaiming(true);
      const res = await claimRebate(deadtime);
      if (res.code === 200) {
        alert(res.message || '领取成功！');
        // 重新加载数据
        await loadRebateData();
        // 刷新用户余额
        window.location.reload();
      } else {
        alert(res.message || '领取失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('领取洗码返利失败:', error);
      alert(error.message || '领取失败，请稍后重试');
    } finally {
      setClaiming(false);
    }
  };

  // 游戏类型配置（根据截图）
  // 游戏类型映射：1=真人, 2=电游, 3=电游, 4=体育, 5=彩票, 6=棋牌, 7=捕鱼, 99=其他
  // 注意：2和3都是电游，需要合并显示
  const defaultGameTypes = [
    { key: '1', label: '真人', icon: '/images/newimg/zr.avif', gameTypeNums: [1] },
    { key: '2', label: '电游', icon: '/images/newimg/dy.avif', gameTypeNums: [2, 3] },
    { key: '4', label: '体育', icon: '/images/newimg/1.avif', gameTypeNums: [4] },
    { key: '5', label: '彩票', icon: '/images/newimg/cp.avif', gameTypeNums: [5] },
  ];
  
  // 显示所有游戏类型，反水比例严格按接口返回（与后台设置一致，不做合并取高）
  const gameTypes = React.useMemo(() => {
    const rateMap = new Map<string, number>();
    rebateList.forEach((item: any) => {
      const gameTypeNum = parseInt(item.gameType || item.game_type || '0');
      const rate = parseFloat(item.rate ?? 0);
      const gameTypeConfig = defaultGameTypes.find(config =>
        config.gameTypeNums.includes(gameTypeNum)
      );
      if (gameTypeConfig) {
        const key = gameTypeConfig.key;
        // 同类型多档（如 2、3 均为电游）时保留后台返回的该类型首次出现的比例，与后台一致
        if (!rateMap.has(key)) {
          rateMap.set(key, rate);
        }
      }
    });
    return defaultGameTypes.map(config => ({
      key: config.key,
      label: config.label,
      icon: config.icon,
      rate: rateMap.has(config.key)
        ? `${Number(rateMap.get(config.key)).toFixed(2)}%`
        : '0%'
    }));
  }, [rebateList]);

  return (
    <>
      <PageLoader loading={loading || authLoading} />
      <div style={{ 
        minHeight: '100vh', 
        background: 'rgb(12, 16, 23)', 
        color: '#fff',
        paddingBottom: '80px'
      }}>
        {/* 头部 */}
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
          <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>洗码返利</h2>
        </div>

        {/* 主要内容 */}
        <div style={{ padding: '16px' }}>
          {/* 当前可结算区域 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(101, 67, 33, 0.2))',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(139, 69, 19, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                  当前可结算
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc53e' }}>
                  {currentSettlable.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                  ≈ {currentSettlableUsdt.toFixed(2)}元
                </div>
              </div>
              <div
                onClick={() => navigate('/assets?type=4')}
                style={{
                  fontSize: '14px',
                  color: '#ffc53e',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                洗码记录 &gt;
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                  有效投注流水
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {weekValidBet.toFixed(2)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                  可领取返利金额
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {weekRebateAmount.toFixed(2)}元
                </div>
              </div>
            </div>

            <button
              onClick={handleClaimRebate}
              disabled={claiming || currentSettlable <= 0}
              style={{
                width: '100%',
                padding: '14px',
                background: claiming || currentSettlable <= 0 
                  ? 'rgba(139, 69, 19, 0.5)' 
                  : 'linear-gradient(135deg, #8b4513, #654321)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: claiming || currentSettlable <= 0 ? 'not-allowed' : 'pointer',
                opacity: claiming || currentSettlable <= 0 ? 0.6 : 1
              }}
            >
              {claiming ? '领取中...' : '一键洗码'}
            </button>
          </div>

          {/* 会员等级提示和说明 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px' }}>
              您当前{memberLevel || 0}星级，升级1星级即可享受洗码优惠
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '8px',
              lineHeight: '1.5'
            }}>
              洗码返利根据您的有效投注流水自动计算，投注越多返利越多
            </div>
            {errorMessage && (
              <div style={{ 
                fontSize: '12px', 
                color: '#ff6b6b',
                marginTop: '8px',
                padding: '8px',
                background: 'rgba(255, 107, 107, 0.1)',
                borderRadius: '4px'
              }}>
                {errorMessage}
              </div>
            )}
          </div>

          {/* 游戏类型和返利比例 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              justifyContent: 'space-around'
            }}>
              {gameTypes.map((type) => (
                <div
                  key={type.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <img
                      src={type.icon}
                      alt={type.label}
                      style={{
                        width: '44px',
                        height: '44px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#fff', marginBottom: '4px' }}>
                    {type.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    {type.rate}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 游戏大厅列表 */}
            <div style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px'
            }}>
              PA旗舰厅、PA国际厅、波音厅、EVO厅、WALI视讯
            </div>
          </div>

          {/* 洗码明细（可展开） */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>洗码明细</div>
              <div style={{ fontSize: '20px' }}>▲</div>
            </div>
            
            {rebateList.length > 0 ? (
              <div style={{ marginTop: '16px' }}>
                {rebateList.map((item: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {item.game_type_text ?? item.gameType ?? '-'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#ffc53e' }}>
                        {(parseFloat(item.fs_money ?? item.fsMoney ?? 0)).toFixed(2)}元
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      有效投注流水: {(parseFloat(item.total_valid ?? item.totalValid ?? 0)).toFixed(2)} | 
                      返利比例: {(parseFloat(item.rate ?? 0)).toFixed(2)}%
                    </div>
                    {(item.api_names ?? item.apiNames) && (
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                        游戏接口: {item.api_names ?? item.apiNames}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                <div style={{ marginBottom: '12px', fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  暂无可领取的洗码返利
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  洗码返利根据您的有效投注流水自动计算
                  <br />
                  请先进行游戏投注，系统会根据您的投注流水计算返利
                  <br />
                  已领取的返利不会重复计算
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
