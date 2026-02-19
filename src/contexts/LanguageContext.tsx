import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, LanguageCode, getTranslation } from '@/i18n/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // 从 localStorage 读取语言设置
    const savedLang = localStorage.getItem('ly_lang') as LanguageCode;
    if (savedLang && translations[savedLang]) {
      return savedLang;
    }
    return 'zh_cn';
  });

  // 监听 localStorage 变化（跨标签页同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ly_lang' && e.newValue) {
        const newLang = e.newValue as LanguageCode;
        if (translations[newLang]) {
          setLanguageState(newLang);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 监听同标签页内的语言变化（通过自定义事件）
  useEffect(() => {
    const handleLanguageChangeEvent = () => {
      const savedLang = localStorage.getItem('ly_lang') as LanguageCode;
      if (savedLang && translations[savedLang] && savedLang !== language) {
        setLanguageState(savedLang);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChangeEvent);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChangeEvent);
    };
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    if (translations[lang]) {
      localStorage.setItem('ly_lang', lang);
      setLanguageState(lang);
      // 触发自定义事件，通知其他组件
      window.dispatchEvent(new Event('languageChanged'));
    }
  };

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

