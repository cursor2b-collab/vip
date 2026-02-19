/**
 * 取款页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getBankList, Bank } from '@/lib/api/bank';
import { submitWithdraw } from '@/lib/api/withdraw';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageLoader } from '@/components/PageLoader';

export default function WithdrawPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<number>(0);
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadBanks();
  }, [isLoggedIn, authLoading, navigate]);

  const loadBanks = async () => {
    try {
      const res = await getBankList();
      if (res.code === 200 && res.data) {
        setBanks(res.data);
        if (res.data.length > 0) {
          setSelectedBank(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('加载银行卡失败:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBank || !amount || !password) {
      alert(t('fillCompleteInfo'));
      return;
    }

    setLoading(true);
    try {
      // 获取选中的银行卡信息
      const selectedBankInfo = banks.find(b => b.id === selectedBank);
      const cardNo = selectedBankInfo?.bank_no || selectedBankInfo?.card_no || '';
      const bankType = selectedBankInfo?.bank_name || selectedBankInfo?.bank_type || '';
      
      const res = await submitWithdraw({
        name: userInfo?.realname || userInfo?.name || '', // 用户姓名
        money: parseFloat(amount),
        account: cardNo, // 提现账户
        member_bank_id: selectedBank,
        member_bank_text: bankType, // 银行卡类型文本
        qk_pwd: password
      });
      
      if (res.code === 200) {
        alert(t('withdrawSubmitted'));
        navigate('/profile');
      } else {
        alert(res.message || t('withdrawFailed'));
      }
    } catch (err: any) {
      alert(err.message || t('withdrawFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <PageLoader loading />;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#fff' }}>
      {/* 返回按钮 */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <img 
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/profile'))} 
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
        <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('withdrawTitle')}</h2>
      </div>

      <div style={{ padding: '20px' }}>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%',
            height: '44px',
            paddingLeft: '12px',
            paddingRight: '16px',
            background: 'rgba(0, 0, 0, 0.45098039215686275)',
            border: focusedInput === 'bank' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
            borderRadius: '12px',
            position: 'relative',
            transition: 'border-color 0.3s ease'
          }}>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(Number(e.target.value))}
              onFocus={() => setFocusedInput('bank')}
              onBlur={() => setFocusedInput(null)}
              title={t('selectBank')}
              style={{
                flex: 1,
                width: '97%',
                height: '100%',
                fontSize: '16px',
                color: focusedInput === 'bank' ? 'hsla(0,0%,100%,.8509803921568627)' : '#fff',
                background: '#121519',
                border: 0,
                outline: 0,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                cursor: 'pointer',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23fff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0 center',
                paddingRight: '30px'
              }}
            >
            {banks.map(bank => {
              // 兼容 bank_no 和 card_no 两种字段名
              const cardNo = bank.bank_no || bank.card_no || '';
              const displayName = bank.bank_name || bank.bank_type || '';
              
              // 隐藏卡号/地址中间部分，只显示前后几位（与银行卡管理页面一致）
              const maskCardNo = (cardNo: string) => {
                if (!cardNo) return '****';
                if (cardNo.length <= 8) {
                  // 如果长度小于等于8，只显示前2位和后2位
                  return cardNo.substring(0, 2) + '*'.repeat(cardNo.length - 4) + cardNo.substring(cardNo.length - 2);
                } else {
                  // 显示前4位和后4位，中间用*代替
                  return cardNo.substring(0, 4) + '*'.repeat(cardNo.length - 8) + cardNo.substring(cardNo.length - 4);
                }
              };
              
              return (
                <option key={bank.id} value={bank.id}>
                  {displayName} - {maskCardNo(cardNo)}
                </option>
              );
            })}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%',
            height: '44px',
            paddingLeft: '12px',
            paddingRight: '16px',
            background: 'rgba(0, 0, 0, 0.45098039215686275)',
            border: focusedInput === 'amount' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
            borderRadius: '12px',
            position: 'relative',
            transition: 'border-color 0.3s ease'
          }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={() => setFocusedInput('amount')}
              onBlur={() => setFocusedInput(null)}
              placeholder={t('enterWithdrawAmount')}
              style={{
                flex: 1,
                height: '100%',
                fontSize: '16px',
                color: focusedInput === 'amount' ? 'hsla(0,0%,100%,.8509803921568627)' : '#fff',
                background: 'transparent',
                border: 0,
                outline: 0,
                caretColor: '#ffc53e'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%',
            height: '44px',
            paddingLeft: '12px',
            paddingRight: '16px',
            background: 'rgba(0, 0, 0, 0.45098039215686275)',
            border: focusedInput === 'password' ? '1px solid #ffc53e' : '1px solid rgba(199, 218, 255, 0.0784313725490196)',
            borderRadius: '12px',
            position: 'relative',
            transition: 'border-color 0.3s ease'
          }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              placeholder="请输入提款密码"
              style={{
                flex: 1,
                height: '100%',
                fontSize: '16px',
                color: focusedInput === 'password' ? 'hsla(0,0%,100%,.8509803921568627)' : '#fff',
                background: 'transparent',
                border: 0,
                outline: 0,
                caretColor: '#ffc53e'
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          onClick={!loading ? handleSubmit : undefined}
          disabled={loading}
          style={{
            WebkitTextSizeAdjust: 'none',
            textSizeAdjust: 'none',
            margin: '32px 0 0 0',
            padding: 0,
            boxSizing: 'border-box',
            fontFamily: 'PingFang SC',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%',
            height: '44px',
            borderRadius: '12px',
            background: '#ffc53e',
            boxShadow: 'inset 0 0 13px 0 rgba(255, 46, 0, 0.45098039215686275), 0 0 10px 0 rgba(255, 46, 0, 0.25098039215686274)',
            color: 'rgba(0, 0, 0, 0.8509803921568627)',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.3s ease'
          }}
        >
          {loading ? '提交中...' : '提交取款申请'}
        </button>
      </div>
          <div style={{ fontSize: '12px', padding: '20px' }}>
            <div>B77官方温馨提示：</div>
            <div style={{paddingLeft: '10px', color: '#ff4444'}}>
              <div style={{ fontWeight: 500, marginTop: '8px', color:'#fff' }}>USDT提现方式：</div>
              <div>填写平台余额后台自动按照USDT当天费率自动转账到你钱包地址，提现到账时间一般为10分钟内。</div>
              <div style={{marginTop: '8px',color: '#fff'}}>银行卡提现方式：</div>
              <div> 填写平台余额将自动转到你银行卡账户，提现到账时间一般为20分钟内。</div>
            </div>
            
          </div>
      </div>
    </div>
  );
}

