/**
 * 团队管理（推广赚钱）相关API
 * 当使用 Supabase 认证时，邀请码从 profiles.invite_code / RPC ensure_invite_code 获取
 * 使用 PHP 后端时走 phpGameClient，推广链接可依赖 auth/profile 返回的 invite_code
 */
import apiClient from './client';
import phpGameClient from './php-game-client';
import { supabase, USE_SUPABASE_AUTH } from '@/lib/supabase';

const usePhpBackend = import.meta.env.VITE_USE_PHP_GAME_BACKEND === 'true';

export interface TeamMember {
  id: number;
  name: string;
  balance: number;
  total_recharge: number;
  total_withdraw: number;
  created_at: string;
  [key: string]: any;
}

export interface TeamChildListRequest {
  page?: number;
  limit?: number;
  name?: string;
}

export interface TeamChildListResponse {
  code: number;
  message: string;
  data: {
    data: TeamMember[];
    total?: number;
  };
}

export interface TeamMoneyLogRequest {
  page?: number;
  limit?: number;
  member_name?: string;
}

export interface TeamMoneyLogResponse {
  code: number;
  message: string;
  data: {
    data: any[];
    total?: number;
  };
}

export interface TeamAddRequest {
  name: string;
  password?: string;
  code?: string;
  key?: string;
  [key: string]: any;
}

export interface TeamGameRecordRequest {
  page?: number;
  limit?: number;
  member_name?: string;
}

export interface TeamGameRecordResponse {
  code: number;
  message: string;
  data: {
    data: any[];
    total?: number;
  };
}

export interface TeamRate {
  api_name: string;
  rate: number;
  [key: string]: any;
}

export interface TeamFdInfoResponse {
  code: number;
  message: string;
  data: {
    agent_rates: TeamRate[];
  };
}

export interface TeamChartResponse {
  code: number;
  message: string;
  data: any;
}

export interface TeamReportRequest {
  start_time?: string;
  end_time?: string;
  created_at?: string; // 后端可能需要的字段
  [key: string]: any;
}

export interface TeamReportResponse {
  code: number;
  message: string;
  data: any;
}

export interface InviteLink {
  id: number;
  code: string;
  url: string;
  status: number;
  created_at: string;
  [key: string]: any;
}

export interface InviteLinkListResponse {
  code: number;
  message: string;
  data: InviteLink[];
}

export interface CreateInviteLinkRequest {
  name?: string;
  rates?: any; // 返点比例数据
  [key: string]: any;
}

export interface UpdateInviteLinkRequest {
  id: number;
  name?: string;
  status?: number;
}

export interface TeamResponse {
  code: number;
  message: string;
  data?: any;
}

// 获取下级会员列表
export const getTeamChildList = (params: TeamChildListRequest = {}): Promise<TeamChildListResponse> => {
  if (USE_SUPABASE_AUTH) {
    return (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return { code: 401, message: '未登录', data: { data: [], total: 0 } };
      const page = params.page || 1;
      const limit = params.limit || 20;
      const from = (page - 1) * limit;
      let q = supabase.from('profiles').select('id, username, nickname, balance, total_deposit, created_at', { count: 'exact' }).eq('inviter_id', session.user.id);
      if (params.name?.trim()) q = q.ilike('username', '%' + params.name.trim() + '%');
      const { data: rows, count, error } = await q.order('created_at', { ascending: false }).range(from, from + limit - 1);
      if (error) return { code: 500, message: error.message, data: { data: [], total: 0 } };
      const data = (rows ?? []).map((r: any) => ({
        id: r.id,
        name: r.nickname || r.username || r.id?.slice(0, 8),
        balance: Number(r.balance ?? 0),
        total_recharge: Number(r.total_deposit ?? 0),
        total_withdraw: 0,
        created_at: r.created_at
      }));
      return { code: 200, message: 'ok', data: { data, total: count ?? 0 } };
    })();
  }
  return apiClient.post('/team/childlist', {
    page: params.page || 1,
    limit: params.limit || 20,
    name: params.name || ''
  }).then((res: any) => {
    // 处理不同的响应结构
    if (res.code === 200) {
      // 如果data是数组，包装成标准格式
      if (Array.isArray(res.data)) {
        return {
          ...res,
          data: {
            data: res.data,
            total: res.total || res.data.length
          }
        };
      }
      // 如果data是对象但没有data字段，尝试从其他字段获取
      if (res.data && !res.data.data && !Array.isArray(res.data)) {
        const dataArray = res.data.list || res.data.members || [];
        return {
          ...res,
          data: {
            data: Array.isArray(dataArray) ? dataArray : [],
            total: res.data.total || res.total || 0
          }
        };
      }
    }
    return res;
  });
};

// 获取团队资金流水
export const getTeamMoneyLog = (params: TeamMoneyLogRequest = {}): Promise<TeamMoneyLogResponse> => {
  // 根据接口清单：POST /team/moneylog
  return apiClient.post('/team/moneylog', {
    page: params.page || 1,
    limit: params.limit || 20,
    member_name: params.member_name || ''
  });
};

// 添加团队成员
export const addTeamMember = (params: TeamAddRequest): Promise<TeamResponse> => {
  // 根据接口清单：POST /team/add
  return apiClient.post('/team/add', params);
};

// 获取团队游戏记录
export const getTeamGameRecord = (params: TeamGameRecordRequest = {}): Promise<TeamGameRecordResponse> => {
  // 根据接口清单：POST /team/gamerecord
  return apiClient.post('/team/gamerecord', {
    page: params.page || 1,
    limit: params.limit || 20,
    member_name: params.member_name || ''
  });
};

// 获取下级返点设置
export const getTeamChildRates = (params: { member_name?: string }): Promise<TeamResponse> => {
  // 根据接口清单：POST /team/childrates
  return apiClient.post('/team/childrates', params);
};

/** 从 Supabase 获取当前用户邀请码（无则生成并回写），用于推广链接 */
export async function getMyInviteCodeFromSupabase(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;
  const { data, error } = await supabase.rpc('ensure_invite_code', { p_user_id: session.user.id });
  if (error) return null;
  return data ?? null;
}

/** 获取注册页带邀请码的完整 URL（前端域名 + /Register?i=code） */
export function getInviteRegisterUrl(code: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/Register?i=${encodeURIComponent(code)}`;
  }
  return `/Register?i=${encodeURIComponent(code)}`;
}

// 获取返点信息
export const getTeamFdInfo = (): Promise<TeamFdInfoResponse> => {
  if (USE_SUPABASE_AUTH) {
    return Promise.resolve({ code: 200, message: 'ok', data: { agent_rates: [] } });
  }
  if (usePhpBackend) {
    return phpGameClient.get('team/fdinfo').then((res: any) => ({
      code: 200,
      message: res?.message ?? 'ok',
      data: { agent_rates: res?.data?.agent_rates ?? res?.agent_rates ?? [] }
    })).catch(() => ({ code: 200, message: 'ok', data: { agent_rates: [] } }));
  }
  return apiClient.get('/team/fdinfo');
};

// 获取团队图表数据
export const getTeamChart = (): Promise<TeamChartResponse> => {
  // 根据接口清单：POST /team/chart
  return apiClient.post('/team/chart');
};

// 获取团队报表
export const getTeamReport = (params: TeamReportRequest = {}): Promise<TeamReportResponse> => {
  if (USE_SUPABASE_AUTH) {
    return Promise.resolve({ code: 200, message: 'ok', data: {} });
  }
  if (usePhpBackend) {
    return phpGameClient.post('team/report', params).then((res: any) => ({
      code: 200,
      message: res?.message ?? 'ok',
      data: res?.data ?? {}
    })).catch(() => ({ code: 200, message: 'ok', data: {} }));
  }
  return apiClient.post('/team/report', params);
};

// 获取邀请链接列表（PHP 后端无此接口时返回空列表，由页面用 userInfo.invite_code 生成推广链接）
export const getInviteLinkList = (): Promise<InviteLinkListResponse> => {
  if (usePhpBackend) {
    return phpGameClient.get('team/invite/list').then((res: any) => {
      const raw = res?.data ?? res?.list ?? res?.links ?? [];
      const list = Array.isArray(raw) ? raw : (res?.data?.list ?? res?.data?.data ?? []);
      const data = Array.isArray(list) ? list : [];
      return { code: 200, message: res?.message ?? '', data };
    }).catch(() => ({ code: 200, message: '', data: [] }));
  }
  return apiClient.get('/team/invite/list').then((res: any) => {
    if (res.code === 200) {
      if (Array.isArray(res.data)) return res;
      if (res.data && !Array.isArray(res.data)) {
        const linkArray = res.data.list || res.data.data || res.data.links || [];
        return { ...res, data: Array.isArray(linkArray) ? linkArray : [] };
      }
    }
    return res;
  });
};

// 创建邀请链接（PHP 后端无此接口时返回失败，页面用 userInfo.invite_code 展示）
export const createInviteLink = (params: CreateInviteLinkRequest = {}): Promise<TeamResponse> => {
  if (usePhpBackend) {
    return phpGameClient.post('team/invite/create', params).then((res: any) => ({
      code: res?.code === 0 || res?.code === 200 ? 200 : res?.code ?? 200,
      message: res?.message ?? '',
      data: res?.data
    })).catch(() => ({ code: 500, message: '创建失败', data: undefined }));
  }
  return apiClient.post('/team/invite/create', params);
};

// 更新邀请链接
export const updateInviteLink = (params: UpdateInviteLinkRequest): Promise<TeamResponse> => {
  // 根据接口清单：POST /team/invite/update
  return apiClient.post('/team/invite/update', params);
};

// export const getRechargeInfo = (bill_no: string = ''): Promise<any> => {
//   return apiClient.get('/recharge/info', {
//     params: {
//       bill_no
//     }
//   }).then((res: any) => {
//     return {
//       code: res.code || 200,
//       message: res.message || '',
//       data: res.data?.data || res.data || {}
//     };
//   });
// };
export const getRechargeInfo = (params: any): Promise<any> => {
  // 根据接口清单：POST auth/info/update
  return apiClient.post('/recharge/info', params).then((res: any) => {
    // 处理不同的响应结构
    if (res.code === 200) {
      return {
        "status": "success",
        "code": 200,
        "message": "",
        data: res.data
      };
    }
    return res;
  });
};