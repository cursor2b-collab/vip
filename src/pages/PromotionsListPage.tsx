/**
 * 优惠活动列表页面 - 正确版本
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivityList, type Activity } from '@/lib/api/activity';
import { PromotionLeaderboard } from '@/components/PromotionLeaderboard';

interface Tab {
  name: string;
  type: string;
}

const DEFAULT_ACTIVITY: Activity = {
  id: 'threegifts' as any,
  title: '新用户专享 40%超高存送 最高赠送16888元',
  banner: '/images/newimg/aa71.avif',
  content: '',
  type: 'default',
  created_at: '',
  start_date: '',
  end_date: ''
};

export default function PromotionsListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [displayList, setDisplayList] = useState<Activity[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([{ name: '全部活动', type: 'all' }]);
  const [currentTab, setCurrentTab] = useState('all');

  const convertDate = (isoDate: any) => {
    if (isoDate == null || isoDate === '') return '-';
    try {
      const date = new Date(isoDate);
      if (Number.isNaN(date.getTime())) return '-';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}.${minutes}.${seconds}`;
    } catch {
      return '-';
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    if (currentTab === 'all') {
      setDisplayList(allActivities);
    } else {
      const filtered = allActivities.filter((item) => String(item.type) === String(currentTab));
      setDisplayList(filtered);
    }
  }, [currentTab, allActivities]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await getActivityList();
      if (res.code === 200) {
        let activities: Activity[] = [];
        if (Array.isArray(res.data)) {
          activities = res.data;
        } else if (res.data && typeof res.data === 'object' && 'data' in res.data) {
          activities = (res.data as any).data || [];
        }

        setAllActivities(activities);
        setDisplayList(activities);

        const typeMap: Record<string, string> = {};
        activities.forEach((item) => {
          if (item.type !== undefined && item.type !== null) {
            const typeKey = String(item.type);
            if (!typeMap[typeKey]) {
              typeMap[typeKey] = item.type_text || `活动${typeKey}`;
            }
          }
        });

        const dynamicTabs: Tab[] = [{ name: '全部活动', type: 'all' }];
        Object.keys(typeMap).sort().forEach((type) => {
          dynamicTabs.push({ name: typeMap[type], type: type });
        });
        console.log('dynamicTabs',dynamicTabs);
        setTabs(dynamicTabs);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#151a23', paddingBottom: '100px' }}>
      {/* 页头：返回 + 标题 */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: '#151A23',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
          aria-label="返回"
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>
          优惠活动
        </h1>
        <div style={{ width: 32 }} />
      </div>

      {/* 顶部横幅 - 单独的图片，向上移，置于最底层 */}
      <div style={{ width: '100%', margin: 0, padding: 0, lineHeight: 0, marginTop: -16, position: 'relative', zIndex: 0 }}>
        <img
          src="/images/newimg/bg.avif"
          alt="活动横幅"
          style={{ display: 'block', width: '100%', height: 'auto', margin: 0, padding: 0 }}
        />
      </div>

      {/* 页头背景图 + 标签栏 - 向上稍微一点 */}
      <div style={{ width: '100%', marginTop: '-320px', position: 'relative', overflow: 'visible', zIndex: 1 }}>
        <img
          src="/images/login/header_bg.png"
          alt="背景"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />

        {/* 活动分类标签 - 叠加在背景图上 */}
        <div style={{
          position: 'absolute',
          bottom: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px 0',
          zIndex: 10,
          width: '100%'
        }}>
          {tabs.map((tab, index) => (
            <div
              key={index}
              onClick={() => setCurrentTab(tab.type)}
              style={{
                padding: '8px 20px',
                margin: '0 8px',
                fontSize: '18px',
                color: currentTab === tab.type ? '#fff' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.3s',
                zIndex: 20,
                display: index > 0 ? 'none' : '',
                whiteSpace: 'nowrap',
                fontWeight: currentTab === tab.type ? 500 : 400
              }}
            >
              {tab.name.substring(0, 2)}
              {/* 指示器 - 只在激活的标签显示 */}
              {currentTab === tab.type && (
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '200px',
                  height: '22px',
                  backgroundImage: 'url(https://www.xpj00000.vip/indexImg/active.43ca0d4a.png)',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  zIndex: -1,
                  pointerEvents: 'none'
                }}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 活动列表 - 向下移，z-index 低于底部导航避免遮挡 */}
      <div style={{ padding: '20px 15px', marginTop: 24, position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '18px' }}>
            加载中...
          </div>
        ) : (
          [DEFAULT_ACTIVITY, ...displayList].map((item) => (
            <div
              key={String(item.id)}
              onClick={() => navigate(item.id === 'threegifts' ? '/promotions/threegifts' : `/promotions/${item.id}`)}
              style={{
                marginBottom: '15px',
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ position: 'relative', width: '100%' }}>
                <img 
                  src={item.banner} 
                  alt={item.title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#ff4757',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  新活动
                </div>
              </div>
              <div style={{ padding: '15px' }}>
                <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </h3>
                <span style={{ color: '#999', fontSize: '14px' }}>
                  {(convertDate(item.start_date ?? item.start_at) === '-' && convertDate(item.end_date ?? item.end_at) === '-')
                    ? '永久有效'
                    : `${convertDate(item.start_date ?? item.start_at)} 至 ${convertDate(item.end_date ?? item.end_at)}`}
                </span>
              </div>
            </div>
          ))
        )}

        {/* 排行榜：优惠 / 俱乐部 */}
        <PromotionLeaderboard />
      </div>
    </div>
  );
}
