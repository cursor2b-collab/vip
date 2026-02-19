/**
 * 活动相关API（Supabase / PHP 后端 / apiClient）
 */
import apiClient from './client';
import phpGameClient from './php-game-client';
import { supabase, USE_SUPABASE_DATA, SUPABASE_TABLES } from '@/lib/supabase';

const usePhpBackend = import.meta.env.VITE_USE_PHP_GAME_BACKEND === 'true';

function resolveUploadUrl(path: string | undefined | null): string {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (import.meta.env.VITE_BACKEND_URL as string || '').replace(/\/+$/, '');
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path;
}

export interface Activity {
  id: number;
  title: string;
  banner: string;
  content: string;
  memo?: string;
  type: number | string;
  type_text?: string;
  created_at: string;
  start_date?: string;
  end_date?: string;
}

export interface ActivityListResponse {
  code: number;
  message: string;
  data: Activity[] | { data: Activity[] };
}

export interface ActivityDetailResponse {
  code: number;
  message: string;
  data: Activity;
}

export interface ActivityApplyResponse {
  code: number;
  message: string;
}

// 获取活动列表
export const getActivityList = (type?: string): Promise<ActivityListResponse> => {
  if (usePhpBackend) {
    const mapResponse = (res: any): Activity[] => {
      // 后端返回 { code: 0, data: { list: [...] } }，优先取 data.list
      const raw =
        (Array.isArray(res?.data?.list) ? res.data.list : null) ??
        (Array.isArray(res?.data?.data) ? res.data.data : null) ??
        (Array.isArray(res?.data) ? res.data : null) ??
        res?.activity ?? res?.list ?? res?.result ?? [];
      const list = Array.isArray(raw) ? raw : [];
      return list.map((item: any) => {
        const banner = item.cover_image ?? item.banner ?? item.hall_image ?? item.image ?? item.pic ?? '';
        return {
          id: item.id,
          title: item.title ?? item.name ?? '',
          banner: resolveUploadUrl(banner),
          content: item.content ?? '',
          memo: item.memo ?? item.desc,
          type: item.type ?? item.type_code ?? '',
          type_text: item.type_text ?? item.type_name,
          created_at: item.created_at ?? item.create_time ?? '',
          start_date: item.startDate ?? item.start_date ?? item.start_at ?? '',
          end_date: item.endDate ?? item.end_date ?? item.end_at ?? ''
        };
      });
    };
    // 正确接口为 GET /api/v1/activity/list（act/list 返回 404）
    return phpGameClient
      .get('activity/list', { params: { type: type || '' } })
      .then((res: any) => ({
        code: 200,
        message: res?.message ?? '获取成功',
        data: mapResponse(res)
      }))
      .catch((err: any) => ({
        code: err?.code ?? 500,
        message: err?.message ?? '获取失败',
        data: [] as Activity[]
      }));
  }
  if (USE_SUPABASE_DATA) {
    return (async () => {
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const { data: typeRows } = await supabase
        .from(SUPABASE_TABLES.activity_type)
        .select('code, name')
        .eq('status', 1);
      const typeNameMap: Record<string, string> = {};
      (typeRows ?? []).forEach((r: { code: string; name: string }) => {
        typeNameMap[r.code] = r.name;
      });
      let q = supabase
        .from(SUPABASE_TABLES.activity)
        .select('id, title, banner, content, desc, type_code, start_date, end_date, created_at')
        .eq('status', 1)
        .order('sort', { ascending: true })
        .order('id', { ascending: false });
      if (type && type !== 'all') {
        q = q.eq('type_code', type);
      }
      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      const list = (rows ?? []).filter(
        (row: any) => !row.end_date || String(row.end_date) >= nowStr
      );
      const activities: Activity[] = list.map((row: any) => ({
        id: row.id,
        title: row.title ?? '',
        banner: row.banner ?? '',
        content: row.content ?? '',
        memo: row.desc,
        type: row.type_code ?? '',
        type_text: typeNameMap[row.type_code] || undefined,
        created_at: row.created_at ?? '',
        start_date: row.start_date ?? '',
        end_date: row.end_date ?? ''
      }));
      return { code: 200, message: '', data: activities };
    })();
  }
  return apiClient.get('act/list', {
    params: { type: type || '' }
  }).then((res: any) => {
    let activities: Activity[] = [];
    const responseData = res.data || res;
    if (Array.isArray(responseData)) {
      activities = responseData;
    } else if (responseData?.activity && Array.isArray(responseData.activity)) {
      activities = responseData.activity;
    } else if (responseData?.data && Array.isArray(responseData.data)) {
      activities = responseData.data;
    }
    activities = activities.map((item: any) => ({
      ...item,
      banner: item.cover_image || item.banner || item.hall_image || ''
    }));
    return { ...res, data: activities };
  });
};

// 获取活动详情（后端接口：GET /api/v1/activity/detail/:id）
export const getActivityDetail = (id: number | string): Promise<ActivityDetailResponse> => {
  if (usePhpBackend) {
    return phpGameClient
      .get<{ code?: number; data?: any }>(`activity/detail/${id}`)
      .then((res: any) => {
        const row = res?.data ?? res;
        if (!row || typeof row !== 'object') {
          return { code: 404, message: '活动不存在', data: null as any };
        }
        const banner = row.cover_image ?? row.banner ?? row.hall_image ?? row.image ?? '';
        const activity: Activity & Record<string, unknown> = {
          ...row,
          id: row.id,
          title: row.title ?? row.name ?? '',
          banner: resolveUploadUrl(banner),
          content: row.content ?? '',
          memo: row.memo ?? row.desc ?? row.terms,
          type: row.type ?? row.type_code ?? row.typeCode ?? '',
          type_text: row.type_text ?? row.type_name,
          created_at: row.created_at ?? row.create_time ?? '',
          start_date: row.startDate ?? row.start_date ?? row.start_at ?? '',
          end_date: row.endDate ?? row.end_date ?? row.end_at ?? '',
          rule_content: row.rules ?? row.rule_content,
          apply_desc: row.apply_desc
        };
        return { code: 200, message: res?.message ?? '', data: activity };
      })
      .catch((err: any) => ({
        code: err?.code ?? 500,
        message: err?.message ?? '获取活动详情失败',
        data: null as any
      }));
  }
  if (USE_SUPABASE_DATA) {
    return supabase
      .from(SUPABASE_TABLES.activity)
      .select('*')
      .eq('id', Number(id))
      .single()
      .then(({ data: row, error }) => {
        if (error) throw new Error(error.message);
        if (!row) throw new Error('活动不存在');
        const activity: Activity = {
          id: row.id,
          title: row.title ?? '',
          banner: row.banner ?? '',
          content: row.content ?? '',
          memo: row.desc,
          type: row.type_code ?? '',
          type_text: undefined,
          created_at: row.created_at ?? '',
          start_date: row.start_date ?? '',
          end_date: row.end_date ?? ''
        };
        return { code: 200, message: '', data: activity };
      });
  }
  return apiClient.get(`act/${id}`).then((res: any) => {
    if (res.data) {
      res.data.banner = res.data.cover_image || res.data.banner || res.data.hall_image || '';
    }
    return res;
  });
};

// 申请活动
export const applyActivity = (
  activityid: number | string,
  params?: {
    member_name?: string;
    captcha?: string;
    key?: string;
  }
): Promise<ActivityApplyResponse> => {
  if (usePhpBackend) {
    return phpGameClient
      .post(`act/apply/${activityid}`, params || {})
      .then((res: any) => ({
        code: res?.code === 0 || res?.code === 200 ? 200 : res?.code ?? 200,
        message: res?.message ?? ''
      }))
      .catch((err: any) => ({
        code: err?.code ?? 500,
        message: err?.message ?? '申请失败'
      }));
  }
  return apiClient.post(`act/apply/${activityid}`, params || {});
};

// 洗码返利相关接口
export interface RebateItem {
  gameType: string;
  total_valid: number;
  rate: number;
  fs_money: number;
  game_type_text: string;
  api_names: string;
}

export interface RebateListResponse {
  code: number;
  message: string;
  data: RebateItem[];
  deadtime?: number;
  today?: number;
  yesterday?: number;
  total?: number;
}

export interface RebateClaimResponse {
  code: number;
  message: string;
}

// 规范化单条反水项（兼容后端 snake_case / camelCase 及嵌套）
function normalizeRebateItem(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const fsMoney = parseFloat(item.fs_money ?? item.fsMoney ?? item.rebate_amount ?? item.rebateAmount ?? 0);
  const totalValid = parseFloat(item.total_valid ?? item.totalValid ?? item.valid_bet ?? item.validBet ?? 0);
  const rate = parseFloat(item.rate ?? 0);
  const gameType = String(item.gameType ?? item.game_type ?? '');
  return {
    fs_money: fsMoney,
    total_valid: totalValid,
    rate,
    gameType,
    game_type_text: item.game_type_text ?? item.gameTypeText ?? item.game_type ?? '',
    api_names: item.api_names ?? item.apiNames ?? ''
  };
}

// 获取实时反水列表
export const getRebateList = (): Promise<RebateListResponse> => {
  // 后端 MemberController::fs_now_list 返回: status/code/message 与 data/deadtime/today/yesterday/total 合并后的单层对象
  return apiClient.get('fsnow/list').then((res: any) => {
    if (!res) {
      return {
        code: 200,
        message: '',
        status: 'success',
        data: [],
        deadtime: Math.floor(Date.now() / 1000),
        today: 0,
        yesterday: 0,
        total: 0
      };
    }

    // 列表：支持 res.data 为数组，或 res.data.data 为数组
    let rawList: any[] = [];
    if (Array.isArray(res.data)) {
      rawList = res.data;
    } else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.data)) {
      rawList = res.data.data;
    }

    // deadtime/today/yesterday/total：可能在顶层或 res.data 下
    const inner = res.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : res;
    const deadtime = inner.deadtime ?? res.deadtime ?? Math.floor(Date.now() / 1000);
    const today = Number(inner.today ?? res.today ?? 0) || 0;
    const yesterday = Number(inner.yesterday ?? res.yesterday ?? 0) || 0;
    const total = Number(inner.total ?? res.total ?? 0) || 0;

    const data = rawList.map(normalizeRebateItem);

    return {
      code: res.code ?? 200,
      message: res.message ?? '',
      status: res.status ?? 'success',
      data,
      deadtime,
      today,
      yesterday,
      total
    };
  }).catch((error: any) => {
    console.error('❌ getRebateList 请求失败:', error);
    console.error('❌ 错误详情:', {
      message: error.message,
      code: error.code,
      response: error.response,
      data: error.response?.data
    });
    // 即使请求失败，也返回空数据，不阻止页面显示
    return {
      code: error.code || 500,
      message: error.message || '请求失败',
      status: 'error',
      data: [],
      deadtime: Math.floor(Date.now() / 1000),
      today: 0,
      yesterday: 0,
      total: 0
    };
  });
};

// 领取实时反水
export const claimRebate = (deadtime: number): Promise<RebateClaimResponse> => {
  // 根据MemberController.php: fs_now()
  // 后端路由: Route::post('fsnow/fetch','MemberController@fs_now');
  return apiClient.post('fsnow/fetch', {
    deadtime: deadtime
  });
};