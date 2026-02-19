/**
 * USDT自动充值组件
 * 
 * 功能：
 * 1. 创建USDT充值订单（带唯一金额标识）
 * 2. 显示收款地址和二维码
 * 3. 自动轮询订单状态
 * 4. 充值成功自动回调
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Copy, Check, Clock, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
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

interface UsdtAutoRechargeProps {
  amount: number;                    // 充值金额(USDT)
  paymentId: number;                 // 支付方式ID
  receiveAddress: string;            // 收款地址(从payment获取)
  usdtRate: number;                  // 汇率
  usdtType: string;                  // 钱包协议 TRC20/ERC20
  qrcode: string;                    // 收款二维码
  onSuccess: (data: UsdtOrderStatus) => void;  // 充值成功回调
  onCancel: () => void;              // 取消/返回回调
  onError: (message: string) => void; // 错误回调
}

// 轮询间隔(毫秒)
const POLL_INTERVAL = 5000;

export function UsdtAutoRecharge({
  amount,
  paymentId,
  receiveAddress,
  usdtRate,
  usdtType,
  qrcode,
  onSuccess,
  onCancel,
  onError
}: UsdtAutoRechargeProps) {
  const { refreshUserInfo } = useAuth();
  
  // 订单状态
  const [orderData, setOrderData] = useState<UsdtOrderData | null>(null);
  const [orderStatus, setOrderStatus] = useState<UsdtOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  
  // 轮询定时器引用
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 创建订单
  const createOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await createUsdtOrder({
        amount,
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
  }, [amount, paymentId, onError]);
  
  // 查询订单状态
  const checkStatus = useCallback(async () => {
    if (!orderData?.bill_no) return;
    
    setIsChecking(true);
    
    try {
      // 调用检查接口（会触发后端轮询链上交易）
      const res = await checkUsdtOrder(orderData.bill_no);
      
      if (res.code === 200 && res.data) {
        setOrderStatus(res.data);
        
        // 检查是否成功
        if (res.data.status === USDT_ORDER_STATUS.SUCCESS) {
          // 停止轮询
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          // 刷新用户余额
          if (refreshUserInfo) {
            await refreshUserInfo(true);
          }
          // 触发成功回调
          onSuccess(res.data);
        } else if (res.data.status === USDT_ORDER_STATUS.EXPIRED || 
                   res.data.status === USDT_ORDER_STATUS.CANCELLED ||
                   res.data.status === USDT_ORDER_STATUS.FAILED) {
          // 订单已结束，停止轮询
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
  const copyToClipboard = useCallback((text: string) => {
    const input = document.createElement('input');
    input.style.opacity = '0';
    input.style.position = 'fixed';
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      // 清理定时器
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
    
    // 启动状态轮询
    pollTimerRef.current = setInterval(checkStatus, POLL_INTERVAL);
    
    // 启动倒计时
    countdownTimerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 0) {
          // 订单过期
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
    
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [orderData, checkStatus]);
  
  // 加载中状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        gap: '16px'
      }}>
        <RefreshCw 
          className="w-8 h-8 animate-spin" 
          style={{ color: '#ffc53e' }} 
        />
        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
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
        minHeight: '300px',
        gap: '16px',
        padding: '20px'
      }}>
        <AlertCircle className="w-12 h-12" style={{ color: '#ff4444' }} />
        <div style={{ color: '#ff4444', fontSize: '16px', textAlign: 'center' }}>
          {error}
        </div>
        <button
          onClick={createOrder}
          style={{
            background: '#ffc53e',
            color: '#151A23',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
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
            color: 'rgba(255, 255, 255, 0.6)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
        minHeight: '300px',
        gap: '16px',
        padding: '20px'
      }}>
        <Clock className="w-12 h-12" style={{ color: '#ff8c00' }} />
        <div style={{ color: '#ff8c00', fontSize: '16px', fontWeight: 600 }}>
          订单已过期
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', textAlign: 'center' }}>
          请重新创建充值订单
        </div>
        <button
          onClick={createOrder}
          style={{
            background: '#ffc53e',
            color: '#151A23',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
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
            color: 'rgba(255, 255, 255, 0.6)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
        minHeight: '300px',
        gap: '16px',
        padding: '20px'
      }}>
        <CheckCircle className="w-16 h-16" style={{ color: '#00c853' }} />
        <div style={{ color: '#00c853', fontSize: '20px', fontWeight: 600 }}>
          充值成功！
        </div>
        <div style={{ 
          color: '#fff', 
          fontSize: '24px', 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px'
        }}>
          <span style={{ color: '#ffc53e' }}>{orderStatus.usdt_amount}</span>
          <span style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>USDT</span>
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
          ≈ ¥{orderStatus.cny_amount}
        </div>
        {orderStatus.tx_hash && (
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.5)', 
            fontSize: '12px',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            交易哈希: {orderStatus.tx_hash}
          </div>
        )}
        <button
          onClick={onCancel}
          style={{
            background: '#ffc53e',
            color: '#151A23',
            padding: '12px 32px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          完成
        </button>
      </div>
    );
  }
  
  // 正常显示充值信息
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 倒计时提示 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px',
        background: 'rgba(255, 197, 62, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 197, 62, 0.3)'
      }}>
        <Clock className="w-5 h-5" style={{ color: '#ffc53e' }} />
        <span style={{ color: '#ffc53e', fontSize: '14px' }}>
          请在 <strong>{formatTime(remainingSeconds)}</strong> 内完成转账
        </span>
      </div>
      
      {/* 自动监听提示 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
        background: 'rgba(0, 200, 83, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 200, 83, 0.3)'
      }}>
        <RefreshCw 
          className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} 
          style={{ color: '#00c853' }} 
        />
        <span style={{ color: '#00c853', fontSize: '14px' }}>
          系统正在自动监听链上交易，到账后自动上分
        </span>
      </div>
      
      {/* 二维码区域 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          padding: '20px',
          background: '#fff',
          borderRadius: '12px'
        }}>
          <img 
            src={orderData?.qrcode || qrcode} 
            alt="收款二维码" 
            style={{ width: '200px', height: '200px', borderRadius: '8px' }} 
          />
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
          请使用钱包扫码转账
        </div>
      </div>
      
      {/* 转账金额(重要) */}
      <div style={{
        background: 'rgba(255, 68, 68, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 68, 68, 0.3)'
      }}>
        <div style={{ 
          fontSize: '14px', 
          color: '#ff4444', 
          marginBottom: '8px',
          fontWeight: 600
        }}>
          ⚠️ 请务必转账以下金额（精确到小数点后2位）
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <span style={{ 
            color: '#ffc53e', 
            fontSize: '24px', 
            fontWeight: 700,
            fontFamily: 'monospace'
          }}>
            {orderData?.usdt_amount?.toFixed(2)} USDT
          </span>
          <button
            onClick={() => copyToClipboard(orderData?.usdt_amount?.toFixed(2) || '')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#ffc53e',
              color: '#151A23',
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.6)', 
          marginTop: '8px' 
        }}>
          转账金额不符将无法自动到账，请仔细核对！
        </div>
      </div>
      
      {/* 收款地址 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
          收款地址 ({orderData?.usdt_type || usdtType})
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <span style={{ 
            flex: 1, 
            color: '#fff', 
            fontSize: '12px',
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}>
            {orderData?.receive_address || receiveAddress}
          </span>
          <button
            onClick={() => copyToClipboard(orderData?.receive_address || receiveAddress)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Copy className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
          </button>
        </div>
      </div>
      
      {/* 订单信息 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>订单号</span>
          <span style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>
            {orderData?.bill_no}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>原始金额</span>
          <span style={{ color: '#fff', fontSize: '14px' }}>
            {orderData?.original_amount} USDT
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>折算人民币</span>
          <span style={{ color: '#ffc53e', fontSize: '14px', fontWeight: 600 }}>
            ≈ ¥{orderData?.cny_amount}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>汇率</span>
          <span style={{ color: '#fff', fontSize: '14px' }}>
            1 USDT = ¥{orderData?.usdt_rate || usdtRate}
          </span>
        </div>
      </div>
      
      {/* 手动刷新按钮 */}
      <button
        onClick={checkStatus}
        disabled={isChecking}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          padding: '14px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '14px',
          cursor: isChecking ? 'not-allowed' : 'pointer',
          opacity: isChecking ? 0.7 : 1
        }}
      >
        <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
        {isChecking ? '检查中...' : '手动刷新状态'}
      </button>
      
      {/* 取消按钮 */}
      <button
        onClick={handleCancel}
        style={{
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.6)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        取消充值
      </button>
      
      {/* 温馨提示 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
          温馨提示:
        </div>
        <ol style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.7)', 
          lineHeight: 1.8, 
          paddingLeft: '20px', 
          margin: 0 
        }}>
          <li>请务必转账<strong style={{ color: '#ffc53e' }}>精确金额</strong>，否则无法自动到账</li>
          <li>系统将自动监听链上交易，通常1-3分钟内到账</li>
          <li>请使用{orderData?.usdt_type || usdtType}协议转账，其他协议无法到账</li>
          <li>如超过10分钟未到账，请联系在线客服</li>
        </ol>
      </div>
    </div>
  );
}

export default UsdtAutoRecharge;
