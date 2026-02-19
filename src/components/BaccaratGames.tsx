import { useGames } from '@/contexts/GameContext';
import { openGame } from '@/utils/gameUtils';

export function BaccaratGames() {
  const { realbetList } = useGames();
  
  // 过滤掉欧博视讯和XG视讯，只显示前8个
  const filteredGames = realbetList
    .filter(game => game.app_state === 1 && game.name !== '欧博视讯' && game.name !== 'XG视讯')
    .slice(0, 8);
  
  // 如果游戏列表为空，使用静态数据
  const games = filteredGames.length > 0
    ? filteredGames.map((game, index) => ({
        id: index,
        image: game.cover || `https://www.xpj00000.vip/indexImg/0eb168ba2f40b4a09df4dd2390ed1047.png_.webp`,
        position: index,
        platformName: game.platform_name,
        gameType: game.game_type || game.gameType || 1,
        gameCode: game.game_code || '0'
      }))
    : [
        { id: 0, image: 'https://www.xpj00000.vip/indexImg/0eb168ba2f40b4a09df4dd2390ed1047.png_.webp', position: 0, platformName: 'AG', gameType: 1, gameCode: '0' },
        { id: 1, image: 'https://www.xpj00000.vip/indexImg/f7a09c5f491e769eedb7a7c5f7ac5dce.png_.webp', position: 1, platformName: 'BG', gameType: 1, gameCode: '0' },
        { id: 2, image: 'https://www.xpj00000.vip/indexImg/030c8cdead42dfc7e997d9c6d76b4dbe.png_.webp', position: 2, platformName: 'EVO', gameType: 1, gameCode: '0' },
        { id: 3, image: 'https://www.xpj00000.vip/indexImg/9b383048befb1400932e86edb7f7c95c.png_.webp', position: 3, platformName: 'WM', gameType: 1, gameCode: '0' },
        { id: 4, image: 'https://www.xpj00000.vip/indexImg/6b95ffd319c76b3cdd349fac4955a1b5.png_.webp', position: 4, platformName: 'BBIN', gameType: 1, gameCode: '0' },
        { id: 5, image: 'https://www.xpj00000.vip/indexImg/bcf239484a9d675c5db3ac7b46bb870b.png_.webp', position: 5, platformName: 'YB', gameType: 1, gameCode: '0' }
      ];

  return (
    <>
      <style>{`
        .baccarat-games-container {
          background: #151A23;
          padding: 16px;
          padding-bottom: 24px;
        }

        .baccarat-games-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          row-gap: 16px;
        }

        .baccarat-game-item {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          background: #1A1F2A;
          padding: 2px;
        }

        .baccarat-game-item:active {
          transform: scale(0.95);
          opacity: 0.8;
        }

        .baccarat-game-item.margin-top {
          margin-top: 0;
        }

        .baccarat-game-item img {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 10px;
        }
      `}</style>

      <div className="baccarat-games-container" style={{ marginTop: '-20px' }}>
        <div className="baccarat-games-grid">
          {games.map((game) => (
            <div 
              key={game.id}
              className={`baccarat-game-item ${game.position >= 2 ? 'margin-top' : ''}`}
              onClick={() => openGame(game.platformName, game.gameType, game.gameCode)}
            >
              <img 
                src={game.image} 
                alt={`百家乐游戏 ${game.id + 1}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}