import React from 'react';

const PC_BREAKPOINT = 701;
const PC_NAV_MAX_WIDTH = '520px';

interface CenteredBottomNavProps {
  children: React.ReactNode;
  maxWidth?: string;
  height?: string;
  backgroundColor?: string;
  zIndex?: number;
}

/**
 * CenteredBottomNav 组件
 * 用于在PC端将底部导航栏居中显示
 * 移动端使用 maxWidth（默认 430px），PC 端（≥701px）使用 520px 与布局一致
 *
 * @param children - 导航栏内容
 * @param maxWidth - 移动端最大宽度，默认 '430px'
 * @param height - 高度，默认 '65px'
 * @param backgroundColor - 背景颜色，默认 '#151a23'
 * @param zIndex - 层级，默认 999
 */
export function CenteredBottomNav({
  children,
  maxWidth = '430px',
  height = '65px',
  backgroundColor = '#151a23',
  zIndex = 999
}: CenteredBottomNavProps) {
  return (
    <>
      <style>{`
        @media (min-width: ${PC_BREAKPOINT}px) {
          .centered-bottom-nav {
            max-width: ${PC_NAV_MAX_WIDTH} !important;
          }
        }
      `}</style>
      <div
        className="centered-bottom-nav"
        style={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: maxWidth,
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          height: height,
          margin: 0,
          padding: 0,
          background: backgroundColor,
          zIndex: zIndex,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        {children}
      </div>
    </>
  );
}

export default CenteredBottomNav;

