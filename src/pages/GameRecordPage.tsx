/**
 * 投注记录页面
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getGameRecord, getGameType, getGameApiList, GameRecord } from '@/lib/api/game';
import { useLanguage } from '@/contexts/LanguageContext';

export default function GameRecordPage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(''); // '':全部, 1:今日, 2:7日内, 3:半月内, 4:一月内
  const [selectedApiType, setSelectedApiType] = useState(''); // 游戏平台筛选
  const [selectedGameType, setSelectedGameType] = useState(''); // 游戏类型筛选
  const [gameTypes, setGameTypes] = useState<any[]>([]);
  const [apiTypes, setApiTypes] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_bet: 0, total_win: 0 });
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<GameRecord | null>(null); // 当前选中的记录
  const [showDetail, setShowDetail] = useState(false); // 是否显示详情抽屉

  useEffect(() => {
    // 等待AuthContext加载完成后再检查登录状态
    if (authLoading) {
      return; // 正在加载，等待
    }

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadGameTypes();
    loadAllApiTypes(); // 加载所有接口类型
    loadRecords();
    console.log('GameRecordPage mounted');
  }, [isLoggedIn, authLoading, navigate]);

  useEffect(() => {
    if (authLoading) {
      return; // 等待AuthContext加载完成
    }
    if (isLoggedIn) {
      loadRecords();
    }
  }, [isLoggedIn, authLoading, page, selectedDate, selectedApiType, selectedGameType]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };

    if (openFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilter]);

  const loadGameTypes = async () => {
    // 直接使用固定的游戏类型列表，不依赖接口返回
    // 游戏类型：1真人,2捕鱼,3电子,4彩票,5体育,6棋牌,7其他
    const defaultGameTypes = [
      { value: 1, label: '真人' },
      { value: 2, label: '捕鱼' },
      { value: 3, label: '电子' },
      { value: 4, label: '彩票' },
      { value: 5, label: '体育' },
      { value: 6, label: '棋牌' },
      { value: 7, label: '其他' },
      { value: 'system_lottery', label: '系统彩票' }
    ];
    
    setGameTypes(defaultGameTypes);
    
    // 可选：尝试从接口获取，但不影响显示
    try {
      const res = await getGameType();
      console.log('📊 游戏类型接口返回:', res);
      // 如果接口返回成功且有数据，可以用于验证，但不覆盖默认列表
    } catch (err) {
      console.error('❌ 加载游戏类型失败:', err);
      // 忽略错误，使用默认列表
    }
  };

  // 加载所有接口类型（从游戏接口列表获取）
  const loadAllApiTypes = async () => {
    try {
      // 尝试从游戏接口列表获取所有接口类型
      const res = await getGameApiList(1, 1); // 获取真人游戏的接口列表
      if (res.code === 200 && Array.isArray(res.data)) {
        const apiSet = new Set<string>();
        res.data.forEach((api: any) => {
          if (api.api_name) {
            apiSet.add(api.api_name);
          }
        });
        
        // 转换接口名称函数
        const formatApiName = (apiName: string): string => {
          if (!apiName) return '';
          let name = apiName.replace(/^slot-/i, '').toUpperCase();
          const nameMap: Record<string, string> = {
            'JDB': 'JDB',
            'PG': 'PG',
            'PGSOFT': 'PG',
            'AG': 'PG',
            'BBIN': 'BBIN',
            'FB': 'FB',
            'OB': 'OB',
            'crown': 'crown',
            'SBO': 'sa',
            'saba': 'saba',
            'WM': 'WM',
            'PT': 'PT',
            'MG': 'MG',
            'PP': 'PP',
            'CQ9': 'CQ9',
            'EVO': 'EVO',
            'SA': 'SA',
            'DG': 'DG',
            'AE': 'AE',
            'KY': 'KY',
            'VG': 'VG',
            'LC': 'LC',
            'TC': 'TC',
            'IM': 'IM',
            'VR': 'VR',
            'OG': 'OG',
            'BG': 'BG',
            'ALLBET': 'ALLBET',
            'EBET': 'EBET',
            'BET365': 'BET365',
            '188': '188',
            'SB': 'SB',
            'SBTECH': 'SBTECH',
            'BTI': 'BTI',
            'IMSPORTS': 'IMSPORTS',
            'CMD': 'CMD',
            'SABA': 'SABA',
            'PINNACLE': 'PINNACLE',
            'BETRADAR': 'BETRADAR',
            'NOWBET': 'NOWBET',
            'M8': 'M8',
            'SEXY': 'SEXY',
            'GD': 'GD',
            'AB': 'AB',
            'ABT': 'ABT',
            'ABTECH': 'ABTECH',
          };
          return nameMap[name] || name;
        };
        
        const apiTypeList = Array.from(apiSet).map((api: string) => ({
          value: api,
          label: formatApiName(api)
        }));
        
        apiTypeList.sort((a, b) => a.label.localeCompare(b.label));
        setApiTypes(apiTypeList);
        console.log('✅ 从游戏接口列表加载了', apiTypeList.length, '个接口类型');
      }
    } catch (err) {
      console.error('❌ 加载接口类型失败:', err);
      // 如果加载失败，使用预定义的完整列表
      const allApiTypes = [
        'AG', 'BBIN', 'FB', 'OB', 'sa', 'saba', 'WM', 'PT', 'MG', 'PP',
        'CQ9', 'EVO', 'SA', 'DG', 'AE', 'KY', 'VG', 'LC', 'TC', 'IM', 'VR',
        'OG', 'BG', 'ALLBET', 'EBET', 'BET365', '188', 'SB', 'SBTECH', 'BTI',
        'IMSPORTS', 'CMD', 'SABA', 'PINNACLE', 'BETRADAR', 'NOWBET', 'M8',
        'SEXY', 'GD', 'AB', 'ABT', 'ABTECH', 'JDB', 'PG', 'slot-jdb', 'slot-pgsoft'
      ];
      
      const formatApiName = (apiName: string): string => {
        if (!apiName) return '';
        let name = apiName.replace(/^slot-/i, '').toUpperCase();
        const nameMap: Record<string, string> = {
          'JDB': 'JDB',
          'PG': 'PG',
          'PGSOFT': 'PG',
        };
        return nameMap[name] || name;
      };
      
      const apiTypeList = allApiTypes.map((api: string) => ({
        value: api,
        label: formatApiName(api)
      }));
      
      apiTypeList.sort((a, b) => a.label.localeCompare(b.label));
      setApiTypes(apiTypeList);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await getGameRecord({ 
        limit: 20,
        date: selectedDate,
        api_name: selectedApiType, // 使用api_name参数（后端参数名）
        gameType: selectedGameType // 使用gameType参数（后端参数名）
      });
      console.log('📊 投注记录接口完整响应:', JSON.stringify(res, null, 2));
      
      // 检查响应状态：status === 'error' 时视为失败，即使code是200
      if (res.status === 'error') {
        console.error('❌ 投注记录接口返回错误:', res.message, res);
        setRecords([]);
        setStats({ total_bet: 0, total_win: 0 });
        return;
      }
      
      if (res.code === 200 && res.data) {
        // 根据后端实际返回的数据结构：
        // res.data 是分页对象，包含 data 数组（记录列表）和分页信息（last_page等）
        // res.data.data 是记录列表数组（Laravel分页对象的data属性）
        // res.statistic 是统计信息（在res的顶层，不在res.data中）
        // res.apis 和 res.gametypes 是筛选选项（在res的顶层，不在res.data中）
        
        // 获取记录列表：分页对象的data属性
        const paginationData = res.data;
        const recordData = Array.isArray(paginationData.data) ? paginationData.data : [];
        console.log('📋 解析后的投注记录数据:', recordData, '数量:', recordData.length);
        console.log('📋 分页信息:', {
          current_page: paginationData.current_page,
          last_page: paginationData.last_page,
          total: paginationData.total
        });
        
        setRecords(recordData);
        setLastPage(paginationData.last_page || paginationData.lastPage || 1);
        
        // 使用后端返回的统计信息（在res的顶层）
        if (res.statistic) {
          setStats({ 
            total_bet: parseFloat(res.statistic.sum_bet_amount || 0),
            total_win: parseFloat(res.statistic.sum_net_amount || 0)
          });
        } else if (res.data.statistic) {
          // 兼容：如果统计信息在res.data中
          setStats({ 
            total_bet: parseFloat(res.data.statistic.sum_bet_amount || 0),
            total_win: parseFloat(res.data.statistic.sum_net_amount || 0)
          });
        } else {
          // 前端计算统计信息
          let totalBet = 0;
          let totalWin = 0;
          recordData.forEach((record: GameRecord) => {
            const betAmount = parseFloat(String(record.bet_amount || record.betAmount || 0));
            const netAmount = parseFloat(String(record.net_amount || record.netAmount || record.win_loss || record.win_loss || 0));
            totalBet += betAmount;
            totalWin += netAmount; // 总输赢 = 净盈亏
          });
          setStats({ total_bet: totalBet, total_win: totalWin });
        }

        // 接口类型列表已由 loadAllApiTypes 函数统一加载，这里不再处理

        // 加载游戏类型列表（在res的顶层）
        if (res.gametypes && Array.isArray(res.gametypes)) {
          const gameTypeList = res.gametypes.map((type: any) => ({
            value: type.key,
            label: type.value
          }));
          if (gameTypeList.length > 0) {
            setGameTypes(gameTypeList);
          }
        } else if (res.data.gametypes && Array.isArray(res.data.gametypes)) {
          // 兼容：如果gametypes在res.data中
          const gameTypeList = res.data.gametypes.map((type: any) => ({
            value: type.key,
            label: type.value
          }));
          if (gameTypeList.length > 0) {
            setGameTypes(gameTypeList);
          }
        }
      } else {
        console.error('❌ 投注记录接口返回错误:', res.message, res);
        setRecords([]);
        setStats({ total_bet: 0, total_win: 0 });
      }
    } catch (err) {
      console.error('❌ 加载投注记录失败:', err);
      setRecords([]);
      setStats({ total_bet: 0, total_win: 0 });
    } finally {
      setLoading(false);
    }
  };

  const dateOptions = [
    { value: '', label: t('all') },
    { value: '1', label: t('today') },
    { value: '2', label: '昨日' },
    { value: '4', label: '30天内' }
  ];

  const getDateLabel = (value: string) => {
    return dateOptions.find(opt => opt.value === value)?.label || t('all');
  };

  // 转换接口名称：将技术名称转换为显示名称
  const formatApiName = (apiName: string): string => {
    if (!apiName) return '';
    
    // 移除 slot- 前缀
    let name = apiName.replace(/^slot-/i, '');
    
    // 转换为大写
    name = name.toUpperCase();
    
    // 特殊转换规则
    const nameMap: Record<string, string> = {
      'JDB': 'JDB',
      'PG': 'PG',
      'PGSOFT': 'PG',
      'AG': 'PG',
      'BBIN': 'BBIN',
      'FB': 'FB',
      'OB': 'OB',
      'crown': 'crown',
      'SBO': 'sa',
      'saba': 'saba',
      'WM': 'WM',
      'PT': 'PT',
      'MG': 'MG',
      'PP': 'PP',
      'CQ9': 'CQ9',
      'EVO': 'EVO',
      'SA': 'SA',
      'DG': 'DG',
      'AE': 'AE',
      'KY': 'KY',
      'VG': 'VG',
      'LC': 'LC',
      'TC': 'TC',
      'IM': 'IM',
      'VR': 'VR',
      'OG': 'OG',
      'BG': 'BG',
      'ALLBET': 'ALLBET',
      'EBET': 'EBET',
      'BET365': 'BET365',
      '188': '188',
      'SB': 'SB',
      'SBTECH': 'SBTECH',
      'BTI': 'BTI',
      'IMSPORTS': 'IMSPORTS',
      'CMD': 'CMD',
      'SABA': 'SABA',
      'PINNACLE': 'PINNACLE',
      'BETRADAR': 'BETRADAR',
      'NOWBET': 'NOWBET',
      'M8': 'M8',
      'SEXY': 'SEXY',
      'GD': 'GD',
      'AB': 'AB',
      'ABT': 'ABT',
      'ABTECH': 'ABTECH',
      'BTISPORTS': 'BTISPORTS',
      'BTI365': 'BTI365',
      'BTI188': 'BTI188',
      'BTISB': 'BTISB',
      'BTICMD': 'BTICMD',
      'BTISABA': 'BTISABA',
      'BTIPINNACLE': 'BTIPINNACLE',
      'BTIBETRADAR': 'BTIBETRADAR',
      'BTINOWBET': 'BTINOWBET',
      'BTIM8': 'BTIM8',
      'BTISEXY': 'BTISEXY',
      'BTIGD': 'BTIGD',
      'BTIAB': 'BTIAB',
      'BTIABT': 'BTIABT',
      'BTIABTECH': 'BTIABTECH',
    };
    
    // 如果映射中存在，使用映射值
    if (nameMap[name]) {
      return nameMap[name];
    }
    
    // 否则返回转换后的大写名称
    return name;
  };

  const getApiTypeLabel = (value: string) => {
    if (!value) return t('apiType');
    const apiType = apiTypes.find(t => t.value === value);
    // apiType.label已经是转换后的显示名称，直接使用
    return apiType ? apiType.label : formatApiName(value);
  };

  const getGameTypeLabel = (value: string) => {
    if (!value) return t('all');
    const gameType = gameTypes.find(t => String(t.value) === String(value));
    return gameType ? gameType.label : t('all');
  };


  // 状态映射
  const getStatusText = (state: number | string | undefined) => {
    if (state === undefined || state === null) return '未知';
    const stateMap: Record<string, string> = {
      '0': '待处理',
      '1': '已确认',
      '2': '已取消',
      '3': '已结算'
    };
    return stateMap[String(state)] || '未知';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0C1017', color: '#fff' }}>
      {/* 返回按钮 */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <img 
          onClick={() => navigate(-1)} 
          src="https://www.xpj00000.vip/indexImg/icon_header_arrow.f02628bc.png" 
          alt="返回"
          style={{ 
            width: '24px', 
            height: '24px', 
            cursor: 'pointer',
            position: 'absolute',
            left: '20px'
          }} 
        />
        <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('gameRecordTitle')}</h2>
      </div>

      {/* 筛选器 */}
      <div 
        ref={filterRef}
        style={{ 
          display: 'flex', 
          background: '#1a1f2e', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          margin: '8px 16px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1000
        }}>
        {/* 日期筛选 */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            onClick={() => setOpenFilter(openFilter === 'date' ? null : 'date')}
            style={{
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              color: openFilter === 'date' ? '#ffc53e' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              borderRadius: '8px'
            }}
          >
            <span>{getDateLabel(selectedDate)}</span>
            <span style={{ fontSize: '10px' }}>{openFilter === 'date' ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* 接口类型筛选 */}
        <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            onClick={() => setOpenFilter(openFilter === 'api' ? null : 'api')}
            style={{
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              color: openFilter === 'api' ? '#ffc53e' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              borderRadius: '8px'
            }}
          >
            <span>{getApiTypeLabel(selectedApiType)}</span>
            <span style={{ fontSize: '10px' }}>{openFilter === 'api' ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* 游戏类型筛选 */}
        <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            onClick={() => setOpenFilter(openFilter === 'game' ? null : 'game')}
            style={{
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              color: openFilter === 'game' ? '#ffc53e' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              borderRadius: '8px'
            }}
          >
            <span>{getGameTypeLabel(selectedGameType)}</span>
            <span style={{ fontSize: '10px' }}>{openFilter === 'game' ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ 
        background: '#0C1017', 
        minHeight: 'calc(100vh - 200px)',
        padding: 0
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>{t('noMore')}</div>
        ) : (
          <>
            {records.map((record, index) => {
              // 兼容多种字段名（后端字段名优先）
              const betAmount = parseFloat(String(record.betAmount || record.bet_amount || 0));
              
              // 处理betTime（可能是Date对象或字符串）
              let betTime = '';
              if (record.betTime) {
                if (typeof record.betTime === 'string') {
                  betTime = record.betTime;
                } else if (record.betTime instanceof Date) {
                  betTime = record.betTime.toISOString().replace('T', ' ').substring(0, 19);
                }
              } else {
                betTime = record.bet_time || record.created_at || '';
              }
              
              // 游戏名称：优先使用playDetail（游戏名称），然后是api_name_text、Code、api_name
              const gameName = record.playDetail || record.play_detail || record.api_name_text || record.Code || record.api_name || record.game_name || '未知游戏';

              return (
                <div
                  key={record.id || index}
                  onClick={() => {
                    setSelectedRecord(record);
                    setShowDetail(true);
                  }}
                  style={{
                    padding: '15px',
                    borderBottom: index === records.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: '#1a1f2e',
                    transition: 'background-color 0.2s',
                    borderRadius: '8px',
                    margin: '0 16px 8px 16px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 197, 62, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1a1f2e';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', marginBottom: '5px', color: '#fff', fontWeight: 500 }}>
                      {gameName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{betTime}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>
                      {betAmount.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '16px', color: '#999' }}>›</span>
                  </div>
                </div>
              );
            })}
            {!loading && records.length > 0 && page >= lastPage && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '12px' }}>
                没有更多了
              </div>
            )}
            {!loading && records.length > 0 && page < lastPage && (
              <div 
                onClick={() => setPage(page + 1)}
                style={{ 
                  textAlign: 'center', 
                  padding: '15px', 
                  color: '#4a9eff', 
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                加载更多
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部统计信息 */}
      <div style={{
        position: 'fixed',
        bottom: '60px', // 在底部导航栏上方
        left: 0,
        right: 0,
        background: '#1a1f2e',
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        color: '#999'
      }}>
        <span>{t('statistics')}: {t('totalBetAmount')}: <span style={{ color: '#fff' }}>{stats.total_bet.toFixed(2)}</span></span>
        <span>{t('totalWinLose')}: <span style={{ color: '#f87171' }}>{stats.total_win.toFixed(2)}</span></span>
      </div>

      {/* 底部占位，避免内容被统计栏遮挡 */}
      <div style={{ height: '100px' }}></div>

      {/* 投注记录详情抽屉 */}
      {showDetail && selectedRecord && (
        <>
          {/* 遮罩层 */}
          <div
            onClick={() => setShowDetail(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              animation: 'fadeIn 0.3s ease'
            }}
          />
          {/* 抽屉内容 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#1a1f2e',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              zIndex: 1001,
              maxHeight: '80vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s ease',
              color: '#fff'
            }}
          >
            {/* 标题栏 */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#1a1f2e',
              zIndex: 1
            }}>
              <div style={{ width: '32px' }}></div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' }}>游戏详情</h3>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail(false);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#fff'
                }}
              >
                ×
              </div>
            </div>

            {/* 详情内容 */}
            <div style={{ padding: '0' }}>
              {(() => {
                const betAmount = parseFloat(String(selectedRecord.betAmount || selectedRecord.bet_amount || 0));
                const validBetAmount = parseFloat(String(selectedRecord.validBetAmount || selectedRecord.valid_bet_amount || 0));
                const winAmount = parseFloat(String(selectedRecord.win_amount || 0));
                const betId = selectedRecord.bet_id || selectedRecord.id || '';
                const gameName = selectedRecord.playDetail || selectedRecord.play_detail || selectedRecord.api_name_text || selectedRecord.Code || selectedRecord.api_name || selectedRecord.game_name || '未知游戏';
                const gameType = selectedRecord.game_type || selectedRecord.gameType || '';
                const gameTypeText = gameType ? getGameTypeLabel(String(gameType)) : '';
                
                let betTime = '';
                if (selectedRecord.betTime) {
                  if (typeof selectedRecord.betTime === 'string') {
                    betTime = selectedRecord.betTime;
                  } else if (selectedRecord.betTime instanceof Date) {
                    betTime = selectedRecord.betTime.toISOString().replace('T', ' ').substring(0, 19);
                  }
                } else {
                  betTime = selectedRecord.bet_time || selectedRecord.created_at || '';
                }
                
                // 派彩时间
                let payoutTime = selectedRecord.payout_time || selectedRecord.payoutTime || selectedRecord.win_time || '';
                if (!payoutTime && selectedRecord.updated_at && selectedRecord.updated_at !== betTime) {
                  payoutTime = selectedRecord.updated_at;
                }

                // 详情项样式
                const detailItemStyle = {
                  padding: '15px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                };
                const labelStyle = {
                  fontSize: '14px',
                  color: '#999',
                  fontWeight: 400
                };
                const valueStyle = {
                  fontSize: '14px',
                  color: '#fff',
                  fontWeight: 400,
                  textAlign: 'right' as const,
                  flex: 1,
                  marginLeft: '20px'
                };

                return (
                  <>
                    {/* 游戏单号 */}
                    <div style={detailItemStyle}>
                      <div style={labelStyle}>游戏单号</div>
                      <div style={{ ...valueStyle, wordBreak: 'break-all' }}>{betId || '-'}</div>
                    </div>

                    {/* 游戏名称 */}
                    <div style={detailItemStyle}>
                      <div style={labelStyle}>游戏名称</div>
                      <div style={valueStyle}>{gameName}</div>
                    </div>

                    {/* 游戏类型 */}
                    {gameTypeText && (
                      <div style={detailItemStyle}>
                        <div style={labelStyle}>游戏类型</div>
                        <div style={valueStyle}>{gameTypeText}</div>
                      </div>
                    )}

                    {/* 下注明细标题 */}
                    <div style={{ ...detailItemStyle, background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ ...labelStyle, fontWeight: 500, color: '#fff' }}>下注明细</div>
                    </div>

                    {/* 下注金额 */}
                    <div style={detailItemStyle}>
                      <div style={labelStyle}>下注金额</div>
                      <div style={valueStyle}>{betAmount.toFixed(2)}</div>
                    </div>

                    {/* 有效下注 */}
                    <div style={detailItemStyle}>
                      <div style={labelStyle}>有效下注</div>
                      <div style={valueStyle}>{validBetAmount.toFixed(2)}</div>
                    </div>

                    {/* 派彩金额 */}
                    <div style={detailItemStyle}>
                      <div style={labelStyle}>派彩金额</div>
                      <div style={valueStyle}>{winAmount.toFixed(2)}</div>
                    </div>

                    {/* 开奖结果标题 */}
                    <div style={{ ...detailItemStyle, background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ ...labelStyle, fontWeight: 500, color: '#fff' }}>开奖结果</div>
                    </div>

                    {/* 下注时间 */}
                    {betTime && (
                      <div style={detailItemStyle}>
                        <div style={labelStyle}>下注时间</div>
                        <div style={valueStyle}>{betTime}</div>
                      </div>
                    )}

                    {/* 派彩时间 */}
                    {payoutTime && (
                      <div style={{ ...detailItemStyle, borderBottom: 'none' }}>
                        <div style={labelStyle}>派彩时间</div>
                        <div style={valueStyle}>{payoutTime}</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* 底部筛选抽屉 */}
      {openFilter && (
        <>
          {/* 遮罩层 */}
          <div
            onClick={() => {
              console.log('🖱️ 点击遮罩层，关闭抽屉');
              setOpenFilter(null);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
              animation: 'fadeIn 0.3s ease',
              pointerEvents: 'auto'
            }}
          />
          {/* 抽屉面板 */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#1a1f2e',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 9999,
              maxHeight: '60vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s ease',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
              pointerEvents: 'auto'
            }}
          >
            {/* 抽屉标题栏 */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#1a1f2e',
              zIndex: 1
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                {openFilter === 'date' && '选择日期'}
                {openFilter === 'api' && '选择接口类型'}
                {openFilter === 'game' && '选择游戏类型'}
              </div>
              <div
                onClick={() => setOpenFilter(null)}
                style={{
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </div>
            </div>

            {/* 日期选项 */}
            {openFilter === 'date' && (
              <div>
                {dateOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('📅 选择日期:', opt.value, opt.label);
                      setSelectedDate(opt.value);
                      setPage(1);
                      setTimeout(() => {
                        setOpenFilter(null);
                      }, 100);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: selectedDate === opt.value ? '#ffc53e' : '#fff',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      userSelect: 'none',
                      background: selectedDate === opt.value ? 'rgba(255, 197, 62, 0.1)' : 'transparent',
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 10000
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{opt.label}</span>
                    {selectedDate === opt.value && <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            {/* 接口类型选项 */}
            {openFilter === 'api' && (
              <div>
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔌 选择接口类型: 全部');
                    setSelectedApiType('');
                    setPage(1);
                    setTimeout(() => {
                      setOpenFilter(null);
                    }, 100);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: !selectedApiType ? '#ffc53e' : '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    userSelect: 'none',
                    background: !selectedApiType ? 'rgba(255, 197, 62, 0.1)' : 'transparent',
                    pointerEvents: 'auto',
                    position: 'relative',
                    zIndex: 10000
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{t('all')}</span>
                  {!selectedApiType && <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>}
                </div>
                {apiTypes.map(type => (
                  <div
                    key={type.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔌 选择接口类型:', type.value, type.label);
                      setSelectedApiType(type.value);
                      setPage(1);
                      setTimeout(() => {
                        setOpenFilter(null);
                      }, 100);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: selectedApiType === type.value ? '#ffc53e' : '#fff',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      userSelect: 'none',
                      background: selectedApiType === type.value ? 'rgba(255, 197, 62, 0.1)' : 'transparent',
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 10000
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{type.label}</span>
                    {selectedApiType === type.value && <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            {/* 游戏类型选项 */}
            {openFilter === 'game' && (
              <div>
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎮 选择游戏类型: 全部');
                    setSelectedGameType('');
                    setPage(1);
                    setTimeout(() => {
                      setOpenFilter(null);
                    }, 100);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: !selectedGameType ? '#ffc53e' : '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    userSelect: 'none',
                    background: !selectedGameType ? 'rgba(255, 197, 62, 0.1)' : 'transparent',
                    pointerEvents: 'auto',
                    position: 'relative',
                    zIndex: 10000
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{t('all')}</span>
                  {!selectedGameType && <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>}
                </div>
                {gameTypes.map(type => (
                  <div
                    key={type.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🎮 选择游戏类型:', type.value, type.label);
                      setSelectedGameType(String(type.value));
                      setPage(1);
                      setTimeout(() => {
                        setOpenFilter(null);
                      }, 100);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: selectedGameType === String(type.value) ? '#ffc53e' : '#fff',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      userSelect: 'none',
                      background: selectedGameType === String(type.value) ? 'rgba(255, 197, 62, 0.1)' : 'transparent',
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 10000
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{type.label}</span>
                    {selectedGameType === String(type.value) && <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 添加动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

