import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { setGameNavigation } from './utils/gameUtils';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { getSystemConfig } from './lib/api/system';
import { Header } from './components/Header';
import { LoaderHome } from './components/LoaderHome';
import { BannerCarousel } from './components/BannerCarousel';
import { JackpotNews } from './components/JackpotNews';
import { NoticePopup } from './components/NoticePopup';
import { NavigationTabs } from './components/NavigationTabs';
import { ProfitLeaderboard } from './components/ProfitLeaderboard';
import { Footer } from './components/Footer';
import { DepositPage } from './components/DepositPage';
import BottomNavigation from './components/BottomNavigation';
import { CenteredBottomNav } from './components/CenteredBottomNav';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterSuccessPage from './pages/RegisterSuccessPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UserCenterPage from './pages/UserCenterPage';
import PromotionsListPage from './pages/PromotionsListPage';
import PromotionDetailPage from './pages/PromotionDetailPage';
import ThreeGiftsPage from './pages/ThreeGiftsPage';
import ServicePage from './pages/ServicePage';
import TestPage from './pages/TestPage';
import WithdrawPage from './pages/WithdrawPage';
import AboutPage from './pages/AboutPage';
import TutorialPage from './pages/TutorialPage';
import AppDownloadPage from './pages/AppDownloadPage';
import MoneyLogPage from './pages/MoneyLogPage';
import GameRecordPage from './pages/GameRecordPage';
import BankCardPage from './pages/BankCardPage';
import CreditPage from './pages/CreditPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import TeamPage from './pages/TeamPage';
import MessagePage from './pages/MessagePage';
import AccountSecurityPage from './pages/AccountSecurityPage';
import BalancePage from './pages/BalancePage';
import FavoritesPage from './pages/FavoritesPage';
import RebatePage from './pages/RebatePage';
import GamePage from './pages/GamePage';
import DepositOrderDetailPage from './pages/DepositOrderDetailPage';
import VipDetailPage from './pages/VipDetailPage';
import { GameLobbyPage } from './pages/GameLobbyPage';
import TelegramGamePage from './pages/TelegramGamePage';
import { supabase, USE_SUPABASE_AUTH } from './lib/supabase';
import { LiveCasinoPage } from './pages/LiveCasinoPage';
import PCLayout from './components/pc/PCLayout';
import PCIndexPage from './pages/pc/PCIndexPage';
import MobileLayout from './components/MobileLayout';

// 首页组件 - 固定 Header + 固定底部导航 + 仅内容区滚动
function HomePage() {
  return (
    <MobileLayout
      header={<Header />}
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      {/* 首页公告弹窗：每个用户单日首次访问显示，关闭后今日不再显示 */}
      <NoticePopup />
      <BannerCarousel />
      <JackpotNews />
      <NavigationTabs />
      <ProfitLeaderboard />
      <Footer />
    </MobileLayout>
  );
}

// 存款页面布局
function DepositPageLayout() {
  const navigate = useNavigate();
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/profile');
    }
  };
  return (
    <MobileLayout
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <DepositPage onBack={handleBack} />
      <Footer />
    </MobileLayout>
  );
}

// 个人中心页面布局
function ProfilePageLayout() {
  return (
    <MobileLayout
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <UserCenterPage />
    </MobileLayout>
  );
}

// 优惠活动列表布局
function PromotionsPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <PromotionsListPage />
    </MobileLayout>
  );
}

// 优惠活动详情布局
function PromotionDetailPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <PromotionDetailPage />
    </MobileLayout>
  );
}

function ThreeGiftsPageLayout() {
  return (
    <MobileLayout backgroundColor="#151A23">
      <ThreeGiftsPage />
    </MobileLayout>
  );
}

// 客服页面布局
function ServicePageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <ServicePage />
    </MobileLayout>
  );
}

// 登录页面布局 - 固定头+底+可滚动内容，与 MobileLayout 一致
function LoginPageLayout() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#151A23',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <LoginPage />
        </div>
      </div>
    </div>
  );
}

// 注册页面布局 - 与登录页保持一致
function RegisterPageLayout() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#151A23',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <RegisterPage />
        </div>
      </div>
    </div>
  );
}

// 注册成功页布局 - PC 端居中手机尺寸，与登录/注册页一致
function RegisterSuccessPageLayout() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#151A23',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <RegisterSuccessPage />
        </div>
      </div>
    </div>
  );
}

// 忘记账号/密码页布局 - PC 端居中手机尺寸
function ForgotPasswordPageLayout() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#151A23',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <ForgotPasswordPage />
        </div>
      </div>
    </div>
  );
}

// 借款页面布局
function CreditPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <CreditPage />
    </MobileLayout>
  );
}

// 提现页面布局
function WithdrawPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <WithdrawPage />
    </MobileLayout>
  );
}

// 关于我们页面布局
function AboutPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <AboutPage />
    </MobileLayout>
  );
}

// 教程页面布局
function TutorialPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <TutorialPage />
    </MobileLayout>
  );
}

// APP下载页面布局
function AppDownloadPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <AppDownloadPage />
    </MobileLayout>
  );
}

// 资产记录页面布局
function MoneyLogPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <MoneyLogPage />
    </MobileLayout>
  );
}

// 游戏记录页面布局
function GameRecordPageLayout() {
  return (
    <MobileLayout
      backgroundColor="#151A23"
      bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}
    >
      <GameRecordPage />
    </MobileLayout>
  );
}

// 处理从 URL 传入的 token（用于 Telegram 等外部分发登录链接）
// 支持 tgWebAppStartParam 格式：/?tgWebAppStartParam=base64({token,tg,path,modal,languageCode})
// 注意：/telegram-game?token=xxx 的 token 是一次性 Telegram 登录凭证，必须由 TelegramGamePage 消费，此处不能处理
function useTokenFromUrl() {
  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tgWebAppStartParam = params.get('tgWebAppStartParam');
    if (tgWebAppStartParam) {
      try {
        const decoded = decodeURIComponent(escape(atob(tgWebAppStartParam)));
        const obj = JSON.parse(decoded) as { token?: string; tg?: string };
        if (obj.token || obj.tg) {
          const q = obj.token ? `token=${obj.token}` : `tg=${obj.tg}`;
          navigate(`/telegram-game?${q}`, { replace: true });
          return;
        }
      } catch (e) {
        console.warn('解析 tgWebAppStartParam 失败', e);
      }
    }
    // /telegram-game 的 ?token= 或 ?tg= 是给 TelegramGamePage 用的，不能当作 auth token 存储或移除
    if (location.pathname === '/telegram-game') return;
    let token = params.get('token');
    if (!token && location.hash) {
      const hashStr = location.hash.replace(/^#/, '').replace(/^\?/, '');
      const hashParams = new URLSearchParams(hashStr);
      token = hashParams.get('token') || hashParams.get('access_token');
      // Supabase 魔术链接重定向后，显式建立会话，确保在 API 调用前 session 已就绪
      if (USE_SUPABASE_AUTH && token) {
        const refreshToken = hashParams.get('refresh_token');
        if (refreshToken) {
          supabase.auth.setSession({ access_token: token, refresh_token: refreshToken }).catch((e) => console.warn('setSession 失败', e));
        }
      }
    }
    if (token && token.length > 10) {
      try {
        sessionStorage.setItem('token', token);
        localStorage.setItem('token', token);
        params.delete('token');
        const newSearch = params.toString();
        const newUrl = location.pathname + (newSearch ? '?' + newSearch : '') + (location.hash || '');
        window.history.replaceState({}, '', newUrl);
        window.dispatchEvent(new Event('authStateChange'));
      } catch (e) {
        console.warn('保存 URL token 失败', e);
      }
    }
  }, [location.pathname, location.search, location.hash]);
}

// 内部组件：设置游戏导航函数
function AppRoutes() {
  const navigate = useNavigate();
  useTokenFromUrl();

  // 设置全局导航函数，供 openGame 使用
  React.useEffect(() => {
    // console.log('✅ AppRoutes: 设置全局导航函数');
    setGameNavigation((path: string) => {
      // console.log('✅ AppRoutes: 导航到:', path);
      navigate(path);
    });
  }, [navigate]);

  // 获取系统配置并设置网站标题
  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const res = await getSystemConfig('system');
        if (res.code === 200 && res.data) {
          const siteName = res.data.site_name || res.data.site_title || 'B77';
          document.title = siteName;
          // console.log('✅ 网站标题已设置为:', siteName);
        }
      } catch (error) {
        console.error('❌ 获取网站名称失败:', error);
      }
    };
    fetchSiteName();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPageLayout />} />
      <Route path="/login/forgot" element={<ForgotPasswordPageLayout />} />
      <Route path="/register" element={<RegisterPageLayout />} />
      <Route path="/register/success" element={<RegisterSuccessPageLayout />} />
      <Route path="/deposit" element={<DepositPageLayout />} />
      <Route path="/deposit/order-detail" element={<MobileLayout backgroundColor="#151A23" bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}><DepositOrderDetailPage /></MobileLayout>} />
      <Route path="/profile" element={<ProfilePageLayout />} />
      <Route path="/promotions" element={<PromotionsPageLayout />} />
      <Route path="/promotions/threegifts" element={<ThreeGiftsPageLayout />} />
      <Route path="/promotions/:id" element={<PromotionDetailPageLayout />} />
      <Route path="/service" element={<ServicePageLayout />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/withdraw" element={<WithdrawPageLayout />} />
      <Route path="/about" element={<AboutPageLayout />} />
      <Route path="/tutorial" element={<TutorialPageLayout />} />
      <Route path="/appDownload" element={<AppDownloadPageLayout />} />
      <Route path="/assets" element={<MoneyLogPageLayout />} />
      <Route path="/game-record" element={<GameRecordPageLayout />} />
      <Route path="/bankcard" element={<BankCardPage />} />
      <Route path="/borrow" element={<CreditPageLayout />} />
      <Route path="/Credit/Index" element={<CreditPageLayout />} />
      <Route path="/Credit/Record" element={<CreditPageLayout />} />
      <Route path="/Credit/Borrow" element={<CreditPageLayout />} />
      <Route path="/Credit/Repay" element={<CreditPageLayout />} />
      <Route path="/profile-detail" element={<ProfileDetailPage />} />
      <Route path="/promotion" element={<TeamPage />} />
      <Route path="/message" element={<MessagePage />} />
      <Route path="/account" element={<AccountSecurityPage />} />
      <Route path="/balance" element={<BalancePage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/rebate" element={<MobileLayout backgroundColor="#0C1017" bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}><RebatePage /></MobileLayout>} />
      <Route path="/gamelobby" element={<MobileLayout backgroundColor="#0f1419" bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}><GameLobbyPage /></MobileLayout>} />
      <Route path="/livecasino" element={<MobileLayout backgroundColor="#0f1419" bottomNav={<CenteredBottomNav><BottomNavigation /></CenteredBottomNav>}><LiveCasinoPage /></MobileLayout>} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/vip" element={<MobileLayout backgroundColor="#0C1017"><VipDetailPage /></MobileLayout>} />
      <Route path="/telegram-game" element={<TelegramGamePage />} />
      
      {/* PC端路由 */}
      <Route path="/pc" element={<PCLayout />}>
        <Route index element={<PCIndexPage />} />
        <Route path="realPerson" element={<div>真人游戏页面（待实现）</div>} />
        <Route path="electronics" element={<div>电游页面（待实现）</div>} />
        <Route path="sports" element={<div>体育页面（待实现）</div>} />
        <Route path="eSports" element={<div>电竞页面（待实现）</div>} />
        <Route path="lottery" element={<div>彩票页面（待实现）</div>} />
        <Route path="cards" element={<div>棋牌页面（待实现）</div>} />
        <Route path="discount" element={<div>优惠活动页面（待实现）</div>} />
        <Route path="accountSetting" element={<UserCenterPage />} />
        <Route path="vip" element={<VipDetailPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <GameProvider>
          <BrowserRouter>
            {/* 启动屏：根层级 + 最高 z-index，覆盖页头页脚 */}
            <LoaderHome />
            <AppRoutes />
          </BrowserRouter>
        </GameProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}