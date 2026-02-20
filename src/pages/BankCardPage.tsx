/**
 * 银行卡管理页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getBankList, getBankType, createBank, updateBank, deleteBank, Bank } from '@/lib/api/bank';
import { setDrawingPwd } from '@/lib/api/password';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BankCardPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankTypes, setBankTypes] = useState<any[]>([]);
  const [walletTypes, setWalletTypes] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSetPasswordStep, setShowSetPasswordStep] = useState(false);
  const [setPasswordForm, setSetPasswordForm] = useState({ qk_pwd: '', qk_pwd_confirmation: '' });
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: 'error' | 'success'; message: string }>({ show: false, type: 'success', message: '' });
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [formData, setFormData] = useState({
    bank_name: '',
    bank_no: '',
    bank_owner: '',
    bank_address: '',
    wallet_type: '', // 钱包类型：Omni、ERC20、TRC20
    qk_pwd: '' // 提款密码
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadData();
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.show, toast.message]);

  // useEffect(() => {
  //   if (formData.bank_name === 'USDT') {
  //     if(formData.bank_owner === '') {
  //       formData.bank_owner = userInfo.username || ''
  //       setFormData({ ...formData, bank_owner: userInfo.username || '' })
  //     }
  //   }else{
  //     // formData.bank_owner = ''
  //     // setFormData({ ...formData, bank_owner: '' })
  //   }
  // }, [formData]);
  

  const onBankNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // console.log('e.target.value',e.target.value);
    if(e.target.value === 'USDT' && formData.bank_owner === ''){
      // formData.bank_owner = userInfo.username || ''
      setFormData({ ...formData, bank_name: e.target.value, bank_owner: userInfo.username || '' })
    }else{
      setFormData({ ...formData, bank_name: e.target.value, bank_owner: '' });
    }
  };

  // 已绑定的账户类型（bank_type）
  const boundTypes = React.useMemo(() => new Set(banks.map(b => (b.bank_type || b.bank_name || '').toLowerCase())), [banks]);
  // 可添加的账户类型（排除已绑定的）
  const availableBankTypes = React.useMemo(() => 
    (Array.isArray(bankTypes) ? bankTypes : []).filter(t => !boundTypes.has((t.value || '').toLowerCase())),
    [bankTypes, boundTypes]
  );

  const loadData = async () => {
    try {
      const [banksRes, typesRes] = await Promise.all([
        getBankList(),
        getBankType()
      ]);
      if (banksRes.code === 200) setBanks(banksRes.data || []);
      if (typesRes.code === 200) {
        // 确保 bankTypes 始终是数组
        const bankTypeData = typesRes.data || [];
        if (Array.isArray(bankTypeData)) {
          setBankTypes(bankTypeData);
        } else if (typeof bankTypeData === 'object' && bankTypeData !== null) {
          // 如果是对象格式，转换为数组格式
          setBankTypes(Object.entries(bankTypeData).map(([value, label]) => ({ 
            value, 
            label: String(label) 
          })));
        } else {
          setBankTypes([]);
        }
        
        // 从接口响应中提取钱包类型（usdt 字段）
        if (typesRes.usdt && typeof typesRes.usdt === 'object') {
          // 将对象格式转换为数组格式
          // 例如: {omni: 'Omni', erc: 'ERC20', trc: 'TRC20'} => [{value: 'omni', label: 'Omni'}, ...]
          const walletTypeArray = Object.entries(typesRes.usdt).map(([value, label]) => ({
            value,
            label: String(label)
          }));
          setWalletTypes(walletTypeArray);
        } else {
          // 如果接口没有返回钱包类型，使用默认值
          setWalletTypes([
            { value: 'omni', label: 'Omni' },
            { value: 'erc', label: 'ERC20' },
            { value: 'trc', label: 'TRC20' }
          ]);
        }
      } else {
        setBankTypes([]);
        // 如果接口失败，使用默认值
        setWalletTypes([
          { value: 'omni', label: 'Omni' },
          { value: 'erc', label: 'ERC20' },
          { value: 'trc', label: 'TRC20' }
        ]);
      }
    } catch (err) {
      // 如果接口失败，使用默认值
      setBankTypes([]);
      setWalletTypes([
        { value: 'omni', label: 'Omni' },
        { value: 'erc', label: 'ERC20' },
        { value: 'trc', label: 'TRC20' }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.qk_pwd || formData.qk_pwd.length !== 6) {
      alert(t('enterWithdrawPassword6'));
      return;
    }
    try {
      // 转换字段名以匹配后端API
      const submitData = {
        bank_type: formData.bank_name,
        card_no: formData.bank_no,
        owner_name: formData.bank_owner,
        bank_address: formData.bank_address,
        wallet_type: formData.wallet_type,
        qk_pwd: formData.qk_pwd
      };
      
      let res;
      if (editingBank) {
        res = await updateBank({ ...submitData, id: editingBank.id });
      } else {
        res = await createBank(submitData);
      }
      if (res.code === 200) {
        alert(editingBank ? t('updateSuccess') : t('addSuccess'));
        setShowAddForm(false);
        setEditingBank(null);
        setFormData({ bank_name: '', bank_no: '', bank_owner: '', bank_address: '', wallet_type: '', qk_pwd: '' });
        loadData();
      } else {
        alert(res.message || t('operationFailed'));
      }
    } catch (err: any) {
      alert(err.message || t('operationFailed'));
    }
  };

  const handleSetPasswordAndContinue = async () => {
    if (!setPasswordForm.qk_pwd || setPasswordForm.qk_pwd.length !== 6) {
      setToast({ show: true, type: 'error', message: t('enterWithdrawPassword6') });
      return;
    }
    if (setPasswordForm.qk_pwd !== setPasswordForm.qk_pwd_confirmation) {
      setToast({ show: true, type: 'error', message: t('passwordMismatch') });
      return;
    }
    setSetPasswordLoading(true);
    try {
      const res = await setDrawingPwd({
        qk_pwd: setPasswordForm.qk_pwd,
        qk_pwd_confirmation: setPasswordForm.qk_pwd_confirmation
      });
      if (res.code === 200) {
        setShowSetPasswordStep(false);
        setSetPasswordForm({ qk_pwd: '', qk_pwd_confirmation: '' });
        setShowAddForm(true);
        setEditingBank(null);
        setFormData({ bank_name: '', bank_no: '', bank_owner: '', bank_address: '', wallet_type: '', qk_pwd: setPasswordForm.qk_pwd });
        setToast({ show: true, type: 'success', message: t('setSuccess') });
      } else {
        const msg = res.message || '';
        if (/已设置|已经设置/i.test(msg)) {
          setShowSetPasswordStep(false);
          setSetPasswordForm({ qk_pwd: '', qk_pwd_confirmation: '' });
          setShowAddForm(true);
          setEditingBank(null);
          setFormData({ bank_name: '', bank_no: '', bank_owner: '', bank_address: '', wallet_type: '', qk_pwd: '' });
          setToast({ show: true, type: 'success', message: t('setSuccess') });
        } else {
          setToast({ show: true, type: 'error', message: msg || t('setFailed') });
        }
      }
    } catch (err: any) {
      const isUnauth = err?.status === 401 || err?.error === 'Unauthenticated.';
      const msg = typeof err?.message === 'string' ? err.message : (err?.error || t('setFailed'));
      if (isUnauth) {
        // Supabase 登录时后端不认 JWT，无法调用设置提款密码接口；允许继续绑定银行卡
        setShowSetPasswordStep(false);
        setSetPasswordForm({ qk_pwd: '', qk_pwd_confirmation: '' });
        setShowAddForm(true);
        setEditingBank(null);
        setFormData({ bank_name: '', bank_no: '', bank_owner: '', bank_address: '', wallet_type: '', qk_pwd: '' });
        setToast({ show: true, type: 'error', message: t('drawingPwdApiUnauth') });
      } else {
        setToast({ show: true, type: 'error', message: msg });
      }
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeleteBankCard'))) return;
    try {
      const res = await deleteBank(id);
      if (res.code === 200) {
        alert(t('deleteSuccess'));
        loadData();
      } else {
        alert(res.message || t('deleteFailed'));
      }
    } catch (err: any) {
      alert(err.message || t('deleteFailed'));
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C1017', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>加载中...</span>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0C1017', 
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      {/* Toast 居中提示（与登录成功一致） */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            zIndex: 10001,
            boxSizing: 'border-box',
            minWidth: '160px',
            maxWidth: '280px',
            padding: '16px 20px 20px',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            background: 'rgba(0,0,0,0.85)',
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          <div style={{ width: '100%', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            <img src={toast.type === 'error' ? '/images/login/77.png' : '/images/login/66.png'} alt="" style={{ width: '44px', height: '35px', objectFit: 'contain' }} />
          </div>
          <p style={{ margin: 0, padding: '0 5px', fontSize: '14px', lineHeight: 1.5, textAlign: 'center' }}>
            {toast.message}
          </p>
        </div>
      )}

      {/* PC端居中容器 */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
        minHeight: '100vh',
        background: '#0C1017'
      }}>
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
        <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('bankCardTitle')}</h2>
      </div>

      {/* 先设置取款密码步骤 */}
      {showSetPasswordStep && (
        <>
          <div
            onClick={() => setShowSetPasswordStep(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              WebkitAnimation: 'fadeIn 0.3s ease',
              animation: 'fadeIn 0.3s ease'
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              ...(isDesktop ? { left: '50%', right: 'auto', width: '430px', maxWidth: '100%', transform: 'translateX(-50%)', WebkitTransform: 'translateX(-50%)' } : { left: 0, right: 0 }),
              background: '#1a1f2e',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              zIndex: 10000,
              maxHeight: '90vh',
              overflowY: 'auto',
              WebkitAnimation: 'slideUp 0.3s ease',
              animation: 'slideUp 0.3s ease'
            }}
          >
            <div style={{
              background: '#1a1f2e',
              padding: '20px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>
                {t('setWithdrawPassword')}
              </h2>
            </div>
            <div style={{ padding: '20px', background: '#1a1f2e' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                  {t('enterWithdrawPassword6')}
                </label>
                <input
                  type="password"
                  value={setPasswordForm.qk_pwd}
                  onChange={(e) => setSetPasswordForm({ ...setPasswordForm, qk_pwd: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder={t('enterWithdrawPassword6')}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(199, 218, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                  {t('confirmWithdrawPassword')}
                </label>
                <input
                  type="password"
                  value={setPasswordForm.qk_pwd_confirmation}
                  onChange={(e) => setSetPasswordForm({ ...setPasswordForm, qk_pwd_confirmation: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder={t('enterWithdrawPassword6')}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(199, 218, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button
                  onClick={() => setShowSetPasswordStep(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSetPasswordAndContinue}
                  disabled={setPasswordLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#ffc53e',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: setPasswordLoading ? 'not-allowed' : 'pointer',
                    boxShadow: 'inset 0 0 13px 0 rgba(255, 46, 0, 0.45), 0 0 10px 0 rgba(255, 46, 0, 0.25)'
                  }}
                >
                  {setPasswordLoading ? t('loading') : t('setWithdrawPasswordBtn')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 底部抽屉表单 */}
      {showAddForm && (
        <>
          {/* 遮罩层 */}
          <div
            onClick={() => {
              setShowAddForm(false);
              setEditingBank(null);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              WebkitAnimation: 'fadeIn 0.3s ease',
              animation: 'fadeIn 0.3s ease'
            }}
          />
          {/* 抽屉内容 */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              ...(isDesktop ? { left: '50%', right: 'auto', width: '430px', maxWidth: '100%', transform: 'translateX(-50%) translateY(0)', WebkitTransform: 'translateX(-50%) translateY(0)' } : { left: 0, right: 0 }),
              background: '#1a1f2e',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              zIndex: 10000,
              maxHeight: '90vh',
              overflowY: 'auto',
              WebkitAnimation: 'slideUp 0.3s ease',
              animation: 'slideUp 0.3s ease',
              ...(!isDesktop && { WebkitTransform: 'translateY(0)', transform: 'translateY(0)' })
            }}
          >
            {/* 深色头部 */}
            <div style={{
              background: '#1a1f2e',
              padding: '20px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>
                {t('bankCardChange')}
              </h2>
            </div>

            {/* 表单内容 */}
            <div style={{ padding: '20px', background: '#1a1f2e' }}>
              {/* 开户银行 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                  {t('bankName')}:
                </label>
                <select
                  value={formData.bank_name}
                  onChange={onBankNameChange}
                  title={t('selectBankName')}
                  disabled={availableBankTypes.length === 0}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23fff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '12px 12px',
                    border: '1px solid rgba(199, 218, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                >
                  <option value="">{availableBankTypes.length === 0 ? t('bankTypeAlreadyBind') : t('pleaseSelectBank')}</option>
                  {availableBankTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* 开户人姓名 */}
              {formData.bank_name && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                    {formData.bank_name=="USDT"? t('ownerName2') : t('ownerName')}:
                  </label>
                  <input
                    type="text"
                    value={formData.bank_owner}
                    onChange={(e) => setFormData({ ...formData, bank_owner: e.target.value })}
                    disabled={formData.bank_name=="USDT"}
                    placeholder={formData.bank_name=="USDT"? t('enterOwnerName2') : t('enterOwnerName')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(199, 218, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
              
                {/* 钱包地址 / 银行账号 */}
              {formData.bank_name && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                    {formData.bank_name && Array.isArray(bankTypes) && (bankTypes.find(t => t.value === formData.bank_name)?.label?.includes('USDT') || bankTypes.find(t => t.value === formData.bank_name)?.label?.includes('虚拟')) ? t('walletAddress') : t('bankAccount')}
                  </label>
                  <input
                    type="text"
                    value={formData.bank_no}
                    onChange={(e) => setFormData({ ...formData, bank_no: e.target.value })}
                    placeholder={formData.bank_name && Array.isArray(bankTypes) && (bankTypes.find(t => t.value === formData.bank_name)?.label?.includes('USDT') || bankTypes.find(t => t.value === formData.bank_name)?.label?.includes('虚拟')) ? t('enterWalletAddress') : t('enterBankAccount')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(199, 218, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* 钱包类型（仅当选择USDT虚拟货币时显示） */}
              {(formData.bank_name && Array.isArray(bankTypes) && (bankTypes.find(t => t.value === formData.bank_name)?.label?.includes('USDT') || bankTypes.find(t => t.value === formData.bank_name)?.label?.includes('虚拟'))) && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                    {t('walletType')}
                  </label>
                  <select
                    value={formData.wallet_type}
                    onChange={(e) => setFormData({ ...formData, wallet_type: e.target.value })}
                    title={t('walletType')}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23fff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '12px 12px',
                      border: '1px solid rgba(199, 218, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    <option value="">{t('pleaseSelectWalletType')}</option>
                    {Array.isArray(walletTypes) && walletTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 开户行（仅当选择普通银行时显示） */}
              {formData.bank_name && Array.isArray(bankTypes) && !(bankTypes.find(t => t.value === formData.bank_name)?.label?.includes('USDT') || bankTypes.find(t => t.value === formData.bank_name)?.label?.includes('虚拟')) && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                    {t('bankBranch')}
                  </label>
                  <input
                    type="text"
                    value={formData.bank_address}
                    onChange={(e) => setFormData({ ...formData, bank_address: e.target.value })}
                    placeholder={t('enterBankBranch')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(199, 218, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* 输入交易密码（注册时已设置，此处仅验证） */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                  {t('withdrawPassword')}
                </label>
                <input
                  type="password"
                  value={formData.qk_pwd}
                  onChange={(e) => setFormData({ ...formData, qk_pwd: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder={t('enterWithdrawPassword6')}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(199, 218, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 按钮 */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingBank(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#ffc53e',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: 'inset 0 0 13px 0 rgba(255, 46, 0, 0.45), 0 0 10px 0 rgba(255, 46, 0, 0.25)'
                  }}
                >
                  {t('submit')}
                </button>
              </div>
            </div>
          </div>

          {/* 添加动画样式 */}
          <style>{`
            @-webkit-keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @-webkit-keyframes slideUp {
              from { -webkit-transform: translateY(100%); transform: translateY(100%); }
              to { -webkit-transform: translateY(0); transform: translateY(0); }
            }
            @keyframes slideUp {
              from { -webkit-transform: translateY(100%); transform: translateY(100%); }
              to { -webkit-transform: translateY(0); transform: translateY(0); }
            }
            /* 深色主题输入框 placeholder 样式 */
            input::placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
            input::-webkit-input-placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
            input::-moz-placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
            input:-ms-input-placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
            /* 深色主题下拉框选项样式 */
            select {
              color: #fff !important;
              background-color: rgba(0, 0, 0, 0.45) !important;
            }
            select option {
              background: #1a1f2e !important;
              color: #fff !important;
              padding: 10px;
            }
            select:focus {
              outline: none;
              border-color: #ffc53e;
              background-color: rgba(0, 0, 0, 0.45) !important;
            }
            select:focus option {
              background: #1a1f2e !important;
              color: #fff !important;
            }
            /* 移除浏览器默认的下拉箭头和背景 */
            select::-ms-expand {
              display: none;
            }
            select {
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
            }
          `}</style>
        </>
      )}

      <div style={{ padding: '20px' }}>
        {banks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>{t('noBankCard')}</div>
        ) : (
          banks.map(bank => {
            // 判断是否为虚拟货币
            const isVirtual = bank.bank_name && (bank.bank_name.includes('USDT') || bank.bank_name.includes('虚拟'));
            const displayNo = bank.bank_no || bank.card_no || '';
            const displayName = bank.bank_name || bank.bank_type || '';
            
            // 隐藏卡号/地址中间部分，只显示前后几位
            const maskCardNo = (cardNo: string) => {
              if (!cardNo) return '';
              if (cardNo.length <= 8) {
                // 如果长度小于等于8，只显示前2位和后2位
                return cardNo.substring(0, 2) + '*'.repeat(cardNo.length - 4) + cardNo.substring(cardNo.length - 2);
              } else {
                // 显示前4位和后4位，中间用*代替
                return cardNo.substring(0, 4) + '*'.repeat(cardNo.length - 8) + cardNo.substring(cardNo.length - 4);
              }
            };
            
            return (
              <div
                key={bank.id}
                style={{
                  background: isVirtual
                    ? `url('/images/newimg/usdt.avif') center/contain no-repeat, rgba(255, 255, 255, 0.05)`
                    : `url('/images/bitoll_bg.6e2b6b5f.png') center/cover no-repeat`,
                  borderRadius: '12px',
                  padding: '25px 20px',
                  marginBottom: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '120px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {/* 银行名称 */}
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    {displayName}
                  </div>
                  
                  {/* 卡号/钱包地址 */}
                  <div style={{
                    fontSize: '16px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                  }}>
                    {isVirtual ? t('address') + '：' : t('cardNumber') + '：'} {maskCardNo(displayNo)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 添加银行卡按钮 */}
      <div style={{ padding: '0 20px 20px', marginTop: '0' }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowAddForm(true);
            setEditingBank(null);
            setFormData({ bank_name: '', bank_no: '', bank_owner: '', bank_address: '', wallet_type: '', qk_pwd: '' });
          }}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {t('addBankCard')}
        </button>
      </div>
      </div>
    </div>
  );
}

