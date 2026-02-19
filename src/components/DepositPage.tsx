import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Bell, User, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPayWay, getBankList, getPayBank, recharge, rechargeOnline, getPayInfo, getOnlinePaymentList, getNormalPaymentList, uploadRechargePic, PayInfo, OnlinePayment, NormalPayment } from '@/lib/api/deposit';
import { getBankList as getUserBankList, Bank } from '@/lib/api/bank';
import { getSystemConfig } from '@/lib/api/system';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UsdtPaymentPage } from './UsdtPaymentPage';
import { UsdtOrderStatus } from '@/lib/api/usdtRecharge';

type PaymentMode = 'online' | 'company'; // 在线支付 | 公司入款
type PaymentChannel = 'alipay' | 'usdt' | 'wechat' | 'unionpay' | 'bank' | 'qq'; // 支付渠道

interface DepositPageProps {
  onBack: () => void;
}

interface BankBox {
  bank?: string;
  bank_address?: string;
  bank_no?: string;
  bank_owner?: string;
}

export function DepositPage({ onBack }: DepositPageProps) {
  const navigate = useNavigate();
  const { refreshUserInfo, userInfo } = useAuth();
  const { t } = useLanguage();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('company'); // 支付方式：在线支付/公司入款
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('usdt'); // 支付渠道（默认USDT）
  const [depositMethod, setDepositMethod] = useState<'company' | 'online'>('company'); // 存款方式：公司入款/在线支付
  const [showProtocolInfo, setShowProtocolInfo] = useState(false); // 显示协议区别弹窗
  const [showQrCodeZoom, setShowQrCodeZoom] = useState(false); // 显示二维码放大
  const [depositNo, setDepositNo] = useState<string>(''); // 订单号
  const [depositCurrency, setDepositCurrency] = useState<'usdt' | 'cny'>('usdt'); // 存款币种：USDT/人民币
  const [payWayList, setPayWayList] = useState<any>({});
  const [bankList, setBankList] = useState<any[]>([]);
  const [cardList, setCardList] = useState<any[]>([]);
  const congList = [
    100,300,500,1000,2000,3000,5000,10000,20000
  ];
  const [congMoney, setCongMoney] = useState(100);

  const wxCongList = [
    50,100,200,500,800,1000,1500,2000
  ];
  const [wxCongMoney, setWxCongMoney] = useState(50);

  // 在线支付按钮：未选中默认背景 / 选中时两个 active 图随机其一（按 id 取模稳定）
  const ONLINE_PAY_DEFAULT_BG = 'https://www.xpj00000.vip/indexImg/default-sports-mini.BJ4yNOA9.svg';
  const ONLINE_PAY_ACTIVE_BGS = [
    'https://ik.imagekit.io/ixcx8adghm/game/active-sports-mini.DzJgZyvU.svg?updatedAt=1770221767751',
    'https://ik.imagekit.io/ixcx8adghm/game/active-casino-mini.C2xccerq.svg?updatedAt=1770221767747'
  ];
  
  const [bankBox, setBankBox] = useState<BankBox>({});
  const [amount, setAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(7.10); // 兑换汇率
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('TRC20');
  // 转账人：从用户信息中获取，禁止编辑
  const transferor = useMemo(() => {
    if (userInfo) {
      // 优先使用 realname 字段（真实姓名），如果没有则使用 name 或 username
      return userInfo.realname || userInfo.name || userInfo.username || '';
    }
    return '';
  }, [userInfo]);
  const [transferAccount, setTransferAccount] = useState(''); // 转账账户
  const [voucherImage, setVoucherImage] = useState<string | null>(null); // 凭证图片base64（用于预览）
  const [voucherFile, setVoucherFile] = useState<File | null>(null); // 凭证图片文件（用于上传）
  const [payInfo, setPayInfo] = useState<PayInfo | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [onlinePaymentList, setOnlinePaymentList] = useState<OnlinePayment[]>([]); // 在线支付方式列表
  const [selectedOnlinePaymentId, setSelectedOnlinePaymentId] = useState<number | null>(null); // 当前选中的在线支付项 id（仅一个选中，用于图标与提交）
  const [normalPaymentList, setNormalPaymentList] = useState<NormalPayment[]>([]); // 公司入款支付方式列表
  const [userWalletAddresses, setUserWalletAddresses] = useState<Bank[]>([]); // 用户绑定的钱包地址列表
  const [platformWalletAddress, setPlatformWalletAddress] = useState<string>(''); // 管理后台设置的收款地址
  const [platformWalletType, setPlatformWalletType] = useState<string>(''); // 管理后台设置的钱包类型
  const [platformQrCode, setPlatformQrCode] = useState<string>(''); // 管理后台设置的收款二维码
  const [currentNormalPayment, setCurrentNormalPayment] = useState<NormalPayment | null>(null); // 当前选中的公司入款支付方式

  // USDT自动充值状态
  const [showAutoRecharge, setShowAutoRecharge] = useState(false); // 显示USDT自动充值页面
  const [autoRechargeAmount, setAutoRechargeAmount] = useState(0); // 自动充值金额
  const [autoRechargePaymentId, setAutoRechargePaymentId] = useState(0); // 自动充值支付方式ID

  // 防止页面拖拽和缩放
  useEffect(() => {
    // 防止拖拽
    const preventDrag = (e: TouchEvent) => {
      // 如果触摸点在input、textarea、select等可输入元素上，允许默认行为
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      // 防止页面拖拽
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 防止双击缩放
    let lastTouchEnd = 0;
    const preventDoubleZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchmove', preventDrag, { passive: false });
    document.addEventListener('touchend', preventDoubleZoom, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventDrag);
      document.removeEventListener('touchend', preventDoubleZoom);
    };
  }, []);

  // 获取支付方式列表
  useEffect(() => {
    const fetchPayWay = async () => {
      try {
        const res = await getPayWay();
        if (res.code === 200 && res.data) {
          setPayWayList(res.data);
        }
      } catch (err) {
        console.error('获取支付方式失败', err);
      }
    };
    fetchPayWay();
  }, []);

  // 获取系统配置中的汇率
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const res = await getSystemConfig('system');
        if (res.code === 200 && res.data) {
          // 尝试从多个可能的字段获取汇率
          const rate = res.data.exchange_rate || 
                      res.data.usdt_rate || 
                      res.data.cny_rate || 
                      res.data.rate ||
                      res.data.usdt_exchange_rate;
          if (rate && Number(rate) > 0) {
            setExchangeRate(Number(rate));
            console.log('✅ 从系统配置获取汇率:', Number(rate));
          }
        }
      } catch (err) {
        console.error('获取汇率配置失败，使用默认汇率', err);
      }
    };
    fetchExchangeRate();
  }, []);

  // 获取银行列表
  useEffect(() => {
    const fetchBankList = async () => {
      try {
        const res = await getBankList();
        if (res.code === 200 && res.data) {
          setBankList(res.data);
        }
      } catch (err) {
        console.error('获取银行列表失败', err);
      }
    };
    fetchBankList();
  }, []);

  // 获取支付银行信息
  useEffect(() => {
    const fetchPayBank = async () => {
      try {
        const res = await getPayBank();
        if (res.code === 200 && res.data) {
          const data = Array.isArray(res.data) ? res.data : [res.data];
          setCardList(data.filter(item => item));
          
          // 尝试从支付银行信息中获取USDT收款地址
          // 查找包含 mch_id 或 usdt 相关的数据
          const usdtBank = data.find((item: any) => {
            // 优先查找包含 mch_id 的数据（USDT收款地址）
            if (item.mch_id) {
              return true;
            }
            // 或者查找 bank_data 中包含 USDT 的数据
            if (item.bank_data?.bank_name && item.bank_data.bank_name.toLowerCase().includes('usdt')) {
              return true;
            }
            return false;
          });
          
          if (usdtBank) {
            // 优先使用 mch_id 作为收款地址
            if (usdtBank.mch_id) {
              setPlatformWalletAddress(usdtBank.mch_id);
            } else if (usdtBank.bank_no) {
              // 如果没有 mch_id，使用 bank_no
              setPlatformWalletAddress(usdtBank.bank_no);
            }
            // 设置钱包类型
            if (usdtBank.bank_data?.bank_name) {
              setPlatformWalletType(usdtBank.bank_data.bank_name);
            }
          }
        }
      } catch (err) {
        console.error('获取支付银行失败', err);
      }
    };
    fetchPayBank();
  }, []);

  // 获取在线支付方式列表（包含收款账户和收款姓名）
  useEffect(() => {
    const fetchOnlinePaymentList = async () => {
      try {
        const res = await getOnlinePaymentList();
        console.log('📋 获取在线支付方式列表响应:', res);
        if (res.code === 200 && res.data) {
          const paymentList = Array.isArray(res.data) ? res.data : [res.data];
          console.log('📋 在线支付方式列表数据:', paymentList);
          console.log('📋 在线支付方式详情:', paymentList.map((p: any) => ({
            id: p.id,
            type: p.type,
            type_text: p.type_text,
            desc: p.desc,
            account: p.account,
            name: p.name,
            is_open: p.is_open
          })));
          setOnlinePaymentList(paymentList);
        } else {
          console.error('❌ 获取在线支付方式列表失败:', res.message);
        }
      } catch (err) {
        console.error('❌ 获取在线支付方式列表失败', err);
      }
    };
    fetchOnlinePaymentList();
  }, []);

  // 获取公司入款支付方式列表（包含收款地址和二维码）
  useEffect(() => {
    const fetchNormalPaymentList = async () => {
      try {
        const res = await getNormalPaymentList();
        console.log('📋 getNormalPaymentList 返回结果:', res);
        if (res.code === 200 && res.data) {
          console.log('📋 设置公司入款支付方式列表，数据:', res.data);
          console.log('📋 数据详情:', res.data.map((item: any) => ({
            id: item.id,
            type: item.type,
            type_text: item.type_text,
            account: item.account,
            name: item.name
          })));
          setNormalPaymentList(res.data);
        } else {
          console.warn('⚠️ 获取公司入款支付方式列表失败或数据为空:', res);
        }
      } catch (err) {
        console.error('获取公司入款支付方式列表失败', err);
      }
    };
    fetchNormalPaymentList();
  }, []);

  // 当切换支付渠道时，从公司入款支付方式列表中获取对应的收款地址和二维码
  useEffect(() => {
    if (paymentMode === 'company' && normalPaymentList.length > 0) {
      console.log('🔍 查找支付方式，当前渠道:', paymentChannel, '支付方式列表:', normalPaymentList);
      let matchedPayment: NormalPayment | null = null;
      
      if (paymentChannel === 'usdt') {
        // 优先精确匹配 company_usdt 类型
        matchedPayment = normalPaymentList.find(p => p.type === 'company_usdt' && p.params.usdt_type_text == walletType) || null;
        if (!matchedPayment) {
          // 尝试匹配包含 company_ 和 usdt 的类型
          matchedPayment = normalPaymentList.find(p => 
            p.type && (p.type.includes('company_') && p.type.includes('usdt'))
          ) || null;
        }
        if (!matchedPayment) {
          // 如果没有精确匹配，尝试通过type_text匹配
          matchedPayment = normalPaymentList.find(p => 
            p.type_text && (p.type_text.includes('USDT') || p.type_text.includes('usdt') || p.type_text.includes('泰达币'))
          ) || null;
        }
        if (!matchedPayment) {
          // 如果还是匹配不到，尝试匹配任何包含 company_ 前缀的支付方式（作为最后备选）
          matchedPayment = normalPaymentList.find(p => 
            p.type && p.type.startsWith('company_')
          ) || null;
        }
        console.log('🔍 USDT支付方式匹配结果:', matchedPayment);
      } else if (paymentChannel === 'alipay') {
        // 优先精确匹配 company_alipay 类型
        matchedPayment = normalPaymentList.find(p => p.type === 'company_alipay') || null;
        if (!matchedPayment) {
          // 尝试匹配包含 company_ 和 alipay 的类型
          matchedPayment = normalPaymentList.find(p => 
            p.type && (p.type.includes('company_') && p.type.includes('alipay'))
          ) || null;
        }
        if (!matchedPayment) {
          // 如果没有精确匹配，尝试通过type_text匹配
          matchedPayment = normalPaymentList.find(p => 
            p.type_text && (p.type_text.includes('支付宝') || p.type_text.includes('alipay'))
          ) || null;
        }
        console.log('🔍 支付宝支付方式匹配结果:', matchedPayment);
      } else if (paymentChannel === 'wechat') {
        // 微信支付匹配
        matchedPayment = normalPaymentList.find(p => 
          p.type === 'company_wxpay' || 
          (p.type && p.type.includes('company_') && p.type.includes('wx')) ||
          (p.type_text && (p.type_text.includes('微信') || p.type_text.includes('wechat')))
        ) || null;
      } else if (paymentChannel === 'bank') {
        // 银行卡支付匹配
        matchedPayment = normalPaymentList.find(p => 
          p.type === 'company_bankpay' || 
          (p.type && p.type.includes('company_') && p.type.includes('bank')) ||
          (p.type_text && (p.type_text.includes('银行卡') || p.type_text.includes('银行')))
        ) || null;
      } else if (paymentChannel === 'qq') {
        // QQ钱包匹配
        matchedPayment = normalPaymentList.find(p => 
          (p.type_text && (p.type_text.includes('QQ') || p.type_text.includes('qq')))
        ) || null;
      }
      
      if (matchedPayment) {
        setCurrentNormalPayment(matchedPayment);
        
        console.log('✅ 匹配到的支付方式详情:', {
          id: matchedPayment.id,
          type: matchedPayment.type,
          type_text: matchedPayment.type_text,
          account: matchedPayment.account,
          name: matchedPayment.name,
          qrcode: matchedPayment.qrcode,
          rate: matchedPayment.rate,
          params: matchedPayment.params
        });
        
        // 设置收款地址
        if (paymentChannel === 'usdt') {
          // USDT: 收款地址在 account 字段，钱包类型在 params.usdt_type_text 或 params 中
          const usdtAddress = matchedPayment.account || '';
          setPlatformWalletAddress(usdtAddress);
          console.log('💰 USDT收款地址:', usdtAddress);
          
          const usdtType = matchedPayment.params?.usdt_type_text || matchedPayment.params?.wallet_type || 'TRC20';
          setPlatformWalletType(usdtType);
          console.log('💰 USDT钱包类型:', usdtType);
        } else if (paymentChannel === 'alipay') {
          // 支付宝: 收款账户在 account 字段
          setPlatformWalletAddress(matchedPayment.account || '');
          console.log('💰 支付宝收款账户:', matchedPayment.account);
          
          // 自动设置转账账户默认值（如果为空）
          if ((!transferAccount || transferAccount.trim() === '') && userInfo && userInfo.name) {
            setTransferAccount(userInfo.name);
            console.log('💰 自动设置转账账户默认值:', userInfo.name);
          }
        }
        
        // 设置二维码
        if (matchedPayment.qrcode) {
          setPlatformQrCode(matchedPayment.qrcode);
          console.log('💰 收款二维码:', matchedPayment.qrcode);
        } else {
          setPlatformQrCode('');
          console.warn('⚠️ 未找到二维码');
        }
        
        // 注意：matchedPayment.rate 是赠送比例，不是汇率
        // 汇率保持默认值，或者应该从配置/API获取
        // 这里不设置汇率，保持默认汇率7.15
      } else {
        console.warn('⚠️ 未找到匹配的支付方式:', paymentChannel, '可用列表:', normalPaymentList.map(p => ({ type: p.type, type_text: p.type_text })));
        // 清空相关信息
        setCurrentNormalPayment(null);
        setPlatformWalletAddress('');
        setPlatformQrCode('');
      }
    } else {
      // 如果列表为空，清空相关信息
      if (normalPaymentList.length === 0 && paymentMode === 'company') {
        console.warn('⚠️ 公司入款支付方式列表为空');
        setCurrentNormalPayment(null);
        setPlatformWalletAddress('');
        setPlatformQrCode('');
      }
    }
  }, [paymentMode, walletType, paymentChannel, normalPaymentList]);

  // 当用户信息加载后，自动设置转账账户默认值（如果是支付宝公司入款）
  useEffect(() => {
    if (userInfo && userInfo.name && paymentMode === 'company' && paymentChannel === 'alipay') {
      if (!transferAccount || transferAccount.trim() === '') {
        setTransferAccount(userInfo.name);
        console.log('💰 自动设置转账账户默认值（用户账号）:', userInfo.name);
      }
    }
  }, [userInfo, paymentMode, paymentChannel]);

  // 辅助函数：根据支付方式类型获取图标、显示名称和支付渠道
  const getPaymentMethodInfo = (payment: OnlinePayment): { icon: string; name: string; channel: PaymentChannel } => {
    const type = payment.type?.toLowerCase() || '';
    const typeText = payment.type_text || '';
    const desc = payment.desc || '';
    
    // 根据 type 匹配
    if (type.includes('alipay') || type.includes('zfb')) {
      return { icon: '/images/pay/zfb.png', name: typeText || '支付宝', channel: 'alipay' };
    }
    if (type.includes('wechat') || type.includes('wx') || type.includes('wxpay')) {
      return { icon: '/images/pay/wx.png', name: typeText || '微信', channel: 'wechat' };
    }
    if (type.includes('bank') || type.includes('yhk')) {
      return { icon: '/images/pay/yhk.png', name: typeText || '银行卡', channel: 'bank' };
    }
    if (type.includes('qq') || type.includes('qqqb')) {
      return { icon: '/images/pay/qqqb.png', name: typeText || 'QQ钱包', channel: 'qq' };
    }
    if (type.includes('unionpay') || type.includes('yl')) {
      return { icon: '/images/pay/yhk.png', name: typeText || '银联', channel: 'unionpay' };
    }
    
    // 根据 type_text 匹配
    if (typeText.includes('支付宝') || typeText.includes('alipay') || typeText.includes('Alipay')) {
      return { icon: '/images/pay/zfb.png', name: typeText, channel: 'alipay' };
    }
    if (typeText.includes('微信') || typeText.includes('wechat') || typeText.includes('WeChat') || typeText.includes('wx')) {
      return { icon: '/images/pay/wx.png', name: typeText, channel: 'wechat' };
    }
    if (typeText.includes('银行卡') || typeText.includes('银行') || typeText.includes('bank')) {
      return { icon: '/images/pay/yhk.png', name: typeText, channel: 'bank' };
    }
    if (typeText.includes('QQ') || typeText.includes('qq')) {
      return { icon: '/images/pay/qqqb.png', name: typeText, channel: 'qq' };
    }
    if (typeText.includes('银联') || typeText.includes('unionpay')) {
      return { icon: '/images/pay/yhk.png', name: typeText, channel: 'unionpay' };
    }
    
    // 根据 desc 匹配
    if (desc.includes('支付宝') || desc.includes('alipay')) {
      return { icon: '/images/pay/zfb.png', name: typeText || desc || '支付宝', channel: 'alipay' };
    }
    if (desc.includes('微信') || desc.includes('wechat') || desc.includes('wx')) {
      return { icon: '/images/pay/wx.png', name: typeText || desc || '微信', channel: 'wechat' };
    }
    if (desc.includes('银行卡') || desc.includes('银行')) {
      return { icon: '/images/pay/yhk.png', name: typeText || desc || '银行卡', channel: 'bank' };
    }
    if (desc.includes('QQ') || desc.includes('qq')) {
      return { icon: '/images/pay/qqqb.png', name: typeText || desc || 'QQ钱包', channel: 'qq' };
    }
    
    // 默认返回
    return { icon: '/images/pay/zfb.png', name: typeText || desc || '支付', channel: 'alipay' };
  };

  // 当币种切换时，确保支付模式和渠道正确
  useEffect(() => {
    if (depositCurrency === 'usdt') {
      // USDT使用公司入款
      setSelectedOnlinePaymentId(null);
      if (paymentMode !== 'company') {
        setPaymentMode('company');
        setDepositMethod('company');
      }
      if (paymentChannel !== 'usdt') {
        setPaymentChannel('usdt');
      }
    } else if (depositCurrency === 'cny') {
      // 人民币使用在线支付（第三方支付接口）
      if (paymentMode !== 'online') {
        setPaymentMode('online');
        setDepositMethod('online');
      }
      // 确保支付渠道是支付宝或微信（在线支付）
      if (paymentChannel !== 'alipay' && paymentChannel !== 'wechat') {
        setPaymentChannel('usdt');
      }
    }
  }, [depositCurrency]);

  // 获取用户绑定的钱包地址列表
  useEffect(() => {
    const fetchUserWalletAddresses = async () => {
      try {
        const res = await getUserBankList();
        if (res.code === 200 && res.data) {
          // 筛选出 USDT 类型的钱包（通过 wallet_type 字段判断，或者 bank_type 包含 USDT）
          const usdtWallets = res.data.filter((bank: Bank) => {
            // 如果有 wallet_type 字段，说明是 USDT 钱包
            if (bank.wallet_type) {
              return true;
            }
            // 如果 bank_type 包含 USDT 相关关键词
            const bankType = (bank.bank_type || bank.bank_name || '').toLowerCase();
            return bankType.includes('usdt') || bankType.includes('trc') || bankType.includes('erc') || bankType.includes('omni');
          });
          setUserWalletAddresses(usdtWallets);
          
          // 如果只有一个钱包地址，自动选择
          if (usdtWallets.length === 1) {
            setWalletAddress(usdtWallets[0].card_no || usdtWallets[0].bank_no || '');
            if (usdtWallets[0].wallet_type) {
              setWalletType(usdtWallets[0].wallet_type);
            }
          }
        }
      } catch (err) {
        console.error('获取用户钱包地址列表失败', err);
      }
    };
    fetchUserWalletAddresses();
  }, []);


  // 获取支付方式显示名称的辅助函数
  const getPaymentName = (type: 'usdt' | 'alipay'): string => {
    if (normalPaymentList.length === 0) {
      // 如果列表未加载，返回默认名称
      return type === 'usdt' ? 'USDT支付(公司)' : '支付宝支付(公司)';
    }
    
    let matchedPayment: NormalPayment | null = null;
    if (type === 'usdt') {
      // 优先精确匹配 company_usdt 类型
      matchedPayment = normalPaymentList.find(p => p.type === 'company_usdt') || null;
      if (!matchedPayment) {
        // 如果没有精确匹配，尝试通过type_text匹配
        matchedPayment = normalPaymentList.find(p => 
          p.type_text && (p.type_text.includes('USDT') || p.type_text.includes('usdt'))
        ) || null;
      }
    } else if (type === 'alipay') {
      // 优先精确匹配 company_alipay 类型
      matchedPayment = normalPaymentList.find(p => p.type === 'company_alipay') || null;
      if (!matchedPayment) {
        // 如果没有精确匹配，尝试通过type_text匹配
        matchedPayment = normalPaymentList.find(p => 
          p.type_text && (p.type_text.includes('支付宝') || p.type_text.includes('alipay'))
        ) || null;
      }
    }
    
    // 如果找到匹配的支付方式，使用 type_text 作为显示名称
    if (matchedPayment && matchedPayment.type_text) {
      return matchedPayment.type_text;
    }
    
    // 如果没找到，返回默认名称
    return type === 'usdt' ? 'USDT支付(公司)' : '支付宝支付(公司)';
  };

  // 计算USDT数量
  useEffect(() => {
    if (amount && exchangeRate) {
      const usdt = Number(amount) / exchangeRate;
      setUsdtAmount(Number(usdt.toFixed(2)));
    } else {
      setUsdtAmount(0);
    }
  }, [amount, exchangeRate]);

  // 切换支付方式
  const changePaymentMode = (mode: PaymentMode) => {
    setPaymentMode(mode);
    setAmount('');
    setBankBox({});
    setTransferAccount('');
    setVoucherImage(null);
    if (mode === 'company') setSelectedOnlinePaymentId(null);
  };

  // 切换支付渠道
  const changePaymentChannel = (channel: PaymentChannel) => {
    setPaymentChannel(channel);
    setAmount('');
    setBankBox({});
    // 转账人不再需要清空，因为它是从userInfo获取的只读值
    setTransferAccount('');
    setVoucherImage(null);
  };

  // 初始化支付渠道
  useEffect(() => {
    if (paymentMode === 'online') {
      // 在线支付：优先选择支付宝，其次微信，最后银联
      if (payWayList.alipay === 1) {
        setPaymentChannel('alipay');
      } else if (payWayList.wechat === 1) {
        setPaymentChannel('wechat');
      } else if (payWayList.card === 1) {
        setPaymentChannel('unionpay');
      }
    } else {
      // console.log('payWayList:', payWayList);
      // 公司入款：优先选择USDT，否则选择支付宝
      if (payWayList.usdt === 1) {
        setPaymentChannel('usdt');
      } else {
        setPaymentChannel('usdt');
      }
    }
  }, [paymentMode, payWayList]);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 保存文件对象用于上传
      setVoucherFile(file);
      // 读取为base64用于预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 提交充值
  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      alert('请输入正确金额');
      return;
    }
    let finalPayment = currentNormalPayment;
    // USDT存款金额验证：最低20最高500万
    if (paymentChannel === 'usdt') {
      finalPayment = normalPaymentList.find(p => p.type === 'company_usdt' && p.params.usdt_type_text == walletType) || 
              normalPaymentList.find(p => p.type && p.type.includes('company_') && p.type.includes('usdt')) ||
              normalPaymentList.find(p => p.type_text && (p.type_text.includes('USDT') || p.type_text.includes('usdt') || p.type_text.includes('泰达币'))) ||
              normalPaymentList.find(p => p.type && p.type.startsWith('company_')) ||
              null;
      console.log('matchedPayment', finalPayment)
      if(finalPayment != null && finalPayment.min !=0 && finalPayment.max !=0) {
        if (Number(amount) < finalPayment.min || Number(amount) > finalPayment.max) {
          alert(`充值金额范围：最低${finalPayment.min}最高${finalPayment.max}`);
          return;
        }
      }
      // if (Number(amount) < 20 || Number(amount) > 5000000) {
      //   alert('充值金额范围：最低20最高500万USDT');
      //   return;
      // }
    } else {
      if (Number(amount) < 10 || Number(amount) > 100000) {
        alert('充值金额范围：10~100000');
        return;
      }
    }

    setLoading(true);
    try {
      let rechargeData: any = {
        amount: Number(amount)
      };
      console.log('paymentMode:', paymentMode);

      // 根据支付方式和渠道确定paytype
      if (paymentMode === 'company') {
        // 公司入款：使用从 normalPaymentList 获取的支付方式信息
        
        
        console.log('currentNormalPayment', currentNormalPayment);

        if (!finalPayment) {
          // 尝试重新匹配一次
          let matchedPayment: NormalPayment | null = null;


          console.log('1111111paymentChannel', paymentChannel);

          if (paymentChannel === 'usdt') {
            console.log('11111111walletType', walletType);
            matchedPayment = normalPaymentList.find(p => p.type === 'company_usdt' && p.params.usdt_type_text == walletType) || 
              normalPaymentList.find(p => p.type && p.type.includes('company_') && p.type.includes('usdt')) ||
              normalPaymentList.find(p => p.type_text && (p.type_text.includes('USDT') || p.type_text.includes('usdt') || p.type_text.includes('泰达币'))) ||
              normalPaymentList.find(p => p.type && p.type.startsWith('company_')) ||
              null;
            console.log('111111111matchedPayment', matchedPayment);
          } else if (paymentChannel === 'alipay') {
            matchedPayment = normalPaymentList.find(p => p.type === 'company_alipay') ||
              normalPaymentList.find(p => p.type && p.type.includes('company_') && p.type.includes('alipay')) ||
              normalPaymentList.find(p => p.type_text && (p.type_text.includes('支付宝') || p.type_text.includes('alipay'))) ||
              null;
          } else if (paymentChannel === 'wechat') {
            matchedPayment = normalPaymentList.find(p => 
              p.type === 'company_wxpay' || 
              (p.type && p.type.includes('company_') && p.type.includes('wx')) ||
              (p.type_text && (p.type_text.includes('微信') || p.type_text.includes('wechat')))
            ) || null;
          } else if (paymentChannel === 'bank') {
            matchedPayment = normalPaymentList.find(p => 
              p.type === 'company_bankpay' || 
              (p.type && p.type.includes('company_') && p.type.includes('bank')) ||
              (p.type_text && (p.type_text.includes('银行卡') || p.type_text.includes('银行')))
            ) || null;
          }
          
          if (matchedPayment) {
            finalPayment = matchedPayment;
            setCurrentNormalPayment(matchedPayment);
            setWalletAddress(matchedPayment.mch_id);
            console.log('✅ 重新匹配到支付方式:', matchedPayment);
          } else {
            console.error('❌ 无法找到匹配的支付方式:', {
              paymentChannel,
              paymentMode,
              depositCurrency,
              normalPaymentList: normalPaymentList.map(p => ({ id: p.id, type: p.type, type_text: p.type_text }))
            });
            const channelName = paymentChannel === 'usdt' ? 'USDT' : 
                               paymentChannel === 'alipay' ? '支付宝' : 
                               paymentChannel === 'wechat' ? '微信' : 
                               paymentChannel === 'bank' ? '银行卡' : '支付';
            alert(`未找到${channelName}方式的公司入款配置，请检查后台是否已配置该支付方式，或联系客服`);
            setLoading(false);
            return;
          }
        }
        
        if (!finalPayment) {
          alert('请选择支付方式');
          setLoading(false);
          return;
        }
        
        // 设置支付方式ID和类型
        rechargeData.payment_id = finalPayment.id;
        rechargeData.payment_type = finalPayment.type;
        rechargeData.payment_account = finalPayment.account;
        rechargeData.payment_name = finalPayment.name;
        setWalletAddress(finalPayment.mch_id);
        
        // 设置转账人姓名（后端必填字段 name）
        if (!transferor) {
          alert(t('enterTransferor'));
          setLoading(false);
          return;
        }
        rechargeData.name = transferor;
        
        // 设置转账时间（后端必填字段 hk_at，格式：YYYY-MM-DD HH:mm:ss）
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        rechargeData.hk_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        // 先上传凭证图片（如果有）
        let paymentPicUrl = '';
        if (voucherFile) {
          try {
            console.log('📤 上传凭证图片...');
            const uploadRes = await uploadRechargePic(voucherFile);
            if (uploadRes.code === 200 && uploadRes.data?.file_url) {
              paymentPicUrl = uploadRes.data.file_url;
              if (paymentPicUrl) {
                rechargeData.payment_pic = paymentPicUrl;
              }
              console.log('✅ 凭证图片上传成功:', paymentPicUrl);
            } else {
              alert(uploadRes.message || '上传凭证图片失败');
              setLoading(false);
              return;
            }
          } catch (err: any) {
            console.error('❌ 上传凭证图片失败:', err);
            alert(err.message || '上传凭证图片失败，请稍后重试');
            setLoading(false);
            return;
          }
        } else {
          // 如果支付宝支付也需要凭证图片，取消注释下面的验证
          // alert('请上传转款凭证');
          // setLoading(false);
          // return;
        }
        
        console.log('rechargeData.payment_pic', rechargeData.payment_pic)
        
        if (paymentChannel === 'usdt') {
          // USDT充值 - 使用自动充值组件
          console.log('🔄 USDT充值 - 跳转到自动充值页面');
          
          // 设置自动充值金额和支付方式ID
          setAutoRechargeAmount(Number(amount));
          setAutoRechargePaymentId(finalPayment.id);
          
          // 设置当前选中的支付方式
          setCurrentNormalPayment(finalPayment);
          
          // 设置钱包地址和类型
          let waddress = finalPayment.mch_id || finalPayment.account;
          setWalletAddress(waddress);
          
          // 获取汇率
          const rate = finalPayment.params?.usdt_rate || exchangeRate || 7.15;
          setExchangeRate(rate);
          
          // 获取钱包类型
          const wType = finalPayment.params?.usdt_type_text || finalPayment.params?.usdt_type || 'TRC20';
          setWalletType(wType);
          
          // 显示USDT自动充值页面
          setShowAutoRecharge(true);
          setLoading(false);
          return;
        } else if (paymentChannel === 'alipay') {
          // 公司入款-支付宝
          rechargeData.paytype = 'alipay';
          // 公司入款支付宝需要转账账户
          console.log('🔍 支付宝支付 - 转账账户:', transferAccount);
          // 如果转账账户为空，自动使用用户账号作为默认值
          let finalTransferAccount = transferAccount;
          if (!finalTransferAccount || finalTransferAccount.trim() === '') {
            // 优先使用用户账号
            if (userInfo && userInfo.name) {
              finalTransferAccount = userInfo.name;
              setTransferAccount(finalTransferAccount);
              console.log('✅ 自动填入默认转账账户（用户账号）:', finalTransferAccount);
            } else {
              // 如果没有用户账号，使用支付方式配置的账户
              if (finalPayment && finalPayment.account) {
                finalTransferAccount = finalPayment.account;
                setTransferAccount(finalTransferAccount);
                console.log('✅ 自动填入默认转账账户（支付方式账户）:', finalTransferAccount);
              } else {
                alert(t('enterTransferAccount'));
                setLoading(false);
                return;
              }
            }
          }
          rechargeData.account = finalTransferAccount; // 后端必填字段 account
          console.log('✅ 支付宝支付 - 设置转账账户:', rechargeData.account);
        } else {
          // 其他支付方式（不应该到达这里）
          alert('不支持的支付方式');
          setLoading(false);
          return;
        }
      } else {
        // 在线支付：通过后端 LBPAL 渠道
        // 调试：打印在线支付列表
        console.log('🔍 在线支付列表:', onlinePaymentList);
        console.log('🔍 当前支付渠道:', paymentChannel);
        console.log('🔍 在线支付列表详情:', onlinePaymentList.map(p => ({
          id: p.id,
          type: p.type,
          type_text: p.type_text,
          desc: p.desc,
          is_open: p.is_open
        })));
        
        // 根据支付渠道匹配在线支付方式：优先使用用户点选的支付项 id，否则按渠道匹配
        let matchedOnlinePayment: OnlinePayment | null = null;
        if (selectedOnlinePaymentId != null) {
          matchedOnlinePayment = onlinePaymentList.find(p => p.id === selectedOnlinePaymentId) || null;
        }
        if (!matchedOnlinePayment && paymentChannel === 'alipay') {
          matchedOnlinePayment = onlinePaymentList.find(p => {
            const t = (p.type || '').toLowerCase();
            if (t === 'online_alipay' || t === 'alipay') return true;
            if (t.includes('alipay')) return true;
            if (p.type_text && (p.type_text.includes('支付宝') || p.type_text.toLowerCase().includes('alipay'))) return true;
            if (p.desc && (p.desc.includes('支付宝') || p.desc.toLowerCase().includes('alipay'))) return true;
            return false;
          }) || null;
        } else if (!matchedOnlinePayment && paymentChannel === 'wechat') {
          matchedOnlinePayment = onlinePaymentList.find(p => {
            const t = (p.type || '').toLowerCase();
            if (t === 'online_wxpay' || t === 'online_wechat' || t === 'weixin' || t === 'wechat') return true;
            if (t.includes('wx') || t.includes('wechat') || t.includes('weixin')) return true;
            if (p.type_text && (p.type_text.includes('微信') || p.type_text.toLowerCase().includes('wechat'))) return true;
            if (p.desc && (p.desc.includes('微信') || p.desc.toLowerCase().includes('wechat'))) return true;
            return false;
          }) || null;
        } else if (!matchedOnlinePayment && paymentChannel === 'unionpay') {
          matchedOnlinePayment = onlinePaymentList.find(p => {
            const t = (p.type || '').toLowerCase();
            if (t === 'online_unionpay' || t === 'online_yl' || t === 'unionpay') return true;
            if (t.includes('unionpay') || t.includes('yl')) return true;
            if (p.type_text && (p.type_text.includes('银联') || p.type_text.toLowerCase().includes('unionpay'))) return true;
            if (p.desc && (p.desc.includes('银联') || p.desc.toLowerCase().includes('unionpay'))) return true;
            return false;
          }) || null;
        }
        
        console.log('🔍 匹配到的在线支付方式:', matchedOnlinePayment);
        
        if (!matchedOnlinePayment) {
          const channelName = paymentChannel === 'alipay' ? '支付宝' : 
                             paymentChannel === 'wechat' ? '微信' : 
                             paymentChannel === 'unionpay' ? '银联' : '支付';
          console.error('❌ 未找到匹配的在线支付方式:', {
            paymentChannel,
            onlinePaymentList: onlinePaymentList.map(p => ({
              id: p.id,
              type: p.type,
              type_text: p.type_text,
              desc: p.desc
            }))
          });
          alert(`未找到${channelName}方式的在线支付配置，请检查后台是否已配置该支付方式，或联系客服`);
          setLoading(false);
          return;
        }
        
        // 调用在线充值接口
        console.log('💰 提交在线充值请求:', {
          money: Number(amount),
          payment_type: matchedOnlinePayment.type,
          payment_id: matchedOnlinePayment.id
        });
        
        const onlineRes = await rechargeOnline({
          money: Number(amount),
          payment_type: matchedOnlinePayment.type,
          payment_id: matchedOnlinePayment.id
        });
        
        if (onlineRes.code !== 200) {
          alert(onlineRes.message || '在线充值失败');
          setLoading(false);
          return;
        }
        
        // 在线支付成功，获取支付URL
        const payUrl = onlineRes.data?.pay_url || '';
        const orderNo = onlineRes.data?.bill_no || onlineRes.data?.deposit_no || '';
        
        console.log('💰 获取到的支付地址:', payUrl);
        console.log('💰 获取到的订单号:', orderNo);
        
        if (!payUrl) {
          alert('获取支付地址失败，请稍后重试');
          setLoading(false);
          return;
        }
        
        // 直接打开支付链接（在新窗口打开）
        console.log('🚀 打开支付链接:', payUrl);
        // window.open(payUrl, '_blank');
        
        var userAgent = navigator.userAgent;
        var isAndroid = userAgent.indexOf('Android') > -1 || userAgent.indexOf('Adr') > -1;
        var isiOS = !!userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);

        if (isiOS) {
            window.location.href = payUrl;
        } else {
            window.open(payUrl, '_blank');
        }


        // 提示用户支付信息
        alert('支付页面已打开，请在新窗口中完成支付。支付完成后，订单将自动更新。');
        
        setLoading(false);
        
        // 可选：支付成功后返回充值页面
        // 或者导航到订单详情页面查看订单状态
        // navigate(`/deposit/order-detail?depositNo=${orderNo}&paymentMode=${paymentMode}&paymentChannel=${paymentChannel}&depositCurrency=${depositCurrency}&amount=${encodeURIComponent(amount)}&payUrl=${encodeURIComponent(payUrl)}`);
        return;
      }

      console.log('💰 提交充值请求参数（公司入款）:', rechargeData);
      const res = await recharge(rechargeData);
      
      if (res.code !== 200) {
        alert(res.message || '充值失败');
        setLoading(false);
        return;
      }

      // 如果是银行转账，直接提示成功
      if (rechargeData.paytype === 'bank') {
        alert('操作成功，等待工作人员审核！');
        setAmount('');
        setBankBox({});
        setLoading(false);
        setTimeout(() => {
          onBack();
        }, 1500);
        return;
      }

      // 公司入款：导航到订单详情页面
      if (paymentMode === 'company') {
        // 根据接口文档，充值响应返回 res.data.bill_no 或 res.data.deposit_no
        const orderNo = res.data?.bill_no || res.data?.deposit_no || res.message || '';
        if (orderNo) {
          // 导航到订单详情页面，通过URL参数传递订单信息
          navigate(`/deposit/order-detail?depositNo=${orderNo}&paymentMode=${paymentMode}&paymentChannel=${paymentChannel}&depositCurrency=${depositCurrency}&amount=${encodeURIComponent(amount)}`);
        } else {
          alert('获取支付信息失败，请稍后重试');
          setLoading(false);
        }
        return;
      }

      // 在线支付：导航到订单详情页面
      // 根据接口文档，充值响应返回 res.data.bill_no
      const depositNo = res.data?.bill_no || res.message || '';
      if (depositNo) {
        // 导航到订单详情页面，通过URL参数传递订单信息
        navigate(`/deposit/order-detail?depositNo=${depositNo}&paymentMode=${paymentMode}&paymentChannel=${paymentChannel}&depositCurrency=${depositCurrency}&amount=${encodeURIComponent(amount)}`);
      } else {
        alert('获取支付信息失败，请稍后重试');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ 充值失败', err);
      alert(err.message || err.response?.data?.message || '充值失败，请稍后重试');
      setLoading(false);
    }
  };

  // 获取支付信息
  const fetchPayInfo = async (depositNo: string, type: number) => {
    try {
      const res = await getPayInfo({ deposit_no: depositNo });
      if (res.code === 200 && res.data) {
        let payInfoData = res.data;
        
        // 如果payinfo接口返回的数据中没有收款账户和收款姓名，尝试从在线支付方式列表中获取
        if (!payInfoData.cardlist?.account && !payInfoData.info?.account && !payInfoData.payment?.account) {
          // 根据支付类型查找对应的支付方式
          const paymentType = paymentChannel === 'alipay' ? 'online_alipay' : paymentChannel === 'wechat' ? 'online_wxpay' : '';
          const matchedPayment = onlinePaymentList.find(p => p.type === paymentType);
          if (matchedPayment) {
            // 补充收款账户和收款姓名
            payInfoData = {
              ...payInfoData,
              cardlist: {
                ...payInfoData.cardlist,
                account: matchedPayment.account,
                name: matchedPayment.name
              },
              payment: {
                account: matchedPayment.account,
                name: matchedPayment.name
              }
            };
          }
        }
        
        // 如果是USDT支付，提取管理后台设置的收款地址
        if (paymentMode === 'company' && paymentChannel === 'usdt') {
          if (payInfoData.cardlist?.mch_id) {
            setPlatformWalletAddress(payInfoData.cardlist.mch_id);
          }
          if (payInfoData.info?.bank) {
            setPlatformWalletType(payInfoData.info.bank);
          }
        }
        
        setPayInfo(payInfoData);
        setShowPayDialog(true);
        setAmount('');
        setBankBox({});
        // 转账人不再需要清空，因为它是从userInfo获取的只读值
        setTransferAccount('');
        setVoucherImage(null);
        setVoucherFile(null);
      } else {
        alert(res.message || '获取支付信息失败');
      }
    } catch (err: any) {
      console.error('获取支付信息失败', err);
      alert(err.message || '获取支付信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 关闭支付对话框
  const closePayDialog = () => {
    setShowPayDialog(false);
    setPayInfo(null);
    setDepositNo('');
  };

  // 完成支付
  const handleCompletePayment = async () => {
    // 显示提示信息
    alert('充值订单已提交，请耐心等待客服人员核查通过！');
    // 刷新用户余额（强制刷新，跳过缓存）
    try {
      if (refreshUserInfo) {
        await refreshUserInfo(true);
      }
    } catch (err) {
      console.error('刷新余额失败:', err);
    }
    closePayDialog();
    onBack();
  };

  // 复制文本
  const copyText = (text: string) => {
    const input = document.createElement('input');
    input.style.opacity = '0';
    input.style.position = 'fixed';
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    alert('复制成功！');
  };

  // USDT自动充值页面
  if (showAutoRecharge && autoRechargePaymentId && currentNormalPayment) {
    return (
      <UsdtPaymentPage
        amount={autoRechargeAmount}
        paymentId={autoRechargePaymentId}
        receiveAddress={walletAddress || currentNormalPayment.mch_id || currentNormalPayment.account}
        usdtRate={currentNormalPayment.params?.usdt_rate || exchangeRate || 7.15}
        usdtType={walletType || currentNormalPayment.params?.usdt_type_text || currentNormalPayment.params?.usdt_type || 'TRC20'}
        qrcode={currentNormalPayment.qrcode || ''}
        onSuccess={(data: UsdtOrderStatus) => {
          console.log('✅ USDT充值成功:', data);
          alert(`充值成功！到账 ${data.cny_amount} 元`);
          setShowAutoRecharge(false);
          setAutoRechargeAmount(0);
          setAutoRechargePaymentId(0);
          setAmount('');
          refreshUserInfo(true);
        }}
        onCancel={() => {
          setShowAutoRecharge(false);
          setAutoRechargeAmount(0);
          setAutoRechargePaymentId(0);
        }}
        onError={(message: string) => {
          console.error('❌ USDT充值失败:', message);
          alert(message);
          setShowAutoRecharge(false);
          setAutoRechargeAmount(0);
          setAutoRechargePaymentId(0);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#151A23', color: '#fff', paddingBottom: '80px', touchAction: 'pan-y' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#151A23',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        zIndex: 10,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button onClick={onBack} style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, display: 'flex', alignItems: 'center' }}>
          <ChevronLeft className="w-6 h-6" style={{ color: '#fff' }} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>{t('depositTitle')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 通知图标 */}
          <button 
            onClick={() => navigate('/notifications')}
            style={{ 
              cursor: 'pointer', 
              background: 'transparent', 
              border: 'none', 
              padding: 0, 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell className="w-6 h-6" style={{ color: '#fff' }} />
            {/* 红点 */}
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              background: '#ff4444',
              borderRadius: '50%',
              border: '2px solid #151A23'
            }} />
          </button>
          {/* 用户图标 */}
          <button 
            onClick={() => navigate('/profile')}
            style={{ 
              cursor: 'pointer', 
              background: 'transparent', 
              border: 'none', 
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <User className="w-6 h-6" style={{ color: '#fff' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', background: '#141414', minHeight: '100%' }}>
        {/* 存款币种选择 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#fff' }}>选择支付方式</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* USDT */}
            <button
              onClick={() => {
                setDepositCurrency('usdt');
                setPaymentChannel('usdt');
                setAmount('');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundImage: depositCurrency === 'usdt' 
                  ? 'url(https://www.xpj00000.vip/indexImg/active-sports.CxIU50TW.svg)' 
                  : 'url(https://www.xpj00000.vip/indexImg/default-sports.KM8Zs5_U.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* USDT 图标 */}
              <div style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 1
              }}>
                <img 
                  src="https://www.xpj00000.vip/indexImg/USDTt.png" 
                  alt="USDT" 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    objectFit: 'contain' 
                  }} 
                />
              </div>
              <div style={{ flex: 1, textAlign: 'left', zIndex: 1 }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  color: '#fff', 
                  marginBottom: '4px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                }}>
                  USDT
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                }}>
                  泰达币
                </div>
              </div>
            </button>

            {/* 人民币充值 */}
            <button
              onClick={() => {
                setDepositCurrency('cny');
                setPaymentChannel('alipay');
                setAmount(congMoney.toString());
                setPaymentMode('online'); // 人民币支付使用在线支付（第三方支付接口）
                setDepositMethod('online');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundImage: depositCurrency === 'cny' 
                  ? 'url(https://www.xpj00000.vip/indexImg/active-casino.D98ZVQ96.svg)' 
                  : 'url(https://www.xpj00000.vip/indexImg/default-sports.KM8Zs5_U.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* 人民币 图标 */}
              <div style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 1
              }}>
                <img 
                  src="https://www.xpj00000.vip/indexImg/62692202.png" 
                  alt="人民币" 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    objectFit: 'contain' 
                  }} 
                />
              </div>
              <div style={{ flex: 1, textAlign: 'left', zIndex: 1 }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  color: '#fff', 
                  marginBottom: '4px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                }}>
                  人民币
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                }}>
                  CNY
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 存款方式选择 */}
        <div style={{ marginBottom: '20px' }}>
          {depositCurrency === 'usdt' ? (
            // USDT的存款方式：公司入款和在线支付
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* 公司入款 */}
              <button
                onClick={() => {
                  setDepositMethod('company');
                  setPaymentMode('company');
                  // 确保支付渠道与币种匹配
                  if (depositCurrency === 'usdt') {
                    setPaymentChannel('usdt');
                  }
                }}
                style={{
                  flex: 1,
                  position: 'relative',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `2px solid ${depositMethod === 'company' ? '#ff4444' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: depositMethod === 'company' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {depositMethod === 'company' && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src="/images/xz.png" 
                      alt="已选择" 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        objectFit: 'contain' 
                      }} 
                    />
                  </div>
                )}
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src="/images/gongsirukuan.png" 
                    alt="公司入款" 
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      objectFit: 'contain' 
                    }} 
                  />
                </div>
                <div style={{ fontSize: '14px', color: '#fff' }}>公司入款</div>
              </button>

              {/* 在线支付 - 已隐藏 */}
              {false && (
              <button
                onClick={() => {
                  setDepositMethod('online');
                  setPaymentMode('online');
                  // 确保支付渠道与币种匹配
                  if (depositCurrency === 'usdt') {
                    setPaymentChannel('usdt');
                  }
                }}
                style={{
                  flex: 1,
                  position: 'relative',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `2px solid ${depositMethod === 'online' ? '#ff8c00' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: depositMethod === 'online' ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {depositMethod === 'online' && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src="/images/xz.png" 
                      alt="已选择" 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        objectFit: 'contain' 
                      }} 
                    />
                  </div>
                )}
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src="/images/zaixian.png" 
                    alt="在线支付" 
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      objectFit: 'contain' 
                    }} 
                  />
                </div>
                <div style={{ fontSize: '14px', color: '#fff' }}>在线支付</div>
              </button>
              )}
            </div>
          ) : (
            <>
              {/* 在线支付方式：从后端获取（alipay/weixin 等通过 LBPAL 渠道处理） */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {onlinePaymentList
                .filter(payment => payment.is_open !== false) // 只显示已开启的支付方式
                .map((payment) => {
                  const paymentInfo = getPaymentMethodInfo(payment);
                  const isSelected = selectedOnlinePaymentId === payment.id; // 按支付项 id 选中，仅当前点击项为选中
                  const zdyCong = paymentInfo.channel == 'alipay' ? congMoney : (paymentInfo.channel == 'wechat' ? wxCongMoney : '');
                  const bgUrl = isSelected ? ONLINE_PAY_ACTIVE_BGS[payment.id % ONLINE_PAY_ACTIVE_BGS.length] : ONLINE_PAY_DEFAULT_BG;
                  
                  return (
                    <button
                      key={payment.id}
                      onClick={() => {
                        setSelectedOnlinePaymentId(payment.id);
                        setPaymentChannel(paymentInfo.channel);
                        setAmount(zdyCong ? zdyCong.toString() : '');
                        setPaymentMode('online');
                      }}
                      style={{
                        // flex: '1 1 calc(20% - 9px)',
                        minWidth: '60px',
                        aspectRatio: '1',
                        position: 'relative',
                        padding: '6px',
                        borderRadius: '6px',
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: 'transparent',
                        border: 'none',
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        overflow: 'hidden'
                      }}
                    >
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <img 
                            src="https://ik.imagekit.io/ixcx8adghm/public/top-certification-tick-dark.png?updatedAt=1768998583277" 
                            alt="已选择" 
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              objectFit: 'contain' 
                            }} 
                          />
                        </div>
                      )}
                      <div style={{ 
                        width: '24px' , 
                        height: '24px', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                      }}>
                        <img 
                          src={paymentInfo.icon} 
                          alt={paymentInfo.name} 
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            objectFit: 'contain' 
                          }} 
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: '#fff', zIndex: 1, textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                        {paymentInfo.name}
                      </div>
                    </button>
                  );
                })}
            </div>
            </>
          )}
        </div>

        {/* 钱包协议 */}
        {depositCurrency === 'usdt' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px', 
              fontWeight: 500, 
              marginBottom: '12px', 
              color: '#fff' 
            }}>
              <span>钱包协议</span>
              <button
                onClick={() => setShowProtocolInfo(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Info className="w-4 h-4" style={{ color: '#ffc53e' }} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* TRC20 */}
              <button
                onClick={() => setWalletType('TRC20')}
                style={{
                  flex: 1,
                  position: 'relative',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: `2px solid ${walletType === 'TRC20' ? '#ffc53e' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: walletType === 'TRC20' ? 'rgba(255, 197, 62, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '14px', color: '#fff' }}>TRC20</span>
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ff4444',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap'
                }}>推荐</span>
              </button>
              {/* ERC20 */}
              {/* <button
                onClick={() => setWalletType('ERC20')}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: `2px solid ${walletType === 'ERC20' ? '#ffc53e' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: walletType === 'ERC20' ? 'rgba(255, 197, 62, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '14px', color: '#fff' }}>ERC20</span>
              </button> */}
              {/* BEP20 */}
              {/* <button
                onClick={() => setWalletType('BEP20')}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: `2px solid ${walletType === 'BEP20' ? '#ffc53e' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: walletType === 'BEP20' ? 'rgba(255, 197, 62, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '14px', color: '#fff' }}>BEP20</span>
              </button> */}
            </div>
          </div>
        )}

        {/* 公司入款-支付宝：显示收款信息 - 已隐藏 */}
        {false && paymentMode === 'company' && paymentChannel === 'alipay' && (
          <>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {platformWalletAddress && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>{t('receiveAccount')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {platformWalletAddress}
                    </span>
                    <button
                      onClick={() => copyText(platformWalletAddress)}
                      style={{ color: '#ffc53e', fontSize: '14px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      {t('copy')}
                    </button>
                  </div>
                </div>
              )}
              {currentNormalPayment?.name && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>{t('receiveName')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{currentNormalPayment.name}</span>
                    <button
                      onClick={() => copyText(currentNormalPayment!.name)}
                      style={{ color: '#ffc53e', fontSize: '14px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      {t('copy')}
                    </button>
                  </div>
                </div>
              )}
              {platformQrCode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>{t('receiveQrCode')}</span>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                    <img 
                      src={platformQrCode} 
                      alt="收款二维码" 
                      style={{ 
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'contain',
                        borderRadius: '4px'
                      }} 
                      onError={(e) => {
                        console.error('二维码加载失败:', platformQrCode);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                转账人 <span style={{ color: '#ff4444' }}>*</span>
              </label>
              <input
                type="text"
                value={transferor}
                readOnly
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '16px',
                  cursor: 'not-allowed',
                  touchAction: 'manipulation'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                {t('transferAccount')} <span style={{ color: '#ff4444' }}>*</span>
              </label>
              <input
                type="text"
                value={transferAccount}
                onChange={(e) => setTransferAccount(e.target.value)}
                placeholder={t('enterTransferAccount')}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '16px',
                  touchAction: 'manipulation'
                }}
              />
            </div>
          </>
        )}

        {/* 公司入款 - 显示钱包信息（已移动到订单详情页面） */}

        {/* 在线支付-银联：显示银行信息（已隐藏） */}
        {false && paymentMode === 'online' && paymentChannel === 'unionpay' && payWayList.card === 1 && cardList.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {cardList.map((card, index) => (
                <div
                  key={index}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '10px',
                    lineHeight: 1.5
                  }}
                >
                  <p style={{ color: '#fff', margin: '0 0 4px 0' }}>收款银行：{card.bank_data?.bank_name || ''}</p>
                  <p style={{ color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    账号：{card.bank_no}
                    <button
                      onClick={() => copyText(card.bank_no)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <img
                        src="https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/clongicon.png"
                        alt="复制"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </button>
                  </p>
                  <p style={{ color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    户名：{card.bank_owner}
                    <button
                      onClick={() => copyText(card.bank_owner)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <img
                        src="https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/clongicon.png"
                        alt="复制"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </button>
                  </p>
                  <p style={{ color: '#fff', margin: 0 }}>银行地址：{card.bank_address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 在线支付-银联：银行转账表单（已隐藏） */}
        {false && paymentMode === 'online' && paymentChannel === 'unionpay' && payWayList.card === 1 && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                汇款姓名
              </label>
              <input
                type="text"
                value={bankBox.bank_owner || ''}
                onChange={(e) => setBankBox({ ...bankBox, bank_owner: e.target.value })}
                placeholder="请输入汇款姓名"
                maxLength={17}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                银行类型
              </label>
              <select
                value={bankBox.bank || ''}
                onChange={(e) => setBankBox({ ...bankBox, bank: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="" style={{ background: '#151A23', color: '#fff' }}>请选择银行类型</option>
                {bankList.map((bank, index) => (
                  <option key={index} value={bank.bank_name} style={{ background: '#151A23', color: '#fff' }}>
                    {bank.bank_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                汇款卡号
              </label>
              <input
                type="text"
                value={bankBox.bank_no || ''}
                onChange={(e) => setBankBox({ ...bankBox, bank_no: e.target.value })}
                placeholder="请输入汇款卡号"
                maxLength={20}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                开户行
              </label>
              <input
                type="text"
                value={bankBox.bank_address || ''}
                onChange={(e) => setBankBox({ ...bankBox, bank_address: e.target.value })}
                placeholder="请输入开户行"
                maxLength={20}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>
          </>
        )}


        {/* 充值金额 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
            {t('depositAmount')}
          </label>
          <div style={{ position: 'relative' }}>
            
            {paymentChannel=='alipay' && depositCurrency !== 'usdt' ? (
                <div style={{ width: '100%', display:'flex', gap: '12px',flexWrap: 'wrap' }}>
              
              {congList.map((congItem) => {
                  const isSelected = congMoney === congItem;
                  
                  return (
                    <div 
                      key={congItem}
                      onClick={() => {
                        setAmount(congItem.toString());
                        setCongMoney(congItem);
                      }}
                      style={{
                        width:'30%',
                        height: '50px',
                        lineHeight: '50px',
                        textAlign: 'center',
                        background: isSelected?'rgba(255, 197, 62, 0.1)':'rgb(255, 197, 62)',
                        color: isSelected?'#fff':'rgb(21, 26, 35)',
                        border: isSelected?'1px solid rgb(255, 197, 62)':'1px solid rgba(255, 255, 255, 0.1)',
                        cursor:'pointer',
                        borderRadius: '8px'
                      }}>
                        {congItem}
                    </div>
                  );
                })}
            </div>
            ) : (
               <div></div>
            )}

            {paymentChannel=='wechat' && depositCurrency !== 'usdt' ? (
              <div style={{ width: '100%', display:'flex', gap: '12px', flexWrap: 'wrap' }}>
              
              {wxCongList.map((congItem) => {
                  const isSelected = wxCongMoney === congItem;
                  
                  return (
                    <div 
                      key={congItem}
                      onClick={() => {
                        setAmount(congItem.toString());
                        setWxCongMoney(congItem);
                      }}
                      style={{
                        width:'30%',
                        height: '50px',
                        lineHeight: '50px',
                        textAlign: 'center',
                        background: isSelected?'rgba(255, 197, 62, 0.1)':'rgb(255, 197, 62)',
                        color: isSelected?'#fff':'rgb(21, 26, 35)',
                        border: isSelected?'1px solid rgb(255, 197, 62)':'1px solid rgba(255, 255, 255, 0.1)',
                        cursor:'pointer',
                        borderRadius: '8px'
                      }}>
                        {congItem}
                    </div>
                  );
                })}
            </div>
            ) : (
              <div></div>
            )}

           
           {depositCurrency === 'usdt' ||  paymentChannel=='unionpay' ? (
            <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={(depositCurrency && depositCurrency == 'usdt') ?'请输入充值RMB金额支付USDT':'请输入充值金额100-500'}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '16px',
                  touchAction: 'manipulation'
                }}
              />
            // <div style={{fontSize: '14px', color: '#ff4444', fontWeight: 600, lineHeight: 1.8, paddingLeft: '0px', margin: 0}}>B77官方温馨提示：USDT充值正在维护请转人民币区支付</div>
          ) : (
            <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入充值金额"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  display: 'none',
                  fontSize: '16px',
                  touchAction: 'manipulation'
                }}
              />
          )}

          </div>
          {depositCurrency === 'usdt' ? (
            <div style={{ fontSize: '16px', color: 'red', marginTop: '8px', fontWeight: '600' }}>
              {amount && Number(amount) > 0 && exchangeRate ? (
                <>{Number(amount)}RMB 支付USDT (汇率: {exchangeRate})</>
              ) : (
                <> </>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '16px', color: 'red', marginTop: '8px', fontWeight: '600' }}>
              {/* {amount && Number(amount) > 0 && exchangeRate ? (
                <>{Number(amount)}RMB ≈ {(Number(amount) / exchangeRate).toFixed(2)} USDT (汇率: {exchangeRate})</>
              ) : (
                <>最低10最高10万人民币 {exchangeRate ? `(汇率: ${exchangeRate})` : ''}</>
              )} */}
            </div>
          )}
        </div>

        {/* 上传转款凭证（已移动到订单详情页面） */}

        {/* 获取存款二维码按钮 */}
        <button
          onClick={handleSubmit}
          disabled={loading || !amount}
          style={{
            width: '100%',
            background: (loading || !amount) ? 'rgba(255, 197, 62, 0.5)' : '#ffc53e',
            color: '#151A23',
            borderRadius: '8px',
            padding: '14px',
            marginTop: '16px',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            cursor: (loading || !amount) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s'
          }}
        >
          {loading ? t('submitting') : (depositCurrency === 'usdt' ?'支付USDT':'确认支付')}
        </button>

        {/* 温馨提示 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>{t('tips')}:</div>
          <ol style={{ fontSize: '12px', color: '#ff4444', fontWeight: 600, lineHeight: 1.8, paddingLeft: '0px', margin: 0 }}>
            <li>充值USDT请核对地址进行充值</li>
            <li>USDT充值到账时间为1分钟自动到账</li>
            <li>提现请点击B77卡包添加提现账号</li>
            <li>已经转账情况下如未到账请联系客服提交充值截图</li>
            <li> 存款成功后,需达到三倍有效投注额方可提款-防套现-防洗钱。</li>
            <li></li>
          </ol>
        </div>
      </div>

      {/* 支付对话框 */}
      {showPayDialog && payInfo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={closePayDialog}
          />
          <div style={{
            position: 'relative',
            width: '100%',
            background: '#151A23',
            borderRadius: '16px 16px 0 0',
            padding: '16px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                {paymentMode === 'company' ? t('virtualCurrencyDeposit') : payInfo.info.paytype}
              </h3>
              <button
                onClick={closePayDialog}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {paymentMode === 'company' ? (
              // USDT支付信息 - 按照第二张截图样式
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 二维码区域 */}
                {payInfo.cardlist.payimg && (
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
                      borderRadius: '12px',
                      position: 'relative'
                    }}>
                      <img 
                        src={payInfo.cardlist.payimg} 
                        alt="支付二维码" 
                        style={{ width: '240px', height: '240px', borderRadius: '8px' }} 
                      />
                    </div>
                    
                    {/* 订单号 */}
                    {(depositNo || payInfo.info.deposit_no || payInfo.info.bill_no) && (
                      <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>
                        {depositNo || payInfo.info.deposit_no || payInfo.info.bill_no}
                      </div>
                    )}
                    
                    {/* 二维码提示和放大按钮 */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '12px',
                      width: '100%'
                    }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        二维码仅供本次存款使用
                      </span>
                      <button
                        onClick={() => setShowQrCodeZoom(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        <svg style={{ width: '16px', height: '16px', color: '#ffc53e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        <span style={{ fontSize: '12px', color: '#ffc53e' }}>放大二维码</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 红色警告信息（仅USDT显示） */}
                {paymentChannel === 'usdt' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '12px',
                    background: 'rgba(255, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 68, 68, 0.3)'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ff4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>!</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#ff4444', margin: 0, lineHeight: 1.5 }}>
                      请选择正确的钱包协议类型进行存款,否则资产将无法找回!
                    </p>
                  </div>
                )}
                
                {/* 存款详情卡片 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* 存款方式 + 充值金额 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: paymentMode === 'company' ? '#ff4444' : '#ff8c00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {paymentMode === 'company' ? (
                          <svg style={{ width: '20px', height: '20px', color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                          </svg>
                        ) : (
                          <svg style={{ width: '20px', height: '20px', color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '14px', color: '#fff' }}>{paymentMode === 'company' ? '公司入款' : '在线支付'}</span>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffc53e' }}>
                      {payInfo.info.real_money || amount || '0'} {depositCurrency === 'usdt' ? 'USDT' : '¥'}
                    </span>
                  </div>
                  
                  {/* 收款地址（USDT显示mch_id，其他支付方式显示account） */}
                  {((paymentChannel === 'usdt' && payInfo.cardlist.mch_id) || 
                    (paymentChannel !== 'usdt' && (payInfo.cardlist.account || payInfo.cardlist.mch_id || payInfo.payment?.account))) && (
                    <div>
                      <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                        收款地址
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
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {paymentChannel === 'usdt' 
                            ? payInfo.cardlist.mch_id 
                            : (payInfo.cardlist.account || payInfo.cardlist.mch_id || payInfo.payment?.account || '')}
                        </span>
                        <button
                          onClick={() => copyText(
                            paymentChannel === 'usdt' 
                              ? payInfo.cardlist.mch_id 
                              : (payInfo.cardlist.account || payInfo.cardlist.mch_id || payInfo.payment?.account || '')
                          )}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 钱包协议（仅USDT显示） */}
                  {paymentChannel === 'usdt' && (
                    <div>
                      <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                        钱包协议
                      </div>
                      <div style={{ fontSize: '16px', color: '#fff', fontWeight: 500 }}>
                        {payInfo.info.bank || walletType}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 钱包地址选择（仅USDT显示） */}
                {paymentChannel === 'usdt' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                      钱包地址 <span style={{ color: '#ff4444' }}>*</span>
                    </label>
                    <select
                      value={walletAddress}
                      onChange={(e) => {
                        const selectedAddress = e.target.value;
                        setWalletAddress(selectedAddress);
                        // 根据选中的地址，自动设置对应的钱包类型
                        const selectedWallet = userWalletAddresses.find(
                          (wallet) => (wallet.card_no || wallet.bank_no) === selectedAddress
                        );
                        if (selectedWallet?.wallet_type) {
                          setWalletType(selectedWallet.wallet_type);
                        }
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '16px',
                        touchAction: 'manipulation'
                      }}
                    >
                      <option value="" style={{ background: '#151A23', color: '#fff' }}>请选择</option>
                      {userWalletAddresses.map((wallet, index) => {
                        const address = wallet.card_no || wallet.bank_no || '';
                        const walletTypeLabel = wallet.wallet_type || '';
                        return (
                          <option 
                            key={index} 
                            value={address} 
                            style={{ background: '#151A23', color: '#fff' }}
                          >
                            {address} {walletTypeLabel ? `(${walletTypeLabel})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* 转账人（仅非USDT显示） */}
                {paymentChannel !== 'usdt' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                      转账人 <span style={{ color: '#ff4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={transferor}
                      readOnly
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '16px',
                        cursor: 'not-allowed',
                        touchAction: 'manipulation'
                      }}
                    />
                  </div>
                )}

                {/* 上传转款凭证 */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
                    {t('uploadVoucher')} <span style={{ color: '#ff4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 1
                      }}
                    />
                    <div style={{
                      border: '2px dashed rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '32px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.03)'
                    }}>
                      {voucherImage ? (
                        <img src={voucherImage} alt="凭证" style={{ maxWidth: '100%', maxHeight: '192px', margin: '0 auto' }} />
                      ) : (
                        <>
                          <svg style={{ width: '48px', height: '48px', color: 'rgba(255, 255, 255, 0.4)', margin: '0 auto 8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>点击上传图片</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 已完成转账按钮 - 橙色渐变背景 */}
                <button
                  onClick={handleCompletePayment}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ff8c00 0%, #ffc53e 100%)',
                    color: '#151A23',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)'
                  }}
                >
                  已完成转账
                </button>
              </div>
            ) : (
              // 在线支付信息（支付宝/微信）
              payInfo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {payInfo.cardlist?.payimg && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <img src={payInfo.cardlist.payimg} alt="支付二维码" style={{ width: '192px', height: '192px' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{t('depositAmount')}</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{payInfo.info?.amount}</span>
                </div>
                
                {/* 收款账户 - 从多个可能的字段位置获取 */}
                {(payInfo.cardlist?.account || payInfo.info?.account || payInfo.payment?.account || (payInfo as any).account) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>收款账户</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 500, color: '#fff' }}>
                        {payInfo.cardlist?.account || payInfo.info?.account || payInfo.payment?.account || (payInfo as any).account}
                      </span>
                      <button
                        onClick={() => copyText(payInfo.cardlist?.account || payInfo.info?.account || payInfo.payment?.account || (payInfo as any).account || '')}
                        style={{
                          color: '#ffc53e',
                          fontSize: '14px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        {t('copy')}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 收款姓名 - 从多个可能的字段位置获取 */}
                {(payInfo.cardlist?.name || payInfo.info?.name || payInfo.payment?.name || (payInfo as any).name) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>收款姓名</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 500, color: '#fff' }}>
                        {payInfo.cardlist?.name || payInfo.info?.name || payInfo.payment?.name || (payInfo as any).name}
                      </span>
                      <button
                        onClick={() => copyText(payInfo.cardlist?.name || payInfo.info?.name || payInfo.payment?.name || (payInfo as any).name || '')}
                        style={{
                          color: '#ffc53e',
                          fontSize: '14px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        {t('copy')}
                      </button>
                    </div>
                  </div>
                )}
                
                <p style={{ textAlign: 'center', color: '#fff' }}>
                  请使用{' '}
                  <span style={{ color: '#ffc53e' }}>
                    {payInfo.info?.paytype === '支付宝二维码' ? '支付宝' : '微信'}
                  </span>{' '}
                  扫描二维码，完成付款
                </p>
                <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  可先截屏保存至相册，再使用{payInfo.info?.paytype === '支付宝二维码' ? '支付宝' : '微信'}转账
                </p>
                <button
                  onClick={handleCompletePayment}
                  style={{
                    width: '100%',
                    background: '#ffc53e',
                    color: '#151A23',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '16px',
                    fontSize: '16px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  已完成支付
                </button>
              </div>
              )
            )}
          </div>
        </div>
      )}

      {/* 协议区别弹窗 */}
      {showProtocolInfo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)'
        }}>
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '600px',
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#333', margin: 0 }}>协议区别</h3>
              <button
                onClick={() => setShowProtocolInfo(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: '#333' }}>
              <img 
                src="https://91a2c0front.kfbetter.com/cdn/91a2c0FNEW/static/img/proDiff.8196c8ad.jpg" 
                alt="协议区别" 
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                onError={(e) => {
                  console.error('协议区别图片加载失败');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 二维码放大弹窗 */}
      {showQrCodeZoom && payInfo?.cardlist?.payimg && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '20px'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <button
              onClick={() => setShowQrCodeZoom(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '32px',
                cursor: 'pointer',
                padding: 0,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
            <div style={{ 
              padding: '20px',
              background: '#fff',
              borderRadius: '12px'
            }}>
              <img 
                src={payInfo.cardlist.payimg} 
                alt="支付二维码" 
                style={{ width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '8px' }} 
              />
            </div>
            {(depositNo || payInfo.info.deposit_no || payInfo.info.bill_no) && (
              <div style={{ fontSize: '16px', color: '#fff', fontWeight: 500 }}>
                {depositNo || payInfo.info.deposit_no || payInfo.info.bill_no}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
