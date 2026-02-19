/**
 * USDT充值页面组件
 * 
 * 仿照截图设计：
 * 1. 顶部显示倒计时和充值金额
 * 2. 支付金额卡片（USDT-TRC20）
 * 3. 支付方式列表（转账支付、TronLink、imToken）
 * 4. 点击转账支付，底部抽屉弹出转账详情
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronRight, 
  Copy, 
  Check, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  X,
  QrCode
} from 'lucide-react';
import { 
  createUsdtOrder, 
  getUsdtOrderStatus, 
  checkUsdtOrder,
  cancelUsdtOrder,
  USDT_ORDER_STATUS,
  UsdtOrderData,
  UsdtOrderStatus
} from '@/lib/api/usdtRecharge';
import { useAuth } from '@/contexts/AuthContext';

interface UsdtPaymentPageProps {
  amount: number;                    // 充值金额(RMB)，创建订单时按汇率换算为 USDT
  paymentId: number;                 // 支付方式ID
  receiveAddress: string;            // 收款地址(从payment获取)
  usdtRate: number;                  // 汇率 1 USDT = ? CNY
  usdtType: string;                  // 钱包协议 TRC20/ERC20
  qrcode: string;                    // 收款二维码
  onSuccess: (data: UsdtOrderStatus) => void;  // 充值成功回调
  onCancel: () => void;              // 取消/返回回调
  onError: (message: string) => void; // 错误回调
}

// USDT图标
const UsdtIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path d="M17.922 17.383v-.002c-.11.008-.678.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" fill="white"/>
  </svg>
);

// TronLink图标
const TronLinkIcon = () => (
  <svg width="40" height="40" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#555AAB"/>
    <path d="M8 10.5l12.5 2.05a9.7 9.7 0 0 1 .21 1.68l-2.6 2.02 2.5-.32q-.06.45-.17.9l-3.6.59-.47 5.24a9.6 9.6 0 0 1-1.05.6l.75-6.34-5.78-3.66 4.55 10.22a9.6 9.6 0 0 1-.92.34L8 10.5zm8.54 5.66l3.65-2.62-8.98-1.55 5.33 4.17z" fill="white"/>
  </svg>
);

// imToken图标
const ImTokenIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40">
    <path d="M38.5 10.9c1.27 17.2-9.78 25.33-19.7 26.2-9.22.81-17.9-4.85-18.66-13.55-.63-7.2 3.82-10.26 7.31-10.57 3.59-.32 6.61 2.16 6.87 5.15.25 2.89-1.55 4.2-2.8 4.31-1-.08-2.23-.68-2.34-1.97-.09-1.11.31-1.26.21-2.44-.18-2.1-2.01-2.34-3.01-2.25-1.21.09-3.4 1.52-3.09 5.04.31 3.56 3.44 6.37 7.91 5.98 4.82-.43 8.18-4.18 8.43-9.45a9.9 9.9 0 0 1 .14-.81c.05-.12.11-.22.19-.33.1-.15.24-.32.4-.51.01 0 .01 0 .01-.01.12-.14.27-.28.44-.44 2.11-1.99 9.7-6.67 16.87-5.19.15.03.29.11.39.22.1.12.16.26.17.41z" fill="url(#imtoken-gradient)"/>
    <defs>
      <linearGradient id="imtoken-gradient" x1="35" y1="6.5" x2="6" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0CC5FF"/>
        <stop offset="1" stopColor="#007FFF"/>
      </linearGradient>
    </defs>
  </svg>
);

// 转账图标
const TransferIcon = () => (
  <div style={{
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <QrCode style={{ width: '22px', height: '22px', color: 'white' }} />
  </div>
);

// 轮询间隔(毫秒) - 普通间隔
const POLL_INTERVAL = 5000;
// 轮询间隔(毫秒) - 确认转账后更频繁
const POLL_INTERVAL_FAST = 3000;

export function UsdtPaymentPage({
  amount,
  paymentId,
  receiveAddress,
  usdtRate,
  usdtType,
  qrcode,
  onSuccess,
  onCancel,
  onError
}: UsdtPaymentPageProps) {
  const { refreshUserInfo } = useAuth();
  
  // 订单状态
  const [orderData, setOrderData] = useState<UsdtOrderData | null>(null);
  const [orderStatus, setOrderStatus] = useState<UsdtOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  
  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  // 二维码显示状态
  const [showQrCode, setShowQrCode] = useState(false);
  // 是否已点击"我已转账"
  const [hasConfirmedTransfer, setHasConfirmedTransfer] = useState(false);
  // 显示查询中的全屏提示
  const [showCheckingOverlay, setShowCheckingOverlay] = useState(false);
  // 查询次数计数
  const [checkCount, setCheckCount] = useState(0);
  
  // 轮询定时器引用
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 创建订单（接口要求 USDT 金额，此处 amount 为 RMB，需除以汇率）
  const createOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    const usdtAmount = amount / usdtRate;
    if (usdtAmount <= 0) {
      setError('金额或汇率无效');
      setLoading(false);
      return;
    }
    try {
      const res = await createUsdtOrder({
        amount: usdtAmount,
        payment_id: paymentId
      });
      
      if (res.code === 200 && res.data) {
        setOrderData(res.data);
        // 计算剩余时间
        const expireAt = new Date(res.data.expire_at).getTime();
        const now = Date.now();
        setRemainingSeconds(Math.max(0, Math.floor((expireAt - now) / 1000)));
      } else {
        setError(res.message || '创建订单失败');
        onError(res.message || '创建订单失败');
      }
    } catch (err: any) {
      const message = err.message || '创建订单失败，请重试';
      setError(message);
      onError(message);
    } finally {
      setLoading(false);
    }
  }, [amount, usdtRate, paymentId, onError]);
  
  // 查询订单状态
  const checkStatus = useCallback(async () => {
    if (!orderData?.bill_no) return;
    
    setIsChecking(true);
    setCheckCount(prev => prev + 1);
    
    try {
      const res = await checkUsdtOrder(orderData.bill_no);
      
      if (res.code === 200 && res.data) {
        setOrderStatus(res.data);
        
        if (res.data.status === USDT_ORDER_STATUS.SUCCESS) {
          setShowCheckingOverlay(false);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          if (refreshUserInfo) {
            await refreshUserInfo(true);
          }
          onSuccess(res.data);
        } else if (res.data.status === USDT_ORDER_STATUS.EXPIRED || 
                   res.data.status === USDT_ORDER_STATUS.CANCELLED ||
                   res.data.status === USDT_ORDER_STATUS.FAILED) {
          setShowCheckingOverlay(false);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('检查订单状态失败:', err);
    } finally {
      setIsChecking(false);
    }
  }, [orderData?.bill_no, refreshUserInfo, onSuccess]);
  
  // 取消订单
  const handleCancel = useCallback(async () => {
    if (orderData?.bill_no) {
      await cancelUsdtOrder(orderData.bill_no);
    }
    onCancel();
  }, [orderData?.bill_no, onCancel]);
  
  // 复制到剪贴板
  const copyToClipboard = useCallback((text: string, type: string) => {
    const input = document.createElement('input');
    input.style.opacity = '0';
    input.style.position = 'fixed';
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);
  
  // 格式化剩余时间
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // 初始化：创建订单
  useEffect(() => {
    createOrder();
    
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);
  
  // 订单创建成功后，启动轮询和倒计时
  useEffect(() => {
    if (!orderData) return;
    
    // 根据是否已确认转账调整轮询频率
    const interval = hasConfirmedTransfer ? POLL_INTERVAL_FAST : POLL_INTERVAL;
    
    // 清除之前的定时器
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    
    pollTimerRef.current = setInterval(checkStatus, interval);
    
    // 倒计时只需要设置一次
    if (!countdownTimerRef.current) {
      countdownTimerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 0) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [orderData, checkStatus, hasConfirmedTransfer]);
  
  // 加载中状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
        background: '#fff'
      }}>
        <RefreshCw 
          className="w-10 h-10 animate-spin" 
          style={{ color: '#26A17B' }} 
        />
        <div style={{ color: '#666', fontSize: '15px' }}>
          正在创建订单...
        </div>
      </div>
    );
  }
  
  // 错误状态
  if (error && !orderData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
        padding: '24px',
        background: '#fff'
      }}>
        <AlertCircle className="w-14 h-14" style={{ color: '#ef4444' }} />
        <div style={{ color: '#ef4444', fontSize: '16px', textAlign: 'center', fontWeight: 500 }}>
          {error}
        </div>
        <button
          onClick={createOrder}
          style={{
            background: '#2563eb',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: '24px',
            border: 'none',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          重试
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            color: '#666',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          返回
        </button>
      </div>
    );
  }
  
  // 订单过期
  if (remainingSeconds <= 0 && orderStatus?.status !== USDT_ORDER_STATUS.SUCCESS) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
        padding: '24px',
        background: '#fff'
      }}>
        <Clock className="w-14 h-14" style={{ color: '#f59e0b' }} />
        <div style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 600 }}>
          订单已过期
        </div>
        <div style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>
          请重新创建充值订单
        </div>
        <button
          onClick={createOrder}
          style={{
            background: '#2563eb',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: '24px',
            border: 'none',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          重新充值
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            color: '#666',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          返回
        </button>
      </div>
    );
  }
  
  // 充值成功
  if (orderStatus?.status === USDT_ORDER_STATUS.SUCCESS) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
        padding: '24px',
        background: '#fff'
      }}>
        <CheckCircle className="w-20 h-20" style={{ color: '#22c55e' }} />
        <div style={{ color: '#22c55e', fontSize: '22px', fontWeight: 600 }}>
          充值成功！
        </div>
        <div style={{ 
          color: '#333', 
          fontSize: '28px', 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'baseline',
          gap: '6px'
        }}>
          <span style={{ color: '#26A17B' }}>{orderStatus.usdt_amount}</span>
          <span style={{ fontSize: '18px', color: '#666' }}>USDT</span>
        </div>
        <div style={{ color: '#999', fontSize: '15px' }}>
          ≈ ¥{orderStatus.cny_amount}
        </div>
        <button
          onClick={onCancel}
          style={{
            background: '#2563eb',
            color: '#fff',
            padding: '14px 40px',
            borderRadius: '24px',
            border: 'none',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '12px'
          }}
        >
          完成
        </button>
      </div>
    );
  }

  // USDT金额 = 后端返回的usdt_amount（含唯一标识），用于用户支付
  // 人民币金额 = 后端返回的cny_amount（用户输入的金额），用于上分
  const usdtAmount = orderData?.usdt_amount?.toFixed(2) || (amount / usdtRate).toFixed(2);
  const cnyAmount = orderData?.cny_amount?.toFixed(2) || amount.toFixed(2);
  const walletAddress = orderData?.receive_address || receiveAddress;
  const walletType = orderData?.usdt_type || usdtType;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      paddingBottom: '20px'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#fff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <button 
          onClick={onCancel} 
          style={{ 
            cursor: 'pointer', 
            background: 'transparent', 
            border: 'none', 
            padding: '4px',
            display: 'flex', 
            alignItems: 'center' 
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 style={{ 
          flex: 1, 
          textAlign: 'center', 
          fontSize: '17px', 
          fontWeight: 600, 
          color: '#333', 
          margin: 0 
        }}>
          USDT充值
        </h1>
        <div style={{ width: '32px' }} />
      </div>
      {/* 顶部区域 - 倒计时和金额 */}
      <div style={{
        background: '#fff',
        padding: '24px 20px 32px',
        textAlign: 'center'
      }}>
        {/* 倒计时 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#666',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          <Clock style={{ width: '16px', height: '16px' }} />
          <span>{formatTime(remainingSeconds)}</span>
        </div>
        
        {/* USDT金额显示 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <UsdtIcon />
          <span style={{ 
            fontSize: '36px', 
            fontWeight: 700, 
            color: '#333' 
          }}>
            {usdtAmount} USDT
          </span>
        </div>
        
        {/* 人民币金额显示 */}
        <div style={{ color: '#999', fontSize: '14px' }}>
          ≈ ¥{cnyAmount} (汇率: {orderData?.usdt_rate || usdtRate})
        </div>
      </div>

      {/* 支付金额卡片 */}
      <div style={{
        background: '#fff',
        margin: '12px 16px',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ 
          color: '#333', 
          fontSize: '15px', 
          fontWeight: 500,
          marginBottom: '16px'
        }}>
          支付金额
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px dashed #e5e5e5'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <UsdtIcon />
            <span style={{ fontSize: '15px', color: '#333' }}>
              USDT <span style={{ color: '#999' }}>({walletType})</span>
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* 多币种图标 */}
            <div style={{ display: 'flex', marginLeft: '-4px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#26A17B',
                border: '2px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#fff', fontSize: '10px', fontWeight: 600 }}>₮</span>
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#3B82F6',
                border: '2px solid #fff',
                marginLeft: '-8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#fff', fontSize: '10px', fontWeight: 600 }}>◆</span>
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#EF4444',
                border: '2px solid #fff',
                marginLeft: '-8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#fff', fontSize: '10px', fontWeight: 600 }}>$</span>
              </div>
            </div>
            <ChevronRight style={{ width: '20px', height: '20px', color: '#ccc' }} />
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px'
        }}>
          <span style={{ color: '#999', fontSize: '14px' }}>预计支付：</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <UsdtIcon />
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              color: '#333' 
            }}>
              {usdtAmount} USDT
            </span>
            <span style={{ color: '#999', fontSize: '13px' }}>({walletType})</span>
          </div>
        </div>
      </div>

      {/* 支付方式 */}
      <div style={{
        background: '#fff',
        margin: '12px 16px',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ 
          color: '#333', 
          fontSize: '15px', 
          fontWeight: 500,
          marginBottom: '16px'
        }}>
          支付方式
        </div>
        
        {/* 转账支付 */}
        <div
          onClick={() => setDrawerOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px',
            background: '#f9f9f9',
            borderRadius: '12px',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          <TransferIcon />
          <div style={{ flex: 1, marginLeft: '14px' }}>
            <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
              转账支付
            </div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>
              查看收款地址，转账支付
            </div>
          </div>
          <ChevronRight style={{ width: '20px', height: '20px', color: '#ccc' }} />
        </div>
        
        {/* TronLink支付 */}
        <div
          onClick={() => {
            // TODO: TronLink支付逻辑
            alert('请使用TronLink钱包扫码支付');
            setDrawerOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px',
            background: '#f9f9f9',
            borderRadius: '12px',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          <TronLinkIcon />
          <div style={{ flex: 1, marginLeft: '14px' }}>
            <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
              TronLink 支付
            </div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>
              TronLink 支付
            </div>
          </div>
          <ChevronRight style={{ width: '20px', height: '20px', color: '#ccc' }} />
        </div>
        
        {/* imToken支付 */}
        <div
          onClick={() => {
            // TODO: imToken支付逻辑
            alert('请使用imToken钱包扫码支付');
            setDrawerOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px',
            background: '#f9f9f9',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
        >
          <ImTokenIcon />
          <div style={{ flex: 1, marginLeft: '14px' }}>
            <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
              imToken 支付
            </div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>
              imToken 支付
            </div>
          </div>
          <ChevronRight style={{ width: '20px', height: '20px', color: '#ccc' }} />
        </div>
      </div>

      {/* 自动监听提示 */}
      <div style={{
        margin: '12px 16px',
        padding: '14px 16px',
        background: hasConfirmedTransfer ? 'rgba(37, 99, 235, 0.1)' : 'rgba(34, 197, 94, 0.1)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <RefreshCw 
          className={isChecking || hasConfirmedTransfer ? 'animate-spin' : ''} 
          style={{ 
            width: '18px', 
            height: '18px', 
            color: hasConfirmedTransfer ? '#2563eb' : '#22c55e' 
          }} 
        />
        <span style={{ 
          color: hasConfirmedTransfer ? '#2563eb' : '#22c55e', 
          fontSize: '13px' 
        }}>
          {hasConfirmedTransfer 
            ? '正在查询链上交易，请稍候...' 
            : '系统正在自动监听链上交易，到账后自动上分'}
        </span>
      </div>

      {/* 取消按钮 */}
      <div style={{ padding: '20px 16px' }}>
        <button
          onClick={handleCancel}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #e5e5e5',
            background: '#fff',
            color: '#666',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          取消充值
        </button>
      </div>

      {/* 底部抽屉 - 转账详情 */}
      {drawerOpen && (
        <>
          {/* 遮罩层 */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
          />
          
          {/* 抽屉内容 */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fff',
            borderRadius: '20px 20px 0 0',
            zIndex: 1001,
            maxHeight: '85vh',
            overflow: 'auto',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* 抽屉头部 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <span style={{ fontSize: '17px', fontWeight: 600, color: '#333' }}>
                转账支付
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#999' }} />
              </button>
            </div>

            {/* 金额显示 */}
            <div style={{
              textAlign: 'center',
              padding: '24px 20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <UsdtIcon />
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#333' }}>
                  {usdtAmount} USDT
                </span>
                <span style={{ fontSize: '14px', color: '#999' }}>({walletType})</span>
              </div>
            </div>

            {/* 收款信息卡片 */}
            <div style={{
              margin: '0 16px 20px',
              padding: '20px',
              background: '#f9f9f9',
              borderRadius: '12px'
            }}>
              <div style={{ 
                fontSize: '15px', 
                fontWeight: 500, 
                color: '#333',
                marginBottom: '20px'
              }}>
                收款账户
              </div>

              {/* 网络 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '6px' }}>
                  网络：
                </div>
                <div style={{ fontSize: '15px', color: '#333' }}>
                  {walletType === 'TRC20' ? 'TRON' : walletType}
                </div>
              </div>

              {/* 付款金额 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '6px' }}>
                  付款金额：
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '15px', color: '#333' }}>
                    {usdtAmount} USDT
                  </span>
                  <button
                    onClick={() => copyToClipboard(usdtAmount, 'amount')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    {copied === 'amount' ? (
                      <Check style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                    ) : (
                      <Copy style={{ width: '16px', height: '16px', color: '#999' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* 地址 */}
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '6px' }}>
                  地址：
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#333',
                    wordBreak: 'break-all',
                    flex: 1
                  }}>
                    {walletAddress}
                  </span>
                  <button
                    onClick={() => copyToClipboard(walletAddress, 'address')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {copied === 'address' ? (
                      <Check style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                    ) : (
                      <Copy style={{ width: '16px', height: '16px', color: '#999' }} />
                    )}
                  </button>
                  {/* 二维码按钮 */}
                  <button
                    onClick={() => setShowQrCode(!showQrCode)}
                    style={{
                      background: showQrCode ? '#2563eb' : 'none',
                      border: 'none',
                      padding: '4px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <QrCode style={{ width: '16px', height: '16px', color: showQrCode ? '#fff' : '#999' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* 二维码区域 - 点击图标后显示 */}
            {showQrCode && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '0 20px 20px'
              }}>
                <div style={{
                  padding: '16px',
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <img 
                    src={orderData?.qrcode || qrcode} 
                    alt="收款二维码" 
                    style={{ width: '180px', height: '180px', borderRadius: '8px' }} 
                  />
                </div>
              </div>
            )}

            {/* 提示信息 */}
            <div style={{
              margin: '0 16px 20px',
              padding: '16px',
              background: '#fff9f0',
              borderRadius: '10px',
              borderLeft: '3px solid #f59e0b'
            }}>
              <ol style={{
                margin: 0,
                paddingLeft: '18px',
                fontSize: '13px',
                color: '#666',
                lineHeight: 1.8
              }}>
                <li style={{ color: '#ef4444', fontWeight: 500 }}>
                  转账金额必须与上方的支付金额一致，否则系统不到帐。
                </li>
                <li>
                  如果使用钱包转账，请选择货币种类为"USDT ({walletType})"。
                </li>
                <li>
                  使用钱包时，<span style={{ color: '#ef4444' }}>可能会产生手续费，</span>请确保最终支付金额一致。
                </li>
              </ol>
            </div>

            {/* 确认按钮 */}
            <div style={{ padding: '0 16px 30px' }}>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setHasConfirmedTransfer(true);
                  setShowCheckingOverlay(true);
                  setCheckCount(0);
                  // 立即触发一次查询
                  checkStatus();
                }}
                disabled={isChecking}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '24px',
                  border: 'none',
                  background: isChecking ? '#93c5fd' : '#2563eb',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: isChecking ? 'not-allowed' : 'pointer'
                }}
              >
                {isChecking ? '正在查询链上交易...' : '我已经转账'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 查询中全屏提示 */}
      {showCheckingOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.98)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          {/* 加载动画 - Tailwind风格 */}
          <div style={{
            width: '112px',
            height: '112px',
            borderWidth: '8px',
            borderStyle: 'solid',
            borderColor: '#e5e7eb',
            borderTopColor: '#60a5fa',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            animation: 'spin 1s linear infinite'
          }}>
            <svg 
              viewBox="0 0 24 24" 
              fill="#60a5fa" 
              style={{ 
                width: '32px', 
                height: '32px',
                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
              }}
            >
              <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
            </svg>
          </div>
          
          {/* 标题 */}
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#333',
            marginBottom: '12px'
          }}>
            正在查询链上交易
          </div>
          
          {/* 提示文字 */}
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            textAlign: 'center',
            marginBottom: '20px',
            lineHeight: 1.6
          }}>
            系统正在自动查询区块链交易记录<br/>
            确认到账后将自动上分
          </div>
          
          {/* 查询次数 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#f0f9ff',
            borderRadius: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#2563eb',
              animation: 'blink 1s ease-in-out infinite'
            }} />
            <span style={{ fontSize: '13px', color: '#2563eb' }}>
              已查询 {checkCount} 次
            </span>
          </div>
          
          {/* 订单信息 */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '16px 20px',
            width: '100%',
            maxWidth: '320px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{ color: '#999', fontSize: '13px' }}>支付金额</span>
              <span style={{ color: '#333', fontSize: '14px', fontWeight: 600 }}>
                {usdtAmount} USDT
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <span style={{ color: '#999', fontSize: '13px' }}>收款地址</span>
              <span style={{ 
                color: '#333', 
                fontSize: '12px',
                maxWidth: '160px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {walletAddress}
              </span>
            </div>
          </div>
          
          {/* 返回按钮 */}
          <button
            onClick={() => {
              setShowCheckingOverlay(false);
              onCancel();
            }}
            style={{
              marginTop: '30px',
              padding: '12px 32px',
              borderRadius: '24px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            继续充值
          </button>
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}

export default UsdtPaymentPage;
