import { React, useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import { openGame } from '@/utils/gameUtils';
import { useGames } from '@/contexts/GameContext';

interface GameData {
  position: number;
  size: 'small' | 'big';
  marginTop?: boolean;
  image: string;
  platformName: string;
  gameType: number;
  gameCode: string;
  name: string;
  vendorCode: string;
}

// 本周推荐固定 6 个：封面图 + 平台 + gameCode
const WEEK_RECOMMEND_FIXED: GameData[] = [
  { position: 0, size: 'small', marginTop: false, image: '/images/gaming/PG2.avif', platformName: 'PG', gameType: 3, gameCode: 'PG_65', name: '麻将胡了', vendorCode: '' },
  { position: 1, size: 'big', marginTop: false, image: '/images/gaming/PG4.avif', platformName: 'PG', gameType: 3, gameCode: 'PG_89', name: '招财喵', vendorCode: '' },
  { position: 2, size: 'small', marginTop: false, image: '/images/gaming/PG3.avif', platformName: 'PG', gameType: 3, gameCode: 'PG_84', name: '赏金女王', vendorCode: '' },
  { position: 3, size: 'small', marginTop: true, image: '/images/gaming/PG1.avif', platformName: 'PG', gameType: 3, gameCode: 'PG_74', name: '麻将胡了2', vendorCode: '' },
  { position: 4, size: 'small', marginTop: true, image: '/images/gaming/JDB2.avif', platformName: 'JDB', gameType: 3, gameCode: 'JDB_0_14079', name: '富豪哥2', vendorCode: '' },
  { position: 5, size: 'small', marginTop: true, image: '/images/gaming/pp1.avif', platformName: 'PP', gameType: 3, gameCode: 'PP_vs20sugarrushx', name: '极速糖果1000', vendorCode: '' },
];

export function WeekRecommend() {
  const swiperRef = useRef<any>(null);
  const { loading: gamesLoading } = useGames();
  const [games, setGames] = useState<GameData[]>(WEEK_RECOMMEND_FIXED);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setLoading(gamesLoading);
    if (!gamesLoading) setGames(WEEK_RECOMMEND_FIXED);
  }, [gamesLoading]);

  return (
    <>
      <style>{`

        .week-box {
          padding: 15px 16px;
          padding-bottom: 0;
        }
        .week-box .week-title-box{
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .week-icon{
          width: 20px;
          height: 20px;
          margin-right: 4px;
        }
        .week-title-box .title-left {
          font-size: 16px;
          color: #fff;
          display: flex;
          align-items: center;
        }
        .week-title-box .title-right {
          font-size: 12px;
          color: #fff;
          display: flex;
          align-items: center;
        }
        .title-right .extraBtn {
          padding: 5px 7px;
          border-radius: 4px;
          background-color: rgba(199, 218, 255, .0509803922);
          color: #ffc53e;
          font-family: PingFang SC;
          font-size: 12px;
          font-weight: 600;
        }
        .recommend-list2 {
          width: 100%;
          padding: 0;
          margin-bottom: 0.2rem;
        }

        .recommend-list2 .public-module2 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.4rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .recommend-list2 .item2 {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .recommend-list2 .item2:active {
          transform: scale(0.98);
        }

        .recommend-list2 .home-intro-game-card2 {
          width: 100%;
          position: relative;
          border-radius: 20px;
        }

        .recommend-list2 .home-intro-game-card2 img {
          width: 100%;
          display: block;
          object-fit: contain;
          border-radius: 20px;
        }
        
        .recommend-list2 .game-collect-button {
          display: flex;
          -webkit-box-pack: center;
          -ms-flex-pack: center;
          justify-content: center;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
          -webkit-box-orient: horizontal;
          -webkit-box-direction: normal;
          -ms-flex-direction: row;
          flex-direction: row;
          width: .24rem;
          height: .24rem;
          backdrop-filter: blur(10px);
          background: hsla(0, 0%, 100%, .0509803922);
          border-radius: 0 0 0 8px;
          position: absolute;
          top: 0;
          right: 0;
          z-index: 1;
        }
        .provider-box{
          display: flex;
          align-items: center;
        }
        .recommend-list2 .provider {
          display: flex;
          margin-left: 4px;
          margin-right: 10px;
          -webkit-box-pack: center;
          justify-content: center;
          -webkit-box-align: center;
          align-items: center;
          flex-direction: row;
          width: -webkit-fit-content;
          width: -moz-fit-content;
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
          
        }
        .recommend-list2 .game-marks-top{
          -webkit-box-pack: start;
          -ms-flex-pack: start;
          justify-content: flex-start;
          -webkit-box-align: start;
          -ms-flex-align: start;
          align-items: flex-start;
          width: 100%;
          left: 5%;
          top: 6%;
          display: flex;
          flex-direction: row;
          position: absolute;
          z-index: 2;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
        }
        .week-box .pageModule{
          display: flex;
          -webkit-box-orient: horizontal;
          -webkit-box-direction: normal;
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
          height: 24px;
        }

        .week-box .pageItem {
          display: flex;
          -webkit-box-orient: horizontal;
          -webkit-box-direction: normal;
          flex-direction: row;
          -webkit-box-pack: center;
          justify-content: center;
          -webkit-box-align: center;
          align-items: center;
          width: 32px;
          height: 24px;
          margin-left: 4px;
          border-radius: 4px;
          background: rgba(199, 218, 255, .0509803922);
          pointer-events: auto;
          user-select: none;
          -webkit-user-select: none;
        }
        
        .week-box .pageItem.disabled {
          pointer-events: none;
        }
        
        .week-box .pageItem img {
          pointer-events: none;
        }
        .pageModule .pageItem .pageArrow {
          width: 8px;
          height: 8px;
        }
        .game-title3 {
          
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 30px;
          height: 30px;

        }

      `}</style>
      <div className="week-box">
        <div className="week-title-box">
          <div className="title-left">
            <div>
              <img 
                className="week-icon" 
                src="/images/week/icon_week.png" 
                loading="lazy"
                />
            </div>
            <div>本周推荐</div>
          </div>
          <div className="title-right">
            <div className="extraBtn"> 电游大厅 </div>
            <div className="pageModule">
              <div 
                className={`pageItem ${currentIndex === 0 ? 'disabled' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('左按钮点击', { swiperRef: swiperRef.current, currentIndex });
                  if (swiperRef.current && currentIndex > 0) {
                    swiperRef.current.slidePrev();
                  }
                }}
                style={{ cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.3 : 1 }}
              >
                <img className="pageArrow" src="/images/week/zuo.png" alt="上一页"/>
              </div>
              <div 
                className={`pageItem`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('右按钮点击', { swiperRef: swiperRef.current, currentIndex, slidesCount: swiperRef.current?.slides?.length });
                  if (swiperRef.current) {
                    const slidesCount = swiperRef.current.slides?.length || 0;
                    if (currentIndex < slidesCount - 1) {
                      swiperRef.current.slideNext();
                    }
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <img className="pageArrow" src="/images/week/you.png" alt="下一页"/>
              </div>
            </div>
          </div>
        </div>

        <Swiper
            modules={[Navigation]}
            spaceBetween={50}
            slidesPerView={1}
            allowTouchMove={true}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => {
              setCurrentIndex(swiper.activeIndex);
            }}
          >
          <SwiperSlide>
            <div className="recommend-list2">
              <ul className="public-module2">
                {loading ? (
                  // 加载状态
                  Array.from({ length: 6 }).map((_, index) => (
                    <li 
                      key={index} 
                      className="item2 position"
                      style={{ 
                        background: '#2a2f3a', 
                        borderRadius: '8px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        minHeight: '100px'
                      }}
                    >
                      <div style={{ color: '#666', fontSize: '12px' }}>加载中...</div>
                    </li>
                  ))
                ) : (
                  games.map((game) => (
                    <li 
                      key={game.position} 
                      className="item2 position"
                      onClick={async () => {
                        // 使用旧接口启动游戏（从 game_lists 表获取的游戏）
                        console.log('🎮 启动本周推荐游戏:', {
                          name: game.name,
                          platformName: game.platformName,
                          gameCode: game.gameCode,
                          gameType: game.gameType
                        });
                        
                        openGame(game.platformName, game.gameType, game.gameCode);
                      }}
                    >
                      <div className="home-intro-game-card2">
                        <img 
                          src={game.image} 
                          alt={game.name || `Game ${game.position}`}
                          loading="lazy"
                          onError={(e) => {
                            // 图片加载失败时使用默认图片
                            const target = e.target as HTMLImageElement;
                            const defaultImages = [
                              '/images/week/vs20sugarrush1.png',
                              '/images/week/163-zh-F.png',
                              '/images/week/184-zh-F.png'
                            ];
                            if (defaultImages[game.position]) {
                              target.src = defaultImages[game.position];
                            }
                          }}
                        />
                      </div>
                      <div className="provider-box">
                        <div className="provider"> {game.platformName} </div>
                        <div className="game-title3">{game.name}</div>
                      </div>
                      <div className="game-collect-button"><i className="game-collect-button-item"></i></div>
                      
                      <p className="game-marks-top"></p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </SwiperSlide>
          {/* <SwiperSlide>
            <div className="recommend-list2">
              <ul className="public-module2">
                {games.map((game) => (
                  <li 
                    key={game.position} 
                    className={`item2 position_${game.position}`}
                    onClick={async () => {
                      // 所有游戏都使用 openGame 函数，在当前页面内打开（使用 iframe）
                      openGame(game.platformName, game.gameType, game.gameCode);
                    }}
                  >
                    <div className={`home-intro-game-card2 ${game.size}`}>
                      <img 
                        src={game.image} 
                        alt={game.name || `Game ${game.position}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="game-title3">{game.name}</div>
                    <div className="game-collect-button"><i className="game-collect-button-item"></i></div>
                    <div className="provider"> PA </div>
                    <p className="game-marks-top"></p>
                  </li>
                ))}
              </ul>
            </div>
          </SwiperSlide> */}
        </Swiper>
      </div>
    </>
  );
}