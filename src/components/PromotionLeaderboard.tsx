/**
 * 优惠页下方排行榜（优惠 / 俱乐部）
 */
import React, { useState } from 'react';

const RANK_ICON =
  'https://91a2c0front-wc.jandemetal.com/cdn/91a2c0FM/static/img/rank-icon.4f1d98ab.png_.avif';
const MEDAL_1 =
  'https://91a2c0front-wc.jandemetal.com/cdn/91a2c0FM/static/img/1.e3d0e283.png_.avif';
const MEDAL_2 =
  'https://91a2c0front-wc.jandemetal.com/cdn/91a2c0FM/static/img/2.f0d866e2.png_.avif';
const MEDAL_3 =
  'https://91a2c0front-wc.jandemetal.com/cdn/91a2c0FM/static/img/3.367eb921.png_.avif';

interface LeaderboardRow {
  rank: number;
  account: string;
  starLevel: string;
  reward: string;
}

const MOCK_PROMO: LeaderboardRow[] = [
  { rank: 1, account: '****s88', starLevel: '铂金4星', reward: '7,478,372' },
  { rank: 2, account: '****s66', starLevel: '铂金3星', reward: '6,738,278' },
  { rank: 3, account: '****c00', starLevel: '黑金2星', reward: '4,420,135' },
  { rank: 4, account: '****age', starLevel: '黑金1星', reward: '4,201,105' },
  { rank: 5, account: '****99c', starLevel: '钻石7星', reward: '3,850,017' },
  { rank: 6, account: '****r88', starLevel: '钻石4星', reward: '3,269,858' },
  { rank: 7, account: '****ktt', starLevel: '铂金5星', reward: '2,959,477' },
  { rank: 8, account: '****408', starLevel: '黄金7星', reward: '1,571,076' },
  { rank: 9, account: '****818', starLevel: '钻石3星', reward: '1,116,192' },
  { rank: 10, account: '****168', starLevel: '黄金6星', reward: '823,930' },
];

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="promo-table-rank">
        <img src={MEDAL_1} alt="第1名" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.add('show'); }} />
        <span className="promo-table-rank-fallback">1</span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="promo-table-rank">
        <img src={MEDAL_2} alt="第2名" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.add('show'); }} />
        <span className="promo-table-rank-fallback">2</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="promo-table-rank">
        <img src={MEDAL_3} alt="第3名" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.add('show'); }} />
        <span className="promo-table-rank-fallback">3</span>
      </span>
    );
  }
  return <span className="promo-table-rank"> {rank} </span>;
}

export function PromotionLeaderboard() {
  const [activeTab, setActiveTab] = useState<'promo' | 'club'>('promo');
  const list = activeTab === 'promo' ? MOCK_PROMO : MOCK_PROMO; // 俱乐部可后续接另一数据源

  const handleRuleClick = () => {
    // 榜单规则弹窗或跳转，暂不实现
  };

  return (
    <>
      <style>{`
        .promotion-and-club.promoTable {
          margin: 24px 16px 32px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(26, 31, 46, 0.95);
          padding: 16px;
          padding-top: 0;
          box-sizing: border-box;
        }
        .promotion-and-club .club-header-img-wrap {
          position: relative;
          width: calc(100% + 32px);
          margin-left: -16px;
          margin-right: -16px;
          margin-bottom: 12px;
          overflow: hidden;
          border-radius: 12px 12px 0 0;
        }
        .promotion-and-club .club-header-img-wrap::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          z-index: 1;
          background: linear-gradient(180deg, hsla(0, 0%, 100%, 0.15), hsla(0, 0%, 100%, 0.02));
          border-radius: 12px 12px 0 0;
        }
        .promotion-and-club .club-header-img {
          width: 100%;
          display: block;
          height: auto;
          max-height: 80px;
          object-fit: contain;
          object-position: center top;
          vertical-align: top;
        }
        .promotion-and-club .club-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .promotion-and-club .club-top-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          font-family: 'Source Han Sans CN', '思源黑体', 'Noto Sans SC', sans-serif;
        }
        .promotion-and-club .club-top-left img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        .promotion-and-club .club-top-right {
          font-size: 13px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .promotion-and-club .club-top-right::after {
          content: "";
          width: 14px;
          height: 14px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='rgba(255,255,255,0.6)'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E") no-repeat center;
          background-size: contain;
        }
        .promotion-and-club .club-table {
          position: relative;
        }
        .promotion-and-club .club-header-img-wrap .top-bar {
          display: block;
          width: calc(100% + 12px);
          margin-left: -6px;
          height: 6px;
          flex-shrink: 0;
          border: 1px solid hsla(0, 0%, 100%, 0);
          border-radius: 0;
          border-image-source: linear-gradient(180deg, hsla(0, 0%, 100%, 0), hsla(0, 0%, 100%, 0.05));
          background: rgb(0, 0, 0);
        }
        .promotion-and-club .club-table-top {
          margin-bottom: 12px;
        }
        .promotion-and-club .tab {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 0;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          padding: 4px;
        }
        .promotion-and-club .tab li {
          flex: 1;
          text-align: center;
          padding: 10px 16px;
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .promotion-and-club .tab li.active {
          background: linear-gradient(90deg, #f5a623, #f8c74a);
          color: #1a1a1a;
          font-weight: 600;
        }
        .promotion-and-club .prom-table .head-table,
        .promotion-and-club .prom-table .table-list .item {
          display: grid;
          grid-template-columns: 56px 1fr 90px 100px;
          gap: 8px;
          align-items: center;
          padding: 10px 8px;
        }
        .promotion-and-club .prom-table .head-table {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .promotion-and-club .prom-table .table-list .item {
          font-size: 13px;
          color: #fff;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .promotion-and-club .prom-table .table-list .item:last-child {
          border-bottom: none;
        }
        .promotion-and-club .prom-table .item span:last-child {
          text-align: right;
          font-weight: 600;
          color: #f8c74a;
        }
        .promotion-and-club .promo-table-rank {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
        }
        .promotion-and-club .promo-table-rank img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        .promotion-and-club .promo-table-rank-fallback {
          display: none;
          font-weight: 600;
        }
        .promotion-and-club .promo-table-rank-fallback.show {
          display: inline;
        }
        .promotion-and-club .tip {
          text-align: center;
          padding: 12px 0 0;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
        }
        .promotion-leaderboard-outside .club-top {
          margin: 0 16px 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .promotion-leaderboard-outside .club-top-left {
          color: #fff;
          font-family: 'Source Han Sans CN', '思源黑体', 'Noto Sans SC', sans-serif;
        }
        .promotion-leaderboard-outside .club-top-right {
          color: #fff;
        }
      `}</style>
      <div className="promotion-leaderboard-outside">
        <div className="club-top">
          <div className="club-top-right" onClick={handleRuleClick} role="button" aria-label="榜单规则">
            榜单规则
          </div>
          <div className="club-top-left">
            <img src={RANK_ICON} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            排行榜
          </div>
        </div>
        <div className="promotion-and-club promoTable">
          <div className="club-header-img-wrap">
            <div className="top-bar" />
            <img
              src="/images/gaming/blo888.png"
              alt=""
              className="club-header-img"
            />
          </div>
          <div className="club-table">
            <div className="club-table-top">
            <ul className="tab">
              <li
                className={activeTab === 'promo' ? 'active' : ''}
                onClick={() => setActiveTab('promo')}
              >
                优惠
              </li>
              <li
                className={activeTab === 'club' ? 'active' : ''}
                onClick={() => setActiveTab('club')}
              >
                俱乐部
              </li>
            </ul>
            </div>
            <div className="prom-table">
              <div className="head-table">
                <div className="item">排名</div>
                <div className="item">会员账号</div>
                <div className="item">星级</div>
                <div className="item">累计奖励(元)</div>
              </div>
              <div className="table-list">
                {list.map((row) => (
                  <div key={row.rank} className="item">
                    <span>
                      <RankCell rank={row.rank} />
                    </span>
                    <span>{row.account}</span>
                    <span>{row.starLevel}</span>
                    <span>{row.reward}</span>
                  </div>
                ))}
              </div>
              <div className="tip">
                <span>每30分钟刷新1次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
