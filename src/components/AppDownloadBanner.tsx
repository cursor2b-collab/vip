import React, { useState, useEffect, useRef } from 'react';

const CAROUSEL_IMAGES = [
  '/images/shipin/7c8c.avif',
  '/images/shipin/50571.avif',
  '/images/shipin/ddb6.avif',
];

// 末尾追加第一张，实现无缝滚动（与 Header 轮播一致）
const EXTENDED_IMAGES = [...CAROUSEL_IMAGES, CAROUSEL_IMAGES[0]];

const ITEM_HEIGHT = 24; // px，每帧高度
const STORAGE_KEY = 'app_banner_closed_date';
const BOTTOM_NAV_HEIGHT = 65;

const CLOSE_DURATION = 350; // ms，关闭动画时长

export default function AppDownloadBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const closedDate = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();
    if (closedDate !== today) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCarouselIdx((prev) => prev + 1);
    }, 2200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  // 滚动到复制帧后，无动画跳回第 0 帧（与 Header 无缝循环逻辑一致）
  useEffect(() => {
    if (carouselIdx === CAROUSEL_IMAGES.length) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCarouselIdx(0);
      }, 500);
    }
  }, [carouselIdx]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    }, CLOSE_DURATION);
  };

  const handleInstall = () => {
    window.open('https://innovatioexchange.com/', '_blank', 'noopener,noreferrer');
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes app-banner-enter {
          from { transform: translateX(100%); }
          to   { transform: translateX(-50%); }
        }
        @keyframes app-banner-leave {
          from { transform: translateX(-50%); }
          to   { transform: translateX(-150%); }
        }
        .app-dl-banner {
          animation: app-banner-enter 0.35s ease-out both;
        }
        .app-dl-banner.closing {
          animation: app-banner-leave 0.35s ease-in forwards;
        }
        @media (min-width: 701px) {
          .app-dl-banner { max-width: 520px !important; }
        }
      `}</style>

      <div
        className={`app-dl-banner${closing ? ' closing' : ''}`}
        onClick={handleInstall}
        style={{
          position: 'fixed',
          bottom: BOTTOM_NAV_HEIGHT,
          left: '50%',
          width: '100%',
          maxWidth: '430px',
          height: '68px',
          zIndex: 997,
          cursor: 'pointer',
          backgroundImage: 'url(/images/login/blo66.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* 左侧文字区域 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: '14px',
            gap: '2px',
          }}
        >
          {/* 主标题 */}
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.2,
              letterSpacing: '0.5px',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            Vip贵宾会娱乐APP全新上线
          </div>

          {/* 副标题：轮播文字 + 描述图片 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 轮播文字图片：垂直滑动，与 Header 轮播一致 */}
            <div
              style={{
                width: '68px',
                height: `${ITEM_HEIGHT}px`,
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  transform: `translateY(-${carouselIdx * ITEM_HEIGHT}px)`,
                  transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none',
                }}
              >
                {EXTENDED_IMAGES.map((src, index) => (
                  <div
                    key={index}
                    style={{
                      height: `${ITEM_HEIGHT}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'left center',
                        display: 'block',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* 体验更好速度更快 */}
            <img
              src="/images/shipin/af1ccc9.avif"
              alt="体验更好速度更快"
              style={{
                height: '22px',
                objectFit: 'contain',
                flexShrink: 0,
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* 立即安装按钮 */}
        <div
          onClick={(e) => { e.stopPropagation(); handleInstall(); }}
          style={{
            flexShrink: 0,
            marginRight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src="/images/shipin/e8c6d4ff-7.avif"
            alt="立即安装"
            style={{
              height: '46px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* 关闭按钮 */}
        <div
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '50%',
            right: '8px',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            flexShrink: 0,
          }}
        >
          <img
            src="/images/shipin/c.avif"
            alt="关闭"
            style={{
              width: '28px',
              height: '28px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      </div>
    </>
  );
}
