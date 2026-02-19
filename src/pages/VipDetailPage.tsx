/**
 * VIP详情页面 - 新样式设计
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserVipInfo, VipInfoResponse } from '@/lib/api/user';

export default function VipDetailPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, loading: authLoading } = useAuth();
  const [vipInfo, setVipInfo] = useState<VipInfoResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    loadVipInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authLoading]);

  const loadVipInfo = async () => {
    try {
      setLoading(true);
      const response = await getUserVipInfo();
      if (response.code === 200 && response.data) {
        if (response.data.levels && response.data.levels.length > 0) {
          setVipInfo(response.data);
          // 设置当前用户的VIP等级索引
          const currentLevel = userInfo?.vip || 0;
          const levelIndex = response.data.levels.findIndex(l => l.level === currentLevel);
          setCardIndex(levelIndex >= 0 ? levelIndex : 0);
        } else {
          setVipInfo(null);
        }
      } else {
        setVipInfo(null);
      }
    } catch (error: any) {
      console.error('加载VIP信息失败:', error);
      setVipInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd || !vipInfo?.levels) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && cardIndex < vipInfo.levels.length - 1) {
      setCardIndex(cardIndex + 1);
    }
    if (isRightSwipe && cardIndex > 0) {
      setCardIndex(cardIndex - 1);
    }
  };

  const scrollToCard = (index: number) => {
    if (!vipInfo?.levels || index < 0 || index >= vipInfo.levels.length) return;
    setCardIndex(index);
    
    // 滚动卡片容器
    if (scrollContainerRef.current) {
      const cardWidth = window.innerWidth - 32; // 卡片宽度
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
    
    // 滚动标签容器，让被点击的标签可见
    if (tabsContainerRef.current) {
      const tabsContainer = tabsContainerRef.current;
      const buttons = tabsContainer.querySelectorAll('button');
      if (buttons[index]) {
        const button = buttons[index] as HTMLElement;
        const containerRect = tabsContainer.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        
        // 计算按钮相对于容器的位置
        const buttonLeft = button.offsetLeft;
        const buttonWidth = button.offsetWidth;
        const containerWidth = containerRect.width;
        const scrollLeft = tabsContainer.scrollLeft;
        
        // 计算目标滚动位置：让按钮居中或至少完全可见
        const buttonCenter = buttonLeft + buttonWidth / 2;
        const containerCenter = scrollLeft + containerWidth / 2;
        const targetScrollLeft = scrollLeft + (buttonCenter - containerCenter);
        
        tabsContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth'
        });
      }
    }
  };

  // 当卡片索引改变时，滚动到对应位置
  useEffect(() => {
    if (vipInfo && vipInfo.levels && vipInfo.levels.length > 0 && scrollContainerRef.current) {
      const cardWidth = window.innerWidth - 32; // 卡片宽度
      scrollContainerRef.current.scrollTo({
        left: cardIndex * cardWidth,
        behavior: 'smooth'
      });
    }
    
    // 同时滚动标签容器，让对应的标签可见
    if (tabsContainerRef.current && vipInfo?.levels) {
      const tabsContainer = tabsContainerRef.current;
      const buttons = tabsContainer.querySelectorAll('button');
      if (buttons[cardIndex]) {
        const button = buttons[cardIndex] as HTMLElement;
        const containerRect = tabsContainer.getBoundingClientRect();
        const buttonLeft = button.offsetLeft;
        const buttonWidth = button.offsetWidth;
        const containerWidth = containerRect.width;
        const scrollLeft = tabsContainer.scrollLeft;
        
        // 计算按钮中心位置
        const buttonCenter = buttonLeft + buttonWidth / 2;
        const containerCenter = scrollLeft + containerWidth / 2;
        const targetScrollLeft = scrollLeft + (buttonCenter - containerCenter);
        
        tabsContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [cardIndex, vipInfo]);

  // 等待认证加载完成或VIP数据加载完成
  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0C1017',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  // 如果VIP信息未加载，显示错误提示
  if (!loading && (!vipInfo || !vipInfo.levels || vipInfo.levels.length === 0)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0C1017',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>
          暂无VIP信息
        </div>
        <button
          onClick={() => loadVipInfo()}
          style={{
            padding: '10px 20px',
            background: '#eab308',
            color: '#1e293b',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          重新加载
        </button>
      </div>
    );
  }

  const currentLevelInfo = vipInfo.levels[cardIndex];
  const currentUserLevel = userInfo?.vip || 0;
  const isUnlocked = currentLevelInfo.level <= currentUserLevel;

  // 计算升级进度
  const nextLevelInfo = vipInfo.levels.find(l => l.level === (currentLevelInfo.level + 1)) || null;
  const levelupType = nextLevelInfo?.levelup_type || currentLevelInfo?.levelup_type || 1;
  const totalBet = Number(vipInfo?.total_bet || 0);
  const totalDeposit = Number(vipInfo?.total_deposit || 0);
  
  let currentPoints = 0;
  let requiredPoints = 0;
  
  if (levelupType === 1) {
    currentPoints = totalDeposit;
    requiredPoints = Number(nextLevelInfo?.deposit_money) || 0;
  } else if (levelupType === 2) {
    currentPoints = totalBet;
    requiredPoints = Number(nextLevelInfo?.bet_money) || 0;
  } else if (levelupType === 3) {
    currentPoints = Math.max(totalDeposit, totalBet);
    const depositRequired = Number(nextLevelInfo?.deposit_money) || 0;
    const betRequired = Number(nextLevelInfo?.bet_money) || 0;
    requiredPoints = Math.max(depositRequired, betRequired);
  } else if (levelupType === 4) {
    const depositRequired = Number(nextLevelInfo?.deposit_money) || 0;
    const betRequired = Number(nextLevelInfo?.bet_money) || 0;
    currentPoints = Math.min(totalDeposit, totalBet);
    requiredPoints = Math.min(depositRequired, betRequired);
  }
  
  const upgradeProgress = requiredPoints > 0 ? Math.min((currentPoints / requiredPoints) * 100, 100) : 0;
  const monthUpgradePoints = currentPoints;
  const monthUpgradeRequired = requiredPoints;

  // 保级积分
  let monthRetentionPoints = 0;
  let monthRetentionRequired = 0;
  const currentLevelupType = currentLevelInfo?.levelup_type || 1;
  
  if (currentLevelInfo) {
    if (currentLevelupType === 1) {
      monthRetentionPoints = totalDeposit;
      monthRetentionRequired = Number(currentLevelInfo.deposit_money) || 0;
    } else if (currentLevelupType === 2) {
      monthRetentionPoints = totalBet;
      monthRetentionRequired = Number(currentLevelInfo.bet_money) || 0;
    } else if (currentLevelupType === 3) {
      monthRetentionPoints = Math.max(totalDeposit, totalBet);
      monthRetentionRequired = Math.max(Number(currentLevelInfo.deposit_money) || 0, Number(currentLevelInfo.bet_money) || 0);
    } else if (currentLevelupType === 4) {
      monthRetentionPoints = Math.min(totalDeposit, totalBet);
      monthRetentionRequired = Math.min(Number(currentLevelInfo.deposit_money) || 0, Number(currentLevelInfo.bet_money) || 0);
    }
  }
  const retentionProgress = monthRetentionRequired > 0 ? Math.min((monthRetentionPoints / monthRetentionRequired) * 100, 100) : 100;

  const benefits = [
    {
      iconImage: '/images/orb5.5e73e900.png',
      label: '生日礼物',
      value: Number(currentLevelInfo?.birthday_bonus ?? 0).toFixed(2)
    },
    {
      iconImage: '/images/orb6.6318d528.png',
      label: '晋级礼金',
      value: Number(currentLevelInfo?.level_bonus || 0).toFixed(2)
    },
    {
      iconImage: '/images/orb4.ed2954c7.png',
      label: '周工资',
      value: Number(currentLevelInfo?.week_bonus || 0).toFixed(2)
    },
    {
      iconImage: '/images/orb3.07cea464.png',
      label: '月工资',
      value: Number(currentLevelInfo?.month_bonus || 0).toFixed(2)
    },
    {
      iconImage: '/images/orb1.59d96e05.png',
      label: '提款次数',
      value: '1000'
    },
    {
      iconImage: '/images/orb2.375ffa58.png',
      label: '借呗额度奖励',
      value: Number(currentLevelInfo?.credit_bonus || 0).toFixed(2)
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0C1017',
      color: '#fff',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#151A23',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        zIndex: 10,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronLeft size={24} style={{ color: '#fff' }} />
        </button>
        <h1 style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 600,
          color: '#fff',
          margin: 0
        }}>会员中心</h1>
        <div style={{ width: '24px' }} />
      </div>

      {/* VIP Card */}
      <div style={{ padding: '16px 0 24px' }}>
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            gap: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {vipInfo.levels.map((level, idx) => {
            const totalBet = Number(vipInfo?.total_bet || 0);
            const totalDeposit = Number(vipInfo?.total_deposit || 0);
            const levelupType = level.levelup_type || 1;
            
            // 计算当前等级的进度
            let currentPoints = 0;
            let requiredPoints = 0;
            
            if (levelupType === 1) {
              currentPoints = totalDeposit;
              requiredPoints = Number(level.deposit_money) || 0;
            } else if (levelupType === 2) {
              currentPoints = totalBet;
              requiredPoints = Number(level.bet_money) || 0;
            } else if (levelupType === 3) {
              currentPoints = Math.max(totalDeposit, totalBet);
              const depositRequired = Number(level.deposit_money) || 0;
              const betRequired = Number(level.bet_money) || 0;
              requiredPoints = Math.max(depositRequired, betRequired);
            } else if (levelupType === 4) {
              const depositRequired = Number(level.deposit_money) || 0;
              const betRequired = Number(level.bet_money) || 0;
              currentPoints = Math.min(totalDeposit, totalBet);
              requiredPoints = Math.min(depositRequired, betRequired);
            }
            
            const cardProgress = requiredPoints > 0 ? Math.min((currentPoints / requiredPoints) * 100, 100) : 0;
            const isCurrentLevelCompleted = cardProgress >= 100;
            
            // 检查上一个等级是否完成
            let isPrevLevelCompleted = false;
            if (idx > 0) {
              const prevLevel = vipInfo.levels[idx - 1];
              const prevLevelupType = prevLevel.levelup_type || 1;
              let prevCurrentPoints = 0;
              let prevRequiredPoints = 0;
              
              if (prevLevelupType === 1) {
                prevCurrentPoints = totalDeposit;
                prevRequiredPoints = Number(prevLevel.deposit_money) || 0;
              } else if (prevLevelupType === 2) {
                prevCurrentPoints = totalBet;
                prevRequiredPoints = Number(prevLevel.bet_money) || 0;
              } else if (prevLevelupType === 3) {
                prevCurrentPoints = Math.max(totalDeposit, totalBet);
                const depositRequired = Number(prevLevel.deposit_money) || 0;
                const betRequired = Number(prevLevel.bet_money) || 0;
                prevRequiredPoints = Math.max(depositRequired, betRequired);
              } else if (prevLevelupType === 4) {
                const depositRequired = Number(prevLevel.deposit_money) || 0;
                const betRequired = Number(prevLevel.bet_money) || 0;
                prevCurrentPoints = Math.min(totalDeposit, totalBet);
                prevRequiredPoints = Math.min(depositRequired, betRequired);
              }
              
              const prevProgress = prevRequiredPoints > 0 ? Math.min((prevCurrentPoints / prevRequiredPoints) * 100, 100) : 0;
              isPrevLevelCompleted = prevProgress >= 100;
            }
            
            // 判断是否解锁：用户等级达到 或 上一个等级条件达成
            const isUnlockedLevel = level.level <= currentUserLevel || (idx > 0 && isPrevLevelCompleted);
            
            // 判断是否晋级：当前等级条件达成 或 用户等级已达到
            const isPromoted = isCurrentLevelCompleted || level.level <= currentUserLevel;
            
            // 根据VIP等级选择背景图片（0-10）
            const bgLevel = Math.min(level.level, 10);
            const bgImage = `/images/pay/vip_bg_${bgLevel}.webp`;
            // 优先使用配置的 level_icon，否则默认 vip_icon_{level}.webp
            const iconLevel = Math.min(level.level, 10);
            const rawIcon = (level as { level_icon?: string }).level_icon?.trim();
            const iconImage = rawIcon
              ? (rawIcon.startsWith('http') || rawIcon.startsWith('/') ? rawIcon : `/images/newimg/${rawIcon}`)
              : `/images/newimg/vip_icon_${iconLevel}.webp`;
            
            return (
              <div
                key={level.level}
                style={{
                  flexShrink: 0,
                  width: `calc(100vw - 32px)`,
                  scrollSnapAlign: 'center'
                }}
              >
                <div style={{
                  borderRadius: '12px',
                  padding: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '151px',
                  transition: 'all 0.3s ease',
                  backgroundImage: `url(${bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: idx === cardIndex ? 1 : 0.6,
                  boxShadow: idx === cardIndex
                    ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                    : 'none'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    fontSize: '11px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      {isUnlockedLevel ? (
                        <path d="M17 8H16V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V8H7C5.89543 8 5 8.89543 5 10V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V10C19 8.89543 18.1046 8 17 8ZM10 7C10 5.89543 10.8954 5 12 5C13.1046 5 14 5.89543 14 7V8H10V7ZM17 19H7V10H17V19Z" fill="currentColor"/>
                      ) : (
                        <path d="M12 1C8.96243 1 6.5 3.46243 6.5 6.5V9H5C3.89543 9 3 9.89543 3 11V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V11C21 9.89543 20.1046 9 19 9H17.5V6.5C17.5 3.46243 15.0376 1 12 1ZM12 3C14.2091 3 16 4.79086 16 7V9H8V7C8 4.79086 9.79086 3 12 3ZM5 11H19V19H5V11Z" fill="currentColor"/>
                      )}
                    </svg>
                    <span>{isUnlockedLevel ? '已解锁' : '未解锁'}</span>
                  </div>
                  <div style={{ textAlign: 'left', marginTop: '20px' }}>
                    <h2 style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      marginBottom: '8px',
                      margin: 0
                    }}>{level.level_name || `VIP${level.level}`}</h2>
                    {/* 进度条 */}
                    <div style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      height: '4px',
                      overflow: 'hidden',
                      marginBottom: '6px'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          background: 'linear-gradient(to right, #eab308, #ca8a04)',
                          borderRadius: '4px',
                          width: `${cardProgress}%`,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <p style={{
                      fontSize: '13px',
                      opacity: 0.8,
                      marginBottom: '3px',
                      margin: '6px 0 3px'
                    }}>{isPromoted ? '已晋级' : '未晋级'}</p>
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '8px',
                    width: '90px',
                    height: '90px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={iconImage}
                      alt={`VIP${level.level}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slide Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '16px'
        }}>
          {vipInfo.levels.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToCard(idx)}
              style={{
                height: '8px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: idx === cardIndex ? '#eab308' : '#475569',
                width: idx === cardIndex ? '24px' : '8px',
                padding: 0
              }}
            />
          ))}
        </div>
      </div>

      {/* VIP Level Tabs */}
      <div style={{ padding: '0 16px 32px' }}>
        <div
          ref={tabsContainerRef}
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <style>{`
            div[ref]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {vipInfo.levels.map((level, idx) => (
            <button
              key={level.level}
              onClick={() => scrollToCard(idx)}
              style={{
                padding: idx === cardIndex ? '6px 16px' : '8px 16px',
                borderRadius: '9999px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                background: idx === cardIndex ? '#eab308' : 'transparent',
                color: idx === cardIndex ? '#1e293b' : '#fff',
                fontSize: '14px'
              }}
            >
              {level.level_name || `VIP${level.level}`}
            </button>
          ))}
        </div>
      </div>

      {/* Benefits Summary */}
      <div style={{ padding: '0 16px 32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0
          }}>权益总览</h3>
          <span style={{
            fontSize: '12px',
            color: '#94a3b8'
          }}>ⓘ</span>
        </div>
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          margin: '0 0 16px 0'
        }}>达到晋级条件自动发放对应的奖励</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          {benefits.map((item, idx) => {
            return (
              <div
                key={idx}
                style={{
                  backgroundImage: 'url(https://cy-747263170.imgix.net/default-casino-mini.CQlEkEv9.svg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  transition: 'background 0.3s ease',
                  position: 'relative',
                  minHeight: '126px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <img
                  src={item.iconImage}
                  alt={item.label}
                  style={{
                    width: '32px',
                    height: '32px',
                    margin: '0 auto 8px',
                    objectFit: 'contain'
                  }}
                />
                <p style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: '0 0 4px',
                  color: '#fff'
                }}>{item.value}</p>
                <p style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: 0
                }}>{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Section */}
      <div style={{ padding: '0 16px 32px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>{currentLevelInfo?.level_name || `VIP${currentLevelInfo.level}`}成长进度</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundImage: 'url(https://cy-747263170.imgix.net/default-sports.KM8Zs5_U.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 600,
                margin: 0
              }}>当月升级积分</p>
            </div>
            <div style={{
              width: '100%',
              background: '#475569',
              borderRadius: '9999px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(to right, #eab308, #ca8a04)',
                  borderRadius: '9999px',
                  width: `${upgradeProgress}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '8px',
              margin: '8px 0 0'
            }}>{monthUpgradePoints.toFixed(2)}/{monthUpgradeRequired > 0 ? monthUpgradeRequired.toFixed(2) : '0'}</p>
          </div>

          <div style={{
            backgroundImage: 'url(https://cy-747263170.imgix.net/default-sports.KM8Zs5_U.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 600,
                margin: 0
              }}>当月保级积分</p>
            </div>
            <div style={{
              width: '100%',
              background: '#475569',
              borderRadius: '9999px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(to right, #eab308, #ca8a04)',
                  borderRadius: '9999px',
                  width: `${retentionProgress}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '8px',
              margin: '8px 0 0'
            }}>{monthRetentionPoints.toFixed(2)}/{monthRetentionRequired > 0 ? monthRetentionRequired.toFixed(2) : '0'}</p>
          </div>
        </div>
      </div>

      {/* Growth Rules */}
      <div style={{ padding: '0 16px 32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0
          }}>{currentLevelInfo?.level_name || `VIP${currentLevelInfo.level}`}成长规则</h3>
          <span style={{
            fontSize: '12px',
            color: '#94a3b8'
          }}>ⓘ</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          <div style={{
            backgroundImage: 'url(https://cy-747263170.imgix.net/active-sports.CxIU50TW.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <img
              src="/images/icon_partner.160ba388.png"
              alt="当月积分要求"
              style={{
                width: '20px',
                height: '20px',
                marginBottom: '8px',
                display: 'block'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#fff',
              marginBottom: '4px',
              margin: '0 0 4px'
            }}>当月积分要求</p>
            <p style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              color: '#fff'
            }}>{monthUpgradeRequired.toFixed(2)}</p>
          </div>
          <div style={{
            backgroundImage: 'url(https://cy-747263170.imgix.net/active-casino.D98ZVQ96.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <img
              src="/images/icon_vip.4f991970.png"
              alt="当月保级积分"
              style={{
                width: '20px',
                height: '20px',
                marginBottom: '8px',
                display: 'block'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#fff',
              marginBottom: '4px',
              margin: '0 0 4px'
            }}>当月保级积分</p>
            <p style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              color: '#fff'
            }}>{monthRetentionRequired.toFixed(2)}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
