import React, { useEffect, useState } from 'react';
import { getHomeNotices, getBanners } from '@/lib/api/system';
import { getGameList } from '@/lib/api/game';
import { openGame } from '@/utils/gameUtils';

/**
 * PC端首页
 * 对应 k8_pc 的 mode/index.vue
 */
export default function PCIndexPage() {
  const [notices, setNotices] = useState<string[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [hotGames, setHotGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 获取公告
      const noticesRes = await getHomeNotices();
      if (noticesRes.code === 200) {
        setNotices(noticesRes.data || []);
      }

      // 获取轮播图
      const bannersRes = await getBanners(2);
      if (bannersRes.code === 200) {
        setBanners(bannersRes.data || []);
      }

      // 获取热门游戏（获取所有游戏，然后取前12个）
      const gamesRes = await getGameList();
      if (gamesRes.code === 200) {
        setHotGames((gamesRes.data || []).slice(0, 12));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = (game: any) => {
    openGame(
      game.platform_name || game.api_name || '',
      game.game_type || game.gameType || 0,
      game.game_code || game.gameCode || '0'
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ background: '#0C1017', minHeight: '100vh', color: '#fff' }}>
      {/* 公告栏 */}
      {notices.length > 0 && (
        <div
          style={{
            background: '#1a1a1a',
            padding: '10px 20px',
            marginBottom: '20px',
            borderRadius: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#ffcb4c' }}>📢</span>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {notices.map((notice, index) => (
                <div key={index} style={{ marginBottom: '5px' }}>
                  {notice}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 轮播图 */}
      {banners.length > 0 && (
        <div
          style={{
            marginBottom: '30px',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <img
            src={banners[0]?.src || banners[0]?.url || ''}
            alt="Banner"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      )}

      {/* 热门游戏 */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#ffcb4c' }}>
          热门游戏
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px'
          }}
        >
          {hotGames.map((game, index) => (
            <div
              key={index}
              onClick={() => handlePlayGame(game)}
              style={{
                background: '#1a1a1a',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                border: '1px solid #333'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = '#ffcb4c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#333';
              }}
            >
              <img
                src={game.cover || ''}
                alt={game.name}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/default-game.png';
                }}
              />
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {game.name}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  {game.platform_name || game.api_name || ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

