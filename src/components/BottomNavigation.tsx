'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  key: string;
  labelKey: string;
  icon: string;
  iconActive: string;
  route: string;
}

interface BottomNavigationProps {
  onNavigate?: (tab: string) => void;
}

const navItemsConfig: Omit<NavItem, 'labelKey'>[] = [
  {
    key: 'home',
    icon: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_home.8096b1f5.png',
    iconActive: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_home.8096b1f5.png',
    route: '/',
  },
  {
    key: 'promo',
    icon: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_promo.d4db9c6b.png',
    iconActive: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_promo.d4db9c6b.png',
    route: '/promotions',
  },
  {
    key: 'deposit',
    icon: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_deposit.ef02e061.png',
    iconActive: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_deposit.ef02e061.png',
    route: '/deposit',
  },
  {
    key: 'service',
    icon: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_service.d449bd93.png',
    iconActive: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_service.d449bd93.png',
    route: '/service',
  },
  {
    key: 'user',
    icon: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_user.7aff2ee1.png',
    iconActive: 'https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_user.7aff2ee1.png',
    route: '/profile',
  },
];

const labelKeyMap: Record<string, string> = {
  'home': 'navHome',
  'promo': 'navPromo',
  'deposit': 'navDeposit',
  'service': 'navService',
  'user': 'navUser',
};

const BottomNavigation: React.FC<BottomNavigationProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState('home');

  const navItems: NavItem[] = navItemsConfig.map(item => ({
    ...item,
    labelKey: labelKeyMap[item.key] || item.key,
  }));

  // 根据当前路径更新 tab
  useEffect(() => {
    const path = location.pathname;
    const tabMap: Record<string, string> = {
      '/': 'home',
      '/promotions': 'promo',
      '/deposit': 'deposit',
      '/service': 'service',
      '/user': 'user',
      '/profile': 'user',
    };

    const activeTab = tabMap[path] || 'home';
    setCurrentTab(activeTab);
  }, [location.pathname]);

  const handleNavigate = (tab: string, route: string) => {
    setCurrentTab(tab);
    if (onNavigate) {
      onNavigate(tab);
    }
    navigate(route);
  };

  const getIndicatorStyle = () => {
    const positions: Record<string, string> = {
      home: '10%',
      promo: '30%',
      deposit: '50%',
      service: '70%',
      user: '90%',
    };

    return {
      left: positions[currentTab],
      transform: 'translateX(-50%)',
    };
  };

  return (
    <div className="bottom-nav-container">
      <div className="nav-indicator" style={getIndicatorStyle()}></div>
      <div className="center-bg"></div>
      <ul className="nav-list">
        {navItems.map((item) => (
          <li
            key={item.key}
            className={`nav-item ${item.key === 'deposit' ? 'center-item' : ''} ${
              currentTab === item.key ? 'active' : ''
            }`}
            onClick={() => handleNavigate(item.key, item.route)}
          >
            {item.key === 'deposit' ? (
              <>
                <img
                  className={`deposit-icon ${currentTab === item.key ? 'hidden' : ''}`}
                  src={item.icon}
                  alt={t(item.labelKey)}
                />
                <img
                  className={`deposit-icon-active ${currentTab !== item.key ? 'hidden' : ''}`}
                  src={item.iconActive}
                  alt={t(item.labelKey)}
                />
                <span className="deposit-text">{t(item.labelKey)}</span>
              </>
            ) : (
              <>
                <img
                  className="nav-icon"
                  src={currentTab === item.key ? item.iconActive : item.icon}
                  alt={t(item.labelKey)}
                />
                <span>{t(item.labelKey)}</span>
              </>
            )}
          </li>
        ))}
      </ul>

      <style>{`
        .bottom-nav-container {
          box-sizing: border-box;
          width: 100%;
          height: 65px;
          margin: 0;
          padding: 0;
          position: relative;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .nav-indicator {
          box-sizing: border-box;
          width: 60px;
          height: 30px;
          background: url(https://91a2c0front-wc.ywv2m.com/cdn/91a2c0FM/static/img/tab_active.d9d81611.png)
            0 0/100% 100% no-repeat;
          background-size: 100% 100%;
          transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: absolute;
          z-index: 1;
          left: 0;
          top: 0;
          margin: 0;
          padding: 0;
          will-change: left;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .center-bg {
          box-sizing: border-box;
          width: 67px;
          height: 17px;
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
          margin: 0;
          padding: 0;
          background: url(https://34.96.146.219:9300/cdn/91a2c0FM/static/img/bg_center.7e565dea.png)
            0 0/100% no-repeat;
          background-size: 100% 100%;
        }

        .nav-list {
          display: flex;
          flex-direction: row;
          height: 65px;
          z-index: 3;
          justify-content: space-around;
          align-items: center;
          position: relative;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .nav-item {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          flex-direction: column;
          flex: 1;
          text-align: center;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.35);
          margin: 0;
          padding: 0;
          cursor: pointer;
          transition: color 0.3s ease;
          -webkit-tap-highlight-color: transparent;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .nav-item.active {
          color: #ffcb4c;
          font-weight: 600;
        }

        .nav-icon {
          width: 26px;
          height: 26px;
          margin: 0 0 4px 0;
          padding: 0;
          display: block;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .nav-item:not(.center-item):active .nav-icon {
          transform: scale(0.85);
          opacity: 0.7;
        }

        @keyframes iconBounce {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.85);
          }
          100% {
            transform: scale(1);
          }
        }

        .nav-item:not(.center-item):active {
          animation: iconBounce 0.3s ease;
        }

        .center-item {
          margin-top: 0;
          position: relative;
        }

        .deposit-icon,
        .deposit-icon-active {
          width: 67px;
          height: 50px;
          margin-top: -40%;
          margin-bottom: 0;
          margin-left: 0;
          margin-right: 0;
          padding: 0;
          display: block;
        }

        .deposit-icon-active.hidden {
          display: none;
        }

        .deposit-icon.hidden {
          display: none;
        }

        .deposit-icon-active:not(.hidden) {
          display: block;
        }

        .deposit-icon:not(.hidden) {
          display: block;
        }

        .deposit-text {
          color: #ffc53e;
          margin: 0;
          padding: 0;
          font-size: 11px;
          font-weight: 600;
        }

        .nav-item span {
          margin: 0;
          padding: 0;
          display: block;
          font-size: 11px;
          transition: transform 0.2s ease;
        }

        .nav-item:not(.center-item):active span {
          transform: scale(0.9);
        }
      `}</style>
    </div>
  );
};

export default BottomNavigation;
