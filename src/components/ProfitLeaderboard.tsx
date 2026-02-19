import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { openGame } from '@/utils/gameUtils';

interface ProfitItem {
  user: string;
  desc: string;
  amount: string;
  hasPlayBtn?: boolean;
}

interface ProfitRankListProps {
  profitData?: ProfitItem[];
  onViewMore?: () => void;
}

const defaultProfitData: ProfitItem[] = [
  { user: '贵宾 ****s66', desc: '11/10在PA国际百家乐', amount: '175277.00', hasPlayBtn: true },
  { user: '贵宾 ****s88', desc: '12/03在PA国际百家乐', amount: '33060.00', hasPlayBtn: true },
  { user: '贵宾 ****907', desc: '09/30在电游JP', amount: '645637.00', hasPlayBtn: false },
  { user: '贵宾 ****008', desc: '11/20在PA旗舰百家乐', amount: '488040.00', hasPlayBtn: true },
  { user: '贵宾 ****510', desc: '07/21在PA 旗舰百家乐', amount: '397070.00', hasPlayBtn: true }
];

export function ProfitLeaderboard({ 
  profitData = defaultProfitData, 
  onViewMore 
}: ProfitRankListProps = {}) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % profitData.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [profitData.length]);

  const currentItem = profitData[currentIndex];

  return (
    <>
      <style>{`
        .profit-exposure-card {
          background: #0C1017;
          padding: 20px 16px;
          margin-bottom: 12px;
        }

        .profit-home-title-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .profit-home-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-size: 18px;
        }

        .profit-home-title img {
          width: 20px;
          height: 20px;
        }

        .profit-btn-history {
          color: #999;
          font-size: 14px;
          cursor: pointer;
        }

        .profit-btn-history:hover {
          color: #ffc53e;
        }

        .profit-card-container {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .profit-card-item {
          width: 100%;
          padding: 20px 16px;
          border-radius: 12px;
          background-image: url(https://ik.imagekit.io/gpbvknoim/1dc.avif);
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .profit-icon-money-rain {
          width: 60px;
          height: 60px;
          position: absolute;
          top: 0;
          right: 20px;
          z-index: 0;
        }

        .profit-icon-money {
          width: 200px;
          height: auto;
          position: absolute;
          top: 20px;
          right: -10px;
          z-index: 1;
          object-fit: contain;
          object-position: right center;
        }

        .profit-txt-content {
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 2;
        }

        .profit-txt-content h3 {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .profit-txt-content .profit-desc {
          font-size: 14px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.65);
          margin: 0 0 12px 0;
        }

        .profit-txt-content .profit-amount-wrap {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          flex-direction: row;
          width: fit-content;
          height: 40px;
          padding: 0 12px 0 4px;
          margin: 0 0 16px 0;
          background: rgba(49, 13, 0, 0.25);
          border-radius: 6px;
          border: 0.5px solid rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .profit-txt-content .profit-amount-wrap img {
          width: auto;
          height: 32px;
          margin-right: 8px;
        }

        .profit-txt-content .profit-amount-wrap .profit-amount {
          font-family: DINAlternate-Bold, Arial, sans-serif;
          color: #ffe251;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(180deg, #ffe251, #ff8227);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .profit-txt-content .profit-amount-wrap .profit-amount span {
          font-size: 16px;
          font-weight: 500;
        }

        .profit-txt-content .profit-btn-group {
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
          flex-direction: row;
          width: 100%;
          flex-wrap: nowrap;
          gap: 8px;
          margin-top: 0;
        }

        .profit-btn-group .profit-btn {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: row;
          min-width: 100px;
          height: 44px;
          padding: 0 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          white-space: nowrap;
        }

        .profit-btn-group .profit-btn.dark-top {
          color: #ffc53e;
          background: rgba(255, 197, 62, 0.05);
          border: 1px solid rgba(255, 197, 62, 0.15);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .profit-btn-group .profit-btn.dark-top:active {
          background: rgba(255, 197, 62, 0.15);
          border: 1px solid rgba(255, 203, 76, 0.2);
        }

        .profit-btn-group .profit-btn.light-top {
          color: rgba(0, 0, 0, 0.85);
          background: #ffc53e;
          box-shadow: inset 0 0 10px 0 rgba(255, 46, 0, 0.45),
            0 0 8px 0 rgba(255, 46, 0, 0.25);
        }

        .profit-btn-group .profit-btn.light-top:active {
          background: #ffd83e;
        }

        .profit-indicators {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
        }

        .profit-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.3s;
        }

        .profit-indicator.active {
          width: 20px;
          border-radius: 3px;
          background: #ffc53e;
        }
      `}</style>

      <div className="profit-exposure-card">
        <div className="profit-home-title-between">
          <div className="profit-home-title">
            <img src="https://www.xpj00000.vip/indexImg/title_icon.ecd82694.png" alt="icon" />
            <span>{t('profitLeaderboard')}</span>
          </div>
          <div className="profit-btn-history" onClick={onViewMore}>
            {t('viewMore')}
          </div>
        </div>

        <div className="profit-card-container">
          <div className="profit-card-item" key={currentIndex}>
            <img
              src="https://www.xpj00000.vip/indexImg/icon_money_rain.456de041.gif"
              alt="金钱雨"
              className="profit-icon-money-rain"
            />
            <img
              src="https://www.xpj00000.vip/indexImg/icon_money.a55514e9.png"
              alt="$"
              className="profit-icon-money"
              style={{ right: '5px', top: '50px', width: '240px' }}
            />
            <div className="profit-txt-content">
              <h3>{currentItem.user}</h3>
              <div className="profit-desc">{currentItem.desc}</div>
              <div className="profit-amount-wrap">
                <img
                  src="https://www.xpj00000.vip/indexImg/top_profit_txt.7613b119.png"
                  alt="profit"
                />
                <div className="profit-amount">
                  {currentItem.amount} <span>元</span>
                </div>
              </div>
              <div className="profit-btn-group">
                <div className="profit-btn dark-top">看详情</div>
                {currentItem.hasPlayBtn && (
                  <div 
                    className="profit-btn light-top"
                    onClick={() => openGame('PA', 1, '0')}
                  >
                    玩同款
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profit-indicators">
          {profitData.map((_, index) => (
            <div
              key={index}
              className={`profit-indicator ${index === currentIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}