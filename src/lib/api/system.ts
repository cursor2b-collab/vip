/**
 * 系统相关API（当 USE_SUPABASE_DATA 时从 Supabase 读取；否则优先 PHP 后端 /api/v1）
 */
import apiClient from './client';
import phpGameClient from './php-game-client';
import { supabase, USE_SUPABASE_DATA, SUPABASE_TABLES } from '@/lib/supabase';

const usePhpBackend = import.meta.env.VITE_USE_PHP_GAME_BACKEND === 'true';

/** 将后端的相对图片路径转为可访问的完整 URL（管理后台上传的 /app/admin/upload/... 等） */
function resolveUploadUrl(path: string | undefined | null): string {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (import.meta.env.VITE_BACKEND_URL as string || '').replace(/\/+$/, '');
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path;
}

export interface Notice {
  title: string;
  content: string;
  url?: string;
}

export interface NoticeResponse {
  code: number;
  message: string;
  data: Notice[];
}

export interface Banner {
  id?: number;
  src: string;
  url?: string;
  link?: string;
  [key: string]: any;
}

export interface BannerResponse {
  code: number;
  message: string;
  data: Banner[];
}

// 获取首页公告（轮播下方滚动消息栏）：优先 PHP 后端 /api/v1/notices
const hasSupabase = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const getHomeNotices = (): Promise<NoticeResponse> => {
  if (usePhpBackend) {
    return phpGameClient
      .get<{ code?: number; data?: Array<{ id?: number; title?: string; content?: string; time?: string }> }>('notices')
      .then((res: any) => {
        const raw = res?.data ?? res?.list ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const data: Notice[] = list.map((row: any) => ({
          title: row.title ?? row.name ?? '',
          content: row.content ?? '',
          url: row.url ?? undefined
        }));
        return { code: 200, message: 'success', data };
      })
      .catch(() => ({ code: 500, message: '获取失败', data: [] }));
  }
  if (hasSupabase || USE_SUPABASE_DATA) {
    return supabase
      .from(SUPABASE_TABLES.notice)
      .select('id, title, content, url, created_at')
      .eq('show_carousel', true)
      .order('id', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) return { code: 500, message: error.message, data: [] };
        const notices: Notice[] = (data || []).map((row: { title?: string; content?: string | null; url?: string | null }) => ({
          title: row.title || '',
          content: row.content ?? '',
          url: row.url ?? undefined
        }));
        return { code: 200, message: 'success', data: notices };
      });
  }
  return apiClient.get('notices').then((res: any) => {
    const raw = res?.data ?? res?.list ?? [];
    const notices: Notice[] = Array.isArray(raw) ? raw.map((row: any) => ({ title: row.title ?? row.name ?? '', content: row.content ?? '', url: row.url })) : [];
    return { code: res.code ?? 200, message: res.message ?? '', data: notices };
  });
};

/** 首页公告弹窗：手机端弹窗公告 */
export interface PopupNoticeItem {
  title: string;
  content: string;
  url?: string | null;
  /** 弹窗类型：text=文字消息，image=图片消息 */
  popup_type?: string | null;
  /** 图片消息时的图片URL */
  popup_image?: string | null;
  popup_font_family?: string | null;
  popup_font_size?: string | null;
  popup_text_color?: string | null;
  popup_bg_color?: string | null;
}

export interface PopupNoticeResponse {
  code: number;
  message: string;
  alert: PopupNoticeItem[];
}

/** 弹窗：优先 PHP 后端 /api/v1/notices，与首页滚动消息同源，管理后台添加的公告会显示在弹窗 */
export const getPopupNotice = (): Promise<PopupNoticeResponse> => {
  if (usePhpBackend) {
    return phpGameClient
      .get<{ code?: number; data?: any; list?: any[] }>('notices')
      .then((res: any) => {
        const raw =
          (Array.isArray(res?.data) ? res.data : null) ??
          (Array.isArray(res?.data?.list) ? res.data.list : null) ??
          res?.list ??
          [];
        const list = Array.isArray(raw) ? raw : [];
        const alert: PopupNoticeItem[] = list.slice(0, 20).map((row: any) => ({
          title: row.title ?? row.name ?? '',
          content: row.content ?? '',
          url: row.url ?? null,
          popup_type: (row.popup_type ?? 'text') as const,
          popup_image: row.popup_image ?? null,
          popup_font_family: row.popup_font_family ?? null,
          popup_font_size: row.popup_font_size ?? null,
          popup_text_color: row.popup_text_color ?? null,
          popup_bg_color: row.popup_bg_color ?? null
        }));
        return { code: 200, message: 'success', alert };
      })
      .catch(() => ({ code: 500, message: '获取失败', alert: [] }));
  }
  if (hasSupabase || USE_SUPABASE_DATA) {
    return supabase
      .from(SUPABASE_TABLES.notice)
      .select('id, title, content, popup_type, popup_image, popup_font_family, popup_font_size, popup_text_color, popup_bg_color')
      .eq('show_popup', true)
      .eq('show_carousel', false)
      .order('id', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) return { code: 500, message: error.message, alert: [] };
        const alert: PopupNoticeItem[] = (data || []).map((row: any) => ({
          title: row.title || '',
          content: row.content || '',
          url: null,
          popup_type: row.popup_type ?? 'text',
          popup_image: row.popup_image ?? null,
          popup_font_family: row.popup_font_family ?? null,
          popup_font_size: row.popup_font_size ?? null,
          popup_text_color: row.popup_text_color ?? null,
          popup_bg_color: row.popup_bg_color ?? null
        }));
        return { code: 200, message: 'success', alert };
      });
  }
  return apiClient.get('notices', { params: { isMobile: 1 } }).then((res: any) => {
    const raw = res?.data ?? res?.list ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const alert: PopupNoticeItem[] = list.slice(0, 20).map((row: any) => ({
      title: row.title ?? row.name ?? '', content: row.content ?? '', url: row.url ?? null,
      popup_type: (row.popup_type ?? 'text') as const, popup_image: row.popup_image ?? null,
      popup_font_family: row.popup_font_family ?? null, popup_font_size: row.popup_font_size ?? null,
      popup_text_color: row.popup_text_color ?? null, popup_bg_color: row.popup_bg_color ?? null
    }));
    return { code: res.code ?? 200, message: res.message ?? '', alert: res.alert ?? alert };
  });
};

// 获取轮播图（platform: 0=全部 1=PC 2=移动端）：优先 PHP 后端 /api/v1/banners
export const getBanners = (type: number = 2): Promise<BannerResponse> => {
  if (usePhpBackend) {
    return phpGameClient
      .get<{ code?: number; data?: Array<{ id?: number; title?: string; image?: string; link?: string; sort?: number }> }>('banners', {
        params: type === 2 ? { platform: 2 } : type === 1 ? { platform: 1 } : {}
      })
      .then((res: any) => {
        const raw = res?.data ?? res?.list ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const data: Banner[] = list.map((row: any) => {
          const image = row.image ?? '';
          const link = row.link ?? '';
          return {
            id: row.id,
            src: resolveUploadUrl(image || row.img),
            url: link ? (link.startsWith('http') ? link : resolveUploadUrl(link)) : resolveUploadUrl(image || row.img),
            link: link || undefined,
            title: row.title ?? ''
          };
        });
        return { code: 200, message: 'success', data };
      })
      .catch(() => ({ code: 500, message: '获取失败', data: [] }));
  }
  if (hasSupabase || USE_SUPABASE_DATA) {
    const platform = type === 2 ? 2 : type === 1 ? 1 : 2;
    return supabase
      .from(SUPABASE_TABLES.system_banner)
      .select('id, title, image, link, platform, sort, status')
      .eq('status', 1)
      .or(`platform.eq.0,platform.eq.${platform}`)
      .order('sort', { ascending: true })
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) return { code: 500, message: error.message, data: [] };
        const banners: Banner[] = (data || []).map((row: any) => ({
          id: row.id,
          src: row.image || '',
          url: row.link || row.image || '',
          link: row.link,
          title: row.title
        }));
        return { code: 200, message: 'success', data: banners };
      });
  }
  const group = type === 2 ? 'mobile1' : type === 1 ? 'new1' : 'mobile1';
  return apiClient.get('banners', { params: { group } }).then((res: any) => {
    const banners = (res.data || []).map((item: any) => ({
      ...item,
      src: item.url || item.src
    }));
    return { ...res, data: banners };
  });
};

// 获取系统配置
export interface SystemConfigResponse {
  code: number;
  message: string;
  data: {
    [key: string]: any;
  };
}

export const getSystemConfig = (group: string = 'system'): Promise<SystemConfigResponse> => {
  return apiClient.get('config', { params: group ? { group } : {} }).then((res: any) => {
    return {
      code: res.code || 200,
      message: res.message || '',
      data: res.data?.data ?? res.data ?? {}
    };
  });
};

// 获取客服链接
export interface ServiceUrlResponse {
  code: number;
  message: string;
  data: {
    url?: string;
  };
}

export const getServiceUrl = (): Promise<ServiceUrlResponse> => {
  // 使用 getSystemConfig 接口获取客服链接，group=service 包含 service_link 配置
  // 根据 wap 项目的实现，应该使用 group=service 而不是 group=system
  return apiClient.get('config', {
    params: { group: 'service' }
  }).then((res: any) => {
    // 从 system config 中获取 service_link
    // 后端可能返回多种格式：
    // 1. { code: 200, data: { data: { service_link: '...' } } }
    // 2. { code: 200, data: { service_link: '...' } }
    // 3. { status: 'success', code: 200, data: { data: { service_link: '...' } } }
    let url = '';
    
    // 尝试多种数据结构
    if (res.data) {
      // 情况1: res.data.data 存在（嵌套结构）
      if (res.data.data && typeof res.data.data === 'object') {
        url = res.data.data.service_link || res.data.data.service_url || '';
      }
      // 情况2: res.data 直接包含 service_link
      else if (typeof res.data === 'object' && res.data.service_link) {
        url = res.data.service_link || res.data.service_url || '';
      }
      // 情况3: res.data 是字符串（直接返回链接）
      else if (typeof res.data === 'string') {
        url = res.data;
      }
    }
    
    // 如果还是空，尝试从 res 根级别获取
    if (!url && res.service_link) {
      url = res.service_link;
    }
    
    return {
      code: (res.status === 'success' || res.code === 200) ? 200 : (res.code || 200),
      message: res.message || '',
      data: {
        url: url
      }
    };
  }).catch((err: any) => {
    return {
      code: err?.code || 500,
      message: err?.message || '获取客服链接失败',
      data: {
        url: ''
      }
    };
  });
};

/** 百家乐等标签下的单个展示位 */
export interface HomeTabBannerSlot {
  platformCode: string;
  coverImage: string;
}

/** 首页标签页配置项 */
export interface HomeTabItem {
  id: number;
  key: string;
  name: string;
  icon: string;
  activeIcon: string;
  enabled: boolean;
  hasNew: boolean;
  /** 该标签页默认游戏平台 */
  platformCode?: string;
  /** 该标签页主封面图 */
  coverImage?: string;
  /** 百家乐标签专用：6 个展示位 */
  bannerSlots?: HomeTabBannerSlot[];
}

/** 获取首页标签页配置（无需登录） */
export const getHomeTabConfig = (): Promise<HomeTabItem[]> => {
  return phpGameClient
    .get<{ code?: number; data?: { tabs?: HomeTabItem[] }; tabs?: HomeTabItem[] }>('home-tab-config')
    .then((res: any) => {
      const tabs = res?.data?.tabs ?? res?.tabs ?? null;
      if (Array.isArray(tabs) && tabs.length > 0) return tabs as HomeTabItem[];
      return [];
    })
    .catch(() => []);
};

