import { useGames } from '@/contexts/GameContext';
import { openGame } from '@/utils/gameUtils';

export function SportsContent() {
  const { sportList } = useGames();
  
  console.log('sportList', sportList);
  // 静态图片数据（如果游戏列表为空时使用）
  const sprotListData = [
        {
            "name": "沙巴体育",
            "gameType": 4,
            "game_type": 4,
            "game_code": 0,
            "mobile_pic": "/images/week/99e6f2f92958248fc84096bcc5723c47.png",
            "tags": "",
            "params":  {gameCode: '0', gameType: 5},
            "platform_name": "saba",
            "weight": 999,
            "game_type_text": "体育",
            "game_type_cn_text": "体育"
        },
        {
            "name": "FB体育",
            "gameType": 5,
            "game_type": 5,
            "game_code": 0,
            "mobile_pic": "/images/week/8b4a0000065c5fcf281d032c12ce0162.png",
            "tags": "",
            "params":  {gameCode: '0', gameType: 5},
            "platform_name": "FB",
            "weight": 999,
            "game_type_text": "体育",
            "game_type_cn_text": "体育"
        },
        {
            "name": "SBO体育",
            "gameType": 4,
            "game_type": 4,
            "game_code": 0,
            "mobile_pic": "/images/gaming/SBOTY.png",
            "tags": "",
            "params":  {gameCode: '0', gameType: 4},
            "platform_name": "sa",
            "weight": 11,
            "game_type_text": "体育",
            "game_type_cn_text": "体育"
        },
        {
            "name": "小金体育",
            "gameType": 5,
            "game_type": 5,
            "game_code": 0,
            "mobile_pic": "/images/gaming/XJTY.png",
            "tags": "",
            "params":  {gameCode: '0', gameType: 5},
            "platform_name": "XJ",
            "weight": 10,
            "game_type_text": "体育",
            "game_type_cn_text": "体育"
        },
        {
           "name": "AI体育",
            "gameType": 5,
            "game_type": 5,
            "game_code": 0,
            "mobile_pic": "/images/gaming/AITY.png",
            "tags": "",
            "params":  {gameCode: '0', gameType: 5},
            "platform_name": "AI",
            "weight": 10,
            "game_type_text": "体育",
            "game_type_cn_text": "体育"
        },
        {
            "name": "三晟体育",
            "gameType": 5,
            "game_type": 5,
            "game_code": 0,
            "mobile_pic": "/images/gaming/SSTY.png",
            "tags": "",
            "params":  {gameCode: '0', gameType: 5},
            "platform_name": "SS",
            "weight": 10,
            "game_type_text": "体育",
            "game_type_cn_text": "体育"
        },
        {
            "name": "皇冠体育",
            "gameType": 4,
            "game_type": 4,
            "game_code": 0,
            "mobile_pic": "/images/gaming/HGTY.png",
            "tags": "",
            "params":  {gameCode: '0', gameType: 4},
            "platform_name": "crown",
            "weight": 10,
            "game_type_text": "体育",
            "game_type_cn_text": "体育"
        },
        {
            "name": "雷火电竞",
            "gameType": 5,
            "game_type": 5,
            "game_code": 0,
            "mobile_pic": "/images/gaming/9ad5a7179ab07e9d5c6c23b0f7d5acd0.png_.webp",
            "tags": "",
            "params":  {gameCode: '0', gameType: 5},
            "platform_name": "TFG",
            "weight": 10,
            "game_type_text": "体育",
            "game_type_cn_text": "体育"
        }
    ]

  const staticImages = [
    {
      id: 1,
      src: "/images/week/99e6f2f92958248fc84096bcc5723c47.png",
      type: 'big',
      position: 0
    },
    {
      id: 2,
      // src: "https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/_wms/img/_l/form/8b4a0000065c5fcf281d032c12ce0162.png_.webp?time=1764885702507",
      src: "/images/week/99e6f2f92958248fc84096bcc5723c47.png",
      type: 'big',
      position: 1
    },
    {
      id: 3,
      src: "/images/week/99e6f2f92958248fc84096bcc5723c47.png",
      //https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/_wms/img/_l/form/56742668882b2e285ee81692eeeef45e.png_.webp?time=1764885702269
      type: 'small',
      position: 2
    },
    {
      id: 4,
      // src: "https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/_wms/img/_l/form/3b49258f83a2af19c1f3fb1f94f17e54.png_.webp?time=1764885702315",
      src: "/images/week/99e6f2f92958248fc84096bcc5723c47.png",
      type: 'small',
      position: 3
    },
    {
      id: 5,
      src: "/images/week/99e6f2f92958248fc84096bcc5723c47.png",
      // src: "https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/_wms/img/_l/form/9ad5a7179ab07e9d5c6c23b0f7d5acd0.png_.webp?time=1764885702494",
      type: 'small',
      position: 4
    },
    {
      id: 6,
      src: "/images/week/99e6f2f92958248fc84096bcc5723c47.png",
      // src: "https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/_wms/img/_l/form/1a0fb03baf45d2ce3cf7100f50eb7f7c.png_.webp?time=1764885702423",
      type: 'small',
      position: 5
    }
  ];

  return (
    <>
      <style>{`
        .sports-content-wrapper {
          background: #1a1f35;
          padding: 16px;
        }

        .sports-images-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .sports-image-item {
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .sports-image-item.big {
          grid-row: span 1;
        }

        .sports-image-item.small {
          grid-row: span 1;
        }

        .sports-image-item:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        .sports-image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 6px;
        }

        .sports-live-module {
          display: flex;
          align-items: center;
          background: url('https://www.xpj00000.vip/indexImg/new_bg.faf1b732.png') no-repeat center center;
          background-size: cover;
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .sports-live-module:active {
          opacity: 0.8;
        }

        .sports-live-module .icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .sports-live-module .msg {
          flex: 1;
          color: #ffffff;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sports-live-module .icon-arrow {
          width: 16px;
          height: 16px;
          margin-left: 8px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="sports-content-wrapper">
        {/* 图片网格 */}
        <div className="sports-images-grid">
          {(sprotListData.length > 0 ? sprotListData.slice(0, 8).map((game, index) => ({
            id: index + 1,
            src: game.mobile_pic || staticImages[index]?.src || '',
            type: index < 2 ? 'big' : 'small',
            platformName: game.platform_name,
            gameType: game.game_type || game.gameType || 5,
            gameCode: game.game_code || '0'
          })) : staticImages.map(img => ({ ...img, platformName: 'PA', gameType: 5, gameCode: '0' }))).map((image) => (
            <div 
              key={image.id} 
              className={`sports-image-item ${image.type}`}
              onClick={() => openGame(image.platformName, image.gameType, image.gameCode)}
            >
              <img 
                src={image.src}
                alt={`体育推广 ${image.id}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* 直播赛事模块 */}
        <div 
          className="sports-live-module"
          onClick={() => {
            if (sportList.length > 0) {
              const firstGame = sportList[0];
              openGame(firstGame.platform_name, firstGame.game_type || firstGame.gameType || 5, firstGame.game_code || '0');
            } else {
              openGame('PA', 5, '0');
            }
          }}
        >
          <img 
            src="https://www.xpj00000.vip/indexImg/icon.e67b8e00.png"
            alt="直播图标"
            className="icon"
          />
          <div className="msg">12/5NBA9:00森林狼vs鹈鹕</div>
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