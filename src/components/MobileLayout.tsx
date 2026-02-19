import { ReactNode, useState, useEffect } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  /** 固定顶部区域（如 Header），不随内容滚动 */
  header?: ReactNode;
  /** 固定底部导航，不随内容滚动 */
  bottomNav?: ReactNode;
  maxWidth?: string;
  /** PC 端居中容器最大宽度（默认 520px，仅 min-width: 701px 生效） */
  maxWidthPC?: string;
  backgroundColor?: string;
  showShadow?: boolean;
}

const BOTTOM_NAV_HEIGHT = 65;
const PC_BREAKPOINT = 701;
const DEFAULT_MAX_WIDTH_PC = '520px';

/**
 * MobileLayout 组件
 * 采用「固定头 + 固定底 + 仅内容区滚动」的移动端布局
 * - 根容器：height: 100vh, overflow: hidden，禁止整页滚动
 * - 头部/底部：flex-shrink: 0，固定在视口
 * - 内容区：flex: 1, overflow-y: auto，仅此处可上下滑动
 */
export function MobileLayout({ 
  children, 
  header,
  bottomNav,
  maxWidth = '430px',
  maxWidthPC = DEFAULT_MAX_WIDTH_PC,
  backgroundColor = '#0C1017',
  showShadow = true
}: MobileLayoutProps) {
  const [isPC, setIsPC] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${PC_BREAKPOINT}px)`);
    const update = () => setIsPC(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const effectiveMaxWidth = isPC ? maxWidthPC : maxWidth;

  return (
    <div 
      className="mobile-layout-wrapper" 
      style={{ 
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: backgroundColor,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* 移动端居中容器；PC 端使用更大宽度 */}
      <div 
        className="mobile-layout-container"
        style={{
          width: '100%',
          maxWidth: effectiveMaxWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: backgroundColor,
          boxShadow: showShadow ? '0 0 50px rgba(0, 0, 0, 0.5)' : 'none',
        }}
      >
        {/* 固定头部（无上边距，贴顶） */}
        {header && (
          <div style={{ flexShrink: 0, position: 'relative', zIndex: 10, marginTop: 0, paddingTop: 0 }}>
            {header}
          </div>
        )}

        {/* 可滚动内容区 - 仅此处可上下滑动 */}
        <div
          className="mobile-layout-content"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
            paddingBottom: bottomNav ? BOTTOM_NAV_HEIGHT : 0,
          }}
        >
          {children}
        </div>

        {/* 固定底部导航（CenteredBottomNav 内部用 fixed，此处留出占位高度） */}
        {bottomNav && (
          <div style={{ flexShrink: 0, height: BOTTOM_NAV_HEIGHT, position: 'relative', zIndex: 10 }}>
            {bottomNav}
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileLayout;
