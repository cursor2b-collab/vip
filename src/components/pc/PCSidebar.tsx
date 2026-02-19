import React from 'react';

interface PCSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  isLoggedIn: boolean;
}

/**
 * PC端侧边栏组件
 * 对应 k8_pc Main.vue 中的左侧导航栏
 */
export default function PCSidebar({
  collapsed,
  onToggle,
  currentPath,
  onNavigate,
  isLoggedIn
}: PCSidebarProps) {
  // 导航菜单项
  const menuItems = [
    { path: '/pc', label: '首页', icon: 'iconHome' },
    { path: '/pc/realPerson', label: '真人', icon: 'iconLive' },
    { path: '/pc/electronics', label: '电游', icon: 'iconGames' },
    { path: '/pc/sports', label: '体育', icon: 'iconSports' },
    { path: '/pc/eSports', label: '电竞', icon: 'iconGames' },
    { path: '/pc/lottery', label: '彩票', icon: 'iconLottery' },
    { path: '/pc/cards', label: '棋牌', icon: 'iconCards' }
  ];

  const discountItem = { path: '/pc/discount', label: '最新优惠', icon: 'iconGifts' };

  const userItems = [
    { path: '/pc/accountSetting', label: '会员中心', icon: 'iconUser', requireAuth: true },
    { path: '/pc/vip', label: 'VIP俱乐部', icon: 'iconVip', requireAuth: true }
  ];

  // 处理代理登录
  const handleAgentLogin = () => {
    const pathInfo = `/game?dailiD=1`;
    window.open(pathInfo, '_blank');
  };

  return (
    <div
      className={`leftSliderBarWrap ${collapsed ? 'min' : ''}`}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: collapsed ? '80px' : '240px',
        background: '#1a1a1a',
        transition: 'width 0.3s ease',
        zIndex: 1000,
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className={`leftSliderBar ${collapsed ? 'leftSliderMinBar' : ''}`}>
        <a className="toggle" onClick={onToggle} style={{ cursor: 'pointer', padding: '10px', color: '#fff' }}>
          <span>{collapsed ? '☰' : '✕'}</span>
        </a>

        {!collapsed && (
          <div className="defaultState">
            <div className="top" onClick={() => onNavigate('/pc')} style={{ cursor: 'pointer', padding: '20px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffcb4c' }}>LOGO</div>
            </div>
            <div className="c">
              <div className="navigation">
                <ul className="group1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {menuItems.map((item) => (
                    <li
                      key={item.path}
                      onClick={() => onNavigate(item.path)}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        color: currentPath === item.path ? '#ffcb4c' : '#fff',
                        background: currentPath === item.path ? 'rgba(255, 203, 76, 0.1)' : 'transparent',
                        borderLeft: currentPath === item.path ? '3px solid #ffcb4c' : '3px solid transparent'
                      }}
                    >
                      <span style={{ marginRight: '10px' }}>📱</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="separator" style={{ height: '1px', background: '#333', margin: '10px 0' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li
                    onClick={() => onNavigate(discountItem.path)}
                    style={{
                      padding: '12px 20px',
                      cursor: 'pointer',
                      color: currentPath === discountItem.path ? '#ffcb4c' : '#fff',
                      background: currentPath === discountItem.path ? 'rgba(255, 203, 76, 0.1)' : 'transparent',
                      borderLeft: currentPath === discountItem.path ? '3px solid #ffcb4c' : '3px solid transparent'
                    }}
                  >
                    <span style={{ marginRight: '10px' }}>🎁</span>
                    <span>{discountItem.label}</span>
                  </li>
                </ul>

                <div className="separator" style={{ height: '1px', background: '#333', margin: '10px 0' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {userItems.map((item) => {
                    if (item.requireAuth && !isLoggedIn) {
                      return null;
                    }
                    return (
                      <li
                        key={item.path}
                        onClick={() => onNavigate(item.path)}
                        style={{
                          padding: '12px 20px',
                          cursor: 'pointer',
                          color: currentPath === item.path ? '#ffcb4c' : '#fff',
                          background: currentPath === item.path ? 'rgba(255, 203, 76, 0.1)' : 'transparent',
                          borderLeft: currentPath === item.path ? '3px solid #ffcb4c' : '3px solid transparent'
                        }}
                      >
                        <span style={{ marginRight: '10px' }}>👤</span>
                        <span>{item.label}</span>
                      </li>
                    );
                  })}
                  <li
                    onClick={handleAgentLogin}
                    style={{
                      padding: '12px 20px',
                      cursor: 'pointer',
                      color: '#fff'
                    }}
                  >
                    <span style={{ marginRight: '10px' }}>⭐</span>
                    <span>代理登录</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="minState">
            <div className="top" onClick={() => onNavigate('/pc')} style={{ cursor: 'pointer', padding: '10px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffcb4c' }}>L</div>
            </div>
            <div className="c">
              <div className="navigation">
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {menuItems.map((item) => (
                    <li
                      key={item.path}
                      onClick={() => onNavigate(item.path)}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: currentPath === item.path ? '#ffcb4c' : '#fff'
                      }}
                      title={item.label}
                    >
                      📱
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

