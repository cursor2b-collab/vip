import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Bell } from 'lucide-react';
import { getPayInfo, PayInfo, PayInfo2, uploadRechargePic, rechargeEdit, getNormalPaymentList, NormalPayment } from '@/lib/api/deposit';
import { getBankList as getUserBankList, Bank } from '@/lib/api/bank';
import { getSystemConfig } from '@/lib/api/system';
import { getRechargeInfo } from '@/lib/api/team';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type PaymentMode = 'online' | 'company';
type PaymentChannel = 'alipay' | 'usdt' | 'wechat' | 'unionpay' | 'bank' | 'qq';

export default function DepositOrderDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userInfo } = useAuth();
  const { t } = useLanguage();
  
  const depositNo = searchParams.get('depositNo') || '';
  const paymentMode = (searchParams.get('paymentMode') || 'company') as PaymentMode;
  const paymentChannel = (searchParams.get('paymentChannel') || 'usdt') as PaymentChannel;
  const depositCurrency = (searchParams.get('depositCurrency') || 'usdt') as 'usdt' | 'cny';
  const amount = searchParams.get('amount') || '';
  
  const [payInfo, setPayInfo] = useState<PayInfo | null>(null);
  const [payInfo2, setPayInfo2] = useState<PayInfo2 | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('TRC20');
  const [userWalletAddresses, setUserWalletAddresses] = useState<Bank[]>([]);
  const [transferor, setTransferor] = useState('');
  const [transferAccount, setTransferAccount] = useState('');
  const [voucherImage, setVoucherImage] = useState<string | null>(null);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [showQrCodeZoom, setShowQrCodeZoom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [normalPaymentList, setNormalPaymentList] = useState<NormalPayment[]>([]); // 公司入款支付方式列表
  const hasSupplementedData = useRef(false); // 标记是否已经补充过数据，避免重复执行
  const [exchangeRate, setExchangeRate] = useState(7.1); // 兑换汇率

  let normalPaymentListAll: NormalPayment[] = [];


  useEffect(() => {
    if (!depositNo) {
      alert('订单号不存在');
      navigate('/deposit');
      return;
    }
    
    // 重置补充数据标记
    hasSupplementedData.current = false;
    
    // 自动设置转账人和转账账户默认值（用户账号）
    if (userInfo && userInfo.name) {
      setTransferor(userInfo.name);
      setTransferAccount(userInfo.name);
      console.log('✅ 自动设置默认值 - 转账人:', userInfo.name, '转账账户:', userInfo.name);
    }
    
    // 获取用户钱包地址列表（USDT）
    if (paymentChannel === 'usdt') {
      loadUserWalletAddresses();
    }
    
    // 获取公司入款支付方式列表（用于获取二维码和收款地址）
    if (paymentMode === 'company') {
      loadNormalPaymentList();
    }
    
    // 获取订单信息
    fetchPayInfo();
    
    // 获取系统配置中的汇率
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
  }, [depositNo]);

  // 当支付方式列表加载完成且支付信息为空时，从支付方式列表中补充数据
  useEffect(() => {
    if (payInfo2 && normalPaymentList.length > 0 && paymentMode === 'company' && !hasSupplementedData.current) {
      // 检查是否需要补充数据（二维码或收款地址为空）
      // const needsQrcode = !payInfo.cardlist?.payimg;
      const needsQrcode = !payInfo.cardlist?.payimg;
      const needsAddress = !payInfo.cardlist?.mch_id && !payInfo.cardlist?.account;
      const needsData = needsQrcode || needsAddress;
      
      if (needsData) {
        console.log('⚠️ 支付信息数据为空，尝试从支付方式列表补充数据');
        let matchedPayment: NormalPayment | null = null;
        
        console.log('paymentChannel', paymentChannel)
        console.log('payInfo2.account', payInfo)

        // 根据支付渠道匹配支付方式
        if (paymentChannel === 'usdt') {
          matchedPayment = normalPaymentList.find(p => p.type === 'company_usdt' && p.params.mch_id == payInfo.account) || 
            normalPaymentList.find(p => p.type && p.type.includes('company_') && p.type.includes('usdt')) ||
            normalPaymentList.find(p => p.type_text && (p.type_text.includes('USDT') || p.type_text.includes('usdt'))) ||
            null;
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
        }
        
        if (matchedPayment) {
          console.log('✅ 找到匹配的支付方式:', matchedPayment);
          console.log('✅ 支付方式详情:', {
            id: matchedPayment.id,
            type: matchedPayment.type,
            type_text: matchedPayment.type_text,
            account: matchedPayment.account,
            name: matchedPayment.name,
            qrcode: matchedPayment.qrcode,
            mch_id: (matchedPayment as any).mch_id,
            params: matchedPayment.params
          });
          
          // 补充二维码和收款地址（只补充缺失的字段）
          const updatedPayInfo: PayInfo = {
            ...payInfo,
            cardlist: {
              ...payInfo.cardlist,
              // 如果二维码为空，使用支付方式的二维码
              payimg: needsQrcode ? (matchedPayment.qrcode || payInfo.cardlist?.payimg || '') : (payInfo.cardlist?.payimg || ''),
              // USDT: mch_id 可能在 account 字段中，或者单独存储
              mch_id: paymentChannel === 'usdt' && needsAddress ? ((matchedPayment as any).mch_id || matchedPayment.account || '') : (payInfo.cardlist?.mch_id || ''),
              // 非USDT: 使用 account 字段
              account: paymentChannel !== 'usdt' && needsAddress ? (matchedPayment.account || '') : (payInfo.cardlist?.account || ''),
              name: matchedPayment.name || payInfo.cardlist?.name || ''
            },
            info: {
              ...payInfo.info,
              // amount: payInfo.info.amount || Number(amount) || 0,
              amount: payInfo2.money || Number(amount) || 0,
              // real_money: payInfo.info.real_money || Number(amount) || 0,
              real_money: payInfo2.money || Number(amount) || 0,
              // paytype: payInfo.info.paytype || matchedPayment.type_text || '',
              paytype: payInfo2.payment_type || matchedPayment.type_text || '',
              bank: paymentChannel === 'usdt' ? (matchedPayment.params?.usdt_type_text || matchedPayment.params?.wallet_type || matchedPayment.params?.usdt_type || 'TRC20') : payInfo.info.bank
            },
            payment: {
              account: matchedPayment.account || payInfo.payment?.account,
              name: matchedPayment.name || payInfo.payment?.name
            }
          };
          
          console.log('✅ 从支付方式列表补充数据后的支付信息:', updatedPayInfo);
          setPayInfo(updatedPayInfo);
          hasSupplementedData.current = true; // 标记已补充数据
        } else {
          console.warn('⚠️ 未找到匹配的支付方式，支付渠道:', paymentChannel, '可用列表:', normalPaymentList.map(p => ({ type: p.type, type_text: p.type_text })));
          hasSupplementedData.current = true; // 即使没找到，也标记为已尝试，避免重复执行
        }
      }
    }
  }, [normalPaymentList, payInfo, payInfo2, paymentMode, paymentChannel, amount]);

  const loadUserWalletAddresses = async () => {
    try {
      const res = await getUserBankList();
      console.log('获取钱包地址列表响应:', res);
      if (res.code === 200 && res.data) {
        const wallets = res.data.filter((bank: Bank) => bank.bank_type == 'USDT');
        setUserWalletAddresses(wallets);
        if (wallets.length > 0 && !walletAddress) {
          const firstWallet = wallets[0];
          setWalletAddress(firstWallet.card_no || firstWallet.bank_no || '');
          setWalletType(firstWallet.wallet_type || 'TRC20');
        }
      }
    } catch (err) {
      console.error('获取钱包地址列表失败', err);
    }
  };

  const loadNormalPaymentList = async () => {
    try {
      console.log('📋 获取公司入款支付方式列表...');
      const res = await getNormalPaymentList();
      console.log('📋 公司入款支付方式列表响应:', res);
      if (res.code === 200 && res.data) {
        setNormalPaymentList(res.data);
        normalPaymentListAll = res.data;
        console.log('📋 设置公司入款支付方式列表，数据:', res.data);
        console.log('📋 支付方式列表详情:', res.data.map((p: NormalPayment) => ({
          id: p.id,
          type: p.type,
          type_text: p.type_text,
          account: p.account,
          qrcode: p.qrcode ? '有' : '无',
          mch_id: (p as any).mch_id || '无'
        })));
      }
    } catch (err) {
      console.error('获取公司入款支付方式列表失败', err);
    }
  };

  const fetchPayInfo = async () => {
    try {
      setLoading(true);
      console.log('📱 订单详情页面 - 获取支付信息，订单号:', depositNo);
      // const res = await getPayInfo({ deposit_no: depositNo });
      const res = await getRechargeInfo({ bill_no: depositNo });

      setPayInfo2(res.data);

      console.log('📱 订单详情页面 - 支付信息响应:', res);

      console.log('normalPaymentListAll', normalPaymentListAll);

      // {"bill_no":"20260121172909PWGPj","lang":"zh_cn"}
      // {"status":"success","code":200,"message":"","data":{"id":52,"bill_no":"20260121172909PWGPj","member_id":55,"name":"用户2","origin_money":"0.00","forex":"0.00","lang":"zh_cn","money":"10.00","payment_type":"company_usdt","account":"cccccccccccccccccccccccccccccccccccccccccccccc","payment_desc":null,"payment_detail":{"payment_id":3,"payment_account":"vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv","payment_name":"张三","usdt_rate":"7.14","usdt_type":"bep"},"payment_pic":"","status":1,"diff_money":"0.00","before_money":"0.00","after_money":"0.00","score":"0.00","fail_reason":null,"hk_at":"2026-01-21 17:29:08","confirm_at":null,"user_id":0,"created_at":"2026-01-21 17:29:09","updated_at":"2026-01-21 17:29:09","status_text":"待确认","payment_type_text":"USDT支付(公司入款)"}}

      
      if (res.code === 200 && res.data) {
        
        let payInfoData = res.data;
        // 确保 cardlist 对象存在
        if (!payInfoData.cardlist) {
          payInfoData.cardlist = {} as any;
        }
        
        // 如果二维码为空，尝试从多个可能的字段获取
        if (!payInfoData.cardlist.payimg && normalPaymentListAll && normalPaymentListAll.length > 0) {
          console.warn('⚠️ 二维码为空，尝试从其他字段获取');
          const rawData = res.data as any;
          
          const npayMod = normalPaymentListAll.find((p: any) => p.mch_id === payInfoData.account);
          
          const qrcodeUrl = npayMod?.qrcode;

          // 尝试多个可能的字段
          // const qrcodeUrl = rawData.qrcode || 
          //                  rawData.cardlist?.qrcode || 
          //                  rawData.payimg || 
          //                  rawData.cardlist?.payimg ||
          //                  rawData.info?.qrcode ||
          //                  rawData.payment?.qrcode;
          
          if (qrcodeUrl) {
            payInfoData = {
              ...payInfoData,
              info:payInfoData,
              cardlist: {
                ...npayMod,
                payimg: qrcodeUrl,
                real_money: payInfoData?.money || Number(payInfoData.money) || 0
              }
            };
            console.log('✅ 从其他字段获取二维码:', qrcodeUrl);
          } else {
            console.error('❌ 无法找到二维码字段，原始数据:', rawData);
          }
        }
        
        // 如果收款地址为空，尝试从多个可能的字段获取
        if (!payInfoData.cardlist.mch_id && !payInfoData.cardlist.account && normalPaymentListAll && normalPaymentListAll.length > 0) {
          console.warn('⚠️ 收款地址为空，尝试从其他字段获取');
          const rawData = res.data as any;
          // 尝试多个可能的字段
          const address = rawData.mch_id || 
                         rawData.cardlist?.mch_id ||
                         rawData.account ||
                         rawData.cardlist?.account ||
                         rawData.info?.mch_id ||
                         rawData.info?.account ||
                         rawData.payment?.account;
          
          if (address) {
            // 如果是USDT，优先使用mch_id
            if (paymentChannel === 'usdt' && (rawData.mch_id || rawData.cardlist?.mch_id || rawData.info?.mch_id)) {
              payInfoData = {
                ...payInfoData,
                cardlist: {
                  ...payInfoData.cardlist,
                  mch_id: rawData.mch_id || rawData.cardlist?.mch_id || rawData.info?.mch_id
                }
              };
              console.log('✅ 从其他字段获取USDT收款地址(mch_id):', payInfoData.cardlist.mch_id);
            } else {
              payInfoData = {
                ...payInfoData,
                cardlist: {
                  ...payInfoData.cardlist,
                  account: address
                }
              };
              console.log('✅ 从其他字段获取收款地址(account):', address);
            }
          } else {
            console.error('❌ 无法找到收款地址字段，原始数据:', rawData);
          }
        }
        
        if(!normalPaymentListAll || normalPaymentListAll.length === 0) {
          payInfoData = {
              ...payInfoData,
              info:payInfoData,
              cardlist: {
                real_money: payInfoData?.money || Number(payInfoData.money) || 0
              }
            };
        }

        setPayInfo(payInfoData);
        console.log('✅ 订单详情页面 - 最终支付信息:', JSON.stringify(payInfoData, null, 2));
      } else {
        console.error('❌ 获取订单信息失败:', res.message);
        alert(res.message || '获取订单信息失败');
        navigate('/deposit');
      }
    } catch (err: any) {
      console.error('❌ 获取订单信息失败', err);
      alert(err.message || '获取订单信息失败');
      navigate('/deposit');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板');
    }).catch(() => {
      alert('复制失败');
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherImage(reader.result as string);
        setVoucherFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompletePayment = async () => {
    if (paymentChannel === 'usdt' && !walletAddress) {
      alert('请选择钱包地址');
      return;
    }
    
    // 自动填入转账账户默认值（如果为空）
    let finalTransferAccount = transferAccount;
    if (paymentChannel !== 'usdt') {
      if (!finalTransferAccount || finalTransferAccount.trim() === '') {
        // 优先使用用户账号
        if (userInfo && userInfo.name) {
          finalTransferAccount = userInfo.name;
          setTransferAccount(finalTransferAccount);
          console.log('✅ 自动填入默认转账账户（用户账号）:', finalTransferAccount);
        } else {
          alert('请输入转账账户');
          return;
        }
      }
    }
    
    // 确保转账人已设置
    let finalTransferor = transferor;
    if (!finalTransferor && userInfo && userInfo.name) {
      finalTransferor = userInfo.name;
      setTransferor(finalTransferor);
      console.log('✅ 自动填入默认转账人（用户姓名）:', finalTransferor);
    }
    
    if (!voucherFile) {
      alert('请上传转款凭证');
      return;
    }
    
    try {
      setLoading(true);
      const uploadRes = await uploadRechargePic(voucherFile);
      if (uploadRes.code === 200 && uploadRes.data?.file_url) {

        rechargeEdit(uploadRes.data.file_url, payInfo.id).then((res: any) => {
          if (res.code === 200) {
            alert('凭证上传成功，请等待审核');
            navigate('/deposit');
          }
          else {
            alert(res.message || '凭证上传失败，请稍后重试');
          }
        }).catch((err: any) => {
          console.error('❌ 充值失败:', err);
          alert(err.message || '充值失败，请稍后重试');
        });

        // alert('凭证上传成功，请等待审核');
        // navigate('/deposit');
      } else {
        alert(uploadRes.message || '上传凭证失败');
      }
    } catch (err: any) {
      console.error('上传凭证失败', err);
      alert(err.message || '上传凭证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !payInfo) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#151A23', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#fff'
      }}>
        加载中...
      </div>
    );
  }

  if (!payInfo) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#151A23', paddingBottom: '80px' }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: '#151A23',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button
          onClick={() => navigate('/deposit')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>存款</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={20} color="rgba(255, 255, 255, 0.7)" />
        </div>
      </div>

      {/* 订单详情内容 */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 二维码区域 */}
        {payInfo?.cardlist?.payimg && (
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
                onError={(e) => {
                  console.error('❌ 二维码图片加载失败:', payInfo.cardlist.payimg);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ 二维码图片加载成功:', payInfo.cardlist.payimg);
                }}
              />
            </div>
            
            {/* 订单号 */}
            {(depositNo || payInfo.info.deposit_no || payInfo.info.bill_no) && (
              <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>
                {depositNo || payInfo.info.deposit_no || payInfo.info.bill_no}
                <input
                  type="hidden"
                  name="depositNo"
                  value={depositNo || payInfo.info.deposit_no || payInfo.info.bill_no}
                />
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
          {/* 金额 */}
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
                background: '#ff4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '20px', height: '20px', color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span style={{ fontSize: '14px', color: '#fff' }}>金额</span>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffc53e' }}>
              {exchangeRate && (payInfo.info.real_money || amount) 
                ? ((Number(payInfo.info.real_money || amount || 0) / exchangeRate).toFixed(2)) + ' USDT'
                : (payInfo.info.real_money || amount || '0') + ' ¥'}
            </span>
          </div>
          
          {/* 收款地址（USDT显示mch_id，其他支付方式显示account） */}
          {((paymentChannel === 'usdt' && (payInfo.cardlist?.mch_id || payInfo.cardlist?.account)) || 
            (paymentChannel !== 'usdt' && (payInfo.cardlist?.account || payInfo.cardlist?.mch_id || payInfo.payment?.account))) && (
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
                    ? (payInfo.cardlist?.mch_id || payInfo.cardlist?.account || '') 
                    : (payInfo.cardlist?.account || payInfo.cardlist?.mch_id || payInfo.payment?.account || '')}
                </span>
                <button
                  onClick={() => copyText(
                    paymentChannel === 'usdt' 
                      ? (payInfo.cardlist?.mch_id || payInfo.cardlist?.account || '') 
                      : (payInfo.cardlist?.account || payInfo.cardlist?.mch_id || payInfo.payment?.account || '')
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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#ff4444' }}>
              选择转账钱包地址 <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <select
              value={walletAddress}
              onChange={(e) => {
                const selectedAddress = e.target.value;
                setWalletAddress(selectedAddress);
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
                fontSize: '14px'
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
            <div style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginTop: '8px', color: '#ff4444' }}>
              B77官方温馨提示：
              <div style={{ marginLeft:'20px' }}>请选择B77卡包里面绑定的USDT地址进行转账</div>
            </div>
          </div>
        )}

        {/* 转账人和转账账户字段已隐藏，提交时自动填入默认值 */}

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
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'rgba(255, 140, 0, 0.5)' : 'linear-gradient(135deg, #ff8c00 0%, #ffc53e 100%)',
            color: '#151A23',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)'
          }}
        >
          {loading ? '提交中...' : '已完成转账'}
        </button>
      </div>

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
