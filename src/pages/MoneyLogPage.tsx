/**
 * 资金流水页面
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getMoneyLog, getMoneyLogType, MoneyLogItem } from '@/lib/api/moneylog';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MoneyLogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [logs, setLogs] = useState<MoneyLogItem[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedDate, setSelectedDate] = useState('0'); // 0:全部, 1:今日, 2:昨日, 3:7日内, 4:30日内
  const [selectedAmountType, setSelectedAmountType] = useState(''); // 金额类型：全部、反水钱包、中心钱包
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ sum_money: 0, effective_flow: 0 });
  const [openFilter, setOpenFilter] = useState<string | null>(null); // 当前打开的筛选器
  const [selectedLog, setSelectedLog] = useState<MoneyLogItem | null>(null); // 当前选中的记录
  const [showDetail, setShowDetail] = useState(false); // 是否显示详情抽屉
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 等待AuthContext加载完成后再检查登录状态
    if (authLoading) {
      return; // 正在加载，等待
    }
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    // 处理URL参数中的type，支持字符串和数字格式
    const typeParam = searchParams.get('type') || '';
    // 如果type是字符串（如'FANSHUI'），需要转换为对应的数字
    const typeMap: Record<string, string> = {
      'FANSHUI': '4',        // 返水发放
      'ADMIN': '1',          // 管理员操作
      'SYSTEM': '2',         // 系统赠送
      'GAME_IN_OUT': '3',    // 游戏转入/转出
      'QIANDAO': '5',        // 签到活动领取
    };
    const type = typeMap[typeParam] || typeParam;
    setSelectedType(type);
    // 先加载类型列表，然后再加载数据
    loadTypes().then(() => {
      // 类型加载完成后再加载数据，确保类型已准备好
      if (type) {
        console.log('✅ 从URL参数设置类型:', type, '开始加载数据');
      }
    });
  }, [isLoggedIn, authLoading, searchParams, navigate]);

  useEffect(() => {
    // 等待AuthContext加载完成后再加载数据
    if (authLoading) {
      return; // 正在加载，等待
    }
    
    if (isLoggedIn) {
      loadLogs();
    }
  }, [isLoggedIn, authLoading, selectedType, selectedDate, selectedAmountType, page]);

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

  const loadTypes = async (): Promise<void> => {
    try {
      const res = await getMoneyLogType();
      console.log('📊 流水类型接口返回:', res);
      if (res.code === 200 && res.data) {
        // 后端返回的是对象格式：{ operate_type: {'1': '管理员操作', '2': '系统赠送', ...}, money_type: {...} }
        const operateTypeObj = res.data.operate_type || {};
        // 将对象转换为数组格式：[{key: '1', value: '1', label: '管理员操作'}, ...]
        // key和value都是数字字符串（'1', '2', '3', '4'等），用于匹配selectedType
        // label是显示的中文名称
        const typeArray = Object.entries(operateTypeObj).map(([key, value]) => ({
          key: key,
          value: String(key), // value应该是key（数字字符串），用于匹配selectedType
          label: String(value) // label是显示的中文名称
        }));
        console.log('📋 解析后的类型数据:', typeArray);
        setTypes(typeArray);
      } else {
        console.error('❌ 流水类型接口返回错误:', res.message);
        setTypes([]);
      }
    } catch (err) {
      console.error('❌ 加载流水类型失败:', err);
      setTypes([]);
    }
  };

  const getDateRange = (dateType: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startTime = '';
    let endTime = '';

    // 格式化为 YYYY-MM-DD HH:mm:ss
    const formatDateTime = (date: Date, time: string) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day} ${time}`;
    };

    if (dateType === '0') {
      return { startTime: '', endTime: '' };
    }

    switch (dateType) {
      case '1': // 今日
        startTime = formatDateTime(today, '00:00:00');
        endTime = formatDateTime(now, '23:59:59');
        break;
      case '2': // 昨日
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startTime = formatDateTime(yesterday, '00:00:00');
        endTime = formatDateTime(yesterday, '23:59:59');
        break;
      case '3': // 7日内
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        startTime = formatDateTime(sevenDaysAgo, '00:00:00');
        endTime = formatDateTime(now, '23:59:59');
        break;
      case '4': // 30日内
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startTime = formatDateTime(thirtyDaysAgo, '00:00:00');
        endTime = formatDateTime(now, '23:59:59');
        break;
      default:
        // 默认今日
        startTime = formatDateTime(today, '00:00:00');
        endTime = formatDateTime(now, '23:59:59');
    }

    return { startTime, endTime };
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { startTime, endTime } = getDateRange(selectedDate);
      console.log('📅 日期范围:', { startTime, endTime, selectedDate });
      console.log('🔍 当前选中的类型:', selectedType, '类型:', typeof selectedType);
      console.log('📋 可用的类型列表:', types);
      
      const res = await getMoneyLog({
        page,
        limit: 20,
        type: selectedType, // 传递类型参数（数字字符串，如'4'）
        start_time: startTime,
        end_time: endTime
      });
      
      console.log('📊 流水接口完整响应:', JSON.stringify(res, null, 2));
      
      if (res.code === 200) {
        // 处理不同的数据结构
        let logData: MoneyLogItem[] = [];
        
        if (Array.isArray(res.data)) {
          // 如果data直接是数组
          logData = res.data;
        } else if (res.data && Array.isArray(res.data.data)) {
          // 如果data.data是数组（分页结构）
          logData = res.data.data;
        } else if (res.data && Array.isArray(res.data.list)) {
          // 如果data.list是数组
          logData = res.data.list;
        } else if (res.data && typeof res.data === 'object') {
          // 尝试查找可能的数组字段
          const possibleKeys = ['items', 'records', 'logs', 'data', 'list'];
          for (const key of possibleKeys) {
            if (Array.isArray((res.data as any)[key])) {
              logData = (res.data as any)[key];
              break;
            }
          }
        }
        
        console.log('📋 解析后的流水数据:', logData, '数量:', logData.length);
        // 打印第一条记录的完整数据，用于调试
        if (logData.length > 0) {
          console.log('🔍 第一条记录完整数据:', JSON.stringify(logData[0], null, 2));
          console.log('🔍 第一条记录字段:', Object.keys(logData[0]));
          console.log('🔍 余额相关字段:', {
            money_after: logData[0].money_after,
            after_money: logData[0].after_money,
            money_before: logData[0].money_before,
            before_money: logData[0].before_money
          });
        }
        setLogs(logData);
        
        // 提取统计信息（后端返回在res.data.statistic中）
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
          const dataObj = res.data as any;
          console.log('📊 统计信息数据:', dataObj.statistic);
          // 后端返回的统计信息在statistic字段中
          if (dataObj.statistic) {
            const statsData = {
              sum_money: dataObj.statistic.sum_money || 0,
              effective_flow: dataObj.statistic.valid_money || dataObj.statistic.effective_flow || 0
            };
            console.log('✅ 设置统计信息:', statsData);
            setStats(statsData);
          } else if (dataObj.sum_money !== undefined || dataObj.effective_flow !== undefined) {
            setStats({
              sum_money: dataObj.sum_money || 0,
              effective_flow: dataObj.effective_flow || 0
            });
          } else {
            // 如果没有统计信息，计算总金额
            const total = logData.reduce((sum: number, log: MoneyLogItem) => sum + (parseFloat(String(log.money)) || 0), 0);
            setStats({
              sum_money: total,
              effective_flow: total
            });
          }
        } else {
          // 如果没有统计信息，计算总金额
          const total = logData.reduce((sum: number, log: MoneyLogItem) => sum + (parseFloat(String(log.money)) || 0), 0);
          setStats({
            sum_money: total,
            effective_flow: total
          });
        }
      } else {
        console.error('❌ 流水接口返回错误:', res.message, res);
        setLogs([]);
        setStats({ sum_money: 0, effective_flow: 0 });
      }
    } catch (err) {
      console.error('❌ 加载流水失败:', err);
      setLogs([]);
      setStats({ sum_money: 0, effective_flow: 0 });
    } finally {
      setLoading(false);
    }
  };

  const dateOptions = [
    { value: '0', label: '全部' },
    { value: '1', label: t('today') },
    { value: '2', label: '昨日' },
    { value: '3', label: '7日内' },
    { value: '4', label: '30日内' }
  ];

  const amountTypeOptions = [
    { value: '', label: '全部' },
    { value: 'rebate', label: '反水钱包' },
    { value: 'center', label: '中心钱包' }
  ];

  const getDateLabel = (value: string) => {
    return dateOptions.find(opt => opt.value === value)?.label || '全部';
  };

  const getAmountTypeLabel = (value: string) => {
    return amountTypeOptions.find(opt => opt.value === value)?.label || '全部';
  };

  const getTypeLabel = (value: string) => {
    if (!value) return t('changeType');
    const type = types.find(t => t.value === value);
    return type ? type.label : '变动类型';
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
        <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('moneyLogTitle')}</h2>
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
        {/* 今日筛选 */}
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

        {/* 变动类型筛选 */}
        <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            onClick={() => setOpenFilter(openFilter === 'type' ? null : 'type')}
            style={{
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              color: openFilter === 'type' ? '#ffc53e' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              borderRadius: '8px'
            }}
          >
            <span>{getTypeLabel(selectedType)}</span>
            <span style={{ fontSize: '10px' }}>{openFilter === 'type' ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* 金额类型筛选 */}
        <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            onClick={() => setOpenFilter(openFilter === 'amount' ? null : 'amount')}
            style={{
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              color: openFilter === 'amount' ? '#ffc53e' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              borderRadius: '8px'
            }}
          >
            <span>{getAmountTypeLabel(selectedAmountType)}</span>
            <span style={{ fontSize: '10px' }}>{openFilter === 'amount' ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ 
        background: '#0C1017', 
        minHeight: 'calc(100vh - 200px)',
        padding: 0
      }}>
        {authLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>验证登录状态...</div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无数据</div>
        ) : (
          <>
            {logs.map(log => (
              <div
                key={log.id}
                onClick={() => {
                  setSelectedLog(log);
                  setShowDetail(true);
                }}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  borderRadius: '8px',
                  margin: '0 16px 8px 16px',
                  background: '#1a1f2e'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 197, 62, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1a1f2e';
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '5px', color: '#fff' }}>
                    {log.operate_type_text || log.type_text || log.operate_type || log.type || '未知类型'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{log.created_at}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {(() => {
                    // 根据number_type判断金额正负：1=增加(正数), -1=减少(负数)
                    // 如果number_type不存在，则根据money的正负判断
                    const moneyValue = parseFloat(String(log.money || 0));
                    const numberType = log.number_type;
                    const isPositive = numberType !== undefined 
                      ? numberType === 1  // MONEY_TYPE_ADD = 1
                      : moneyValue > 0;
                    const displayMoney = numberType === -1 ? -Math.abs(moneyValue) : Math.abs(moneyValue);
                    
                    return (
                      <div style={{ fontSize: '16px', color: isPositive ? '#4ade80' : '#f87171' }}>
                        {isPositive ? '+' : ''}{displayMoney.toFixed(2)}
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    余额: {log.money_after !== undefined && log.money_after !== null 
                      ? parseFloat(String(log.money_after)).toFixed(2) 
                      : (log.after_money !== undefined && log.after_money !== null 
                        ? parseFloat(String(log.after_money)).toFixed(2) 
                        : (log.money_before !== undefined && log.money_before !== null 
                          ? parseFloat(String(log.money_before)).toFixed(2) 
                          : (log.before_money !== undefined && log.before_money !== null 
                            ? parseFloat(String(log.before_money)).toFixed(2) 
                            : '0.00')))}
                  </div>
                </div>
              </div>
            ))}
            {!loading && logs.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '12px' }}>
                没有更多了
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部统计信息 */}
      {isLoggedIn && (
        <div style={{
          position: 'fixed',
          bottom: '60px', // 在底部导航栏上方
          left: 0,
          right: 0,
          background: '#1a1f2e',
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'none',//flex
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: '#999',
          zIndex: 999
        }}>
          <span>统计: 流水金额: <span style={{ color: '#fff' }}>{Number(stats.sum_money || 0).toFixed(2)}</span></span>
          <span>有效金额: <span style={{ color: '#f87171' }}>{Number(stats.effective_flow || 0).toFixed(2)}</span></span>
        </div>
      )}

      {/* 底部占位，避免内容被统计栏遮挡 */}
      <div style={{ height: '60px' }}></div>

      {/* 交易详情抽屉 */}
      {showDetail && selectedLog && (
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>交易详情</h3>
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
            <div style={{ padding: '20px' }}>
              {/* 交易金额 */}
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>交易金额</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                  {(() => {
                    const moneyValue = parseFloat(String(selectedLog.money || 0));
                    const numberType = selectedLog.number_type;
                    const displayMoney = numberType === -1 ? -Math.abs(moneyValue) : Math.abs(moneyValue);
                    return displayMoney.toFixed(2);
                  })()}
                </div>
              </div>

              {/* 转入前余额 */}
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>转入前余额</div>
                <div style={{ fontSize: '16px', color: '#fff' }}>
                  {parseFloat(String(selectedLog.money_before || selectedLog.before_money || 0)).toFixed(2)}
                </div>
              </div>

              {/* 转入后余额 */}
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>转入后余额</div>
                <div style={{ fontSize: '16px', color: '#fff' }}>
                  {parseFloat(String(selectedLog.money_after || selectedLog.after_money || 0)).toFixed(2)}
                </div>
              </div>

              {/* 钱包类型 */}
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>钱包类型</div>
                <div style={{ fontSize: '16px', color: '#fff' }}>
                  {selectedLog.money_type_text || selectedLog.money_type || '中心钱包余额'}
                </div>
              </div>

              {/* 转账类型 */}
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>转账类型</div>
                <div style={{ fontSize: '16px', color: '#fff' }}>
                  {selectedLog.operate_type_text || selectedLog.type_text || selectedLog.operate_type || selectedLog.type || '未知类型'}
                </div>
              </div>

              {/* 操作描述 */}
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>操作描述</div>
                <div style={{ fontSize: '16px', color: '#fff', wordBreak: 'break-word' }}>
                  {selectedLog.description || '-'}
                </div>
              </div>

              {/* 交易时间 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>交易时间</div>
                <div style={{ fontSize: '16px', color: '#fff' }}>
                  {selectedLog.created_at || '-'}
                </div>
              </div>
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
                {openFilter === 'type' && '选择变动类型'}
                {openFilter === 'amount' && '选择金额类型'}
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

            {/* 变动类型选项 */}
            {openFilter === 'type' && (
              <div>
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔌 选择变动类型: 全部');
                    setSelectedType('');
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
                    color: !selectedType ? '#ffc53e' : '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    userSelect: 'none',
                    background: !selectedType ? 'rgba(255, 197, 62, 0.1)' : 'transparent',
                    pointerEvents: 'auto',
                    position: 'relative',
                    zIndex: 10000
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{t('all')}</span>
                  {!selectedType && <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>}
                </div>
                {types.map(type => (
                  <div
                    key={type.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔌 选择变动类型:', type.value, type.label);
                      setSelectedType(type.value);
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
                      color: selectedType === type.value ? '#ffc53e' : '#fff',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      userSelect: 'none',
                      background: selectedType === type.value ? 'rgba(255, 197, 62, 0.1)' : 'transparent',
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 10000
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{type.label}</span>
                    {selectedType === type.value && <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            {/* 金额类型选项 */}
            {openFilter === 'amount' && (
              <div>
                {amountTypeOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('💰 选择金额类型:', opt.value, opt.label);
                      setSelectedAmountType(opt.value);
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
                      color: selectedAmountType === opt.value ? '#ffc53e' : '#fff',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      userSelect: 'none',
                      background: selectedAmountType === opt.value ? 'rgba(255, 197, 62, 0.1)' : 'transparent',
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 10000
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{opt.label}</span>
                    {selectedAmountType === opt.value && <span style={{ color: '#ffc53e', fontSize: '20px' }}>✓</span>}
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

