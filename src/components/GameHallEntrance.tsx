import React from 'react';
import { openGame } from '@/utils/gameUtils';

export function GameHallEntrance() {
  return (
    <>
      <style>{`
        .entrance-wrap {
          padding: 16px;
          background: #1a1f35;
        }

        .home-game-entrance {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .home-game-entrance .wrap {
          display: flex;
          gap: 12px;
        }

        .title-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .title img {
          width: 24px;
          height: 24px;
        }

        .title span {
          font-size: 18px;
          font-weight: bold;
          color: #ffffff;
        }

        .ad-text {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ad-text li {
          font-size: 14px;
          color: #ffffff;
          opacity: 0.8;
        }

        .game-fish {
          flex: 1;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .game-fish:active {
          transform: scale(0.98);
        }

        .game-fish img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .game-item {
          flex: 1;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .game-item:active {
          transform: scale(0.98);
        }

        .game-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .home-game-entrance-item {
          width: 100%;
          height: 100%;
        }

        .btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #d32f2f 0%, #f57c00 100%);
          border-radius: 8px;
          text-align: center;
          color: #ffffff;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: opacity 0.2s;
          border: none;
        }

        .btn:active {
          opacity: 0.8;
        }
      `}</style>

      <div className="entrance-wrap">
        <div className="home-game-entrance">
          <div className="wrap">
            <div className="title-wrap">
              <div className="title">
                <img 
                  src="https://ik.imagekit.io/gpbvknoim/af1.avif" 
                  alt="游戏大厅图标"
                  style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                />
                <span>游戏大厅</span>
              </div>
              <ul className="ad-text">
                <li>精彩无限</li>
                <li>乐趣无穷</li>
                <li>海量电游品牌</li>
              </ul>
            </div>
            <div 
              className="game-fish"
              onClick={() => openGame('PA', 3, 'lobby')}
            >
              <div className="home-game-entrance-item">
                <img 
                  src="https://ik.imagekit.io/gpbvknoim/af1.avif" 
                  alt="PA捕鱼王"
                />
              </div>
            </div>
          </div>

          <div className="wrap">
            <div 
              className="game-item"
              onClick={() => openGame('PA', 3, 'lobby')}
            >
              <div className="home-game-entrance-item">
                <img 
                  src="https://ik.imagekit.io/gpbvknoim/af1.avif" 
                  alt="PA电游"
                />
              </div>
            </div>
            <div 
              className="game-item"
              onClick={() => openGame('PT', 3, 'lobby')}
            >
              <div className="home-game-entrance-item">
                <img 
                  src="https://ik.imagekit.io/gpbvknoim/af1.avif" 
                  alt="PT电游"
                />
              </div>
            </div>
            <div 
              className="game-item"
              onClick={() => openGame('PP', 3, 'lobby')}
            >
              <div className="home-game-entrance-item">
                <img 
                  src="https://ik.imagekit.io/gpbvknoim/af1.avif" 
                  alt="PP电游"
                />
              </div>
            </div>
          </div>

          <button 
            className="btn"
            onClick={() => {
              // 导航到游戏大厅页面
              window.location.href = '/gamelobby';
            }}
          >
            进入大厅
          </button>
        </div>
      </div>
    </>
  );
}
