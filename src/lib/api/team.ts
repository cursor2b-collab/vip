/**
 * 团队管理（推广赚钱）相关API
 * 统一走 houduan /api/v1/agent/* 路由：
 *   GET  agent/info              - 代理基本信息（含 invite_code）
 *   GET  agent/invite-info       - 邀请信息（含邀请码、下级数）
 *   GET  agent/overview          - 团队概览（团队图表）
 *   GET  agent/my-stats          - 我的统计（报表）
 *   GET  agent/performance       - 团队业绩报表
 *   GET  agent/commission        - 佣金信息（返点/fdinfo）
 *   GET  agent/commission-rates  - 返点比率
 *   GET  agent/subordinate/list  - 下级列表（childlist）
 *   GET  agent/subordinate/bets  - 下级投注（gamerecord）
 *   GET  agent/subordinate/finance - 下级资金流水（moneylog）
 *   POST agent/create-account    - 创建下级账号（team/add）
 *   POST agent/claim-commission  - 领取佣金
 */
import phpGameClient from './php-game-client';
import { supabase, USE_SUPABASE_AUTH } from '@/lib/supabase';

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
  data: { data: TeamMember[]; total?: number };
}

export interface TeamMoneyLogRequest {
  page?: number;
  limit?: number;
  member_name?: string;
}

export interface TeamMoneyLogResponse {
  code: number;
  message: string;
  data: { data: any[]; total?: number };
}

export interface TeamAddRequest {
  name: string;
  password?: string;
  code?: string;
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
  data: { data: any[]; total?: number };
}

export interface TeamRate {
  api_name: string;
  rate: number;
  [key: string]: any;
}

export interface TeamFdInfoResponse {
  code: number;
  message: string;
  data: { agent_rates: TeamRate[] };
}

export interface TeamChartResponse {
  code: number;
  message: string;
  data: any;
}

export interface TeamReportRequest {
  start_time?: string;
  end_time?: string;
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

/** 标准化响应 code（后端返 0 表示成功） */
function ok(res: any): number {
  return res?.code === 0 ? 200 : (res?.code ?? 200);
}

// 获取下级会员列表 → GET /api/v1/agent/subordinate/list
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
        id: r.id, name: r.nickname || r.username || r.id?.slice(0, 8),
        balance: Number(r.balance ?? 0), total_recharge: Number(r.total_deposit ?? 0),
        total_withdraw: 0, created_at: r.created_at
      }));
      return { code: 200, message: 'ok', data: { data, total: count ?? 0 } };
    })();
  }
  return phpGameClient.get('agent/subordinate/list', {
    params: { page: params.page ?? 1, pageSize: params.limit ?? 20, keyword: params.name ?? '' }
  }).then((res: any) => {
    const raw = res?.data?.list ?? res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return {
      code: ok(res), message: res?.message ?? '',
      data: { data: list.map((r: any) => ({
        id: r.id, name: r.nickname ?? r.username ?? '', balance: Number(r.balance ?? 0),
        total_recharge: Number(r.totalDeposit ?? r.total_recharge ?? 0),
        total_withdraw: Number(r.totalWithdraw ?? r.total_withdraw ?? 0),
        created_at: r.createdAt ?? r.created_at ?? ''
      })), total: res?.data?.total ?? list.length }
    };
  }).catch(() => ({ code: 200, message: '', data: { data: [], total: 0 } }));
};

// 获取团队资金流水 → GET /api/v1/agent/subordinate/finance
export const getTeamMoneyLog = (params: TeamMoneyLogRequest = {}): Promise<TeamMoneyLogResponse> => {
  return phpGameClient.get('agent/subordinate/finance', {
    params: { page: params.page ?? 1, pageSize: params.limit ?? 20, keyword: params.member_name ?? '' }
  }).then((res: any) => {
    const raw = res?.data?.list ?? res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return { code: ok(res), message: res?.message ?? '', data: { data: list, total: res?.data?.total ?? list.length } };
  }).catch(() => ({ code: 200, message: '', data: { data: [], total: 0 } }));
};

// 添加团队成员（创建下级账号） → POST /api/v1/agent/create-account
export const addTeamMember = (params: TeamAddRequest): Promise<TeamResponse> => {
  return phpGameClient.post('agent/create-account', {
    username: params.name,
    password: params.password,
  }).then((res: any) => ({
    code: ok(res), message: res?.message ?? '', data: res?.data
  }));
};

// 获取团队游戏记录（下级投注） → GET /api/v1/agent/subordinate/bets
export const getTeamGameRecord = (params: TeamGameRecordRequest = {}): Promise<TeamGameRecordResponse> => {
  return phpGameClient.get('agent/subordinate/bets', {
    params: { page: params.page ?? 1, pageSize: params.limit ?? 20, keyword: params.member_name ?? '' }
  }).then((res: any) => {
    const raw = res?.data?.list ?? res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return { code: ok(res), message: res?.message ?? '', data: { data: list, total: res?.data?.total ?? list.length } };
  }).catch(() => ({ code: 200, message: '', data: { data: [], total: 0 } }));
};

// 获取下级返点设置 → GET /api/v1/agent/commission-rates
export const getTeamChildRates = (_params: { member_name?: string }): Promise<TeamResponse> => {
  return phpGameClient.get('agent/commission-rates').then((res: any) => ({
    code: ok(res), message: res?.message ?? '', data: res?.data
  })).catch(() => ({ code: 200, message: '', data: {} }));
};

/** 从 Supabase 获取当前用户邀请码（无则生成并回写） */
export async function getMyInviteCodeFromSupabase(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;
  const { data, error } = await supabase.rpc('ensure_invite_code', { p_user_id: session.user.id });
  if (error) return null;
  return data ?? null;
}

/** 获取注册页带邀请码的完整 URL */
export function getInviteRegisterUrl(code: string): string {
  if (typeof window !== 'undefined') return `${window.location.origin}/Register?i=${encodeURIComponent(code)}`;
  return `/Register?i=${encodeURIComponent(code)}`;
}

// 获取返点/代理信息 → GET /api/v1/agent/commission
export const getTeamFdInfo = (): Promise<TeamFdInfoResponse> => {
  if (USE_SUPABASE_AUTH) return Promise.resolve({ code: 200, message: 'ok', data: { agent_rates: [] } });
  return phpGameClient.get('agent/commission').then((res: any) => {
    const d = res?.data ?? {};
    const rates: TeamRate[] = Array.isArray(d.rates)
      ? d.rates.map((r: any) => ({ api_name: r.platform ?? r.api_name ?? '', rate: Number(r.rate ?? 0) }))
      : Array.isArray(d.agent_rates) ? d.agent_rates : [];
    return { code: ok(res), message: res?.message ?? 'ok', data: { agent_rates: rates } };
  }).catch(() => ({ code: 200, message: 'ok', data: { agent_rates: [] } }));
};

// 获取团队图表/概览 → GET /api/v1/agent/overview
export const getTeamChart = (): Promise<TeamChartResponse> => {
  return phpGameClient.get('agent/overview').then((res: any) => ({
    code: ok(res), message: res?.message ?? '', data: res?.data ?? {}
  })).catch(() => ({ code: 200, message: '', data: {} }));
};

// 获取团队报表 → GET /api/v1/agent/performance
export const getTeamReport = (params: TeamReportRequest = {}): Promise<TeamReportResponse> => {
  if (USE_SUPABASE_AUTH) return Promise.resolve({ code: 200, message: 'ok', data: {} });
  return phpGameClient.get('agent/performance', {
    params: { startTime: params.start_time ?? '', endTime: params.end_time ?? '' }
  }).then((res: any) => ({
    code: ok(res), message: res?.message ?? 'ok', data: res?.data ?? {}
  })).catch(() => ({ code: 200, message: 'ok', data: {} }));
};

// 获取邀请信息/链接 → GET /api/v1/agent/invite-info
export const getInviteLinkList = (): Promise<InviteLinkListResponse> => {
  return phpGameClient.get('agent/invite-info').then((res: any) => {
    const d = res?.data ?? {};
    const inviteCode: string = d.inviteCode ?? d.invite_code ?? d.code ?? '';
    const registerUrl = inviteCode && typeof window !== 'undefined'
      ? `${window.location.origin}/Register?i=${encodeURIComponent(inviteCode)}` : '';
    const data: InviteLink[] = inviteCode ? [{
      id: 1, code: inviteCode, url: registerUrl, status: 1, created_at: ''
    }] : [];
    return { code: ok(res), message: res?.message ?? '', data };
  }).catch(() => ({ code: 200, message: '', data: [] }));
};

// 创建邀请链接（houduan 无专门接口，返回代理信息中的邀请码）
export const createInviteLink = (_params: CreateInviteLinkRequest = {}): Promise<TeamResponse> => {
  return phpGameClient.get('agent/invite-info').then((res: any) => ({
    code: ok(res), message: res?.message ?? '', data: res?.data
  })).catch(() => ({ code: 200, message: '', data: undefined }));
};

// 更新邀请链接（houduan 无专门接口，忽略）
export const updateInviteLink = (_params: UpdateInviteLinkRequest): Promise<TeamResponse> => {
  return Promise.resolve({ code: 200, message: '', data: undefined });
};

// 获取充值记录（用于充值状态查询） → GET /api/v1/recharge/records
export const getRechargeInfo = (params: any): Promise<any> => {
  return phpGameClient.get('recharge/records', { params: { page: 1, pageSize: 1, trano: params?.trano ?? '' } }).then((res: any) => ({
    status: 'success', code: ok(res), message: res?.message ?? '', data: res?.data
  })).catch(() => ({ status: 'error', code: 500, message: '获取失败', data: null }));
};
