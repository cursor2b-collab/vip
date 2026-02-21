import { useGames } from '@/contexts/GameContext';
import { openGame } from '@/utils/gameUtils';

export function LotteryContent() {
  const { lotteryList, jokerList } = useGames();
  
  // 合并彩票和棋牌列表
  const allGames = [...lotteryList, ...jokerList].filter(game => game.app_state === 1);

  // 彩票/棋牌区静态配置：2 个大图 + 6 个小图
  const staticImages = [
    { id: 1, src: '/images/gaming/322a3681123c0df9550c8ad5c4568383.png_.webp', type: 'big', position: 0, platformName: 'KY', gameType: 7, gameCode: 'KY_830', title: '开元棋牌' },
    { id: 2, src: '/images/gaming/cp2.png', type: 'big', position: 1, platformName: 'WL_CHESS', gameType: 7, gameCode: '0', title: '瓦利棋牌' },
    { id: 3, src: '/images/gaming/cp5.png', type: 'small', position: 2, platformName: 'KY', gameType: 7, gameCode: 'KY_890', title: '开元棋牌' },
    { id: 4, src: '/images/gaming/cp8.png', type: 'small', position: 3, platformName: 'KY', gameType: 7, gameCode: 'KY_220', title: '开元棋牌' },
    { id: 5, src: '/images/gaming/4fadab3a11a4a492f3a60a70a64b1188.png', type: 'small', position: 4, platformName: 'WL_CHESS', gameType: 7, gameCode: '4', title: '瓦利棋牌' },
    { id: 6, src: '/images/gaming/99ec13bf46733d4bad4489f03bee04d7.png', type: 'small', position: 5, platformName: 'WL_CHESS', gameType: 7, gameCode: '3', title: '瓦利棋牌' },
    { id: 7, src: '/images/gaming/cp3.png', type: 'small', position: 6, platformName: 'TCG', gameType: 3, gameCode: '0', title: '天成彩票' },
    { id: 8, src: '/images/gaming/97c111212406b4c81383ef49551001d4.png_.webp', type: 'small', position: 7, platformName: 'DB7', gameType: 7, gameCode: '109', title: 'DB棋牌' },
  ];

  return (
    <>
      <style>{`
        .lottery-content-wrapper {
          background: #1a1f35;
          padding: 16px;
        }

        .lottery-images-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .lottery-image-item {
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .lottery-image-item.big {
          grid-row: span 1;
          width: 100%;
          height: 190px;
        }

        .lottery-image-item.small {
          grid-row: span 1;
        }

        .lottery-image-item:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        .lottery-image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .lottery-image-item.big img {
          width: 100%;
          height: 100%;
          object-fit: fill;
          display: block;
        }

        .lottery-live-module {
          display: flex;
          align-items: center;
          background: url('https://www.xpj00000.vip/indexImg/new_bg.faf1b732.png') no-repeat center center;
          background-size: cover;
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .lottery-live-module:active {
          opacity: 0.8;
        }

        .lottery-live-module .icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .lottery-live-module .msg {
          flex: 1;
          color: #ffffff;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lottery-live-module .icon-arrow {
          width: 16px;
          height: 16px;
          margin-left: 8px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="lottery-content-wrapper">
        {/* 图片网格 */}
        <div className="lottery-images-grid">
          {/* {allGames.length > 0 ? allGames.length + '': '0'} */}
          {staticImages.map((image) => (
            <div 
              key={image.id} 
              className={`lottery-image-item ${image.type}`}
              onClick={() => openGame(image.platformName, image.gameType, image.gameCode)}
            >
              <img 
                src={image.src}
                alt={image.title}
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* 直播模块 */}
        <div 
          className="lottery-live-module"
          onClick={() => {
            if (allGames.length > 0) {
              const firstGame = allGames[0];
              openGame(firstGame.platform_name, firstGame.game_type || firstGame.gameType || 4, firstGame.game_code || '0');
            } else {
              openGame('KY', 4, '0');
            }
          }}
        >
          <img 
            src="https://www.xpj00000.vip/indexImg/icon.e67b8e00.png"
            alt="直播图标"
            className="icon"
          />
          <div className="msg">精彩彩票游戏 天天开奖 好运连连</div>
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
