import React, { useMemo } from 'react';
import { useGames } from '@/contexts/GameContext';
import { openGame } from '@/utils/gameUtils';

// 兜底静态图（api_games 无图时使用）
const staticImages: Record<number, string> = {
  0: '/images/ng/f7a09c5f491e769eedb7a7c5f7ac5dce.png_.png',
  1: '/images/ng/026_45_1.png',
  2: '/images/ng/6b95ffd319c76b3cdd349fac4955a1b5.png_.webp.png',
  3: '/images/ng/030c8cdead42dfc7e997d9c6d76b4dbe.png_.webp',
  4: '/images/ng/FB.png',
  7: 'https://www.xpj00000.vip/indexImg/074_830.png_.webp',
  8: '/images/newimg/cjnb.png'
};

// PA 视讯（AG）首页推荐前 4 个：固定游戏与封面
const PA_RECOMMEND_GAMES = [
  { position: 0, size: 'small' as const, marginTop: false, gameCode: 'AG_BAC', name: '金球银球', image: '/images/ng/f7a09c5f491e769eedb7a7c5f7ac5dce.png_.png' },
  { position: 1, size: 'big' as const, marginTop: false, gameCode: 'AG_VDG', name: '官人坏坏百J乐', image: '/images/ng/026_45_1.png' },
  { position: 2, size: 'small' as const, marginTop: true, gameCode: 'AG_ROU', name: '捕鱼传说', image: '/images/ng/6b95ffd319c76b3cdd349fac4955a1b5.png_.webp.png' },
  { position: 3, size: 'small' as const, marginTop: true, gameCode: 'AG_SHB', name: '梭哈德州扑克', image: '/images/ng/030c8cdead42dfc7e997d9c6d76b4dbe.png_.webp' },
];

// 固定：FB 体育（位置 4）。前端约定 5=体育，getGameUrl 走美盛接口 game/enter
const FIXED_SLOT_4_FB_SPORT = { position: 4, size: 'small' as const, marginTop: true, platformName: 'FB', gameType: 5, gameCode: '0', name: 'FB体育', image: '/images/ng/FB.png' };
const FIXED_SLOT_7_PA_AG_DT = { position: 7, size: 'small' as const, marginTop: true, platformName: 'PA', gameType: 1, gameCode: 'AG_DT', name: 'AG_DT', image: '/images/ng/79073e2.avif' };

export function RecommendedGames() {
  const { apiGamesList } = useGames();

  // 使用 api_games 表数据，按 game_type 筛选：1=真人 3=电游 5=体育 6=棋牌
  const games = useMemo(() => {
    const items: Array<{
      position: number;
      size: 'small' | 'big';
      marginTop?: boolean;
      image: string;
      platformName: string;
      gameType: number;
      gameCode: string;
      name: string;
    }> = [];
    // 真人视讯：前 4 个固定为 PA 视讯（AG）指定游戏与封面
    PA_RECOMMEND_GAMES.forEach((g) => {
      items.push({
        position: g.position,
        size: g.size,
        marginTop: g.marginTop,
        image: g.image,
        platformName: 'PA',
        gameType: 1,
        gameCode: g.gameCode,
        name: g.name
      });
    });

    // 位置 4：固定 FB 体育（gameType 4）
    items.push({
      position: FIXED_SLOT_4_FB_SPORT.position,
      size: FIXED_SLOT_4_FB_SPORT.size,
      marginTop: FIXED_SLOT_4_FB_SPORT.marginTop,
      image: FIXED_SLOT_4_FB_SPORT.image,
      platformName: FIXED_SLOT_4_FB_SPORT.platformName,
      gameType: FIXED_SLOT_4_FB_SPORT.gameType,
      gameCode: FIXED_SLOT_4_FB_SPORT.gameCode,
      name: FIXED_SLOT_4_FB_SPORT.name
    });

    // 位置 7：固定 PA 视讯 AG_DT
    items.push({
      position: FIXED_SLOT_7_PA_AG_DT.position,
      size: FIXED_SLOT_7_PA_AG_DT.size,
      marginTop: FIXED_SLOT_7_PA_AG_DT.marginTop,
      image: FIXED_SLOT_7_PA_AG_DT.image,
      platformName: FIXED_SLOT_7_PA_AG_DT.platformName,
      gameType: FIXED_SLOT_7_PA_AG_DT.gameType,
      gameCode: FIXED_SLOT_7_PA_AG_DT.gameCode,
      name: FIXED_SLOT_7_PA_AG_DT.name
    });

    // 电游：1个，位置 8（固定为 JDB 超级牛B豪华版，封面图保持不变）
    items.push({
      position: 8,
      size: 'small',
      marginTop: true,
      image: staticImages[8],
      platformName: 'JDB',
      gameType: 3,
      gameCode: 'JDB_0_14045',
      name: '超级牛B 豪华版'
    });

    return items.sort((a, b) => a.position - b.position);
  }, [apiGamesList]);

  return (
    <>
      <style>{`
        .recommend-list {
          width: 100%;
          padding: 0 0.16rem;
          margin-bottom: 0.2rem;
        }

        .recommend-list .public-module {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.15rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .recommend-list .item {
          position: relative;
          overflow: hidden;
          border-radius: 0.08rem;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .recommend-list .item:active {
          transform: scale(0.98);
        }

        .recommend-list .home-intro-game-card {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .recommend-list .home-intro-game-card img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          border-radius: 0.08rem;
        }

        .recommend-list .home-intro-game-card.small {
          aspect-ratio: 1.72;
        }

        .recommend-list .home-intro-game-card.big {
          aspect-ratio: 0.86;
          grid-row: span 2;
        }

        .recommend-list .item.position_0 {
          grid-column: 1;
          grid-row: 1;
        }

        .recommend-list .item.position_1 {
          grid-column: 2;
          grid-row: 1 / span 2;
        }

        .recommend-list .item.position_2 {
          grid-column: 1;
          grid-row: 2;
        }

        .recommend-list .item.position_3 {
          grid-column: 1;
          grid-row: 3;
        }

        .recommend-list .item.position_4 {
          grid-column: 2;
          grid-row: 3;
        }

        .recommend-list .item.position_7 {
          grid-column: 1;
          grid-row: 4;
        }

        .recommend-list .item.position_8 {
          grid-column: 2;
          grid-row: 4;
        }
      `}</style>

      <div className="recommend-list">
        <ul className="public-module">
          {games.map((game) => (
            <li 
              key={game.position} 
              className={`item position_${game.position}`}
              onClick={async () => {
                // 所有游戏都使用 openGame 函数，在当前页面内打开（使用 iframe）
                openGame(game.platformName, game.gameType, game.gameCode);
              }}
            >
              <div className={`home-intro-game-card ${game.size}`}>
                <img 
                  src={game.image} 
                  alt={game.name || `Game ${game.position}`}
                  loading="lazy"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}