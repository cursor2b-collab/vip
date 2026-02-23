import { useState, useEffect, useRef } from 'react';
import { openGame } from '@/utils/gameUtils';
import { useGames } from '@/contexts/GameContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';

interface GameData {
  id: number;
  src: string;
  type: 'big' | 'small';
  position: number;
  platformName: string;
  gameType: number;
  gameCode: string;
}

// 捕鱼/捕猎游戏平台（游戏类型 6）：AG、BBIN、BG、CQ9、DB、FG、JDB、KY、MG
const FISHING_PLATFORMS = ['AG', 'BBIN', 'BG', 'CQ9', 'DB', 'FG', 'JDB', 'KY', 'MG'];

// JDB 捕鱼固定列表（JDB_7_7001 ~ JDB_7_7010）及封面图
const JDB_FISHING_ITEMS: { code: string; cover: string }[] = [
  { code: '7001', cover: '/images/gaming/longwang.png' },
  { code: '7002', cover: '/images/gaming/longw2.png' },
  { code: '7003', cover: '/images/gaming/csby.png' },
  { code: '7004', cover: '/images/gaming/8a4c44.avif' },
  { code: '7005', cover: '/images/gaming/d.avif' },
  { code: '7006', cover: '/images/gaming/2f.avif' },
  { code: '7007', cover: '/images/gaming/68f4.avif' },
  { code: '7008', cover: '/images/gaming/74ff.avif' },
  { code: '7009', cover: '/images/gaming/35.avif' },
  { code: '7010', cover: '/images/gaming/xlcq.png' },
];

export function GameContent() {
  const { gamingList, apiGamesList, loading: gamesLoading } = useGames();
  const [gamesList, setGamesList] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerGames, setBannerGames] = useState<Array<{name: string; code: string; thumbnail: string}>>([]);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [fishingGames, setFishingGames] = useState<Array<{
    id: string;
    name: string;
    thumbnail: string;
    vendorCode: string;
    gameCode: string;
    provider: string;
    gameType?: number;
  }>>([]);
  const [fishingGamesLoading, setFishingGamesLoading] = useState(true);
  const fishingSwiperRef = useRef<any>(null);
  
  // 静态图片数据（如果游戏列表为空时使用）
  const staticImages = [
    {
      id: 1,
      src: "https://ik.imagekit.io/gpbvknoim/af1.avif",
      type: 'big',
      position: 0
    },
    {
      id: 2,
      src: "https://www.xpj00000.vip/indexImg/2ac7fa83b8c3b145feb60e04ec5049593c4b7fdead75-PDzx80_fw658webp.jpg",
      type: 'big',
      position: 1
    },
    {
      id: 3,
      src: "https://www.xpj00000.vip/indexImg/5c7568bdb686be9da57bfde16f18136b7a3b66b57979-fdByiR_fw240webp.jpg",
      type: 'small',
      position: 2
    },
    {
      id: 4,
      src: "https://www.xpj00000.vip/indexImg/786aa910c7963319920238060aeee2e612fc518479e8-m9ijvC_fw240webp.jpg",
      type: 'small',
      position: 3
    },
    {
      id: 5,
      src: "https://www.xpj00000.vip/indexImg/7c13f16e6816a8d96e43c8a696c69452cef18cef7913-fav2po_fw658webp.jpg",
      type: 'small',
      position: 4
    },
    {
      id: 6,
      src: "https://www.xpj00000.vip/indexImg/65bfb66e9fff4067869ce30eedde3377656839886181-aU182X_fw658webp.jpg",
      type: 'small',
      position: 5
    },
    {
      id: 7,
      src: "https://www.xpj00000.vip/indexImg/4559fc7633fcf3c22f45990be3e25ddb3690a5b3806e-8BMR4v_fw240webp.jpg",
      type: 'small',
      position: 6
    },
    {
      id: 8,
      src: "https://www.xpj00000.vip/indexImg/5125.png",
      type: 'small',
      position: 7
    },
    {
      id: 9,
      src: "https://www.xpj00000.vip/indexImg/45454.png",
      type: 'small',
      position: 8
    },
    {
      id: 10,
      src: "https://www.xpj00000.vip/indexImg/561320.png",
      type: 'small',
      position: 9
    },
    {
      id: 11,
      src: "https://www.xpj00000.vip/indexImg/cc773a3284a2e601d2b71934c2aa983437afeb3a78c8-zgds9c_fw658webp.jpg",
      type: 'small',
      position: 10
    },
    {
      id: 12,
      src: "https://www.xpj00000.vip/indexImg/ff141a1c930d86ef728e66404a7fc9b5f7b3cca5681a-UkDBGa_fw658webp.jpg",
      type: 'small',
      position: 11
    }
  ];

  // 横幅游戏自定义图片配置（如果设置了自定义图片，将优先使用自定义图片）
  const bannerGamesCustomImages: Record<string, string> = {
    'vs20sugarrushx': 'https://ik.imagekit.io/gpbvknoim/7465.avif',  // 极速糖果1000
    'vs243lionsgold': 'https://ik.imagekit.io/gpbvknoim/e2c.avif',   // 5金狮
    'vs20fruitsw': 'https://ik.imagekit.io/gpbvknoim/fd4.avif',     // 甜入心扉
  };

  // 捕鱼游戏：apiGamesList 筛 game_type=6 + 固定 JDB_7_7001~7010，合并去重
  useEffect(() => {
    if (gamesLoading) {
      setFishingGamesLoading(true);
      return;
    }
    try {
      const list = Array.isArray(apiGamesList) ? apiGamesList : [];
      const fishing = list.filter(
        (g) => (g.game_type ?? g.gameType) === 6 && FISHING_PLATFORMS.includes((g.platform_name || g.api_name || '').toUpperCase())
      );
      const fromApi = fishing.map((game, idx) => ({
        id: `fishing-${(game.platform_name || game.api_name || '').toUpperCase()}-${game.game_code || idx}`,
        name: game.title || game.name || '',
        thumbnail: game.cover || game.mobile_pic || game.web_pic || '',
        vendorCode: '',
        gameCode: game.game_code || '0',
        provider: (game.platform_name || game.api_name || '').toUpperCase(),
        gameType: 6
      }));
      const jdbStatic = JDB_FISHING_ITEMS.map(({ code, cover }) => ({
        id: `fishing-JDB-${code}`,
        name: `JDB捕鱼${code}`,
        thumbnail: cover,
        vendorCode: '',
        gameCode: code,
        provider: 'JDB',
        gameType: 3
      }));
      const seen = new Set(fromApi.map((g) => `${g.provider}-${g.gameCode}`));
      const jdbMerged = jdbStatic.filter((g) => !seen.has(`${g.provider}-${g.gameCode}`));
      setFishingGames([...fromApi, ...jdbMerged]);
    } catch {
      setFishingGames(JDB_FISHING_ITEMS.map(({ code, cover }) => ({
        id: `fishing-JDB-${code}`,
        name: `JDB捕鱼${code}`,
        thumbnail: cover,
        vendorCode: '',
        gameCode: code,
        provider: 'JDB',
        gameType: 3
      })));
    } finally {
      setFishingGamesLoading(false);
    }
  }, [apiGamesList, gamesLoading]);

  // 格式化显示的游戏数据
  const displayGames = gamesList.length > 0 
    ? gamesList.map((game, index) => ({
        id: game.id,
        src: game.src || staticImages[index]?.src || '',
        type: game.type,
        position: game.position,
        platformName: game.platformName,
        gameType: game.gameType,
        gameCode: game.gameCode
      }))
    : staticImages.map(img => ({ 
        ...img, 
        platformName: 'slot-pragmatic', 
        gameType: 3, 
        gameCode: 'lobby' 
      }));

  return (
    <>
      <style>{`
        .game-content-wrapper {
          background: #0C1017;
          padding: 16px;
        }

        .game-banner-image {
          position: relative;
          width: 100%;
          border-radius: 8px;
          overflow: visible;
          margin-bottom: 16px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .game-banner-image:active {
          transform: scale(0.98);
        }

        .game-banner-image img {
          width: 100%;
          height: auto;
          display: block;
        }

        .game-banner-title {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 5;
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 16px;
        }

        .game-banner-lobby-buttons {
          position: absolute;
          top: 140px;
          left: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
          z-index: 5;
        }

        .game-banner-lobby-btn {
          flex: 1;
          aspect-ratio: 1;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.2s;
          position: relative;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          overflow: hidden;
        }

        .game-banner-lobby-btn.pg-btn {
          background-image: url('/images/newimg/4Yk.png');
        }

        .game-banner-lobby-btn.pp-btn {
          background-image: url('/images/newimg/wxFb8cJNr.png');
        }

        .game-banner-lobby-btn.pa-btn {
          background-image: url('/images/newimg/upDNqS6.png');
        }

        .game-banner-lobby-btn:active {
          transform: scale(0.95);
        }

        .game-banner-lobby-btn > * {
          display: none;
        }

        .game-banner-title-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .game-banner-title-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .game-banner-title-icon {
          width: 28px !important;
          height: 28px !important;
          object-fit: contain;
        }

        .game-banner-title-text {
          font-size: 18px;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .game-banner-title-desc {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-left: 0px;
        }

        .game-banner-title-desc-item {
          font-size: 14px;
          color: #FFFFFF73;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }

        .game-banner-title-right {
          flex-shrink: 0;
        }

        .game-banner-title-right img {
          width: auto;
          height: auto;
          max-width: 240px;
          max-height: 110px;
          object-fit: contain;
        }

        .game-banner-games {
          position: absolute;
          bottom: 45px;
          left: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
          z-index: 5;
        }

        .game-banner-game-item {
          flex: 1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          overflow: visible;
          position: relative;
        }

        .game-banner-game-item:active {
          transform: scale(0.95);
        }

        .game-banner-game-item-image {
          width: 100%;
          height: auto;
          min-height: 82px;
          max-height: 120px;
          object-fit: contain;
          object-position: center center;
          display: block;
          position: relative;
          border-radius: 6px;
        }

        .game-banner-game-item-image-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2a2a2a;
          border-radius: 6px;
          z-index: 1;
        }

        .game-banner-game-item-image-placeholder {
          color: #ffffff;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-align: center;
          line-height: 1.4;
          opacity: 0.7;
        }

        .game-banner-game-item-name {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 4px 8px;
          font-size: 11px;
          color: #ffffff;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        }

        .game-banner-btn {
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 32px;
          background: transparent;
          border: none;
          color: #FFB82C;
          font-size: 16px;
          font-weight: bold;
          font-family: 'Source Han Sans CN', '思源黑体', 'Noto Sans SC', sans-serif;
          cursor: pointer;
          z-index: 10;
          white-space: nowrap;
          transition: opacity 0.2s;
        }

        .game-banner-btn:active {
          opacity: 0.8;
        }

        .game-banner-btn span {
          display: block;
          margin-top: 8px;
        }

        .game-banner-btn-indicator {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: -3px;
          width: auto;
          height: 12px;
          display: block;
          z-index: 11;
          pointer-events: none;
        }

        .game-image-item {
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .game-image-item.big {
          grid-row: span 1;
        }

        .game-image-item.small {
          grid-row: span 1;
        }

        .game-image-item:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        .game-image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .game-live-module {
          display: flex;
          align-items: center;
          background: url('https://www.xpj00000.vip/indexImg/new_bg.faf1b732.png') no-repeat center center;
          background-size: cover;
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .game-live-module:active {
          opacity: 0.8;
        }

        .game-live-module .icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .game-live-module .msg {
          flex: 1;
          color: #ffffff;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .game-live-module .icon-arrow {
          width: 16px;
          height: 16px;
          margin-left: 8px;
          flex-shrink: 0;
        }

        .fishing-games-wrapper {
          padding: 15px 16px;
          padding-bottom: 0;
          margin-bottom: 16px;
        }

        .fishing-games-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .fishing-games-title {
          font-size: 16px;
          color: #fff;
          display: flex;
          align-items: center;
        }

        .fishing-icon {
          width: 20px;
          height: 20px;
          margin-right: 4px;
          font-size: 20px;
          line-height: 1;
        }

        .fishing-games-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .fishing-nav-btn {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          width: 32px;
          height: 24px;
          margin-left: 4px;
          border-radius: 4px;
          background: rgba(199, 218, 255, .0509803922);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .fishing-nav-arrow {
          width: 8px;
          height: 8px;
        }

        .fishing-nav-btn:active {
          opacity: 0.7;
        }

        .fishing-nav-btn.disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .fishing-games-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .fishing-game-item {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s;
          width: 100%;
        }

        /* 移动端和PC端分别显示 */
        .fishing-games-mobile {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
          width: 100%;
        }

        .fishing-games-desktop {
          display: none;
        }

        .fishing-games-nav {
          display: none; /* 网格布局不需要导航按钮 */
        }

        /* PC端样式：使用网格布局 */
        @media (min-width: 768px) {
          .fishing-games-mobile {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            width: 100%;
          }

          .fishing-games-desktop {
            display: none;
          }
        }

        .fishing-game-item:active {
          transform: scale(0.98);
        }

        .fishing-game-cover-wrapper {
          width: 100%;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fishing-game-picture {
          width: 100%;
          height: auto;
          display: block;
          object-fit: contain;
          object-position: center;
          border-radius: 12px;
        }

        .fishing-game-provider {
          display: flex;
          margin-left: 4px;
          margin-right: 10px;
          justify-content: center;
          align-items: center;
          flex-direction: row;
          width: fit-content;
          height: 12px;
          padding: 0 4px;
          font-size: 10px;
          font-weight: 500;
          color: #fff;
          border-radius: 3px;
          background: hsla(0, 0%, 100%, 0.2);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          position: absolute;
          bottom: 8px;
          left: 4px;
        }

        .fishing-game-name {
          margin-top: 8px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 30px;
          height: 30px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }

        .fishing-games-loading,
        .fishing-games-empty {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
        }
      `}</style>

      <div className="game-content-wrapper">
        {/* 游戏横幅图片 */}
        <div className="game-banner-image">
          <img 
            src="https://ik.imagekit.io/gpbvknoim/af1.avif" 
            alt="游戏大厅"
          />
          <div className="game-banner-title">
            <div className="game-banner-title-left">
              <div className="game-banner-title-header">
                <img 
                  src="https://ik.imagekit.io/gpbvknoim/4d5.avif" 
                  alt="游戏大厅图标"
                  className="game-banner-title-icon"
                />
                <span className="game-banner-title-text">游戏大厅</span>
              </div>
              <div className="game-banner-title-desc">
                <div className="game-banner-title-desc-item">精彩无限</div>
                <div className="game-banner-title-desc-item">乐趣无穷</div>
                <div className="game-banner-title-desc-item">海量电游品牌</div>
              </div>
            </div>
            <div
              className="game-banner-title-right"
              role="button"
              tabIndex={0}
              onClick={() => openGame('AG', 3, 'AG_UH01')}
              onKeyDown={(e) => e.key === 'Enter' && openGame('AG', 3, 'AG_UH01')}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src="https://ik.imagekit.io/gpbvknoim/abb.avif" 
                alt="AG 捕鱼"
              />
            </div>
          </div>
          {/* 游戏大厅按钮 */}
          <div className="game-banner-lobby-buttons">
            <button 
              className="game-banner-lobby-btn pg-btn"
              onClick={() => {
                openGame('PG', 3, '0');
              }}
              aria-label="PG游戏大厅"
            />
            <button 
              className="game-banner-lobby-btn pp-btn"
              onClick={() => {
                openGame('PP', 3, '0');
              }}
              aria-label="PP游戏大厅"
            />
            <button 
              className="game-banner-lobby-btn pa-btn"
              onClick={() => {
                openGame('PA', 3, '0');
              }}
              aria-label="PA游戏大厅"
            />
          </div>
          <div className="game-banner-games">
            {bannerGames.map((game, index) => {
              const imageKey = game.code;
              // 如果状态未定义，默认为加载中；如果为 false，表示已加载完成
              const isLoading = imageLoadingStates[imageKey] === undefined || imageLoadingStates[imageKey] === true;
              
              return (
                <div 
                  key={game.code}
                  className="game-banner-game-item"
                  onClick={() => {
                    const gameCodes = ['vs20sugarrushx', 'vs243lionsgold', 'vs20fruitsw'];
                    openGame('PP', 3, gameCodes[index]);
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', minHeight: '82px' }}>
                    {isLoading && (
                      <div className="game-banner-game-item-image-loading">
                        <div className="game-banner-game-item-image-placeholder">
                          Vip贵宾会<br/>娱乐平台
                        </div>
                      </div>
                    )}
                    <img 
                      src={game.thumbnail || 'https://ik.imagekit.io/gpbvknoim/af1.avif'} 
                      alt={game.name}
                      className="game-banner-game-item-image"
                      onLoadStart={() => {
                        setImageLoadingStates(prev => ({ ...prev, [imageKey]: true }));
                      }}
                      onLoad={() => {
                        setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://ik.imagekit.io/gpbvknoim/af1.avif';
                        setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                      }}
                      style={{ 
                        opacity: isLoading ? 0 : 1,
                        transition: 'opacity 0.3s ease-in-out'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            className="game-banner-btn"
            onClick={() => {
              // 导航到游戏大厅页面
              window.location.href = '/gamelobby';
            }}
          >
            <span>进入大厅</span>
          </button>
          <img 
            src="https://ik.imagekit.io/gpbvknoim/xxxx.avif" 
            alt="指示器"
            className="game-banner-btn-indicator"
          />
        </div>

        {/* 捕鱼游戏模块 */}
        <div className="fishing-games-wrapper">
          <div className="fishing-games-header">
            <div className="fishing-games-title">
              <span className="fishing-icon">🐟</span>
              <span>捕鱼游戏</span>
            </div>
            <div className="fishing-games-nav">
              <button 
                className="fishing-nav-btn fishing-nav-prev"
                onClick={() => {
                  if (fishingSwiperRef.current) {
                    fishingSwiperRef.current.slidePrev();
                  }
                }}
              >
                <img className="fishing-nav-arrow" src="/images/week/zuo.png" alt="上一页" />
              </button>
              <button 
                className="fishing-nav-btn fishing-nav-next"
                onClick={() => {
                  if (fishingSwiperRef.current) {
                    fishingSwiperRef.current.slideNext();
                  }
                }}
              >
                <img className="fishing-nav-arrow" src="/images/week/you.png" alt="下一页" />
              </button>
            </div>
          </div>
          
          {fishingGamesLoading ? (
            <div className="fishing-games-loading">加载中...</div>
          ) : fishingGames.length > 0 ? (
            <div className="fishing-games-mobile">
              {fishingGames.slice(0, 6).map((game) => (
                <div 
                  key={game.id}
                  className="fishing-game-item"
                  onClick={() => {
                    openGame(game.provider || 'AG', game.gameType ?? 6, game.gameCode);
                  }}
                >
                  <div className="fishing-game-cover-wrapper">
                    <img 
                      src={game.thumbnail || '/images/default-game.png'} 
                      alt={game.name}
                      className="fishing-game-picture"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/default-game.png';
                      }}
                    />
                    <div className="fishing-game-provider">{game.provider}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="fishing-games-empty">暂无捕鱼游戏</div>
          )}
        </div>

        {/* 直播模块 */}
        <div 
          className="game-live-module"
          onClick={() => {
            if (displayGames.length > 0) {
              const firstGame = displayGames[0];
              const platformMap: Record<string, string> = {
                'slot-pragmatic': 'PG',
                'slot-cq9': 'CQ9',
                'slot-hacksaw': 'HACKSAW',
                'slot-titan': 'TITAN',
                'slot-uppercut': 'UPPERCUT',
                'slot-peter': 'PETER'
              };
              const platformName = platformMap[firstGame.platformName] || firstGame.platformName.toUpperCase().replace('SLOT-', '');
              openGame(platformName, firstGame.gameType, firstGame.gameCode);
            } else {
              openGame('PG', 3, '0');
            }
          }}
        >
          <img 
            src="https://www.xpj00000.vip/indexImg/icon.e67b8e00.png"
            alt="直播图标"
            className="icon"
          />
          <div className="msg">12月5日9:00麦芽灵动,有你最心动.</div>
          <img 
            src="https://www.xpj00000.vip/indexImg/icon_arrow.6cf8a77d.png"
            alt="箭头"
            className="icon-arrow"
          />
        </div>
      </div>
    </>
  );
}
