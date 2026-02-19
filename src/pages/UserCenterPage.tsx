/**
 * 个人中心页面 - 完全按照原版实现
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserVip, getUserVipInfo, logoff, transferAll } from '@/lib/api/user';
import { gameTransferOut } from '@/lib/api/game';
import { PageLoader } from '@/components/PageLoader';

// 获取等级图片名称
const getLevelImageName = (level: string): string => {
  const levelMap: Record<string, string> = {
    'NEWCOMER': 'a79587db.png',
    'NORMAL': '2830fbd8.png',
    'SILVER': '77456cf6.png',
    'GOLD': 'd456c2ff.png',
    'PLATINUM': '8641814d.png',
    'DIAMOND': '4495f79b.png',
    'BLACK-GOLD': '0dff4bf0.png'
  };
  const upperLevel = (level || 'NEWCOMER').toUpperCase();
  return levelMap[upperLevel] || levelMap['NEWCOMER'];
};

// 获取等级文字键
const getLevelKey = (level: string): string => {
  const levelKeyMap: Record<string, string> = {
    'NEWCOMER': 'levelNewcomer',
    'NORMAL': 'levelNormal',
    'SILVER': 'levelSilver',
    'GOLD': 'levelGold',
    'PLATINUM': 'levelPlatinum',
    'DIAMOND': 'levelDiamond',
    'BLACK-GOLD': 'levelBlackGold'
  };
  const upperLevel = (level || 'NEWCOMER').toUpperCase();
  return levelKeyMap[upperLevel] || levelKeyMap['NEWCOMER'];
};

// 获取会员等级图标路径（根据level字段，0-10对应vip-0.webp到vip-10.webp）
const getVipIconPath = (level: number | string | undefined): string => {
  const memberLevel = typeof level === 'string' ? parseInt(level, 10) : (level || 0);
  const validLevel = Math.max(0, Math.min(10, memberLevel));
  return `/images/newimg/vip-${validLevel}.webp`;
};

// 优先使用晋级配置中该等级的 level_icon，否则用默认 vip-{level}.webp
const getVipIconPathFromList = (memberLevel: number, list: { level: number; level_icon?: string }[]): string => {
  const levelConfig = list.find((l) => l.level === memberLevel);
  const icon = levelConfig?.level_icon?.trim();
  if (icon) {
    if (icon.startsWith('http') || icon.startsWith('//')) return icon;
    if (icon.startsWith('/')) return icon;
    return `/images/newimg/${icon.replace(/^\//, '')}`;
  }
  return getVipIconPath(memberLevel);
};

export default function UserCenterPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, refreshUserInfo, logout: authLogout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [vipList, setVipList] = useState<any[]>([]);
  const [currentVipLevel, setCurrentVipLevel] = useState<number | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [transferring, setTransferring] = useState(false); // 回收余额加载状态
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 768);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 定期刷新余额（类似PC端和Header）
  useEffect(() => {
    if (isLoggedIn) {
      const refreshBalance = async () => {
        try {
          // 强制刷新，跳过缓存
          if (refreshUserInfo) {
            await refreshUserInfo(true);
          }
        } catch (error) {
          console.error('刷新余额失败:', error);
        }
      };

      // 立即刷新一次
      refreshBalance();
      // 每3.3秒刷新一次（与PC端和Header保持一致）
      const interval = setInterval(() => {
        refreshBalance();
      }, 3300);

      return () => clearInterval(interval);
    }
  }, [isLoggedIn, refreshUserInfo]);
  
  // 广告轮播相关
  const bannerImages = [
    'https://ik.imagekit.io/gpbvknoim/fe1e7ae0-4ccb-4786-8fe8-666254c5cd66.png',
    'https://ik.imagekit.io/gpbvknoim/5b8a493.avif',
    'https://ik.imagekit.io/gpbvknoim/1ea.avif'
  ];
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // 当 userInfo 更新时，同步更新 VIP 等级
  useEffect(() => {
    if (userInfo && userInfo.vip !== undefined && userInfo.vip !== null) {
      setCurrentVipLevel(userInfo.vip);
    }
  }, [userInfo]);

  useEffect(() => {
    if (isLoggedIn) {
      // 先刷新用户信息，确保获取最新的VIP等级
      if (refreshUserInfo) {
        refreshUserInfo(true).then(() => {
          loadVipInfo().finally(() => {
            setLoading(false);
          });
        });
      } else {
        loadVipInfo().finally(() => {
          setLoading(false);
        });
      }
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, refreshUserInfo]);

  // 广告轮播自动切换
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 3000); // 每3秒切换一次

    return () => clearInterval(timer);
  }, [bannerImages.length]);

  // 回收余额（将所有游戏接口余额回收到钱包余额）
  const handleTransferAll = async () => {
    if (transferring) return;
    
    if (!window.confirm('确定要将所有游戏接口余额回收到钱包余额吗？')) {
      return;
    }
    
    setTransferring(true);
    try {
      // 优先尝试使用 transall API
      let transallSuccess = false;
      try {
        const res = await transferAll();
        console.log('💰 transferAll API 响应:', res);
        
        // 检查响应状态：status === 'error' 时视为失败，即使code是200
        if (res.status === 'error') {
          console.warn('⚠️ transall API 返回错误，尝试使用单个平台转出');
        } else if (res.code === 200 || res.status === 'success') {
          console.log('✅ 使用 transall API 回收余额成功');
          alert(res.message || '回收余额成功！');
          transallSuccess = true;
          // 刷新用户余额
          if (refreshUserInfo) {
            await refreshUserInfo(true);
          }
        }
      } catch (error: any) {
        console.warn('⚠️ transall API 调用异常:', error);
      }
      
      // 如果 transall 失败，尝试转出常见平台（FB体育等）
      if (!transallSuccess) {
        console.log('🔄 尝试转出常见游戏平台余额...');
        const commonPlatforms = ['FB', 'AG', 'BBIN', 'JDB', 'PG', 'OB', 'HG', 'SBO', 'IBC'];
        let successCount = 0;
        let failCount = 0;
        
        for (const platform of commonPlatforms) {
          try {
            console.log(`🔄 转出 ${platform} 平台余额...`);
            const res = await gameTransferOut(platform);
            
            if (res.status === 'error') {
              // 422错误通常是用户没有在该平台注册或余额为0，这是正常的，不计数
              if (res.code !== 422) {
                console.warn(`⚠️ ${platform} 转出失败:`, res.message);
                failCount++;
              }
            } else if (res.code === 200 || res.status === 'success') {
              console.log(`✅ ${platform} 转出成功`);
              successCount++;
            }
            
            // 添加短暂延迟，避免请求过于频繁
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err: any) {
            console.warn(`⚠️ ${platform} 转出异常:`, err);
            failCount++;
          }
        }
        
        if (successCount > 0) {
          alert(`回收余额完成！成功转出 ${successCount} 个平台的余额`);
          // 刷新用户余额
          if (refreshUserInfo) {
            await refreshUserInfo(true);
          }
        } else {
          alert('回收余额失败，可能所有游戏平台都没有余额，或者所有平台转出都失败了。');
        }
      }
    } catch (error: any) {
      console.error('❌ 回收余额失败:', error);
      alert(error.message || error.response?.data?.message || '回收余额失败，请稍后重试');
    } finally {
      setTransferring(false);
    }
  };

  const loadVipInfo = async () => {
    try {
      const vipRes = await getUserVip();
      if (vipRes && vipRes.code === 200 && vipRes.data) {
        setVipList(vipRes.data);
      }
    } catch (err) {
      console.error('加载VIP信息失败:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoff();
    } catch (err) {}
    authLogout();
    setShowLogoutDialog(false);
    navigate('/');
  };

  const quickActions = [
    { 
      icon: 'https://www.xpj00000.vip/indexImg/deposit.27dc6f8d.png', 
      labelKey: 'quickDeposit',
      route: '/deposit' 
    },
    { 
      icon: 'https://www.xpj00000.vip/indexImg/withdraw.f24603dc.png', 
      labelKey: 'quickWithdraw',
      route: '/withdraw' 
    },
    { 
      icon: 'https://www.xpj00000.vip/indexImg/record.bc057faa.png', 
      labelKey: 'quickFlow',
      route: '/assets' 
    },
    { 
      icon: 'https://www.xpj00000.vip/indexImg/rebate.4f209c65.png', 
      labelKey: 'quickRecord',
      route: '/game-record' 
    },
  ];

  const menuItems = [
    { icon: 'https://www.xpj00000.vip/indexImg/wallet.421ee419.png', labelKey: 'menuBankCard', route: '/bankcard' },
    { icon: 'https://www.xpj00000.vip/indexImg/interestTreasure.a4f3a5cc.png', labelKey: 'menuCredit', route: '/borrow' },
    { icon: 'https://www.xpj00000.vip/indexImg/recommend.d7ab430f.png', labelKey: 'menuProfile', route: '/profile-detail' },
    { icon: 'https://www.xpj00000.vip/indexImg/join.7d2d9b1b.png', labelKey: 'menuPromotion', route: '/promotion' },
    { icon: 'https://www.xpj00000.vip/indexImg/myNews.df8f982c.png', labelKey: 'menuMessage', route: '/message' },
    { icon: 'https://www.xpj00000.vip/indexImg/setting.e907f3f7.png', labelKey: 'menuAccount', route: '/account' },
    { icon: 'https://www.xpj00000.vip/indexImg/forum.628ffea7.png', labelKey: 'menuBalance', route: '/balance' },
    { icon: 'https://www.xpj00000.vip/indexImg/myGame.58ded3b5.png', labelKey: 'menuRebate', route: '/rebate' },
  ];

  return (
    <>
      <PageLoader loading={loading || authLoading} />
      <div style={{ minHeight: '100vh', background: 'rgb(12, 16, 23)', color: '#fff', paddingBottom: '80px' }}>
      {/* 头部区域 - 带背景图 */}
      <div style={{
        width: '100%',
        padding: '20px 16px',
        backgroundImage: 'url(https://www.xpj00000.vip/indexImg/bg_header.b9ef1996.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        {/* 用户信息 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            marginRight: '15px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img
              src={isLoggedIn ? 'https://www.xpj00000.vip/indexImg/下载.png' : 'https://www.xpj00000.vip/indexImg/下载.png'}
              alt="头像"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div
                onClick={() => !isLoggedIn && navigate('/login')}
                style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isLoggedIn && userInfo ? (
                  <>
                    <span>{userInfo.username || userInfo.name || '用户'}</span>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      flexDirection: 'row',
                      height: '32px',
                      padding: '4px 4px 4px 8px',
                      borderLeft: '0.5px solid rgba(252, 26, 25, 0.45)',
                      borderRight: '0.5px solid rgba(252, 26, 25, 0.45)',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      position: 'relative'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        flexDirection: 'row',
                        overflow: 'hidden',
                        color: '#ffc53e',
                        fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                        fontSize: '16px',
                        fontWeight: 700
                      }}>
                        <img 
                          src="https://www.xpj00000.vip/indexImg/CNY.1969f5d5.png" 
                          alt="货币"
                          className="money-icon"
                          style={{
                            width: '16px',
                            height: '16px',
                            marginRight: '4px'
                          }}
                        />
                        <span>{(userInfo.balance || 0).toFixed(2).split('.')[0]}. </span>
                        <span className="decimal">{(userInfo.balance || 0).toFixed(2).split('.')[1]} </span>
                      </div>
                    </div>
                  </>
                ) : t('pleaseLogin')}
              </div>
            </div>
            {isLoggedIn && userInfo && (() => {
              const memberLevel = userInfo.level !== undefined && userInfo.level !== null 
                ? userInfo.level 
                : 0;
              const vipIconPath = vipList?.length ? getVipIconPathFromList(memberLevel, vipList) : getVipIconPath(memberLevel);
              return (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  flexDirection: 'row',
                  width: '102px',
                  height: '36px',
                  position: 'relative'
                }}>
                  <img
                    src={vipIconPath}
                    alt={`VIP${memberLevel}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'left center'
                    }}
                    onError={(e) => {
                      // 如果图标加载失败，使用默认图标
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/newimg/vip-0.webp';
                    }}
                  />
                </div>
              );
            })()}
          </div>
        </div>

        {/* VIP区域 */}
        <div style={{ position: 'relative', width: '100%', minHeight: '90px', marginTop: '16px' }}>
          <img
            src="https://www.xpj00000.vip/indexImg/下载 (2).png"
            alt="VIP"
            style={{
              position: 'absolute',
              top: '-32px',
              right: '-8px',
              width: 'auto',
              height: 'auto',
              maxWidth: '90px',
              maxHeight: '90px',
              zIndex: 10
            }}
          />
          <img
            src="https://www.xpj00000.vip/indexImg/%E4%B8%8B%E8%BD%BD%20(3).png"
            alt="VIP背景"
            style={{
              position: 'absolute',
              top: '20px',
              left: 0,
              width: '100%',
              height: 'auto',
              minHeight: '90px',
              zIndex: 0
            }}
          />
          {isLoggedIn && userInfo ? (
            <>
              <img
                src="https://www.xpj00000.vip/indexImg/vip_title.55fb8526.png"
                alt="VIP标题"
                style={{
                  position: 'absolute',
                  bottom: '25px',
                  left: '10px',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '60%',
                  zIndex: 5
                }}
              />
              <img
                src="/images/newimg/chakan.avif"
                alt="查看VIP等级"
                onClick={() => navigate('/vip')}
                style={{
                  position: 'absolute',
                  bottom: '27px',
                  left: isDesktop ? '300px' : '240px',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '70px',
                  maxHeight: '32px',
                  zIndex: 5,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            </>
          ) : (
            <div style={{
              position: 'absolute',
              bottom: '35px',
              left: '10px',
              right: '10px',
              display: 'flex',
              alignItems: 'center',
              zIndex: 5
            }}>
              <div style={{
                fontSize: '18px',
                background: 'linear-gradient(270deg, #f8d494, #e08235)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {t('loginToViewPrivileges')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主要内容 */}
      <div style={{ 
        width: '100%',
        padding: '14px 16px 0',
        marginTop: '-10%',
        background: 'linear-gradient(180deg, rgba(12, 16, 23, 0.4), #0c1017)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box'
      }}>
        {/* 快捷入口 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          listStyle: 'none',
          padding: 0,
          margin: '0 0 20px 0'
        }}>
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={() => isLoggedIn ? navigate(action.route) : navigate('/login')}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '15px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{
                width: '52px',
                height: '52px',
                marginBottom: '8px',
                backgroundImage: `url(${action.icon})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}></div>
              <div style={{ 
                fontSize: '12px', 
                color: '#fff',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>{t(action.labelKey)}</div>
            </div>
          ))}
        </div>

        {/* 轮播广告 */}
        <div style={{ 
          width: '100%', 
          height: '180px', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          marginBottom: '16px',
          position: 'relative'
        }}>
          {bannerImages.map((image, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: currentBannerIndex === index ? 1 : 0,
                transition: 'opacity 0.5s ease',
                zIndex: currentBannerIndex === index ? 1 : 0,
                borderRadius: index === 2 ? '12px' : '0',
                overflow: index === 2 ? 'hidden' : 'visible',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: index === 2 ? 'linear-gradient(180deg, rgba(12, 16, 23, 0.6), rgba(12, 16, 23, 0.9))' : 'transparent'
              }}
            >
              <img
                src={image}
                alt={`广告${index + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: index === 2 ? 'contain' : 'cover',
                  borderRadius: index === 2 ? '12px' : '0'
                }}
              />
            </div>
          ))}
          {/* 分页指示器 */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            zIndex: 2
          }}>
            {bannerImages.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: currentBannerIndex === index ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'background 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentBannerIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* 功能菜单 */}
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            {menuItems.map((item, index) => (
              <div
                key={index}
                onClick={() => isLoggedIn ? navigate(item.route) : navigate('/login')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <img src={item.icon} alt={t(item.labelKey)} style={{ width: '32px', height: '32px', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>{t(item.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 退出登录 */}
        {isLoggedIn && (
          <div
            onClick={() => setShowLogoutDialog(true)}
            style={{
              marginTop: '16px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)'
            }}
          >
            {t('logout')}
          </div>
        )}
      </div>

      {/* 退出确认弹窗 */}
      {showLogoutDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#1a1a1c',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            position: 'relative'
          }}>
            <div
              onClick={() => setShowLogoutDialog(false)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                fontSize: '32px',
                color: '#999',
                cursor: 'pointer',
                fontStyle: 'normal'
              }}
            >
              ×
            </div>
            <div style={{ textAlign: 'center', fontSize: '24px', color: '#fff', marginBottom: '24px', fontWeight: 600 }}>
              {t('confirmLogout')}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                onClick={() => setShowLogoutDialog(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              >
                {t('keepPlaying')}
              </div>
              <div
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '12px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  color: '#000'
                }}
              >
                {t('logout')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
