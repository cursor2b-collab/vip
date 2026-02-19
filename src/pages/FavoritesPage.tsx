/**
 * 我的收藏页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFavoriteList, deleteFavorite, FavoriteGame } from '@/lib/api/favor';
import { openGame } from '@/utils/gameUtils';
import { ChevronLeft } from 'lucide-react';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [isLoggedIn]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await getFavoriteList();
      if (res.code === 200) {
        setFavorites(res.data || []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (game: FavoriteGame) => {
    try {
      // 使用 openGame 函数，在当前页面内打开
      openGame(game.platform_name, game.game_type || 1, game.game_code);
    } catch (err: any) {
      alert(err.message || t('gameLoadFailed'));
    }
  };

  const handleDelete = async (gameId: number) => {
    if (!confirm(t('confirmCancelFavorite'))) return;
    try {
      const res = await deleteFavorite({ game_id: gameId });
      if (res.code === 200) {
        alert(t('cancelFavoriteSuccess'));
        loadFavorites();
      } else {
        alert(res.message || t('cancelFavoriteFailed'));
      }
    } catch (err: any) {
      alert(err.message || t('cancelFavoriteFailed'));
    }
  };

  const openOnlineService2 = () => {
    window.open('https://www.beebet77.com', '_blank');
  };
  const openOnlineService3 = () => {
    window.open('https://www.beebet77.com', '_blank');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'rgb(12, 16, 23)', 
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
        background: 'rgb(12, 16, 23)'
      }}>
        {/* 头部 */}
        <div style={{ 
          padding: '15px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          display: 'flex', 
          alignItems: 'center',
          position: 'relative'
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
          <h1 style={{ margin: 0, fontSize: '20px', flex: 1, textAlign: 'center' }}>{t('favoritesTitle')}</h1>
        </div>

        {/* 内容区域 */}
        <div style={{ padding: '20px' }}>
          
          <div style={{ marginTop: '20px' }}>
            <div
              onClick={openOnlineService2}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '10px',
                background: 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))',
                borderRadius: '12px',
                border: '1px solid rgba(255, 197, 62, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '16px',
                color: '#e4ab30',
                fontWeight: 500
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.15), rgba(255, 197, 62, 0.08))';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))';
              }}
            >
              <img
                src="https://www.xpj00000.vip/indexImg/icon_service.6b1fddf8.png"
                alt="B77官方:www.beebet77.com"
                style={{ width: '32px', height: '32px', flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>B77官方：www.beebet77.com</span>
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <div
              onClick={openOnlineService3}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '10px',
                background: 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))',
                borderRadius: '12px',
                border: '1px solid rgba(255, 197, 62, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '16px',
                color: '#e4ab30',
                fontWeight: 500
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.15), rgba(255, 197, 62, 0.08))';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))';
              }}
            >
              <img
                src="https://www.xpj00000.vip/indexImg/icon_service.6b1fddf8.png"
                alt="B77官方：www.beebet77.com"
                style={{ width: '32px', height: '32px', flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>B77官方：www.beebet77.com</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

