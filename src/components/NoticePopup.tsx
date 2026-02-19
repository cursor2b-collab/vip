import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { Mail, ChevronLeft, ChevronRight } from 'lucide-react';
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

/* Card wrapper */
const CardWrapper = styled.div`
  position: relative;
  width: 340px;
  max-width: min(92vw, 360px);
  min-height: 400px;
  max-height: min(480px, 75vh);
  display: flex;
  flex-direction: column;
`;

const spinGradient = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const CardInner = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 320px;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(139, 92, 246, 0.35), 0 20px 50px rgba(0, 0, 0, 0.6);
`;

const CardBorder = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  padding: 2px;
  background: conic-gradient(from 0deg, #7c3aed, #ec4899, #06b6d4, #7c3aed);
  animation: ${spinGradient} 8s linear infinite;
  & > div {
    width: 100%;
    height: 100%;
    border-radius: calc(1rem - 2px);
    background: #020617;
  }
`;

const CardContent = styled.div`
  position: absolute;
  inset: 2px;
  border-radius: calc(1rem - 2px);
  background: linear-gradient(to bottom, #0f172a, rgba(46, 16, 101, 0.9), #020617);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
    pointer-events: none;
  }
`;

const ContentArea = styled.div<{ $asImage?: boolean }>`
  position: relative;
  flex: 1;
  min-height: 0;
  margin: 1rem 1rem 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, 0.25);
  box-shadow: inset 0 0 16px rgba(0,0,0,0.4);
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(30, 27, 75, 0.85), rgba(15, 23, 42, 0.95));
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
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(124, 58, 237, 0.5);
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

const Sidebar = styled.div`
  width: 64px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  gap: 4px;
  border-right: 1px solid rgba(167, 139, 250, 0.2);
`;

const SidebarBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin: 0 8px;
  border-radius: 8px;
  border: none;
  background: ${(p) => (p.$active ? 'rgba(139, 92, 246, 0.3)' : 'transparent')};
  color: ${(p) => (p.$active ? '#c4b5fd' : 'rgba(255,255,255,0.7)')};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  justify-content: flex-start;
  transition: background 0.2s, color 0.2s;
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
  const content = (notice.content || '').trim();
  const isImageType = notice.popup_type === 'image';
  const imageSrc = isImageType ? (notice.popup_image || '').trim() : '';
  const showAsImage = isImageType && imageSrc ? true : isImageUrl(content);

  const textStyle: React.CSSProperties = {
    fontFamily: notice.popup_font_family || 'system-ui, -apple-system, sans-serif',
    fontSize: notice.popup_font_size || '14px',
    color: notice.popup_text_color || '#e9d5ff',
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
      <CardInner>
        <CardBorder>
          <div />
        </CardBorder>
        <CardContent>
            <ContentArea
              $asImage={showAsImage}
              style={{ cursor: notice.url ? 'pointer' : 'default' }}
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
                <NoticeImage src={imageSrc || content} alt={notice.title || '公告'} />
              ) : notices.length > 1 ? (
                <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <Sidebar>
                    {notices.map((n, i) => (
                      <SidebarBtn
                        key={i}
                        type="button"
                        $active={i === currentIndex}
                        onClick={() => setCurrentIndex(i)}
                      >
                        <Mail size={18} style={{ flexShrink: 0, color: i === currentIndex ? '#c4b5fd' : 'rgba(255,255,255,0.5)' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.title || `公告${i + 1}`}
                        </span>
                      </SidebarBtn>
                    ))}
                  </Sidebar>
                  <ScrollContent>
                    <div style={textStyle}>
                      {content ? (
                        <span dangerouslySetInnerHTML={{ __html: content }} />
                      ) : (
                        notice.title
                      )}
                    </div>
                  </ScrollContent>
                </div>
              ) : (
                <ScrollContent>
                  <div style={textStyle}>
                    {content ? (
                      <span dangerouslySetInnerHTML={{ __html: content }} />
                    ) : (
                      notice.title
                    )}
                  </div>
                </ScrollContent>
              )}
            </ContentArea>
          </CardContent>
        </CardInner>
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
