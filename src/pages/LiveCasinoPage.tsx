import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGames } from '@/contexts/GameContext';
import { openGame } from '@/utils/gameUtils';
import { getServiceUrl } from '@/lib/api/system';
import { getGameApiList } from '@/lib/api/game';
import type { GameApi } from '@/lib/api/game';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { PageLoader } from '@/components/PageLoader';
import { JackpotPool } from '@/components/JackpotPool';

// 静态兜底：当接口无数据时使用
const staticPlatforms = [
  { name: '欧博视讯', cover: 'https://cy-747263170.imgix.net/sucai23%20(11).png?w=800&q=90&fit=max&auto=format', platformName: 'OBZR', gameType: 1, gameCode: '0' },
  { name: '亿博视讯', cover: 'https://cy-747263170.imgix.net/yibo.png?w=800&q=90&fit=max&auto=format', platformName: 'YB', gameType: 1, gameCode: '0' },
  { name: '完美视讯', cover: 'https://cy-747263170.imgix.net/wanmei.png?w=800&q=90&fit=max&auto=format', platformName: 'WM', gameType: 1, gameCode: '0' },
  { name: 'BG视讯', cover: '/images/bgsx12png%20(1).png', platformName: 'BG', gameType: 1, gameCode: '0' },
  { name: 'AG视讯', cover: '/images/bcf239484a9d675c5db3ac7b46bb870b.png', platformName: 'AG', gameType: 1, gameCode: '0' },
  { name: 'XG视讯', cover: 'https://cy-747263170.imgix.net/bgsx12png%20(2).png?w=800&q=90&fit=max&auto=format', platformName: 'XGLIVE', gameType: 1, gameCode: '0' },
  { name: 'DG视讯', cover: '/images/bgsx12png%20(3).png', platformName: 'DG', gameType: 1, gameCode: '0' },
  { name: 'BBIN视讯', cover: '/images/bcf239484a9d675c5db3ac7b46bb870b.png', platformName: 'BBIN', gameType: 1, gameCode: '0' }
];

export function LiveCasinoPage() {
  const navigate = useNavigate();
  const { realbetList, loading } = useGames();
  const [serviceUrl, setServiceUrl] = useState('');
  const [liveApiPlatforms, setLiveApiPlatforms] = useState<GameApi[]>([]);

  // 获取客服链接
  useEffect(() => {
    const fetchServiceUrl = async () => {
      try {
        const res = await getServiceUrl();
        if (res.code === 200 && res.data && res.data.url) {
          setServiceUrl(res.data.url);
        }
      } catch {
        setServiceUrl('');
      }
    };
    fetchServiceUrl();
  }, []);

  // 拉取后端「真人视讯」平台列表（全部真人平台）
  useEffect(() => {
    getGameApiList(1, 1).then((res) => {
      if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
        setLiveApiPlatforms(res.data);
      }
    }).catch(() => {});
  }, []);

  const openOnlineService = () => {
    if (serviceUrl) {
      window.open(serviceUrl, '_blank');
    } else {
      getServiceUrl().then((res) => {
        if (res.code === 200 && res.data && res.data.url) {
          window.open(res.data.url, '_blank');
        } else {
          alert('客服系统加载中，请稍后再试...');
        }
      }).catch(() => {
        alert('客服系统加载中，请稍后再试...');
      });
    }
  };

  // 优先使用后端真人平台列表；用 realbetList 补封面；无接口数据时用静态列表
  const platformList = useMemo(() => {
    if (liveApiPlatforms.length > 0) {
      const coverByPlatform = new Map<string, string>();
      realbetList.forEach((game) => {
        const key = (game.platform_name || '').toUpperCase();
        if (game.cover && !coverByPlatform.has(key)) coverByPlatform.set(key, game.cover);
      });
      return liveApiPlatforms.map((p) => {
        const code = (p.api_name || '').toUpperCase();
        return {
          name: p.title || p.api_name || code,
          cover: p.icon_url || coverByPlatform.get(code) || '/images/default-game.png',
          platformName: p.api_name || code,
          gameType: 1,
          gameCode: '0'
        };
      });
    }
    if (realbetList.length > 0) {
      const map = new Map<string, { name: string; cover: string; platformName: string; gameType: number; gameCode: string }>();
      realbetList.forEach((game) => {
        const key = (game.platform_name || '').toUpperCase();
        if (!map.has(key)) {
          map.set(key, {
            name: game.name || key,
            cover: game.cover || '',
            platformName: game.platform_name || key,
            gameType: game.game_type || game.gameType || 1,
            gameCode: game.game_code || '0'
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
        .live-casino-page {
          min-height: 100vh;
          background: #0f1419;
          padding-bottom: 80px;
        }

        .live-casino-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 48px;
          background: #1a1a1a;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .live-casino-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .live-casino-back-btn {
          width: 24px;
          height: 24px;
          cursor: pointer;
          color: #ffffff;
          padding: 4px;
        }

        .live-casino-header-title {
          font-size: 18px;
          font-weight: 500;
          color: #ffffff;
          margin: 0;
        }

        .live-casino-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .live-casino-customer-service {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .live-casino-customer-service-img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .live-casino-customer-service-text {
          font-size: 14px;
          color: #ffffff;
          font-weight: 500;
        }

        .live-casino-games {
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .live-casino-game-card {
          background: #1a1f2e;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .live-casino-game-card:active {
          transform: scale(0.98);
        }

        .live-casino-game-image {
          width: 100%;
          aspect-ratio: 16/9;
          object-fit: cover;
          display: block;
        }

        .live-casino-empty {
          padding: 60px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>

      <div className="live-casino-page">
        <header className="live-casino-header">
          <div className="live-casino-header-left">
            <svg
              className="live-casino-back-btn"
              onClick={() => navigate(-1)}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <h1 className="live-casino-header-title">真人视讯</h1>
          </div>
          <div className="live-casino-header-right" onClick={openOnlineService}>
            <div className="live-casino-customer-service">
              <img
                src="https://ik.imagekit.io/gpbvknoim/7da179.avif"
                alt="在线客服"
                className="live-casino-customer-service-img"
              />
              <span className="live-casino-customer-service-text">在线客服</span>
            </div>
          </div>
        </header>

        <JackpotPool />

        {platformList.length === 0 ? (
          <div className="live-casino-empty">暂无视讯平台</div>
        ) : (
          <div className="live-casino-games">
            {platformList.map((platform) => (
              <div
                key={platform.platformName}
                className="live-casino-game-card"
                onClick={() =>
                  openGame(platform.platformName, platform.gameType, platform.gameCode)
                }
              >
                <ImageWithFallback
                  src={platform.cover}
                  alt={platform.name}
                  className="live-casino-game-image"
                  fallbackSrc="/images/default-game.png"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
