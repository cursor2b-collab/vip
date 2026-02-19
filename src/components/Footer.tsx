import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LanguageCode } from '@/i18n/translations';

interface Partner {
  name: string;
  logo: string;
}

interface Language {
  code: LanguageCode;
  nameKey: string;
  flag: string;
}

interface FooterProps {
  partners?: Partner[];
  languages?: Language[];
  currentLanguage?: string;
  onLanguageChange?: (code: string) => void;
}

const defaultPartners: Partner[] = [
  { name: 'Partner 1', logo: 'https://www.xpj00000.vip/indexImg/7.b28c3e76.png' },
  { name: 'Partner 2', logo: 'https://www.xpj00000.vip/indexImg/3.727cd2af.png' },
  { name: 'Partner 3', logo: 'https://www.xpj00000.vip/indexImg/6.feeac6b3.png' },
  { name: 'Partner 4', logo: 'https://www.xpj00000.vip/indexImg/2.1de4cdba.png' },
  { name: 'Partner 5', logo: 'https://www.xpj00000.vip/indexImg/5.c7f472a4.png' },
  { name: 'Partner 6', logo: 'https://www.xpj00000.vip/indexImg/1.65eeb785.png' },
  { name: 'Partner 7', logo: 'https://www.xpj00000.vip/indexImg/8.de7102bd.png' },
];

const defaultLanguages: Language[] = [
  { code: 'zh_cn', nameKey: 'langChina', flag: '🇨🇳' },
  { code: 'ja', nameKey: 'langJapan', flag: '🇯🇵' },
  { code: 'id', nameKey: 'langIndonesia', flag: '🇮🇩' },
  { code: 'vi', nameKey: 'langVietnam', flag: '🇻🇳' },
  { code: 'th', nameKey: 'langThailand', flag: '🇹🇭' },
  { code: 'zh_hk', nameKey: 'langHongKong', flag: '🇭🇰' },
];

export function Footer({
  partners = defaultPartners,
  languages = defaultLanguages,
  currentLanguage,
  onLanguageChange,
}: FooterProps = {}) {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const languageWrapperRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageWrapperRef.current &&
        !languageWrapperRef.current.contains(event.target as Node)
      ) {
        setShowLanguageOptions(false);
      }
    };

    if (showLanguageOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageOptions]);

  const currentLangCode = currentLanguage || language;
  const currentLang = languages.find(lang => lang.code === currentLangCode) || languages[0];

  const handleLanguageSelect = (code: LanguageCode) => {
    setShowLanguageOptions(false);
    setLanguage(code);
    
    // 触发外部回调
    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };
  const handleUrlTo = (url: string) => {
    window.location.href = url;
  };

  return (
    <>
      <style>{`
        .footer-brand-wap {
          background: #10141C;
          padding: 20px 16px;
          padding-bottom: 80px;
          color: #fff;
          margin-top: 0;
          margin-bottom: 0;
        }

        .footer-section {
          margin-bottom: 24px;
        }

        .footer-partner-language-section {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .footer-partner-column {
          flex: 1;
        }

        .footer-language-column {
          flex-shrink: 0;
          min-width: 180px;
        }

        .footer-brand-title {
          color: #fff;
          font-size: 16px;
          margin-bottom: 12px;
          text-align: left;
        }

        .footer-partner-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          max-width: 200px;
        }

        .footer-partner-list img {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
        }

        .footer-language-wrapper {
          position: relative;
        }

        .footer-language-select {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #333;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          width: fit-content;
          transition: background 0.2s;
        }

        .footer-language-select:hover {
          background: #444;
        }

        .footer-language-select:active {
          background: #555;
        }

        .footer-language-flag {
          font-size: 20px;
          line-height: 1;
        }

        .footer-language-name {
          color: #fff;
          font-size: 14px;
        }

        .footer-language-arrow {
          font-size: 10px;
          color: #999;
          margin-left: 8px;
          transition: transform 0.2s;
        }

        .footer-language-arrow.open {
          transform: rotate(180deg);
        }

        .footer-language-options {
          position: absolute;
          bottom: 100%;
          left: 0;
          background: #2a2a2a;
          border-radius: 6px;
          padding: 8px 0;
          min-width: 180px;
          z-index: 1000;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4);
          margin-bottom: 8px;
          list-style: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-language-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 16px;
          cursor: pointer;
          color: #fff;
          font-size: 14px;
          transition: background 0.2s;
        }

        .footer-language-option:hover {
          background: #444;
        }

        .footer-language-option:active {
          background: #555;
        }

        .footer-language-option.active {
          background: rgba(255, 197, 62, 0.1);
        }

        .footer-language-option-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-language-code {
          font-size: 12px;
          color: #999;
        }

        .footer-authenticate-list {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .footer-authenticate-list img {
          width: 100px;
          height: auto;
          border-radius: 6px;
        }


        .footerWrap {
            width: 100%;
            padding: 10px 33px 95px 16px;
            font-size: 12px;
            line-height: 16px;
            background-color: #19191c
        }

        .footerWrap .links {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-orient: horizontal;
            -webkit-box-direction: normal;
            -ms-flex-direction: row;
            flex-direction: row;
            color: hsla(0,0%,100%,.4509803922);
            font-family: "Alibaba PuHuiTi 3.0";
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .footerWrap .links .text:active {
            color: hsla(0,0%,100%,.8509803922)
        }

        .footerWrap .links .br {
            width: 2px;
            height: 100%;
        }

        .footerWrap .links .br img {
            height: 100%;
        }

        .footerWrap .copyright {
            height: 16px;
            margin-top: 5px;
            color: #666;
        }

        .footerWrap p {
            color: #666;
        }

        .footerWrap img {
            width: 53%;
            height: auto;
        }

        .footForHome {
            padding-bottom: 3px;
            background-color: #10141c;
        }

        .footer-copyright {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          line-height: 1.8;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-copyright p {
          margin: 4px 0;
        }

        .footer-copyright .footer-year {
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          margin-top: 12px;
        }
      `}</style>

      <div className="footer-brand-wap">
        {/* 合作伙伴和语言切换 */}
        <div className="footer-partner-language-section">
          {/* 合作伙伴 */}
          <div className="footer-partner-column">
            <div className="footer-brand-title">{t('footerPartners')}</div>
            <div className="footer-partner-list">
              {partners.map((partner, index) => (
                <img key={index} src={partner.logo} alt={partner.name} />
              ))}
            </div>
          </div>

          {/* 语言切换 */}
          <div className="footer-language-column">
            <div className="footer-brand-title">{t('footerLanguage')}</div>
            <div className="footer-language-wrapper" ref={languageWrapperRef}>
              <div 
                className="footer-language-select" 
                onClick={() => setShowLanguageOptions(!showLanguageOptions)}
              >
                <span className="footer-language-flag">{currentLang.flag}</span>
                <span className="footer-language-name">{t(currentLang.nameKey)}</span>
                <span className={`footer-language-arrow ${showLanguageOptions ? 'open' : ''}`}>▼</span>
              </div>
              {showLanguageOptions && (
                <ul className="footer-language-options">
                  {languages.map((lang) => (
                    <li
                      key={lang.code}
                      className={`footer-language-option ${currentLangCode === lang.code ? 'active' : ''}`}
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      <div className="footer-language-option-left">
                        <span className="footer-language-flag">{lang.flag}</span>
                        <span className="footer-language-name">{t(lang.nameKey)}</span>
                      </div>
                      <span className="footer-language-code">{lang.code.toUpperCase()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 认证信息 */}
        <div className="footer-section">
          <div className="footer-brand-title">{t('footerAuth')}</div>
          <div className="footer-authenticate-list">
            <img 
              src="https://www.xpj00000.vip/indexImg/3.57fd5e85.png" 
              alt="PA认证"
              style={{ width: '280px' }}
            />
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="footerWrap footForHome">
          <ul className="links">
            <li className="text" onClick={() => handleUrlTo('/about')}>关于我们</li>
            <li className="br">
              <div className="img-loading finished" style={{ height: '19px' }} >
                  <img className="loaded" style={{ borderRadius: '0px' }} src="https://www.xpj00000.vip/indexImg/line.4a75e6b5.png" />
              </div>
            </li>
            <li className="text" onClick={() => handleUrlTo('/service')}>新手教程</li>
            <li className="br">
              <div className="img-loading finished" style={{ height: '19px' }} >
                <img className="loaded" style={{ borderRadius: '0px' }} src="https://www.xpj00000.vip/indexImg/line.4a75e6b5.png" />
              </div>
            </li>
            <li className="text">意见反馈</li>
            <li className="br">
              <div className="img-loading finished" style={{ height: '19px' }} >
                <img className="loaded" style={{ borderRadius: '0px' }} src="https://www.xpj00000.vip/indexImg/line.4a75e6b5.png" />
              </div>
            </li>
            {/* <li className="text" onClick={() => handleUrlTo('/appDownload')}>下载APP</li> */}
          </ul>
          <div className="copyright">
            <div className="img-loading finished" >
              Copyright © 2026 B77版权所有
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="footer-copyright">
        </div>

        
      </div>
    </>
  );
}