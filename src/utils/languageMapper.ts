/**
 * 语言代码映射工具
 * 将网站语言代码映射到游戏接口语言代码
 */

/**
 * 游戏接口支持的语言代码列表
 * 根据API文档：ar, bg, ca, cs, da, de, el, en, es, et, fi, fr, he, hi, hr, hu, hy, id, it, ja, ka, ko, lt, lv, mn, ms, nl, pl, pt, ro, ru, sk, sl, sq, sv, th, tr, uk, vi, zh
 */
export const GAME_API_LANGUAGES = [
  'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 
  'fi', 'fr', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'it', 'ja', 
  'ka', 'ko', 'lt', 'lv', 'mn', 'ms', 'nl', 'pl', 'pt', 'ro', 
  'ru', 'sk', 'sl', 'sq', 'sv', 'th', 'tr', 'uk', 'vi', 'zh'
] as const;

/**
 * 网站语言代码到游戏接口语言代码的映射
 */
const LANGUAGE_MAP: Record<string, string> = {
  // 中文相关
  'zh_cn': 'zh',      // 简体中文 -> zh
  'zh-CN': 'zh',      // 简体中文（连字符格式）-> zh
  'zh_CN': 'zh',      // 简体中文（大写格式）-> zh
  'zh_tw': 'zh',      // 繁体中文（台湾）-> zh
  'zh-TW': 'zh',      // 繁体中文（台湾，连字符格式）-> zh
  'zh_TW': 'zh',      // 繁体中文（台湾，大写格式）-> zh
  'zh_hk': 'zh',      // 繁体中文（香港）-> zh
  'zh-HK': 'zh',      // 繁体中文（香港，连字符格式）-> zh
  'zh_HK': 'zh',      // 繁体中文（香港，大写格式）-> zh
  
  // 英语相关
  'en': 'en',         // 英语 -> en
  'en_us': 'en',      // 美式英语 -> en
  'en-US': 'en',      // 美式英语（连字符格式）-> en
  'en_US': 'en',      // 美式英语（大写格式）-> en
  'en_gb': 'en',      // 英式英语 -> en
  'en-GB': 'en',      // 英式英语（连字符格式）-> en
  'en_GB': 'en',      // 英式英语（大写格式）-> en
  
  // 其他语言（直接映射，如果游戏接口支持）
  'ja': 'ja',         // 日语 -> ja
  'id': 'id',         // 印尼语 -> id
  'vi': 'vi',         // 越南语 -> vi
  'th': 'th',         // 泰语 -> th
  'ko': 'ko',         // 韩语 -> ko
  'ru': 'ru',         // 俄语 -> ru
  'es': 'es',         // 西班牙语 -> es
  'fr': 'fr',         // 法语 -> fr
  'de': 'de',         // 德语 -> de
  'it': 'it',         // 意大利语 -> it
  'pt': 'pt',         // 葡萄牙语 -> pt
  'ar': 'ar',         // 阿拉伯语 -> ar
  'hi': 'hi',         // 印地语 -> hi
  'tr': 'tr',         // 土耳其语 -> tr
  'pl': 'pl',         // 波兰语 -> pl
  'nl': 'nl',         // 荷兰语 -> nl
  'sv': 'sv',         // 瑞典语 -> sv
  'da': 'da',         // 丹麦语 -> da
  'fi': 'fi',         // 芬兰语 -> fi
  'no': 'no',         // 挪威语 -> no (如果游戏接口不支持，映射到en)
  'cs': 'cs',         // 捷克语 -> cs
  'hu': 'hu',         // 匈牙利语 -> hu
  'ro': 'ro',         // 罗马尼亚语 -> ro
  'bg': 'bg',         // 保加利亚语 -> bg
  'hr': 'hr',         // 克罗地亚语 -> hr
  'sk': 'sk',         // 斯洛伐克语 -> sk
  'sl': 'sl',         // 斯洛文尼亚语 -> sl
  'et': 'et',         // 爱沙尼亚语 -> et
  'lv': 'lv',         // 拉脱维亚语 -> lv
  'lt': 'lt',         // 立陶宛语 -> lt
  'el': 'el',         // 希腊语 -> el
  'he': 'he',         // 希伯来语 -> he
  'uk': 'uk',         // 乌克兰语 -> uk
  'ms': 'ms',         // 马来语 -> ms
  'mn': 'mn',         // 蒙古语 -> mn
  'ka': 'ka',         // 格鲁吉亚语 -> ka
  'hy': 'hy',         // 亚美尼亚语 -> hy
  'sq': 'sq',         // 阿尔巴尼亚语 -> sq
  'ca': 'ca',         // 加泰罗尼亚语 -> ca
};

/**
 * 将网站语言代码映射到游戏接口语言代码
 * @param siteLangCode - 网站语言代码（如 'zh_cn', 'en_us', 'ja' 等）
 * @returns 游戏接口语言代码（如 'zh', 'en', 'ja' 等）
 */
export function mapSiteLanguageToGameApiLanguage(siteLangCode: string | null | undefined): string {
  if (!siteLangCode) {
    return 'zh'; // 默认使用中文
  }
  
  // 转换为小写并去除空格
  const normalized = String(siteLangCode).toLowerCase().trim();
  
  // 直接映射
  if (LANGUAGE_MAP[normalized]) {
    return LANGUAGE_MAP[normalized];
  }
  
  // 如果包含下划线或连字符，尝试提取第一部分
  if (normalized.includes('_') || normalized.includes('-')) {
    const parts = normalized.split(/[_-]/);
    const baseLang = parts[0];
    
    // 如果基础语言代码在映射表中，使用它
    if (LANGUAGE_MAP[baseLang]) {
      return LANGUAGE_MAP[baseLang];
    }
    
    // 如果基础语言代码在游戏接口支持的语言列表中，直接使用
    if (GAME_API_LANGUAGES.includes(baseLang as any)) {
      return baseLang;
    }
  }
  
  // 如果语言代码本身就在游戏接口支持的语言列表中，直接使用
  if (GAME_API_LANGUAGES.includes(normalized as any)) {
    return normalized;
  }
  
  // 默认返回中文
  console.warn(`⚠️ 未找到语言代码 "${siteLangCode}" 的映射，使用默认值 "zh"`);
  return 'zh';
}

/**
 * 从localStorage获取当前语言并映射到游戏接口语言代码
 * @returns 游戏接口语言代码
 */
export function getGameApiLanguage(): string {
  const siteLang = localStorage.getItem('ly_lang');
  return mapSiteLanguageToGameApiLanguage(siteLang);
}
