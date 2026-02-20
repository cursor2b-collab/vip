import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGames } from '@/contexts/GameContext';
import { openGame } from '@/utils/gameUtils';
import { getServiceUrl } from '@/lib/api/system';
import { getGameApiList } from '@/lib/api/game';
import type { GameApi } from '@/lib/api/game';
import { PageLoader } from '@/components/PageLoader';
import { JackpotPool } from '@/components/JackpotPool';

// 静态兜底：当接口无数据时使用
const staticPlatforms = [
  { name: '欧博视讯', cover: 'https://cy-747263170.imgix.net/sucai23%20(11).png?w=800&q=90&fit=max&auto=format', platformName: 'OBZR', gameType: 1, gameCode: '0', badge: '豪客首选' },
  { name: '亿博视讯', cover: 'https://cy-747263170.imgix.net/yibo.png?w=800&q=90&fit=max&auto=format', platformName: 'YB', gameType: 1, gameCode: '0', badge: '万人同玩' },
  { name: '完美视讯', cover: 'https://cy-747263170.imgix.net/wanmei.png?w=800&q=90&fit=max&auto=format', platformName: 'WM', gameType: 1, gameCode: '0', badge: '直播中' },
  { name: 'BG视讯', cover: 'https://cy-747263170.imgix.net/BG%E6%97%97%E8%88%B0%E5%8E%85.png?w=800&q=90&fit=max&auto=format', platformName: 'BG', gameType: 1, gameCode: '0', badge: '直播中' },
  { name: 'AG视讯', cover: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FNEW/static/img/PA.d3227693.webp', platformName: 'AG', gameType: 1, gameCode: '0', badge: '直播中' },
  { name: 'DG视讯', cover: 'https://cy-747263170.imgix.net/bbin.5cfea684.png?w=800&q=90&fit=max&auto=format', platformName: 'DG', gameType: 1, gameCode: '0', badge: '直播中' },
];

// 中奖滚动数据
const defaultWinners = [
  { username: '***899', amount: '156,789.45' },
  { username: '**********04', amount: '198,234.67' },
  { username: '***057', amount: '145,678.23' },
  { username: '洗米华', amount: '201,331.00' },
  { username: '不败战神', amount: '131,100.89' },
  { username: '***744', amount: '167,890.12' },
  { username: '***233', amount: '189,456.78' },
  { username: '***sdt', amount: '134,567.34' },
  { username: '***638', amount: '175,234.56' },
  { username: '***123', amount: '138,901.23' },
];

// 平台名 → 封面图（优先使用本地 public/images/shipin/ 图片）
const CDN = 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FNEW/static/img/';
const PLATFORM_COVER_MAP: Record<string, string> = {
  'PA':     CDN + 'PA.d3227693.webp',
  'AG':     CDN + 'PA.d3227693.webp',
  'AGIN':   CDN + 'PA.d3227693.webp',
  'BBIN':   '/images/shipin/bbin.png',
  'OG':     '/images/shipin/og.png',
  'OGZR':   '/images/shipin/og.png',
  'DG':     '/images/shipin/EVO.png',
  'EVO':    '/images/shipin/EVO.png',
  'WM':     '/images/shipin/WM.png',
  'WL':     '/images/shipin/wl.png',
  'BG':     CDN + 'evo.4403b3eb.png',
  'YB':     CDN + 'evo.4403b3eb.png',
  'OBZR':   CDN + 'PA.d3227693.webp',
  'OB':     CDN + 'PA.d3227693.webp',
  'XGLIVE': CDN + 'evo.4403b3eb.png',
};

function getPlatformCover(apiName: string, iconUrl?: string): string {
  // 先查本地映射表，有则优先用公开 CDN（避免后端内网地址无法访问）
  const key = (apiName || '').toUpperCase();
  if (PLATFORM_COVER_MAP[key]) return PLATFORM_COVER_MAP[key];
  // 没有映射时用后端 icon_url
  if (iconUrl && iconUrl.startsWith('http') && !iconUrl.includes('undefined') && !iconUrl.includes('null')) {
    return iconUrl;
  }
  return 'https://cy-747263170.imgix.net/sucai23%20(11).png?w=800&q=90&fit=max&auto=format';
}

// 平台名 → 悬停视频（来自 k8pc realPerson.vue）
const MEDIA = 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FNEW/static/media/';
const PLATFORM_VIDEO_MAP: Record<string, string> = {
  'PA':     MEDIA + 'AG.fc46d6fa.mp4',
  'AG':     MEDIA + 'AG.fc46d6fa.mp4',
  'AGIN':   MEDIA + 'AGIN.66620ed5.mp4',
  'BG':     MEDIA + 'AGIN.66620ed5.mp4',
  'EVO':    MEDIA + 'EVO.daab959e.mp4',
  'BBIN':   MEDIA + 'EVO.daab959e.mp4',
  'DG':     MEDIA + 'EVO.daab959e.mp4',
  'OG':     MEDIA + 'AG.fc46d6fa.mp4',
  'WM':     MEDIA + 'AGIN.66620ed5.mp4',
  'YB':     MEDIA + 'AG.fc46d6fa.mp4',
  'OBZR':   MEDIA + 'AG.fc46d6fa.mp4',
  'OB':     MEDIA + 'AG.fc46d6fa.mp4',
  'XGLIVE': MEDIA + 'EVO.daab959e.mp4',
};

function getPlatformVideo(apiName: string): string {
  const key = (apiName || '').toUpperCase();
  return PLATFORM_VIDEO_MAP[key] || MEDIA + 'AG.fc46d6fa.mp4';
}

// 箭头图标 base64
const ARROW_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAPUExURf///0dwTP///////////2JNjWwAAAAEdFJOU4AAYN8tW3RDAAAAR0lEQVQY02MQRAIMpHGEFJE4Kg7IHBdGBEfAxQHJABagFJwDkmIQYoACExdGBhUXOHBC5aAoQzEAm9EolqI4B8WhKF4gJQwAvIsZ5fJtQjsAAAAASUVORK5CYII=';

export function LiveCasinoPage() {
  const navigate = useNavigate();
  const { realbetList, loading } = useGames();
  const [serviceUrl, setServiceUrl] = useState('');
  const [liveApiPlatforms, setLiveApiPlatforms] = useState<GameApi[]>([]);
  const [winners, setWinners] = useState(defaultWinners);
  const [scrollIndex, setScrollIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getServiceUrl().then((res) => {
      if (res.code === 200 && res.data?.url) setServiceUrl(res.data.url);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    getGameApiList(1, 1).then((res) => {
      if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
        setLiveApiPlatforms(res.data);
      }
    }).catch(() => {});
  }, []);

  // 中奖滚动定时器
  useEffect(() => {
    const timer = setInterval(() => {
      setScrollIndex((prev) => {
        const next = (prev + 1) % winners.length;
        return next;
      });
      // 随机更新一条记录
      setWinners((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const names = ['***', '****', '*****'];
        const newList = [...prev];
        newList[idx] = {
          username: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
          amount: (Math.floor(Math.random() * 200000) + 10000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        };
        return newList;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [winners.length]);

  const openOnlineService = () => {
    const url = serviceUrl;
    if (url) { window.open(url, '_blank'); return; }
    getServiceUrl().then((res) => {
      if (res.code === 200 && res.data?.url) window.open(res.data.url, '_blank');
      else alert('客服系统加载中，请稍后再试...');
    }).catch(() => alert('客服系统加载中，请稍后再试...'));
  };

  const platformList = useMemo(() => {
    if (liveApiPlatforms.length > 0) {
      const coverByPlatform = new Map<string, string>();
      realbetList.forEach((game) => {
        const key = (game.platform_name || '').toUpperCase();
        if (game.cover && !coverByPlatform.has(key)) coverByPlatform.set(key, game.cover);
      });
      return liveApiPlatforms.map((p, i) => {
        const code = (p.api_name || '').toUpperCase();
        const cdnCover = coverByPlatform.get(code) || '';
        return {
          name: p.title || p.api_name || '',
          cover: getPlatformCover(p.api_name || '', p.icon_url || cdnCover),
          platformName: p.api_name || '',
          gameType: 1,
          gameCode: '0',
          badge: ['豪客首选', '万人同玩', '直播中'][i % 3],
        };
      });
    }
    if (realbetList.length > 0) {
      const map = new Map<string, { name: string; cover: string; platformName: string; gameType: number; gameCode: string; badge: string }>();
      realbetList.forEach((game, i) => {
        const key = (game.platform_name || '').toUpperCase();
        if (!map.has(key)) {
          map.set(key, {
            name: game.name || key,
            cover: getPlatformCover(game.platform_name || key, game.cover),
            platformName: game.platform_name || key,
            gameType: game.game_type || game.gameType || 1,
            gameCode: game.game_code || '0',
            badge: ['豪客首选', '万人同玩', '直播中'][i % 3],
          });
        }
      });
      return Array.from(map.values());
    }
    return staticPlatforms;
  }, [liveApiPlatforms, realbetList]);

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        .lc-page {
          min-height: 100vh;
          background: #0c1017;
          padding-bottom: 80px;
        }

        /* ===== 顶部导航 ===== */
        .lc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 48px;
          background: rgba(20,24,32,0.95);
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .lc-header-left { display:flex; align-items:center; gap:10px; }
        .lc-back-btn {
          width:32px; height:32px; cursor:pointer; color:#fff;
          display:flex; align-items:center; justify-content:center;
          border-radius:8px; background:rgba(255,255,255,0.06);
        }
        .lc-header-title { font-size:17px; font-weight:600; color:#fff; margin:0; }
        .lc-service-btn {
          display:flex; align-items:center; gap:6px; cursor:pointer;
          padding:6px 12px; border-radius:8px;
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1);
        }
        .lc-service-img { width:18px; height:18px; object-fit:contain; }
        .lc-service-text { font-size:13px; color:#fff; }

        /* ===== 奖池区域 ===== */
        .lc-jackpot { padding: 0 12px 4px; }

        /* ===== 中奖滚动条 ===== */
        .lc-winners-bar {
          margin: 0 12px 12px;
          height: 36px;
          background: rgba(255,203,76,0.08);
          border: 1px solid rgba(255,203,76,0.18);
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 10px;
          gap: 6px;
        }
        .lc-winners-label {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          font-size: 11px;
          color: #ffcb4c;
          font-weight: 600;
          white-space: nowrap;
        }
        .lc-red-dot {
          width: 7px; height: 7px;
          background: #fc1a19;
          border-radius: 50%;
          animation: lc-pulse 1.5s infinite;
        }
        @keyframes lc-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(0.8); }
        }
        .lc-winners-scroll {
          flex: 1;
          overflow: hidden;
          height: 100%;
          position: relative;
        }
        .lc-winners-track {
          transition: transform 1.2s cubic-bezier(0.4,0,0.2,1);
          position: absolute;
          width: 100%;
          top: 0; left: 0;
        }
        .lc-winner-item {
          height: 36px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lc-winner-amount { color: #ffcb4c; font-weight: 600; }

        /* ===== 卡片网格 ===== */
        .lc-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          padding: 0 12px;
        }

        /* ===== 游戏卡片 ===== */
        .lc-card {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          background: #1a1f2e;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .lc-card:active {
          transform: scale(0.97) !important;
          box-shadow: none !important;
        }

        /* 封面图 - 完整显示，不裁剪 */
        .lc-card-img {
          width: 100%;
          height: auto;
          display: block;
          min-height: 120px;
          object-fit: fill;
        }

        /* 底部操作条 */
        .lc-card-action {
          position: absolute;
          left: 8px;
          bottom: 8px;
          right: 8px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 8px;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          padding: 0 6px;
          z-index: 2;
        }

        /* 进厅按钮 */
        .lc-enter-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 24px;
          padding: 0 8px;
          border-radius: 6px;
          background: rgba(255,203,76,0.2);
          border: 1px solid rgba(255,203,76,0.4);
          font-size: 11px;
          color: #ffcb4c;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .lc-enter-arrow {
          width: 10px; height: 10px;
          filter: sepia(1) saturate(5) hue-rotate(5deg);
        }

        /* 状态标签 */
        .lc-status-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
          overflow: hidden;
        }
        .lc-live-icon {
          width: 14px; height: 14px; flex-shrink: 0;
          background: url(https://34.96.146.219:9300/cdn/91a2c0FNEW/static/img/living.08a37c64.webp) center/cover no-repeat;
        }

        /* 悬停视频层 - 默认透明，hover 渐显（参考 k8pc realPerson.vue） */
        .lc-card-video {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          object-fit: fill;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          border-radius: inherit;
          z-index: 1;
          pointer-events: none;
          background: #000;
        }
        .lc-card:hover .lc-card-video {
          opacity: 1;
        }
        /* hover 时卡片上浮 */
        .lc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        /* hover 时遮罩加深便于看清操作栏 */
        .lc-card:hover .lc-card-overlay {
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);
        }

        /* Jackpot 徽章 */
        .lc-jp-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 40px;
          height: auto;
          z-index: 2;
        }

        /* 顶部渐变遮罩 */
        .lc-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%);
          pointer-events: none;
          z-index: 1;
        }

        /* 平台名称 */
        .lc-platform-name {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 10px;
          color: rgba(255,255,255,0.85);
          background: rgba(0,0,0,0.5);
          padding: 2px 6px;
          border-radius: 4px;
          z-index: 2;
        }

        .lc-empty {
          padding: 80px 20px;
          text-align: center;
          color: rgba(255,255,255,0.4);
          font-size: 14px;
        }
      `}</style>

      <div className="lc-page">
        {/* 顶部导航 */}
        <header className="lc-header">
          <div className="lc-header-left">
            <button className="lc-back-btn" onClick={() => navigate(-1)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="lc-header-title">真人视讯</h1>
          </div>
          <button className="lc-service-btn" onClick={openOnlineService}>
            <img src="https://ik.imagekit.io/gpbvknoim/7da179.avif" alt="客服" className="lc-service-img" />
            <span className="lc-service-text">在线客服</span>
          </button>
        </header>

        {/* 奖池 */}
        <div className="lc-jackpot">
          <JackpotPool />
        </div>

        {/* 中奖滚动条 */}
        <div className="lc-winners-bar">
          <div className="lc-winners-label">
            <div className="lc-red-dot" />
            实时中奖
          </div>
          <div className="lc-winners-scroll">
            <div
              className="lc-winners-track"
              style={{ transform: `translateY(${-scrollIndex * 36}px)` }}
            >
              {winners.map((w, i) => (
                <div key={i} className="lc-winner-item">
                  <span>@{w.username} 获得 Jackpot</span>
                  <span className="lc-winner-amount">{w.amount}</span>
                  <span>美元</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 卡片列表 */}
        {platformList.length === 0 ? (
          <div className="lc-empty">暂无视讯平台</div>
        ) : (
          <div className="lc-grid">
            {platformList.map((platform, idx) => (
              <div
                key={platform.platformName}
                className="lc-card"
                onClick={() => openGame(platform.platformName, platform.gameType, platform.gameCode)}
              >
                {/* 封面图 */}
                <img
                  src={platform.cover}
                  alt={platform.name}
                  className="lc-card-img"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://cy-747263170.imgix.net/sucai23%20(11).png?w=800&q=90&fit=max&auto=format'; }}
                />

                {/* 悬停视频层：后台静音播放，hover 时渐显（与 k8pc 一致） */}
                <video
                  className="lc-card-video"
                  src={getPlatformVideo(platform.platformName)}
                  loop
                  autoPlay
                  muted
                  playsInline
                />

                {/* 渐变遮罩 */}
                <div className="lc-card-overlay" />

                {/* 平台名 */}
                <div className="lc-platform-name">{platform.name}</div>

                {/* JP 徽章（前两张显示） */}
                {idx < 2 && (
                  <img
                    className="lc-jp-badge"
                    alt="JP"
                    src="https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FNEW/static/img/jp.ea336340.webp"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}

                {/* 底部操作条 */}
                <div className="lc-card-action">
                  <div className="lc-status-badge">
                    <div className="lc-live-icon" />
                    <span>{(platform as any).badge || '直播中'}</span>
                  </div>
                  <div className="lc-enter-btn">
                    <span>进厅</span>
                    <img src={ARROW_B64} alt="" className="lc-enter-arrow" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
