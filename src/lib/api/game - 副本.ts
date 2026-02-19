/**
 * 游戏相关API
 * 当配置了 VITE_BET_PROXY_URL 时与 ht 统一走 bet-proxy；当 USE_SUPABASE_DATA 时游戏列表从 Supabase caipiao_game 读取
 */
import apiClient from './client';
import { supabase, USE_SUPABASE_DATA, SUPABASE_TABLES } from '@/lib/supabase';
import {
  betCreate,
  betGameUrl,
  betBalance,
  betTransfer,
  betTransferAll
} from './bet-api';

/** gameType 数字与 Supabase caipiao_game.type 映射（与 ht 一致） */
const GAME_TYPE_TO_SUPABASE: Record<number, string> = {
  1: 'live',
  3: 'slot',
  4: 'lottery',
  5: 'sport',
  6: 'slot'
};

/**
 * 将后台返回的封面图路径转为可用的图片 URL
 * - 完整 http(s) URL：直接使用
 * - /images/... 路径：使用前端 public 目录下的图片（前端项目 public/images 存放封面）
 * - 相对路径：拼接 API 域名
 */
function resolveImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // 若完整 URL 的路径是 /images/...，改用前端当前域（封面图在 frontend/public/images）
    try {
      const u = new URL(trimmed);
      if (u.pathname.startsWith('/images/')) return u.pathname;
    } catch (_) {}
    return trimmed;
  }
  // /images/xxx 直接使用（从前端 public 加载）
  if (trimmed.startsWith('/images/')) return trimmed;
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '') || window.location.origin;
  return (apiBase + (trimmed.startsWith('/') ? '' : '/') + trimmed);
}

export interface Game {
  id?: number;
  name: string;
  platform_name: string;
  game_code: string;
  game_type: number;
  gameType: number;
  category_id: string;
  cover?: string;
  app_state?: number;
  tags?: string;
  params?: any;
  [key: string]: any;
}

export interface GameCategory {
  title: string;
  child: Game[];
}

export interface GameListResponse {
  code: number;
  message: string;
  data: Game[];
}

export interface GameUrlResponse {
  code: number;
  message: string;
  status?: string; // 添加 status 属性
  data: {
    game_url?: string;
    url?: string;
  };
}

// 获取游戏接口列表（用于额度转换）
export interface GameApi {
  id: number;
  api_name: string;
  title: string;
  icon_url?: string;
  game_type?: number;
  [key: string]: any;
}

export interface GameApiListResponse {
  code: number;
  message: string;
  data: GameApi[];
}

export const getGameApiList = (gameType: number, isMobile: number = 1): Promise<GameApiListResponse> => {
  if (USE_SUPABASE_DATA) {
    const supabaseType = GAME_TYPE_TO_SUPABASE[gameType] || 'slot';
    return supabase
      .from(SUPABASE_TABLES.caipiao_game)
      .select('id, game_id, name, platform, type, icon, cover')
      .eq('type', supabaseType)
      .eq('status', 'online')
      .order('sort', { ascending: true })
      .then(({ data, error }) => {
        if (error) return { code: 500, message: error.message, data: [] };
        const apis = (data || []).map((row: any) => ({
          id: row.id,
          api_name: row.platform || '',
          title: row.name || '',
          icon_url: row.icon || row.cover,
          game_type: gameType
        }));
        return { code: 200, message: 'success', data: apis };
      });
  }
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  return apiClient.get('games/apis', {
    params: { gameType, isMobile, lang }
  }).then((res: any) => ({
    code: res.code || 200,
    message: res.message || '',
    data: res.data || []
  }));
};

// 获取 api_games 表数据（游戏大厅/推荐游戏使用）
export interface ApiGameItem {
  title: string;
  api_name: string;
  game_type: number;
  params?: string | Record<string, any>;
  mobile_pic?: string;
  web_pic?: string;
  [key: string]: any;
}

export const getApiGames = (): Promise<{ code: number; message: string; data: ApiGameItem[] }> => {
  if (USE_SUPABASE_DATA) {
    return supabase
      .from(SUPABASE_TABLES.caipiao_game)
      .select('id, game_id, name, platform, type, icon, cover, hot, new')
      .eq('status', 'online')
      .order('sort', { ascending: true })
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) return { code: 500, message: error.message, data: [] };
        const list: ApiGameItem[] = (data || []).map((row: any) => {
          const cover = (row.cover || row.icon) ? resolveImageUrl(row.cover || row.icon || '') : '';
          return {
            title: row.name,
            api_name: row.platform || '',
            game_type: 1,
            mobile_pic: row.cover || row.icon,
            web_pic: row.cover || row.icon,
            platform_name: (row.platform || '').toUpperCase(),
            game_code: row.game_id || '',
            effective_game_type: 1,
            cover
          };
        });
        return { code: 200, message: 'success', data: list };
      });
  }
  return apiClient.get('games/web').then((res: any) => {
    const raw = res.data || res.data?.data || [];
    const list = Array.isArray(raw) ? raw : [];
    return {
      code: res.code || 200,
      message: res.message || '',
      data: list.map((item: any) => {
        let params: Record<string, any> = {};
        try {
          params = typeof item.params === 'string' ? JSON.parse(item.params || '{}') : (item.params || {});
        } catch (_) {}
        const gameCode = params.gameCode || params.game_code || params.code || '0';
        const effectiveGameType = params.gameType ?? params.game_type ?? item.game_type ?? 1;
        const cover = item.mobile_pic || item.web_pic ? resolveImageUrl(item.mobile_pic || item.web_pic || '') : '';
        return {
          ...item,
          platform_name: (item.api_name || '').toUpperCase(),
          game_code: gameCode,
          effective_game_type: Number(effectiveGameType),
          cover
        };
      })
    };
  });
};

// 游戏类型映射（与 Supabase caipiao_game.type 及前端 category_id 一致）
const typeMap: Record<number, string> = {
  1: 'realbet',
  3: 'gaming',
  4: 'lottery',
  5: 'sport',
  6: 'joker'
};
const supabaseTypeToGameType: Record<string, number> = {
  live: 1,
  slot: 3,
  lottery: 4,
  sport: 5,
  chess: 6,
  fishing: 3
};

// 获取游戏列表（Supabase 时从 caipiao_game 读取，与 ht 一致）
export const getGameList = (category?: string): Promise<GameListResponse> => {
  if (USE_SUPABASE_DATA) {
    return supabase
      .from(SUPABASE_TABLES.caipiao_game)
      .select('id, game_id, name, platform, type, icon, cover, hot, new, status, sort')
      .eq('status', 'online')
      .in('type', ['live', 'slot', 'lottery', 'sport', 'chess', 'fishing'])
      .order('sort', { ascending: true })
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          return { code: 500, message: error.message, data: [] };
        }
        const allGames: Game[] = (data || []).map((row: any) => {
          const gameType = supabaseTypeToGameType[row.type] ?? 3;
          const categoryId = typeMap[gameType] || 'gaming';
          const cover = (row.cover || row.icon) ? resolveImageUrl(row.cover || row.icon || '') : '';
          return {
            id: row.id,
            category_id: categoryId,
            name: row.name || '',
            platform_name: (row.platform || '').toUpperCase(),
            game_code: row.game_id || '',
            game_type: gameType,
            gameType: gameType,
            app_state: 1,
            cover,
            tags: '',
            params: { gameCode: row.game_id, gameType },
            raw: row
          };
        });
        return { code: 200, message: 'success', data: allGames };
      });
  }

  const gameTypes = [1, 3, 4, 5, 6];
  const promises = gameTypes.map(async (gameType) => {
    try {
      const res = await apiClient.get('games/lists', {
        params: { gameType, isMobile: 1 }
      });
      if (res.code === 200 && res.data) {
        const games = Array.isArray(res.data) ? res.data : (res.data.data || []);
        return games.map((game: any) => {
          const typeValue = Number(game.game_type || gameType);
          const type = Number.isNaN(typeValue) ? gameType : typeValue;
          const categoryId = typeMap[type] || 'concise';
          let params: any = {};
          if (game.param_remark) {
            try {
              params = typeof game.param_remark === 'string' ? JSON.parse(game.param_remark) : game.param_remark;
            } catch (_) {}
          }
          const gameCode = params.gameCode || params.game_code || params.code || game.game_code || '';
          const rawCover = game.full_image_url || game.img_url || game.img_path || game.mobile_pic || game.web_pic || '';
          const cover = rawCover ? resolveImageUrl(rawCover) : '';
          return {
            id: game.id,
            category_id: categoryId,
            name: game.name || '',
            platform_name: (game.api_name || '').toUpperCase(),
            game_code: gameCode,
            game_type: type,
            gameType: type,
            app_state: game.is_open === 1 || game.is_open === '1' ? 1 : 0,
            cover,
            tags: game.tags || '',
            params,
            raw: game
          };
        });
      }
      return [];
    } catch (error) {
      console.error(`❌ 获取 gameType=${gameType} 失败:`, error);
      return [];
    }
  });

  return Promise.all(promises).then((results) => ({
    code: 200,
    message: 'success',
    data: results.flat()
  })).catch((err) => ({
    code: 500,
    message: err?.message || '获取游戏列表失败',
    data: [] as Game[]
  }));
};

// 获取用户ID（从用户信息中获取）
export const getUserId = async (): Promise<string | null> => {
  try {
    // 尝试从localStorage获取用户ID
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      const userId = user.id || user.user_id || user.username || null;
      // 确保返回字符串类型（根据新游戏接口文档，userCode必须是string）
      if (userId !== null) {
        return String(userId);
      }
    }
    
    // 如果没有，尝试从API获取
    const { getUserInfo } = await import('@/lib/api/auth');
    const response = await getUserInfo();
    const userId = response?.data?.id || response?.data?.user_id || response?.data?.username || null;
    if (userId !== null) {
      // 确保返回字符串类型
      return String(userId);
    }
    
    return null;
  } catch (error) {
    console.error('获取用户ID失败:', error);
    return null;
  }
};

/** 是否使用与 ht 统一的 bet-proxy 游戏接口（配置了 VITE_BET_PROXY_URL 即启用） */
export const shouldUseBetProxy = (): boolean => {
  return !!(import.meta.env.VITE_BET_PROXY_URL as string)?.trim();
};

/** 前端 api_code（如 AG、BBIN）转为 api-bet 的 platType（小写 ag、bbin） */
function apiCodeToPlatType(apiCode: string): string {
  const s = String(apiCode || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  return s || 'ag';
}

/** 前端 gameType 数字 转 api-bet gameType 字符串：1=视讯 2=老虎机 3=彩票 4=体育 5=电竞 6=捕猎 7=棋牌 */
function gameTypeToBetGameType(gameType: number): string {
  const map: Record<number, string> = {
    1: '1', 2: '2', 3: '2', 4: '3', 5: '4', 6: '7', 7: '5'
  };
  return map[gameType] ?? '1';
}

/** 语言转 api-bet 货币 */
function langToCurrency(lang: string): string {
  const map: Record<string, string> = {
    zh_cn: 'CNY', en: 'USD', zh_hk: 'HKD', th: 'THB', vi: 'VND', id: 'IDR', ja: 'JPY'
  };
  return map[String(lang || '').toLowerCase()] ?? 'CNY';
}

/** 确保 playerId 符合 api-bet 规范：5-11 位小写字母+数字 */
function toBetPlayerId(userId: string | number | null): string {
  const raw = String(userId ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (raw.length >= 5 && raw.length <= 11) return raw;
  if (raw.length > 11) return raw.slice(0, 11);
  return ('u' + raw).slice(0, 11).padEnd(5, '0');
}

// 获取游戏URL
export const getGameUrl = async (params: {
  api_code: string;
  gameType: number;
  gameCode?: string;
  isMobile?: number;
}): Promise<GameUrlResponse> => {
  // 游戏类型：1=真人, 2=电游, 3=电游, 4=彩票, 5=体育, 6=棋牌
  // 新接口只支持真人（gameType=1）和电游（gameType=2,3），不支持体育、彩票、棋牌
  const isNewApiSupportedGameType = params.gameType === 1 || params.gameType === 2 || params.gameType === 3;
  
  // PA视讯、AG、BG 强制使用旧接口
  let apiCode = params.api_code.replace(/[^0-9a-z]/gi, '').toUpperCase();
  if (!apiCode && params.api_code) {
    apiCode = params.api_code.toUpperCase();
  }
  const isPA = apiCode === 'PA';
  const isAG = apiCode === 'AG';
  const isBG = apiCode === 'BG';
  
  // ========== 与 ht 统一：使用 bet-proxy（api-bet.net） ==========
  if (shouldUseBetProxy()) {
    let gameUrlBody: Record<string, unknown> | undefined;
    try {
      const playerId = toBetPlayerId(await getUserId());
      if (!playerId || playerId.length < 5) {
        throw new Error('无法获取用户ID，请先登录');
      }
      const platType = apiCodeToPlatType(apiCode);
      const lang = localStorage.getItem('ly_lang') || 'zh_cn';
      const currency = langToCurrency(lang);
      const betGameType = gameTypeToBetGameType(params.gameType);
      const isMobile = params.isMobile === 1 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const ingress = isMobile ? 'device2' : 'device1';
      const siteOrigin = (import.meta.env.VITE_SITE_URL as string)?.trim()?.replace(/\/+$/, '') || '';
      const isProductionOrigin = siteOrigin && !/localhost|127\.0\.0\.1/i.test(siteOrigin);
      const returnUrl = isProductionOrigin ? `${siteOrigin}/gamelobby` : undefined;
      let gameCode: string | undefined = (params.gameCode && params.gameCode !== '0' && String(params.gameCode).trim() !== '') ? String(params.gameCode).trim() : undefined;
      if (gameCode && gameCode.toLowerCase() === 'lobby') gameCode = undefined;
      else if (gameCode && gameCode.includes('_')) {
        const after = gameCode.slice(gameCode.indexOf('_') + 1).trim();
        gameCode = after && after.toLowerCase() !== 'lobby' ? after : undefined;
      }
      if (gameCode !== undefined && gameCode === '') gameCode = undefined;

      gameUrlBody = {
        playerId,
        platType,
        currency,
        gameType: betGameType,
        ingress
      };
      if (returnUrl) gameUrlBody.returnUrl = returnUrl;
      if (gameCode) gameUrlBody.gameCode = gameCode;

      await betCreate({ playerId, platType, currency });
      try {
        const { getUserInfo } = await import('@/lib/api/auth');
        const userInfoRes = await getUserInfo();
        const walletBalance = Number((userInfoRes as any)?.data?.money ?? (userInfoRes as any)?.data?.balance ?? 0) || 0;
        if (walletBalance > 0) {
          const balanceRes = await betBalance({ playerId, platType, currency });
          const gameBalance = Number(balanceRes.data?.balance ?? 0) || 0;
          const needIn = walletBalance - gameBalance;
          if (needIn > 0.01) {
            await betTransfer({
              playerId,
              platType,
              currency,
              type: '1',
              amount: String(Math.floor(needIn * 100) / 100),
              orderId: `in_${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
            }).catch(() => {});
          }
        }
      } catch (_) {}
      const res = await betGameUrl(gameUrlBody as Parameters<typeof betGameUrl>[0]);
      const data = res?.data;
      const url = (data && (typeof data === 'object' && 'url' in data))
        ? (data as { url?: string }).url
        : undefined;
      const gameUrl = (url && String(url).trim()) || (data && (data as { game_url?: string }).game_url) || (data && (data as { gameUrl?: string }).gameUrl);
      if (gameUrl) {
        return { code: 200, message: '成功', status: 'success', data: { game_url: gameUrl, url: gameUrl } };
      }
      const apiMsg = (res as { msg?: string })?.msg;
      throw new Error(apiMsg ? `游戏链接为空（接口：${apiMsg}）` : '游戏链接为空，请检查 bet-proxy 与商户配置');
    } catch (err: any) {
      if (gameUrlBody !== undefined) err.requestBody = gameUrlBody;
      console.error('❌ bet-proxy 获取游戏链接失败:', {
        message: err?.message,
        code: err?.code,
        path: err?.path,
        response: err?.response,
        requestBody: gameUrlBody
      });
      throw err;
    }
  }
  
  // 使用旧游戏接口（原有逻辑）
  // 根据Vue项目配置，使用GET请求，参数通过URL query传递
  // 平台代码映射（参考Vue项目的endpointAdapters）
  // apiCode 已经在上面定义过了，这里直接使用
  // 如果 apiCode 还没有定义（理论上不会发生），则重新定义
  if (typeof apiCode === 'undefined') {
    apiCode = params.api_code.replace(/[^0-9a-z]/gi, '').toUpperCase();
    if (!apiCode && params.api_code) {
      apiCode = params.api_code.toUpperCase();
    }
  }
  
  // 平台代码映射（仅保留后端约定的别名）
  const platformMapping: Record<string, string> = {
    'PA': 'AG',  // PA视讯映射为AG
    'CQ': 'CQ9',
    'BA': 'BG'
  };
  
  if (platformMapping[apiCode]) {
    console.log(`🔄 平台代码映射: ${apiCode} -> ${platformMapping[apiCode]}`);
    apiCode = platformMapping[apiCode];
  }
  
  // ========== 旧接口余额转入逻辑（所有游戏类型） ==========
  // 游戏类型：1=真人, 2=捕鱼, 3=电游, 4=彩票, 5=体育, 6=棋牌, 7=电竞
  const needTransferIn = params.gameType >= 1 && params.gameType <= 7;
  
  if (needTransferIn) {
    // 异步执行余额转入，不阻塞游戏URL获取
    (async () => {
      try {
        // 1. 获取用户钱包余额
        const { getUserInfo } = await import('@/lib/api/auth');
        let userInfoResponse = await getUserInfo();
        
        // 处理可能的字符串响应，避免 JSON.parse 抛错导致余额逻辑异常
        if (Object.prototype.toString.call(userInfoResponse) !== '[object Object]') {
          const raw = String(userInfoResponse ?? '').replace(/\{"lang":"zh_cn"\}/g, '').trim();
          if (raw && (raw.startsWith('{') || raw.startsWith('['))) {
            try {
              userInfoResponse = JSON.parse(raw);
            } catch {
              userInfoResponse = {};
            }
          } else {
            userInfoResponse = {};
          }
        }
        
        if (userInfoResponse?.status === 'error') return;
        
        // 获取余额（与 AuthContext 中的逻辑一致）
        // 优先使用 money 字段，然后是 balance 字段
        const walletBalance = userInfoResponse?.data?.money !== undefined && userInfoResponse?.data?.money !== null
          ? userInfoResponse.data.money
          : (userInfoResponse?.data?.balance !== undefined && userInfoResponse?.data?.balance !== null
            ? userInfoResponse.data.balance
            : 0);
        
        if (walletBalance > 0) {
          // 2. 获取游戏中的余额
          let gameBalance = 0;
          try {
            const balanceResponse = await getGameBalance(apiCode);
            if (balanceResponse && balanceResponse.code === 200) {
              gameBalance = parseFloat(String(balanceResponse.money || balanceResponse.data?.money || '0')) || 0;
            }
          } catch {
            gameBalance = 0;
          }
          
          // 3. 计算需要转入的金额（钱包余额 - 游戏中余额）
          const transferAmount = walletBalance - gameBalance;
          
          // 4. 如果有余额需要转入，执行转入操作
          if (transferAmount > 0.01) {
            try {
              const transferResponse = await gameTransferIn(apiCode, transferAmount);
              if (transferResponse && (transferResponse.code === 200 || transferResponse.status === 'success')) {
                // 余额转入成功
              }
            } catch {
              // 余额转入失败不影响游戏启动
            }
          }
        }
      } catch {
        // 余额转入失败不影响游戏启动
      }
    })();
  }
  // ========== 旧接口余额转入逻辑结束 ==========
  
  // 获取语言参数
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  
  // 构建查询参数
  const queryParams: any = {
    api_code: apiCode,
    gameType: params.gameType,
    isMobile: params.isMobile || 1,
    lang: lang
  };
  
  // 如果游戏代码存在且不为0，则添加
  if (params.gameCode && params.gameCode !== '0' && params.gameCode !== '') {
    queryParams.gameCode = params.gameCode;
  }
  
  // 调试日志：打印请求参数
  // 使用GET请求，所有参数放在URL查询参数中
  return apiClient.get('game/login', {
    params: queryParams
  }).then((res: any) => {
    // 处理响应数据，支持多种URL字段名（参考Vue项目的responseTransformers）
    const responseData = res?.data || res || {};
    const nestedData = responseData.data || responseData;
    
    // 尝试多种方式获取URL（包括大小写变体）
    const url = nestedData.game_url || 
                nestedData.gameUrl ||
                nestedData.url || 
                nestedData.URL ||
                nestedData.href || 
                nestedData.Href ||
                responseData.game_url || 
                responseData.gameUrl ||
                responseData.url || 
                responseData.URL ||
                responseData.href ||
                res.url ||
                res.game_url ||
                '';
    
    // 提取错误信息
    const message = res?.message || 
                    res?.Message || 
                    res?.msg || 
                    nestedData?.message ||
                    nestedData?.Message ||
                    '';
    
    // 正确判断：status === 'error' 时视为失败，即使code是200
    if (res?.status === 'error') {
      return {
        code: res?.code || 400,
        message: message || res?.message || '获取游戏链接失败',
        status: 'error',
        data: {}
      };
    }
    
    // 判断成功条件：status === 'success' 或 (code为200且status不是error) 且有URL
    if ((res?.status === 'success' || (res?.code === 200 && res?.status !== 'error')) && url) {
      return {
        code: 200,
        message: message || '成功',
        status: 'success',
        data: { 
          game_url: url,
          url: url
        }
      };
    }
    
    // 如果没有URL，返回错误
    if (!url) {
      return {
        code: res?.code || 400,
        message: message || '游戏链接为空，请稍后重试',
        status: res?.status || 'error',
        data: {}
      };
    }
    
    // 其他情况
    return {
      code: res?.code || 400,
      message: message || '获取游戏链接失败',
      status: res?.status || 'error',
      data: { 
        game_url: url || '',
        url: url || ''
      }
    };
  });
};

// 游戏记录相关
export interface GameRecord {
  id?: number;
  bet_id?: string; // 订单号
  Code?: string; // 游戏代码/名称
  api_name?: string; // 游戏平台名称
  api_name_text?: string; // 游戏平台名称文本（后端append字段）
  game_name?: string; // 游戏名称
  betAmount?: number; // 投注金额（后端字段名）
  bet_amount?: number; // 投注金额（兼容）
  validBetAmount?: number; // 有效投注金额（后端字段名）
  valid_bet_amount?: number; // 有效投注金额（兼容）
  win_amount?: number; // 派彩金额
  netAmount?: number; // 净盈亏（后端字段名）
  net_amount?: number; // 净盈亏（兼容）
  win_loss?: number; // 盈亏金额（派彩）
  betTime?: string; // 投注时间（后端字段名，可能是Date对象）
  bet_time?: string; // 投注时间（兼容）
  created_at?: string; // 创建时间
  state?: number | string; // 状态
  status?: number | string; // 状态（兼容）
  [key: string]: any;
}

export interface GameRecordRequest {
  page?: number;
  limit?: number;
  api_name?: string; // 游戏平台名称（后端参数名）
  api_code?: string; // 游戏平台代码（兼容）
  api_type?: string; // 游戏平台类型（兼容）
  gameType?: string | number; // 游戏类型筛选（后端参数名）
  game_type?: string | number; // 游戏类型筛选（兼容）
  date?: string; // 日期筛选（Vue中使用：1=今日, 2=7日内, 3=半月内, 4=一月内）
  created_at?: string[]; // 创建时间数组（后端参数名）
  start_time?: string; // 开始时间（兼容，会转换为created_at）
  end_time?: string; // 结束时间（兼容，会转换为created_at）
}

export interface GameRecordResponse {
  code: number;
  message: string;
  data: {
    data: GameRecord[]; // 分页数据中的记录列表（直接是数组）
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
    first_page_url?: string;
    last_page_url?: string;
    next_page_url?: string | null;
    prev_page_url?: string | null;
    from?: number | null;
    to?: number | null;
    path?: string;
    statistic?: {
      sum_bet_amount?: number; // 总投注
      sum_valid_bet_amount?: number; // 总有效投注
      sum_net_amount?: number; // 总派彩金额
    };
    apis?: string[]; // API列表
    gametypes?: Array<{ key: string | number; value: string }>; // 游戏类型列表
  };
}

// 获取游戏类型
export interface GameType {
  value: number | string;
  label: string;
}

export interface GameTypeResponse {
  code: number;
  message: string;
  data: GameType[];
}

export const getGameType = (): Promise<GameTypeResponse> => {
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  return apiClient.post(`/game/type?lang=${lang}`, {});
};

// 获取游戏记录（投注记录）
export const getGameRecord = (params: GameRecordRequest = {}): Promise<GameRecordResponse> => {
  // 根据接口清单：POST /game/record
  // 参考Vue实现，添加lang参数
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  
  // 构建请求参数（后端期望的参数名）
  // 根据接口文档：POST /api/game/record
  // 参数格式：
  // {
  //   "created_at": ["开始时间", "结束时间"],
  //   "api_name": "平台名称",
  //   "page": 1,
  //   "gameType": 游戏类型,
  //   "limit": 10
  // }
  const requestParams: any = {
    limit: params.limit || 20,
    page: params.page || 1
  };
  
  // 确保至少有一个参数，避免后端 $data 未初始化错误
  // 但根据后端代码，只要有参数传入就会初始化，所以这里应该没问题
  
  // 平台名称筛选（后端参数名是api_name）
  if (params.api_name) {
    requestParams.api_name = params.api_name;
  } else if (params.api_code) {
    requestParams.api_name = params.api_code; // 兼容api_code
  } else if (params.api_type) {
    requestParams.api_name = params.api_type; // 兼容api_type
  }
  
  // 游戏类型筛选（后端参数名是gameType）
  if (params.gameType !== undefined && params.gameType !== null && params.gameType !== '') {
    requestParams.gameType = params.gameType;
  } else if (params.game_type !== undefined && params.game_type !== null && params.game_type !== '') {
    requestParams.gameType = params.game_type; // 兼容game_type
  }
  
  // 时间筛选（后端参数名是created_at，格式为数组）
  if (params.created_at && Array.isArray(params.created_at)) {
    requestParams.created_at = params.created_at;
  } else if (params.date) {
    // 如果提供了date参数，转换为created_at数组
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startTime = '';
    let endTime = '';

    // 使用本地时间而不是UTC时间，避免时区问题
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (params.date) {
      case '1': // 今日
        startTime = formatLocalDate(today) + ' 00:00:00';
        endTime = formatLocalDate(now) + ' 23:59:59';
        break;
      case '2': // 昨日
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startTime = formatLocalDate(yesterday) + ' 00:00:00';
        endTime = formatLocalDate(yesterday) + ' 23:59:59';
        break;
      case '3': // 半月内
        const halfMonthAgo = new Date(today);
        halfMonthAgo.setDate(halfMonthAgo.getDate() - 15);
        startTime = formatLocalDate(halfMonthAgo) + ' 00:00:00';
        endTime = formatLocalDate(now) + ' 23:59:59';
        break;
      case '4': // 30天内
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startTime = formatLocalDate(thirtyDaysAgo) + ' 00:00:00';
        endTime = formatLocalDate(now) + ' 23:59:59';
        break;
    }
    
    requestParams.created_at = [startTime, endTime];
  } else if (params.start_time && params.end_time) {
    // 兼容start_time和end_time，转换为created_at数组
    requestParams.created_at = [params.start_time, params.end_time];
  }
  
  console.log('📊 投注记录请求参数:', requestParams);
  
  return apiClient.post(`/game/record?lang=${lang}`, requestParams);
};

// 游戏转账相关
export interface GameTransferRequest {
  api_code: string; // 游戏平台代码
  type: 'in' | 'out'; // 转入或转出
  amount?: number; // 转账金额（可选，不传则全部）
}

export interface GameTransferResponse {
  code: number;
  message: string;
  status?: string; // 添加 status 属性
  data?: any;
}

// 游戏转账（转入或转出）
export const gameTransfer = (params: GameTransferRequest): Promise<GameTransferResponse> => {
  // 根据接口清单：POST /game/change_trans 或 /game/transfer
  // 添加lang参数到URL（参考编译后的Vue代码）
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  return apiClient.post(`game/change_trans?lang=${encodeURIComponent(lang)}`, {
    api_code: params.api_code,
    type: params.type,
    amount: params.amount
  }).then((res: any): GameTransferResponse => {
    // 确保返回类型符合 GameTransferResponse
    return {
      code: res.code || 200,
      message: res.message || '',
      status: res.status,
      data: res.data
    };
  }).catch((error: any) => {
    // 如果change_trans接口不存在，尝试使用transfer接口
    if (error.response?.status === 404 || error.code === 404) {
      return apiClient.post(`game/transfer?lang=${encodeURIComponent(lang)}`, {
        api_code: params.api_code,
        type: params.type,
        amount: params.amount
      }).then((res: any): GameTransferResponse => {
        // 确保返回类型符合 GameTransferResponse
        return {
          code: res.code || 200,
          message: res.message || '',
          status: res.status,
          data: res.data
        };
      });
    }
    throw error;
  });
};

// 游戏转入（从钱包转到游戏平台）- 使用正确的 game/deposit 接口
export const gameDeposit = async (apiCode: string, money?: number): Promise<GameTransferResponse> => {
  if (shouldUseBetProxy()) {
    const amount = money !== undefined && money !== null && !Number.isNaN(money) ? Math.max(0, money) : 0;
    if (amount < 0.01) return Promise.reject(new Error('转入金额无效'));
    const playerId = toBetPlayerId(await getUserId());
    if (!playerId) return Promise.reject(new Error('请先登录'));
    const platType = apiCodeToPlatType(apiCode);
    const currency = langToCurrency(localStorage.getItem('ly_lang') || 'zh_cn');
    await betTransfer({
      playerId,
      platType,
      currency,
      type: '1',
      amount: String(Math.floor(amount * 100) / 100),
      orderId: `in_${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    });
    return { code: 200, message: '成功', status: 'success', data: { money: amount } };
  }
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  const amount = money !== undefined && money !== null && !Number.isNaN(money) ? Math.floor(money) : undefined;
  if (amount === undefined || amount < 0) {
    return Promise.reject(new Error('转入金额无效'));
  }
  return apiClient.post(`game/deposit?lang=${encodeURIComponent(lang)}`, {
    api_code: apiCode,
    money: amount
  }).then((res: any): GameTransferResponse => ({
    code: res.code ?? 200,
    message: res.message ?? '',
    status: res.status,
    data: { money: res.money, ...(res.data || {}) }
  }));
};

// 游戏转入（从钱包转到游戏平台）- 调用 game/deposit
// 注意：game/change_trans 仅用于切换自动转入设置，不执行实际转账
export const gameTransferIn = (apiCode: string, amount?: number): Promise<GameTransferResponse> => {
  return gameDeposit(apiCode, amount);
};

// 获取游戏接口余额
export const getGameBalance = async (apiCode: string): Promise<any> => {
  if (shouldUseBetProxy()) {
    const playerId = toBetPlayerId(await getUserId());
    if (!playerId) return { code: 400, message: '未登录', money: 0 };
    const platType = apiCodeToPlatType(apiCode);
    const currency = langToCurrency(localStorage.getItem('ly_lang') || 'zh_cn');
    const { data } = await betBalance({ playerId, platType, currency });
    const money = Number(data?.balance ?? 0) || 0;
    return { code: 200, message: '', money, data: { money } };
  }
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  return apiClient.post(`game/balance?lang=${encodeURIComponent(lang)}`, {
    api_code: apiCode
  }).then((res: any) => {
    return res;
  });
};

// 游戏转出（从游戏平台转回钱包）
export const gameTransferOut = async (apiCode: string): Promise<GameTransferResponse> => {
  if (shouldUseBetProxy()) {
    const playerId = toBetPlayerId(await getUserId());
    if (!playerId) return { code: 400, message: '请先登录', status: 'error', data: {} };
    const platType = apiCodeToPlatType(apiCode);
    const currency = langToCurrency(localStorage.getItem('ly_lang') || 'zh_cn');
    const balanceRes = await betBalance({ playerId, platType, currency });
    const balance = Number(balanceRes.data?.balance ?? 0) || 0;
    if (balance <= 0) {
      return { code: 200, message: '该接口余额为0，无需转出', status: 'success', data: { money: 0 } };
    }
    const amount = Math.floor(balance * 100) / 100;
    await betTransfer({
      playerId,
      platType,
      currency,
      type: '2',
      amount: String(amount),
      orderId: `out_${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    });
    return { code: 200, message: '转出成功', status: 'success', data: { money: amount } };
  }
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  let balance = 0;
  try {
    const balanceRes = await getGameBalance(apiCode);
    
    // 根据日志，后端返回格式：{ status: "success", code: 200, message: "", money: "206" }
    // money 字段直接在 balanceRes 上，不在 balanceRes.data 里
    if (balanceRes.code === 200) {
      // 优先从 balanceRes.money 获取（直接字段）
      if (balanceRes.money !== undefined && balanceRes.money !== null) {
        balance = parseFloat(String(balanceRes.money)) || 0;
      } 
      // 如果没有，尝试从 balanceRes.data.money 获取
      else if (balanceRes.data && balanceRes.data.money !== undefined) {
        balance = parseFloat(String(balanceRes.data.money)) || 0;
      }
    }
    
    if (balance <= 0) {
      return {
        code: 200,
        message: '该接口余额为0，无需转出',
        status: 'success',
        data: { money: 0 }
      };
    }
  } catch {
    throw new Error('获取接口余额失败，无法转出');
  }
  
  // 步骤2: 调用 withdrawal 接口转出
  // 关键：必须传递 money 参数，且必须是大于0的整数
  // 后端会执行 intval($money)，所以传整数
  const withdrawalParams: any = {
    api_code: apiCode,
    money: Math.floor(balance) // 向下取整，确保是整数
  };
  
  // 验证金额
  if (!withdrawalParams.money || withdrawalParams.money <= 0) {
    throw new Error('转出金额无效，无法转出');
  }
  
  return apiClient.post(`game/withdrawal?lang=${encodeURIComponent(lang)}`, withdrawalParams).then((res: any) => {
    // 根据实际日志，后端返回格式：{ status: "success", code: 200, message: "", money: 200 }
    // money 字段直接在 res 上，不在 res.data 里
    
    if (res.status === 'error') {
      return {
        code: res.code || 400,
        message: res.message || '转出失败',
        status: 'error',
        data: {}
      };
    }
    
    if (res.code !== 200) {
      return {
        code: res.code || 400,
        message: res.message || '转出失败',
        status: 'error',
        data: {}
      };
    }
    
    return {
      code: res.code || 200,
      message: res.message || '转出成功',
      status: res.status || 'success',
      data: {
        money: res.money || withdrawalParams.money,
        ...(res.data || {})
      }
    };
  }).catch((error: any) => {
    console.error('❌ 转出API异常:', error);
    console.error('❌ 错误响应:', error.response?.data || error.message);
    throw error;
  });
};

// 获取单个接口余额
export interface ApiMoneyInfo {
  api_name: string;
  api_title: string;
  money: number | string;
}

export interface ApiMoneyResponse {
  code: number;
  message: string;
  data: {
    money_info: ApiMoneyInfo[];
    is_trans_on?: number;
  };
}

export const getApiMoney = (apiCode: string): Promise<ApiMoneyResponse> => {
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  return apiClient.post(`game/api_money?lang=${encodeURIComponent(lang)}`, {
    api_code: apiCode
  }).then((res: any) => {
    return {
      code: res.code || 200,
      message: res.message || '',
      data: res.data || { money_info: [] }
    };
  });
};

// 获取所有接口余额
export interface ApiMoneysResponse {
  code: number;
  message: string;
  data: {
    api_moneys: ApiMoneyInfo[];
  };
}

export const getApiMoneys = (): Promise<ApiMoneysResponse> => {
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  return apiClient.post(`game/api_moneys?lang=${encodeURIComponent(lang)}`, {}).then((res: any) => {
    return {
      code: res.code || 200,
      message: res.message || '',
      data: res.data || { api_moneys: [] }
    };
  });
};

