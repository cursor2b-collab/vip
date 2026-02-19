import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPopupNotice, type PopupNoticeItem } from '@/lib/api/system';

const STORAGE_KEY = 'notice_popup_closed';

/* Overlay */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.75);
`;

/* Card wrapper — 去除深色卡片样式，改用毛玻璃容器 */
const CardWrapper = styled.div`
  position: relative;
  width: 340px;
  max-width: min(92vw, 360px);
  min-height: 260px;
  max-height: min(360px, 60vh);
  display: flex;
  flex-direction: column;
  border-radius: 1.25rem;
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
`;

const ContentArea = styled.div<{ $asImage?: boolean }>`
  position: relative;
  flex: 1;
  min-height: 0;
  margin: 1rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  ${(p) => p.$asImage && 'align-items: center; justify-content: center; padding: 12px;'}
`;

const ScrollContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 18px;
  -ms-overflow-style: none;
  scrollbar-width: none;
  cursor: inherit;
  &::-webkit-scrollbar { display: none; }
  /* 优化 HTML 内容排版 */
  & p { margin: 0 0 0.75em; }
  & p:last-child { margin-bottom: 0; }
  & h1, & h2, & h3 { margin: 1em 0 0.5em; font-weight: 600; line-height: 1.4; }
  & h1 { font-size: 1.1em; }
  & h2 { font-size: 1.05em; }
  & h3 { font-size: 1em; }
  & ul, & ol { margin: 0.5em 0; padding-left: 1.4em; }
  & li { margin-bottom: 0.35em; }
  & strong { font-weight: 600; }
  & a { color: #a78bfa; text-decoration: underline; }
`;

const NoticeImage = styled.img`
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 6px;
`;

const FooterRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 12px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
`;

const CloseBtn = styled.button`
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  /* 液态模糊玻璃底层 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    backdrop-filter: blur(16px) saturate(2);
    -webkit-backdrop-filter: blur(16px) saturate(2);
    background: radial-gradient(
      ellipse at 35% 35%,
      rgba(255, 255, 255, 0.28) 0%,
      rgba(255, 255, 255, 0.10) 50%,
      rgba(200, 180, 255, 0.08) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.08) inset,
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
    transition: background 0.25s, box-shadow 0.25s;
  }

  /* 高光折射层 */
  &::after {
    content: '';
    position: absolute;
    top: 6px;
    left: 8px;
    width: 14px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.45);
    filter: blur(3px);
    opacity: 0.7;
    pointer-events: none;
  }

  svg {
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  &:hover {
    transform: scale(1.1) rotate(5deg);
    &::before {
      background: radial-gradient(
        ellipse at 35% 35%,
        rgba(255, 255, 255, 0.38) 0%,
        rgba(255, 255, 255, 0.18) 50%,
        rgba(200, 180, 255, 0.12) 100%
      );
      box-shadow:
        0 6px 28px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.12) inset,
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
    }
  }

  &:active {
    transform: scale(0.95);
  }
`;

const NavBtn = styled.button<{ $left?: boolean }>`
  position: absolute;
  left: ${(p) => (p.$left ? '-12px' : 'auto')};
  right: ${(p) => (p.$left ? 'auto' : '-12px')};
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(139, 92, 246, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s;
  &:hover { background: rgba(139, 92, 246, 0.8); }
`;

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isImageUrl(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const s = content.trim();
  return (
    /^https?:\/\//i.test(s) &&
    (/\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(s) || /\/storage\/|\/uploads\//i.test(s))
  );
}

const LOADER_DISMISSED_EVENT = 'loaderDismissed';

export function NoticePopup() {
  const [visible, setVisible] = useState(false);
  const [notices, setNotices] = useState<PopupNoticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loaderReady, setLoaderReady] = useState(false);
  const [noRemindToday, setNoRemindToday] = useState(false);

  useEffect(() => {
    const onLoaderDismissed = () => setLoaderReady(true);
    window.addEventListener(LOADER_DISMISSED_EVENT, onLoaderDismissed);
    const fallback = setTimeout(() => setLoaderReady(true), 5500);
    return () => {
      window.removeEventListener(LOADER_DISMISSED_EVENT, onLoaderDismissed);
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!loaderReady) return;

    const today = getTodayKey();
    const closedDate = localStorage.getItem(STORAGE_KEY);
    if (closedDate === today) {
      setLoading(false);
      return;
    }

    getPopupNotice()
      .then((res) => {
        if (res.code === 200 && res.alert && res.alert.length > 0) {
          setNotices(res.alert);
          setCurrentIndex(0);
          setVisible(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loaderReady]);

  const handleClose = () => {
    if (noRemindToday) {
      localStorage.setItem(STORAGE_KEY, getTodayKey());
    }
    setVisible(false);
  };

  const handleContentClick = () => {
    const notice = notices[currentIndex];
    if (notice?.url) {
      window.open(notice.url, '_blank');
    }
  };

  const goPrev = () => {
    setCurrentIndex((i) => (i <= 0 ? notices.length - 1 : i - 1));
  };
  const goNext = () => {
    setCurrentIndex((i) => (i >= notices.length - 1 ? 0 : i + 1));
  };

  if (loading || !visible || notices.length === 0) return null;

  const notice = notices[currentIndex];
  const rawContent = (notice.content || '').trim();
  const content = rawContent.replace(/^<\s*\/?\s*p\s*\/?\s*>$/i, '').trim() || rawContent;
  const hasContent = content.length > 0 && !/^<\s*\/?\s*\w+\s*\/?\s*>$/i.test(content);
  const isImageType = notice.popup_type === 'image';
  const imageSrc = isImageType ? (notice.popup_image || '').trim() : '';
  const showAsImage = isImageType && imageSrc ? true : isImageUrl(content);
  const displayContent = hasContent ? content : '';
  const displayTitle = (notice.title || '').trim() || '公告';

  const textStyle: React.CSSProperties = {
    fontFamily: notice.popup_font_family || 'system-ui, -apple-system, sans-serif',
    fontSize: notice.popup_font_size || '14px',
    color: notice.popup_text_color || 'rgba(255, 255, 255, 0.92)',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    letterSpacing: '0.02em',
  };

  const footerEl = (
    <FooterRow>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={noRemindToday}
          onChange={(e) => setNoRemindToday(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: '#8b5cf6' }}
        />
        今日不再显示
      </CheckboxLabel>
      <CloseBtn type="button" onClick={handleClose} aria-label="关闭">
        <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </CloseBtn>
    </FooterRow>
  );

  const cardContent = (
    <CardWrapper>
      <ContentArea
        $asImage={showAsImage}
        style={{ cursor: notice.url ? 'pointer' : 'default', margin: '1rem' }}
        onClick={notice.url ? handleContentClick : undefined}
      >
        {notices.length > 1 && (
          <>
            <NavBtn $left type="button" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="上一条">
              <ChevronLeft size={20} />
            </NavBtn>
            <NavBtn type="button" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="下一条">
              <ChevronRight size={20} />
            </NavBtn>
          </>
        )}
        {showAsImage ? (
          <NoticeImage src={imageSrc || content} alt={displayTitle} />
        ) : (
          <ScrollContent>
            <div style={textStyle}>
              {displayContent ? (
                <span dangerouslySetInnerHTML={{ __html: displayContent }} />
              ) : (
                displayTitle
              )}
            </div>
          </ScrollContent>
        )}
      </ContentArea>
    </CardWrapper>
  );

  const popupEl = (
    <Overlay role="dialog" aria-modal="true">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {cardContent}
        {footerEl}
      </div>
    </Overlay>
  );

  return createPortal(popupEl, document.body);
}
