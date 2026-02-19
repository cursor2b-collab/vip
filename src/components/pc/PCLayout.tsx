import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PCSidebar from './PCSidebar';
import PCHeader from './PCHeader';
import PCFooter from './PCFooter';

/**
 * PC端主布局组件
 * 对应 k8_pc 的 Main.vue
 */
export default function PCLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, userInfo } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  // 切换侧边栏折叠状态
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 显示加载状态
  const showLoading = () => {
    setLoading(true);
  };

  // 隐藏加载状态
  const hideLoading = () => {
    setLoading(false);
  };

  // 导航到指定路径
  const goNav = (url: string) => {
    if (url === location.pathname) {
      if (url === '/') {
        return;
      }
      // 可以显示提示：已在当前页面
      return;
    }

    // 需要登录的页面检查
    if (url === '/accountSetting' && !isLoggedIn) {
      navigate('/login');
      return;
    }

    navigate(url);
  };

  return (
    <div 
      className="app-wrapper" 
      style={{ 
        minHeight: '100vh',
        backgroundColor: '#0C1017',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* PC端居中容器 - 参考样式 */}
      <div 
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          backgroundColor: '#0C1017',
          minHeight: '100vh',
          position: 'relative',
          display: 'flex'
        }}
      >
        {/* 左侧边栏 */}
        <PCSidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          currentPath={location.pathname}
          onNavigate={goNav}
          isLoggedIn={isLoggedIn}
        />

        {/* 主内容区域 */}
        <div
          className={`mainContentWrap ${sidebarCollapsed ? 'leftSliderMin' : 'leftSliderOpen'}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            marginLeft: sidebarCollapsed ? '80px' : '240px',
            transition: 'margin-left 0.3s ease',
            backgroundColor: '#0C1017',
            minHeight: '100vh'
          }}
        >
          {/* 头部 */}
          <PCHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          {/* 页面内容 */}
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#0C1017' }}>
            <Outlet />
          </div>

          {/* 底部 */}
          <PCFooter />
        </div>
      </div>

      {/* 加载遮罩 */}
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div className="loader">
            <span className="load-img">加载中...</span>
          </div>
        </div>
      )}
    </div>
  );
}

