import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { JackpotPool } from './JackpotPool';
import { JackpotPool2 } from './JackpotPool2';
import { DecorativeBackground } from './DecorativeBackground';
import { WeekRecommend } from './WeekRecommend';
import { RecommendedGames } from './RecommendedGames';
import { BaccaratBanners } from './BaccaratBanners';
import { SportsContent } from './SportsContent';
import { LotteryContent } from './LotteryContent';
import { GameContent } from './GameContent';

export function NavigationTabs() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { 
      nameKey: 'tabRecommend',
      icon: '/images/newimg/11.avif',
      activeIcon: '/images/newimg/zhu.avif',
      hasNew: false 
    },
    { 
      nameKey: 'tabBaccarat',
      icon: '/images/newimg/zhu2.avif',
      activeIcon: '/images/newimg/6.avif',
      hasNew: false 
    },
    { 
      nameKey: 'tabSports',
      icon: '/images/newimg/3.avif',
      activeIcon: '/images/newimg/7.avif',
      hasNew: false 
    },
    { 
      nameKey: 'tabGame',
      icon: '/images/newimg/8.avif',
      activeIcon: '/images/newimg/111.avif',
      hasNew: true 
    },
    { 
      nameKey: 'tabLottery',
      icon: '/images/newimg/10.avif',
      activeIcon: '/images/newimg/ll.avif',
      hasNew: false 
    },
  ];

  return (
    <>
      <div className="px-4 py-1" style={{ backgroundColor: '#151A23' }}>
        <div className="relative">
          {/* 背景高亮滑块 */}
          <div 
            className="absolute top-0 h-full transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${activeTab * 100}%)`,
              width: `${100 / tabs.length}%`,
            }}
          >
            <div className="h-full flex items-center justify-center">
              <img 
                src="/images/login/911251.png"
                alt=""
                className="w-full h-full object-contain"
                style={{ transform: 'scale(1.3)' }}
              />
            </div>
          </div>

          {/* 标签项 */}
          <div className="relative flex items-center justify-between">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
                  activeTab === index ? 'scale-105' : 'scale-100'
                }`}
                style={{ width: `${100 / tabs.length}%` }}
              >
                {/* NEW 标签 */}
                {tab.hasNew && (
                  <div className="absolute -top-1 -right-2 z-10">
                    <img 
                      src="https://www.xpj00000.vip/indexImg/new2.e9e5dfc5.svg" 
                      alt="NEW"
                      className="w-5 h-5"
                    />
                  </div>
                )}


                {/* 图标 */}
                <div style={{position:'relative'}} className="w-10 h-10 flex items-center justify-center mb-0.5">

                  <img 
                    src={activeTab === index ? tab.activeIcon : tab.icon} 
                    alt={t(tab.nameKey)}
                    className={`w-full h-full object-contain transition-all ${
                      activeTab === index ? 'brightness-110' : 'brightness-90'
                    }`}
                  />
                </div>

                {/* 文字 */}
                <span 
                  className={`text-xs transition-colors ${
                    activeTab === index 
                      ? 'text-amber-400' 
                      : 'text-zinc-400'
                  }`}
                >
                  {t(tab.nameKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 标签页内容 */}
      {activeTab === 0 ? (
        // K8推荐标签页
        <>
          <JackpotPool />
          <DecorativeBackground />
          <RecommendedGames />
          <WeekRecommend />
        </>
      ) : activeTab === 1 ? (
        // 百家乐标签页
        <>
          <JackpotPool />
          <DecorativeBackground />
          <BaccaratBanners />
        </>
      ) : activeTab === 2 ? (
        // 体育标签页
        <>
          <SportsContent />
        </>
      ) : activeTab === 3 ? (
        // 电游捕鱼标签页
        <>
          <JackpotPool2 />
          <GameContent />
        </>
      ) : activeTab === 4 ? (
        // 彩票标签页
        <>
          <LotteryContent />
        </>
      ) : (
        // 其他标签页
        <RecommendedGames />
      )}
    </>
  );
}