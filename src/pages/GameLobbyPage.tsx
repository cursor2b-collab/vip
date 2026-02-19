import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import { newGameApiService } from '@/lib/api/newGameApi';
// import { getGameList } from '@/lib/api/game';
// import { getGameApiLanguage } from '@/utils/languageMapper';
import { useGames } from '@/contexts/GameContext';
import { openGame } from '@/utils/gameUtils';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { getServiceUrl } from '@/lib/api/system';
import { PageLoader } from '@/components/PageLoader';

export function GameLobbyPage() {
  const navigate = useNavigate();
  const { gamingList, allGamesList, loading: gamesLoading } = useGames();
  const [activeTab, setActiveTab] = useState('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paJackpot, setPaJackpot] = useState(1679835.62);
  const [ptJackpot, setPtJackpot] = useState(291610318.57);
  // const [allVendors, setAllVendors] = useState<any[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [displayedGamesCount, setDisplayedGamesCount] = useState(12);
  const [allGamesData, setAllGamesData] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [serviceUrl, setServiceUrl] = useState('');

  const banners = [
    "https://ik.imagekit.io/gpbvknoim/5b8a493.avif",
    "https://ik.imagekit.io/gpbvknoim/18c4.avif",
    "https://ik.imagekit.io/gpbvknoim/1ea.avif",
    "https://ik.imagekit.io/gpbvknoim/30c1c.avif",
    "https://ik.imagekit.io/gpbvknoim/ae74690e-694a-43ac-a260-3156276153f8.png",
    "https://ik.imagekit.io/gpbvknoim/8c3ebc55-241d-4663-b3ba-346c58cb847a.png",
    "https://ik.imagekit.io/gpbvknoim/f7f6125e-827b-4a12-adb6-3ce4bf24e047.png"
  ];

  // Banner 自动切换
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // 奖池自动更新
  useEffect(() => {
    const interval = setInterval(() => {
      setPaJackpot(prev => prev + Math.random() * 0.1);
      setPtJackpot(prev => prev + Math.random() * 0.5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 获取客服链接
  useEffect(() => {
    const fetchServiceUrl = async () => {
      try {
        const res = await getServiceUrl();
        if (res.code === 200 && res.data && res.data.url) {
          setServiceUrl(res.data.url);
        } else {
          setServiceUrl('');
        }
      } catch (err: any) {
        setServiceUrl('');
      }
    };
    fetchServiceUrl();
  }, []);

  // 根据选中的标签筛选游戏（按平台名称）
  const getFilteredGames = (tab: string, gamesList: any[]): any[] => {
    if (tab === 'all') {
      return gamesList;
    }
    
    const platformMap: Record<string, string[]> = {
      'hot': ['PG', 'PP'], // 热门标签显示 PG 和 PP
      'pg': ['PG'],
      'pp': ['PP'],
      'jdb': ['JDB'],
      'cq9': ['CQ9'],
      'mg': ['MG'],
      'fc': ['FC'],
    };
    
    const platforms = platformMap[tab] || [];
    if (platforms.length === 0) {
      return gamesList;
    }
    
    return gamesList.filter((game: any) => {
      const platformName = (game.platform_name || '').toUpperCase();
      return platforms.includes(platformName);
    });
  };

  // 获取游戏列表：优先用电游分类(gamingList)，为空时用全部游戏(allGamesList)避免电游大厅空白
  useEffect(() => {
    setLoading(gamesLoading);
    const sourceList = gamingList.length > 0 ? gamingList : allGamesList;

    if (!gamesLoading && sourceList.length > 0) {
      const filteredGames = getFilteredGames(activeTab, sourceList);
      setAllGamesData(filteredGames);
      setDisplayedGamesCount(12);
      requestAnimationFrame(() => {
        setGames(filteredGames.slice(0, 12));
        setLoading(false);
      });
    } else if (!gamesLoading) {
      setGames([]);
      setAllGamesData([]);
      setLoading(false);
    }
  }, [activeTab, gamingList, allGamesList, gamesLoading]);

  // 加载更多游戏
  const loadMoreGames = async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    try {
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const nextCount = displayedGamesCount + 12;
      setDisplayedGamesCount(nextCount);
      // useEffect 会自动更新 games
    } catch (error) {
      console.error('加载更多游戏失败:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 搜索时重新计算显示的游戏
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setGames(allGamesData.slice(0, displayedGamesCount));
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = allGamesData.filter(game => {
      const gameNameMatch = (game.name || '').toLowerCase().includes(query);
      const platformNameMatch = (game.platform_name || '').toLowerCase().includes(query);
      return gameNameMatch || platformNameMatch;
    });
    
    setGames(filtered.slice(0, displayedGamesCount));
  }, [searchQuery, allGamesData, displayedGamesCount]);

  // 过滤游戏 - 用于显示
  const filteredGames = games;


  const categories = [
    { id: 'hot', name: '热门' },
    { id: 'pg', name: 'PG' },
    { id: 'pp', name: 'PP' },
    { id: 'jdb', name: 'JDB' },
    { id: 'cq9', name: 'CQ9' },
    { id: 'mg', name: 'MG' },
    { id: 'fc', name: 'FC' },
  ];

  const formatJackpot = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 打开在线客服
  const openOnlineService = () => {
    if (serviceUrl) {
      window.open(serviceUrl, '_blank');
    } else {
      alert('客服系统加载中，请稍后再试...');
      // 尝试重新获取客服链接
      getServiceUrl().then(res => {
        if (res.code === 200 && res.data && res.data.url) {
          setServiceUrl(res.data.url);
          window.open(res.data.url, '_blank');
        }
      }).catch(err => {
        console.error('获取客服链接失败:', err);
      });
    }
  };

  // 自动滚动到激活的标签
  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    if (activeTabElement && tabsWrapperRef.current) {
      const container = tabsWrapperRef.current;
      const tab = activeTabElement;
      
      // 使用 requestAnimationFrame 延迟滚动，避免与内容更新冲突
      requestAnimationFrame(() => {
        tab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      });
    }
  }, [activeTab]);

  return (
    <>
      <style>{`
        .game-lobby-page {
          min-height: 100vh;
          background: #0C1017;
          color: white;
          font-family: sans-serif;
          max-width: 420px;
          margin: 0 auto;
          position: relative;
          overflow-x: hidden;
        }

        .lobby-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 0 0;
          height: 48px;
          background: #1a1a1a;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .back-btn {
          width: 24px;
          height: 24px;
          cursor: pointer;
          color: #ffffff;
          padding: 4px;
        }

        .header-title {
          font-size: 18px;
          font-weight: 500;
          color: #ffffff;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .header-customer-service {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .header-customer-service-img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .header-customer-service-text {
          font-size: 14px;
          color: #ffffff;
          font-weight: 500;
        }

        .header-icon {
          width: 20px;
          height: 20px;
          cursor: pointer;
          color: #999;
          padding: 4px;
        }

        .banner-container {
          width: 100%;
          position: relative;
          aspect-ratio: 21/9;
          background: #0C1017;
          overflow: hidden;
        }

        .banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.5s, transform 0.5s;
        }

        .banner-dots {
          position: absolute;
          bottom: 8px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 6px;
          z-index: 10;
        }

        .banner-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: all 0.3s;
          background: rgba(255, 255, 255, 0.3);
        }

        .banner-dot.active {
          width: 12px;
          background: #FFD700;
        }

        .sticky-section {
          position: sticky;
          top: 48px;
          z-index: 40;
          background: #0C1017;
        }

        .search-bar-container {
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: center;
          background: #0C1017;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
        }

        .search-input {
          width: 100%;
          height: 40px;
          background: #1e1e1e;
          border: none;
          border-radius: 20px;
          padding: 0 16px 0 16px;
          color: #999;
          font-size: 14px;
          outline: none;
        }

        .search-input:focus {
          outline: 1px solid rgba(255, 215, 0, 0.3);
        }

        .search-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #666;
          pointer-events: none;
        }

        .search-clear-btn {
          position: absolute;
          right: 40px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 0;
        }

        .search-clear-btn:hover {
          color: #999;
        }

        .filter-btn {
          height: 40px;
          padding: 0 20px;
          background: #1e1e1e;
          color: #FFD700;
          font-size: 14px;
          font-weight: 500;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .tabs-container {
          background: transparent;
          padding: 12px 16px;
          display: flex;
          justify-content: center;
        }

        .tabs-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(12, 16, 23, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 4px;
          border-radius: 9999px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          overflow-x: auto;
          max-width: 100%;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        .tabs-wrapper::-webkit-scrollbar {
          display: none;
        }

        .tab-button {
          position: relative;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          white-space: nowrap;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 8px 20px;
          border-radius: 9999px;
          z-index: 1;
        }

        .tab-button:hover {
          color: #FFD700;
        }

        .tab-button.active {
          color: #FFD700;
          background: rgba(255, 215, 0, 0.05);
        }

        .tab-lamp {
          position: absolute;
          inset: 0;
          width: 100%;
          background: rgba(255, 215, 0, 0.05);
          border-radius: 9999px;
          z-index: -1;
          animation: lampSlide 0.3s ease-out;
        }

        .tab-lamp-top {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 4px;
          background: #FFD700;
          border-radius: 4px 4px 0 0;
        }

        .tab-lamp-glow-1 {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 48px;
          height: 24px;
          background: rgba(255, 215, 0, 0.2);
          border-radius: 50%;
          filter: blur(8px);
          animation: glowPulse 2s ease-in-out infinite;
        }

        .tab-lamp-glow-2 {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 24px;
          background: rgba(255, 215, 0, 0.2);
          border-radius: 50%;
          filter: blur(6px);
          animation: glowPulse 2s ease-in-out infinite 0.3s;
        }

        .tab-lamp-glow-3 {
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 16px;
          background: rgba(255, 215, 0, 0.2);
          border-radius: 50%;
          filter: blur(4px);
          animation: glowPulse 2s ease-in-out infinite 0.6s;
        }

        @keyframes lampSlide {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.3;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translateX(-50%) scale(1.1);
          }
        }

        .jackpot-section {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          gap: 10px;
          padding: 0 16px;
        }

        .jackpot-card {
          width: 191px;
          height: 63px;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .jackpot-label {
          color: #ffcb4c;
          font-size: 16px;
          margin-bottom: 5px;
          font-weight: bold;
          line-height: 1;
        }

        .jackpot-amount {
          display: flex;
          align-items: flex-end;
        }

        .jackpot-digit {
          background: #000;
          border-radius: 4px;
          margin: 0 1px;
          width: 14px;
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffcb4c;
          font-size: 18px;
          font-weight: 700;
          font-family: 'DIN Alternate', sans-serif;
        }

        .jackpot-separator {
          width: 4px;
          color: #ffcb4c;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 2px;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 16px;
          min-height: 200px;
          transition: opacity 0.2s ease;
        }

        .games-grid.loading {
          opacity: 0.6;
        }

        .game-card {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
          aspect-ratio: 1 / 1;
        }

        .game-card:active {
          transform: scale(0.95);
        }

        .game-card.fc-game {
          background-image: url(https://ik.imagekit.io/gpbvknoim/winner_bg.cde2edf3.jpg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .game-card.fc-game img {
          width: 70%;
          height: 70%;
          display: block;
          position: relative;
          z-index: 1;
          margin: 0 auto;
          padding: 8px 0;
          object-fit: contain;
        }

        .game-card img {
          width: 100%;
          height: 100%;
          display: block;
          position: relative;
          z-index: 1;
          object-fit: cover;
        }

        .game-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          background: #ff0000;
          color: #ffffff;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .game-info {
          padding: 8px;
          background: #0C1017;
        }

        .game-name {
          font-size: 12px;
          color: #ffffff;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .game-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #999;
        }

        .favorite-icon {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          cursor: pointer;
          z-index: 10;
          color: #FFD700;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 0;
          opacity: 0.4;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #FFD700;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
          opacity: 0.2;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .no-more-data {
          font-size: 12px;
          color: #666;
          letter-spacing: 2px;
        }

        .load-more-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
        }

        .load-more-btn {
          padding: 12px 32px;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000;
          font-size: 14px;
          font-weight: 600;
          border-radius: 24px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }

        .load-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
        }

        .load-more-btn:active {
          transform: translateY(0);
        }

        .load-more-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <PageLoader loading={loading} />
      <div className="game-lobby-page">
        {/* Header */}
        <header className="lobby-header">
          <div className="header-left">
            <svg 
              className="back-btn" 
              onClick={() => navigate(-1)}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <h1 className="header-title">电游大厅</h1>
          </div>
          <div className="header-right" onClick={openOnlineService}>
            <div className="header-customer-service">
              <img 
                src="https://ik.imagekit.io/gpbvknoim/7da179.avif" 
                alt="在线客服"
                className="header-customer-service-img"
              />
              <span className="header-customer-service-text">在线客服</span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '96px' }} className="no-scrollbar">
          {/* Banner */}
          <div className="banner-container">
            <ImageWithFallback 
              src={banners[bannerIndex]} 
              alt="Promotion Banner" 
              className="banner-image"
              style={{ 
                opacity: 1,
                transform: 'translateX(0)'
              }}
            />
            <div className="banner-dots">
              {banners.map((_, i) => (
                <div 
                  key={i}
                  className={`banner-dot ${i === bannerIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Search Bar and Tabs - Sticky */}
          <div className="sticky-section">
            <div className="search-bar-container">
              <div className="search-input-wrapper">
                <input 
                  type="text" 
                  placeholder="请输入您想玩的游戏名字..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    type="button"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="filter-btn">筛选</button>
            </div>

            <div className="tabs-container">
              <div className="tabs-wrapper no-scrollbar" ref={tabsWrapperRef}>
                {categories.map((cat) => {
                  const isActive = activeTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      ref={(el) => {
                        tabRefs.current[cat.id] = el;
                      }}
                      onClick={() => setActiveTab(cat.id)}
                      className={`tab-button ${isActive ? 'active' : ''}`}
                    >
                      {cat.name}
                      {isActive && (
                        <>
                          <div className="tab-lamp">
                            <div className="tab-lamp-top" />
                            <div className="tab-lamp-glow-1" />
                            <div className="tab-lamp-glow-2" />
                            <div className="tab-lamp-glow-3" />
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Jackpot Pools */}
          <div className="jackpot-section">
            <div 
              className="jackpot-card"
              style={{ backgroundImage: 'url(https://ik.imagekit.io/gpbvknoim/2522.avif)' }}
            >
              <p className="jackpot-label">PA电游奖金池(元)</p>
              <div className="jackpot-amount">
                {formatJackpot(paJackpot).split('').map((char, i) => {
                  if (char === ',') return <span key={i} className="jackpot-separator">,</span>;
                  if (char === '.') return <span key={i} className="jackpot-separator">.</span>;
                  return <span key={i} className="jackpot-digit">{char}</span>;
                })}
              </div>
            </div>
            <div 
              className="jackpot-card"
              style={{ backgroundImage: 'url(https://ik.imagekit.io/gpbvknoim/003.avif)' }}
            >
              <p className="jackpot-label">PT电游奖金池(元)</p>
              <div className="jackpot-amount">
                {formatJackpot(ptJackpot).split('').map((char, i) => {
                  if (char === ',') return <span key={i} className="jackpot-separator">,</span>;
                  if (char === '.') return <span key={i} className="jackpot-separator">.</span>;
                  return <span key={i} className="jackpot-digit">{char}</span>;
                })}
              </div>
            </div>
          </div>

          {/* Games Grid */}
          {loading && filteredGames.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p className="no-more-data">加载中...</p>
            </div>
          ) : (
            <>
              <div className={`games-grid ${loading ? 'loading' : ''}`}>
                {filteredGames.map((game, index) => (
                  <div 
                    key={game.id || `${game.platform_name}-${game.game_code}-${index}`}
                    className={`game-card ${(game.platform_name || '').toUpperCase() === 'FC' ? 'fc-game' : ''}`}
                    onClick={() => {
                      // 使用旧接口数据，直接使用 platform_name 和 game_type
                      const platformName = game.platform_name || '';
                      const gameType = game.game_type || game.gameType || 3;
                      const gameCode = game.game_code || '0';
                      openGame(platformName, gameType, gameCode);
                    }}
                  >
                    {/* 旧接口没有isNew字段，暂时不显示 */}
                    {/* {game.isNew && <div className="game-badge">最新</div>} */}
                    <svg 
                      className="favorite-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <img 
                      src={game.cover || 'https://ik.imagekit.io/gpbvknoim/af1.avif'} 
                      alt={game.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://ik.imagekit.io/gpbvknoim/af1.avif';
                      }}
                    />
                  </div>
                ))}
              </div>
              {(() => {
                // 计算是否还有更多游戏
                const totalGames = searchQuery 
                  ? allGamesData.filter(game => {
                      const query = searchQuery.toLowerCase().trim();
                      const gameNameMatch = (game.name || '').toLowerCase().includes(query);
                      const platformNameMatch = (game.platform_name || '').toLowerCase().includes(query);
                      return gameNameMatch || platformNameMatch;
                    }).length
                  : allGamesData.length;
                
                const hasMore = totalGames > displayedGamesCount;
                
                // 如果没有游戏，不显示任何内容
                if (totalGames === 0) {
                  return null;
                }
                
                if (hasMore) {
                  return (
                    <div className="load-more-container">
                      <button 
                        className="load-more-btn"
                        onClick={loadMoreGames}
                        disabled={loadingMore}
                      >
                        {loadingMore ? '加载中...' : '查看更多'}
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="loading-container">
                      <p className="no-more-data">没有更多数据</p>
                    </div>
                  );
                }
              })()}
            </>
          )}
        </main>
      </div>
    </>
  );
}
