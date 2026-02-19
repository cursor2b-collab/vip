import React, { useState, useEffect } from 'react';

export function LoaderHome() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    
    // 检查 sessionStorage 中是否存在标记
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited) {
      // 首次访问，显示组件并设置标记
      setShouldShow(true);
      sessionStorage.setItem('hasVisited', 'done');
      
      // 5秒后隐藏组件，并通知首页公告弹窗可显示（避免弹窗出现在启动屏上）
      const timer = setTimeout(() => {
        setShouldShow(false);
        try {
          window.dispatchEvent(new CustomEvent('loaderDismissed'));
        } catch (_) {}
      }, 5000);

      // 清理定时器
      return () => clearTimeout(timer);
    } else {
      // 本次不显示启动屏，立即通知公告弹窗可显示
      try {
        window.dispatchEvent(new CustomEvent('loaderDismissed'));
      } catch (_) {}
    }
  }, []);

  // 如果已经访问过且关闭后重新打开，不显示组件，但仍通知已关闭以便公告弹窗可显示
  if (!shouldShow) {
    return null;
  }

  function solveVh() {
      // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
      var vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', vh + 'px');

      // 使用方法
      // .my-element {
      //     height: 100vh; /* Fallback for browsers that do not support Custom Properties */
      //     height: calc(var(--vh) * 100);
      // }
    }
    solveVh();
    // 尺寸变化时同步更新vh
    window.addEventListener('resize', solveVh);

    // 等待图
    if (window.Telegram && window.Telegram.WebApp) {
      window.loaderStartTime = +new Date();
      var theme = window.Telegram.WebApp.colorScheme;
      document.documentElement.classList.add('g-' + theme);
    }

  return (
    <>
      <style>{`

        @keyframes rotate360 {
          0% {
            transform: rotate(0);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        #t_loader {
          font-family: 'Mildy';
          position: fixed;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 99999;
        }
        #t_loader .u-main-wrap {
          position: relative;
          z-index: 2;
          max-width: 450px;
          width: 23.4375rem;
          height: 100%;
          margin: 0 auto;
        }
        #t_loader .u-main-wrap:after {
          content: '';
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          width: 23.4375rem;
          height: 13.75rem;
          margin: 0 auto;
          z-index: 1;
        }

        @media screen and (min-width: 450px) {
          #t_loader:before,
          #t_loader:after {
            position: fixed;
            top: 0;
            bottom: 0;
            background:  no-repeat 0 / 100% 100% !important;
            width: 60rem;
            height: 60rem;
            z-index: 1;
          }
          #t_loader:before {
            left: 0;
            transform: translateX(-65%);
          }
          #t_loader:after {
            left: auto;
            right: 0;
            transform: translateX(60%);
          }
        }

        #t_loader .u-loading {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 26px;
          display: flex;
          align-items: center;
          font-size: 14px;
          z-index: 2;
        }

        #t_loader .u-loading .u-svg-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          margin-left: 6px;
          animation: rotate360 1s infinite linear;
        }

        #t_loader .u-loading .u-loading-gif {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }

        #t_loader .u-bg-main-video {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          max-width: 450px;
          margin: 0 auto;
          object-fit: cover;
        }

        #t_loader .u-bg .u-img-bg {
          display: none;
        }
        #t_loader .u-bg .u-img-logo {
          display: none;
        }

        .g-dark #t_loader .u-bg .u-img-bg.s-dark {
          display: block;
        }
        .g-light #t_loader .u-bg .u-img-bg.s-light {
          display: block;
        }
        .g-dark #t_loader .u-bg .u-img-logo.s-dark {
          display: block;
        }
        .g-light #t_loader .u-bg .u-img-logo.s-light {
          display: block;
        }

        #t_loader.s-has-video .u-main-wrap:after {
          opacity: 0;
        }
        #t_loader.s-has-video .u-img-bg {
          opacity: 0;
        }
        #t_loader.s-has-video .u-bg .u-img-logo {
          opacity: 0;
        }
        .g-dark #t_loader.s-has-video .u-loading,
        .g-light #t_loader.s-has-video .u-loading,
        #t_loader.s-has-video .u-loading {
          color: #fff;
        }


        #t_loader:before,
        #t_loader:after {
          content: '';
        }
        #t_loader {
          background: #000;
        }
        #t_loader .u-main-wrap {
          background: #000 no-repeat 0 0 / 100% 100%;
        }
        #t_loader .u-main-wrap:after {
          mix-blend-mode: multiply;
        }
        #t_loader .u-main {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate3d(-50%, -50%, 0);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        #t_loader .u-bg {
          position: relative;
          width: 251px;
          height: 238px;
          margin-top: -80px;
        }
        #t_loader .u-bg .u-img-bg {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }
        #t_loader .u-bg .u-img-logo {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          margin: auto;
          width: 168px;
        }
        #t_loader .u-name {
          display: none;
          margin-top: -52px;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }
        #t_loader .u-desc {
          margin-top: 10px;
          font-size: 14px;
          color: #8b8b8d;
        }

        #t_loader .u-loading {
          color: #fff;
        }

      `}</style>

      <div id="t_loader" className="s-n8yl s-has-video">
        <div className="u-main-wrap">
          <video className="u-bg-main-video" autoPlay muted loop playsInline>
            <source src="/images/shipin/generated-video-4.mp4" type="video/mp4" />
          </video>
          <div className="u-main">
            <div className="u-bg">
              <img src="/images/week/IMG_0371.png" className="u-img-logo s-dark" /> 
              <img src="/images/week/IMG_0371.png" className="u-img-logo s-light" />
            </div>
            <div className="u-name">B77</div>
          </div>
          <div className="u-loading">
            <img 
              src="/images/newimg/gameloading.gif" 
              alt="loading" 
              className="u-loading-gif"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
