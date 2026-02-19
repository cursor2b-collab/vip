/**
 * 免息借呗（信用支付）页面
 * 完全按照后端功能实现
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCreditRule, 
  searchCredit, 
  creditBorrow, 
  creditLend, 
  getCreditRecordList,
  CreditSearchResponse,
  CreditRecordListResponse
} from '@/lib/api/credit';

type PageType = 'index' | 'borrow' | 'lend' | 'record';

export default function CreditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  
  // 确定当前页面类型
  const getPageType = (): PageType => {
    if (location.pathname.includes('/Credit/Repay') || location.pathname.includes('/Credit/Lend')) {
      return 'lend';
    }
    if (location.pathname.includes('/Credit/Borrow')) {
      return 'borrow';
    }
    if (location.pathname.includes('/Credit/Record')) {
      return 'record';
    }
    return 'index';
  };

  const [pageType, setPageType] = useState<PageType>(getPageType());
  const [rule, setRule] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResult, setSearchResult] = useState<CreditSearchResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 借款表单
  const [borrowForm, setBorrowForm] = useState({
    name: '',
    realname: '',
    money: '',
    days: ''
  });
  
  // 还款表单
  const [lendForm, setLendForm] = useState({
    name: '',
    realname: '',
    money: ''
  });
  
  // 借还款记录
  const [recordList, setRecordList] = useState<CreditRecordListResponse | null>(null);
  const [recordPage, setRecordPage] = useState(1);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const newPageType = getPageType();
    setPageType(newPageType);
    
    if (newPageType === 'index') {
      loadRule();
    } else if (newPageType === 'record') {
      loadRecordList(1);
    }
  }, [location.pathname, isLoggedIn]);

  const loadRule = async () => {
    try {
      const res = await getCreditRule();
      if (res.code === 200) {
        setRule(res.data || {});
      }
    } catch (err) {
      console.error('加载规则失败:', err);
    }
  };

  const loadRecordList = async (page: number) => {
    setLoading(true);
    try {
      const res = await getCreditRecordList({ page, size: 5 });
      if (res.code === 200) {
        setRecordList(res);
        setRecordPage(page);
      }
    } catch (err) {
      console.error('加载记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 信用额度查询
  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      alert('请输入会员账号');
      return;
    }
    
    setLoading(true);
    try {
      const res = await searchCredit({ name: searchUsername, page: 1 });
      if (res.code === 200) {
        setSearchResult(res);
        setShowSearchModal(true);
        setCurrentPage(1);
      } else {
        alert('没有相关数据');
      }
    } catch (err: any) {
      alert(err.message || '查询失败');
    } finally {
      setLoading(false);
    }
  };

  // 分页查询
  const handleSearchPage = async (page: number) => {
    if (!searchUsername.trim()) return;
    
    setLoading(true);
    try {
      const res = await searchCredit({ name: searchUsername, page });
      if (res.code === 200) {
        setSearchResult(res);
        setCurrentPage(page);
      }
    } catch (err: any) {
      console.error('查询失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 提交借款
  const handleBorrow = async () => {
    if (!borrowForm.name || !borrowForm.realname || !borrowForm.money || !borrowForm.days) {
      alert('请填写完整信息');
      return;
    }
    
    setLoading(true);
    try {
      const res = await creditBorrow({
        name: borrowForm.name,
        realname: borrowForm.realname,
        money: parseFloat(borrowForm.money),
        days: parseInt(borrowForm.days)
      });
      
      if (res.code === 200) {
        alert(res.message || '借款申请提交成功');
        setBorrowForm({ name: '', realname: '', money: '', days: '' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert(res.message || '操作失败');
      }
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 提交还款
  const handleLend = async () => {
    if (!lendForm.name || !lendForm.realname || !lendForm.money) {
      alert('请填写完整信息');
      return;
    }
    
    setLoading(true);
    try {
      const res = await creditLend({
        name: lendForm.name,
        realname: lendForm.realname,
        money: parseFloat(lendForm.money)
      });
      
      if (res.code === 200) {
        alert(res.message || '还款申请提交成功');
        setLendForm({ name: '', realname: '', money: '' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert(res.message || '操作失败');
      }
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染分页组件
  const renderPagination = (totalPage: number, currentPage: number, onPageChange: (page: number) => void) => {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPage, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
        {currentPage > 1 && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            style={{
              padding: '8px 16px',
              background: '#ffc53e',
              border: 'none',
              borderRadius: '4px',
              color: '#000',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            上一页
          </button>
        )}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              padding: '8px 16px',
              background: page === currentPage ? '#ffc53e' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '4px',
              color: page === currentPage ? '#000' : '#fff',
              cursor: 'pointer',
              fontWeight: page === currentPage ? 'bold' : 'normal'
            }}
          >
            {page}
          </button>
        ))}
        {currentPage < totalPage && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            style={{
              padding: '8px 16px',
              background: '#ffc53e',
              border: 'none',
              borderRadius: '4px',
              color: '#000',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            下一页
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#151a23', 
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingBottom: '80px'
    }}>
      {/* PC端居中容器 */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
        minHeight: '100vh',
        background: '#151a23'
      }}>
        {/* 顶部横幅 - 单独的图片 */}
        <div style={{ width: '100%', margin: 0, padding: 0, lineHeight: 0, position: 'relative' }}>
        <img
          src="https://ik.imagekit.io/ixcx8adghm/public/icon/message_common_bg.png?updatedAt=1768998450112"
          alt="借呗"
          style={{ display: 'block', width: '100%', height: 'auto',marginTop: '150px', margin: 0, padding: 0 }}
        />
        
        {/* 返回按钮 - 浮在图片上方 */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(-1);
          }}
          style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            width: '40px',
            height: '40px'
          }}
        >
          <ChevronLeft className="w-6 h-6" style={{ color: '#fff' }} />
        </button>
      </div>

      {/* 页头背景图 + 导航菜单 */}
      <div style={{ width: '100%', marginTop: '-100vw', position: 'relative', overflow: 'hidden' }}>
        <img
          src="https://cy-747263170.imgix.net/header_bg.caff9723.png"
          alt="背景"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />

        {/* 导航菜单 - 叠加在背景图上 */}
        <div style={{
          position: 'absolute',
          bottom: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4vw 0',
          zIndex: 10,
          width: '100%',
          gap: '1vw'
        }}>
          <div
            onClick={() => navigate('/Credit/Index')}
            style={{
              padding: '2vw 3vw',
              fontSize: '3.5vw',
              color: pageType === 'index' ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.3s',
              zIndex: 20,
              whiteSpace: 'nowrap',
              fontWeight: pageType === 'index' ? 500 : 400,
              flexShrink: 0
            }}
          >
            信用规则
            {pageType === 'index' && (
              <div style={{
                position: 'absolute',
                bottom: '-2vw',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60vw',
                height: '6vw',
                backgroundImage: 'url(https://www.xpj00000.vip/indexImg/active.43ca0d4a.png)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                zIndex: -1,
                pointerEvents: 'none'
              }}></div>
            )}
          </div>
          <div
            onClick={() => navigate('/Credit/Record')}
            style={{
              padding: '2vw 3vw',
              fontSize: '3.5vw',
              color: pageType === 'record' ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.3s',
              zIndex: 20,
              whiteSpace: 'nowrap',
              fontWeight: pageType === 'record' ? 500 : 400,
              flexShrink: 0
            }}
          >
            借还款记录
            {pageType === 'record' && (
              <div style={{
                position: 'absolute',
                bottom: '-2vw',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60vw',
                height: '6vw',
                backgroundImage: 'url(https://www.xpj00000.vip/indexImg/active.43ca0d4a.png)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                zIndex: -1,
                pointerEvents: 'none'
              }}></div>
            )}
          </div>
          <div
            onClick={() => navigate('/Credit/Borrow')}
            style={{
              padding: '2vw 3vw',
              fontSize: '3.5vw',
              color: pageType === 'borrow' ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.3s',
              zIndex: 20,
              whiteSpace: 'nowrap',
              fontWeight: pageType === 'borrow' ? 500 : 400,
              flexShrink: 0
            }}
          >
            我要借款
            {pageType === 'borrow' && (
              <div style={{
                position: 'absolute',
                bottom: '-2vw',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60vw',
                height: '6vw',
                backgroundImage: 'url(https://www.xpj00000.vip/indexImg/active.43ca0d4a.png)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                zIndex: -1,
                pointerEvents: 'none'
              }}></div>
            )}
          </div>
          <div
            onClick={() => navigate('/Credit/Repay')}
            style={{
              padding: '2vw 3vw',
              fontSize: '3.5vw',
              color: pageType === 'lend' ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.3s',
              zIndex: 20,
              whiteSpace: 'nowrap',
              fontWeight: pageType === 'lend' ? 500 : 400,
              flexShrink: 0
            }}
          >
            我要还款
            {pageType === 'lend' && (
              <div style={{
                position: 'absolute',
                bottom: '-2vw',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60vw',
                height: '6vw',
                backgroundImage: 'url(https://www.xpj00000.vip/indexImg/active.43ca0d4a.png)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                zIndex: -1,
                pointerEvents: 'none'
              }}></div>
            )}
          </div>
        </div>
      </div>

      {/* 信用额度查询 */}
      <div style={{ 
        background: '#151a23', 
        padding: '10px 15px', 
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        marginTop: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="请输入会员账号"
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#ffc53e',
              border: 'none',
              borderRadius: '4px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            信用额度查询
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '20px 15px', position: 'relative', zIndex: 30 }}>
        {pageType === 'index' && (
          <div>
            {/* 活动详情 */}
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '15px', 
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffc53e' }}>活动详情</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc' }}>
                <p>即日起，凡是在本站的'电子、棋牌、捕鱼、真人'升级模式等级达到1级的会员，均可申请无利息借贷，0抵押，0担保！所借款的额度，直接添加至会员账号，可直接提款。可借款总额=电子信用额度+真人信用额度+信用借支。</p>
              </div>
            </div>

            {/* 信用规则 */}
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '15px', 
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffc53e' }}>信用规则</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#ccc' }}>
                <p>1.会员还清借款，1分钟后即可再次拥有可借款额度！</p>
                <p>2.会员'已借款'金额等于'最高借款'金额且尚未还款，则无法再次进行借款！</p>
                <p>3.会员若逾期未还款，则电子、棋牌、捕鱼升级模式周俸禄、月俸禄和真人升级模式月俸禄将不予派送，直至还清后正常派送。</p>
                <p>4.信用就是价值，价值就是金钱！未还清借款金额则会冻结账户，直至还清后解冻！</p>
                <p>5.会员借款时间：最长时间为30天，最短时间无限制！</p>
                <p>6.本站借呗保留最终解释权！</p>
              </div>
            </div>

            {/* 活动细则 */}
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '15px', 
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffc53e' }}>活动细则</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#ccc' }}>
                <p>1.借款总额=电子、棋牌、捕鱼信用额度+真人信用额度。</p>
                <p>2.电子、棋牌、捕鱼等级，由电子、棋牌、捕鱼有效投注决定，投注越多，等级越高。</p>
                <p>3.电子、棋牌、捕鱼信用额度，由电子棋牌升级模式决定，等级越高，信用额度就越高。</p>
                <p>4.真人等级，由真人视讯有效投注决定，投注越多，等级越高。</p>
                <p>5.真人信用额度，由真人升级模式决定，等级越高，信用额度就越高。</p>
                <p>6.本站免息借呗保留对活动的最终解释权，参与该优惠，即表示您同意遵守《优惠规则与条款》。</p>
              </div>
            </div>
          </div>
        )}

        {pageType === 'borrow' && (
          <div>
            {/* 活动详情 */}
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '15px', 
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffc53e' }}>活动详情</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc' }}>
                <p>提交成功2小时后请到<span style={{ color: '#f00' }}>"信用额度查询"</span>是否借款成功！若提示借款成功，请到澳门巴黎人登入会员账号是否成功加入，如果没有成功加款到会员账号上，请联系借呗在线客服处理！</p>
              </div>
            </div>

            {/* 我要借款表单 */}
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '15px', 
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#ffc53e' }}>我要借款</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>会员账号：</label>
                  <input
                    type="text"
                    value={borrowForm.name}
                    onChange={(e) => setBorrowForm({ ...borrowForm, name: e.target.value })}
                    placeholder="请填写会员账号"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>会员姓名：</label>
                  <input
                    type="text"
                    value={borrowForm.realname}
                    onChange={(e) => setBorrowForm({ ...borrowForm, realname: e.target.value })}
                    placeholder="请填写会员姓名"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>借款金额：</label>
                  <input
                    type="number"
                    value={borrowForm.money}
                    onChange={(e) => setBorrowForm({ ...borrowForm, money: e.target.value })}
                    placeholder="请填写借款金额"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>借款天数：</label>
                  <input
                    type="number"
                    value={borrowForm.days}
                    onChange={(e) => setBorrowForm({ ...borrowForm, days: e.target.value })}
                    placeholder="请填写借款天数"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  onClick={handleBorrow}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: loading ? 'rgba(255,197,62,0.5)' : '#ffc53e',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#000',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '10px'
                  }}
                >
                  {loading ? '提交中...' : '确认提交'}
                </button>
              </div>
              <p style={{ marginTop: '15px', fontSize: '12px', color: '#999' }}>
                注意：提交成功5分钟后请到"信用额度查询"是否借款成功！
              </p>
            </div>
          </div>
        )}

        {pageType === 'lend' && (
          <div>
            {/* 活动详情 */}
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '15px', 
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffc53e' }}>活动详情</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc' }}>
                <p>还款操作步骤：一、输入会员账号点击【查询欠款额度】查看需要还款的金额；二、点击<span style={{ color: '#f00' }}>【在线付款】</span>选择方便支付的通道进行付款；三、付款成功后回到该页面填写相关信息点击【确认提交】；四、提交成功2小时后，请到"信用额度查询"查询是否成功还款；五、成功还款1分钟后即可再次申请借款！</p>
              </div>
            </div>

            {/* 我要还款表单 */}
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '15px', 
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#ffc53e' }}>我要还款</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>会员账号：</label>
                  <input
                    type="text"
                    value={lendForm.name}
                    onChange={(e) => setLendForm({ ...lendForm, name: e.target.value })}
                    placeholder="请填写会员账号"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>会员姓名：</label>
                  <input
                    type="text"
                    value={lendForm.realname}
                    onChange={(e) => setLendForm({ ...lendForm, realname: e.target.value })}
                    placeholder="请填写会员姓名"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>还款金额：</label>
                  <input
                    type="number"
                    value={lendForm.money}
                    onChange={(e) => setLendForm({ ...lendForm, money: e.target.value })}
                    placeholder="请填写还款金额"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  onClick={handleLend}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: loading ? 'rgba(255,197,62,0.5)' : '#ffc53e',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#000',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '10px'
                  }}
                >
                  {loading ? '提交中...' : '确认提交'}
                </button>
              </div>
              <p style={{ marginTop: '15px', fontSize: '12px', color: '#999' }}>
                注意：请点击"在线付款"进行付款，付款完成再来提交！<br />
                提交成功5分钟，请到"信用额度查询"查询是否成功还款！
              </p>
            </div>
          </div>
        )}

        {pageType === 'record' && (
          <div>
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '15px', 
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffc53e' }}>借还款记录</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc', marginBottom: '15px' }}>
                <p>在澳门巴黎人免息借呗每一笔借还款记录将永久记录且永久累计，电子、棋牌、捕鱼等级和真人等级越高，可借款总额度就越高。</p>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
              ) : recordList && recordList.list ? (
                <>
                  <div 
                    dangerouslySetInnerHTML={{ __html: recordList.list }} 
                    style={{ overflowX: 'auto' }}
                  />
                  {recordList.page_count && recordList.page_count > 1 && renderPagination(
                    recordList.page_count,
                    recordPage,
                    (page) => loadRecordList(page)
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无数据</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 搜索弹窗 */}
      {showSearchModal && searchResult && (
        <>
          <div
            onClick={() => setShowSearchModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 9998
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '20px',
            zIndex: 9999,
            maxWidth: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0, color: '#ffc53e' }}>信用额度查询结果</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  lineHeight: '30px'
                }}
              >
                ×
              </button>
            </div>
            {searchResult.table && (
              <div 
                dangerouslySetInnerHTML={{ __html: searchResult.table }} 
                style={{ overflowX: 'auto' }}
              />
            )}
            {searchResult.pageNum && searchResult.pageNum > 1 && renderPagination(
              searchResult.pageNum,
              currentPage,
              handleSearchPage
            )}
          </div>
        </>
      )}

      {/* 底部版权 */}
      <div style={{ 
        padding: '15px', 
        textAlign: 'center', 
        background: '#151a23',
        color: '#999',
        fontSize: '12px'
      }}>
        Copyright © 本站 Reserved
      </div>
      </div>
    </div>
  );
}
