import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getHomeTabConfig, type HomeTabItem } from '@/lib/api/system';
import { HomeTabConfigProvider } from '@/contexts/HomeTabConfigContext';
import { JackpotPool } from './JackpotPool';
import { JackpotPool2 } from './JackpotPool2';
import { DecorativeBackground } from './DecorativeBackground';
import { WeekRecommend } from './WeekRecommend';
import { RecommendedGames } from './RecommendedGames';
import { BaccaratBanners } from './BaccaratBanners';
import { SportsContent } from './SportsContent';
import { LotteryContent } from './LotteryContent';
import { GameContent } from './GameContent';

const DEFAULT_TABS: HomeTabItem[] = [
  { id: 0, key: 'tabRecommend', name: '推荐', icon: '/images/newimg/11.avif', activeIcon: '/images/newimg/zhu.avif', enabled: true, hasNew: false },
  { id: 1, key: 'tabBaccarat', name: '百家乐', icon: '/images/newimg/zhu2.avif', activeIcon: '/images/newimg/6.avif', enabled: true, hasNew: false },
  { id: 2, key: 'tabSports', name: '体育', icon: '/images/newimg/3.avif', activeIcon: '/images/newimg/7.avif', enabled: true, hasNew: false },
  { id: 3, key: 'tabGame', name: '电游捕鱼', icon: '/images/newimg/8.avif', activeIcon: '/images/newimg/111.avif', enabled: true, hasNew: true },
  { id: 4, key: 'tabLottery', name: '棋牌彩票', icon: '/images/newimg/10.avif', activeIcon: '/images/newimg/ll.avif', enabled: true, hasNew: false },
];

export function NavigationTabs() {
  useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [tabConfig, setTabConfig] = useState<HomeTabItem[]>(DEFAULT_TABS);

  useEffect(() => {
    getHomeTabConfig().then((data) => {
      if (data && data.length > 0) {
        setTabConfig(data);
        // 若当前激活的 tab 被禁用，重置到第一个启用的 tab
        const enabledIds = data.filter(tab => tab.enabled).map(tab => tab.id);
        setActiveTab(prev => enabledIds.includes(prev) ? prev : (enabledIds[0] ?? 0));
      }
    });
  }, []);

  // 只展示已启用的标签
  const tabs = tabConfig.filter(tab => tab.enabled);

  return (
    <HomeTabConfigProvider tabs={tabConfig}>
      <div className="px-4 py-1" style={{ backgroundColor: '#151A23' }}>
        <div className="relative">
          {/* 背景高亮滑块 */}
          <div 
            className="absolute top-0 h-full transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${tabs.findIndex(tab => tab.id === activeTab) * 100}%)`,
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
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
                  activeTab === tab.id ? 'scale-105' : 'scale-100'
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
                    src={activeTab === tab.id ? tab.activeIcon : tab.icon} 
                    alt={tab.name}
                    className={`w-full h-full object-contain transition-all ${
                      activeTab === tab.id ? 'brightness-110' : 'brightness-90'
                    }`}
                  />
                </div>

                {/* 文字 */}
                <span 
                  className={`text-xs transition-colors ${
                    activeTab === tab.id 
                      ? 'text-amber-400' 
                      : 'text-zinc-400'
                  }`}
                >
                  {tab.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 标签页内容 —— 按固定 id 判断，与顺序/是否启用无关 */}
      {activeTab === 0 ? (
        <>
          <JackpotPool />
          <DecorativeBackground />
          <RecommendedGames />
          <WeekRecommend />
        </>
      ) : activeTab === 1 ? (
        <>
          <JackpotPool />
          <DecorativeBackground />
          <BaccaratBanners />
        </>
      ) : activeTab === 2 ? (
        <>
          <SportsContent />
        </>
      ) : activeTab === 3 ? (
        <>
          <JackpotPool2 />
          <GameContent />
        </>
      ) : activeTab === 4 ? (
        <>
          <LotteryContent />
        </>
      ) : (
        <RecommendedGames />
      )}
    </HomeTabConfigProvider>
  );
}