import React, { useState, useRef, useCallback } from 'react';

export interface SliderCaptchaProps {
  /** 滑块验证码 key（由 getSliderCaptcha 返回） */
  captchaKey: string;
  onSuccess: (key: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  tip?: string;
  successTip?: string;
  style?: React.CSSProperties;
  /** 是否占满父容器宽度，默认 true */
  fullWidth?: boolean;
}

const TRACK_HEIGHT = 48;
const KNOB_SIZE = 40;
const KNOB_MARGIN = (TRACK_HEIGHT - KNOB_SIZE) / 2;

export default function SliderCaptcha({
  captchaKey,
  onSuccess,
  onRefresh,
  loading = false,
  tip = '向右滑动完成验证',
  successTip = '验证成功',
  style,
  fullWidth = true
}: SliderCaptchaProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const [startX, setStartX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setVerified(false);
    setOffset(0);
  }, [captchaKey]);

  const [trackWidth, setTrackWidth] = useState(280);
  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTrackWidth(el.offsetWidth));
    ro.observe(el);
    setTrackWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const threshold = trackWidth - KNOB_SIZE - KNOB_MARGIN * 2;

  const handleDragStart = useCallback(
    (clientX: number) => {
      if (verified || loading) return;
      setIsDragging(true);
      setStartX(clientX - offset);
    },
    [offset, verified, loading]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || verified) return;
      let next = clientX - startX;
      if (next < 0) next = 0;
      if (next > threshold) next = threshold;
      setOffset(next);
    },
    [isDragging, startX, verified, threshold]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging || verified) return;
    setIsDragging(false);
    if (offset >= threshold - 2 && captchaKey) {
      setVerified(true);
      setOffset(threshold);
      onSuccess(captchaKey);
    } else {
      setOffset(0);
    }
  }, [isDragging, offset, verified, threshold, captchaKey, onSuccess]);

  React.useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onUp = () => handleDragEnd();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };
  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const progressPercent = trackWidth > 0 ? (offset / threshold) * 100 : 0;

  return (
    <div
      ref={trackRef}
      style={{
        width: fullWidth ? '100%' : 280,
        minWidth: 200,
        height: TRACK_HEIGHT,
        borderRadius: 12,
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,197,62,0.25)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
        ...style
      }}
    >
      {/* 轨道底部高亮条（滑动进度） */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${progressPercent}%`,
          maxWidth: '100%',
          background: verified
            ? 'linear-gradient(90deg, rgba(82,196,26,0.35) 0%, rgba(115,209,61,0.5) 100%)'
            : 'linear-gradient(90deg, rgba(255,197,62,0.2) 0%, rgba(255,214,102,0.35) 100%)',
          borderRadius: 12,
          transition: verified ? 'none' : 'width 0.05s ease-out',
          pointerEvents: 'none'
        }}
      />
      {/* 右侧“终点”提示区 */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 56,
          background: verified
            ? 'rgba(82,196,26,0.2)'
            : 'rgba(255,197,62,0.08)',
          borderLeft: '1px solid rgba(255,197,62,0.2)',
          borderRadius: '0 12px 12px 0',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {verified ? (
          <span style={{ color: '#73d13d', fontSize: 20, fontWeight: 'bold' }}>✓</span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,197,62,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </div>
      {/* 中央提示文字 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 56,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: verified ? 'rgba(115,209,61,0.95)' : 'rgba(255,255,255,0.65)',
          fontSize: 14,
          fontWeight: 500,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {verified ? successTip : tip}
      </div>
      {/* 滑块按钮 */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute',
          left: offset + KNOB_MARGIN,
          top: KNOB_MARGIN,
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: 10,
          background: verified
            ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
            : 'linear-gradient(135deg, #ffc53e 0%, #ffd666 100%)',
          boxShadow: verified
            ? '0 2px 8px rgba(82,196,26,0.4)'
            : '0 2px 10px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
          cursor: verified ? 'default' : isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: verified ? 'none' : 'left 0.08s ease-out, box-shadow 0.2s',
          pointerEvents: loading ? 'none' : 'auto'
        }}
      >
        {verified ? (
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>✓</span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
