/**
 * 资金流水相关API
 * 使用 Supabase 登录时从 balance_log 表读取，不再请求 PHP 接口，避免 401 导致退出登录
 */
import apiClient from './client';
import { supabase, USE_SUPABASE_AUTH, SUPABASE_TABLES } from '@/lib/supabase';

export interface MoneyLogRequest {
  page?: number;
  limit?: number;
  operate_type?: string; // 流水类型（后端参数名是operate_type）
  created_at?: string[]; // 时间范围（后端期望的是created_at数组）
  type?: string; // 兼容字段
  start_time?: string; // 兼容字段
  end_time?: string; // 兼容字段
}

export interface MoneyLogItem {
  id: number;
  operate_type?: string; // 操作类型
  operate_type_text?: string; // 操作类型文本（后端返回的字段名）
  money_type?: string; // 钱包类型
  money_type_text?: string; // 钱包类型文本
  type?: string; // 兼容字段
  type_text?: string; // 兼容字段
  money: number;
  number_type?: number; // 数量类型：1=增加(MONEY_TYPE_ADD), -1=减少(MONEY_TYPE_SUB)
  money_before?: number; // 变动前余额（后端字段名）
  money_after?: number; // 变动后余额（后端字段名）
  before_money?: number; // 兼容字段
  after_money?: number; // 兼容字段
  description?: string;
  created_at: string;
  [key: string]: any;
}

export interface MoneyLogResponse {
  code: number;
  message: string;
  data: any; // 使用any类型避免类型冲突，实际结构由后端决定
}

export interface MoneyLogType {
  value: string;
  label: string;
}

export interface MoneyLogTypeResponse {
  code: number;
  message: string;
  data: {
    operate_type?: Record<string, string>; // 操作类型对象
    money_type?: Record<string, string>; // 钱包类型对象
    [key: string]: any;
  };
}

// 是否使用 Supabase 流水：优先看是否有 Supabase 会话，避免仅因未配 VITE_USE_SUPABASE_AUTH 导致不显示
async function useSupabaseForMoneyLog(): Promise<boolean> {
  if (USE_SUPABASE_AUTH) return true;
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.access_token;
}

// 日期字符串转 ISO，便于 Postgres 比较
function toIsoDateTime(s: string): string {
  if (!s || !s.trim()) return s;
  return s.replace(' ', 'T') + (s.includes('T') ? '' : '');
}

// 从成功充值订单拉取并转为流水项（用于 balance_log 无数据或表不存在时的补显）
// 补显时不按日期筛订单查询，避免 confirmed_at 格式/时区导致 0 条；取最近 N 条后再在内存按日期过滤
async function fetchRechargeOrdersAsLog(
  userId: string,
  params: MoneyLogRequest,
  limit: number
): Promise<MoneyLogItem[]> {
  const q = supabase
    .from(SUPABASE_TABLES.usdt_recharge_orders)
    .select('id, cny_amount, confirmed_at, created_at')
    .eq('user_id', userId)
    .eq('status', 2)
    .order('created_at', { ascending: false })
    .limit(Math.max(limit, 50));
  const { data: orders } = await q;
  if (!orders?.length) return [];
  let list = orders.map((o: any) => {
    const at = o.confirmed_at || o.created_at || '';
    const amount = Number(o.cny_amount ?? 0);
    return {
      id: o.id,
      operate_type: 'recharge',
      operate_type_text: 'USDT充值',
      money: amount,
      number_type: 1,
      money_before: undefined as number | undefined,
      money_after: undefined as number | undefined,
      description: 'USDT充值到账',
      created_at: at ? new Date(at).toLocaleString('zh-CN') : '',
      _ts: at ? new Date(at).getTime() : 0,
      _amount: amount
    } as MoneyLogItem & { _ts?: number; _amount?: number };
  });
  if (params.start_time && params.end_time) {
    const startTs = new Date(toIsoDateTime(params.start_time)).getTime();
    const endTs = new Date(toIsoDateTime(params.end_time)).getTime();
    const inRange = list.filter((o: any) => o._ts >= startTs && o._ts <= endTs);
    if (inRange.length) list = inRange;
  }
  // 按时间正序推算每条记录的转入前/转入后余额（仅充值订单时准确）
  list.sort((a: any, b: any) => (a._ts || 0) - (b._ts || 0));
  let runningBalance = 0;
  list.forEach((o: any) => {
    o.money_before = runningBalance;
    runningBalance += o._amount ?? o.money ?? 0;
    o.money_after = runningBalance;
    delete o._amount;
  });
  list.sort((a: any, b: any) => (b._ts || 0) - (a._ts || 0));
  list.forEach((o: any) => delete o._ts);
  return list.slice(0, limit);
}

// 获取资金流水列表
export const getMoneyLog = (params: MoneyLogRequest = {}): Promise<MoneyLogResponse> => {
  return (async () => {
    const useSupabase = await useSupabaseForMoneyLog();
    if (useSupabase) {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const from = (page - 1) * limit;
      const opType = params.operate_type || params.type;
      let logData: MoneyLogItem[] = [];
      // 先查 balance_log（表可能不存在或为空）
      let q = supabase
        .from(SUPABASE_TABLES.balance_log)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);
      if (params.start_time && params.start_time.trim()) q = q.gte('created_at', params.start_time.trim());
      if (params.end_time && params.end_time.trim()) q = q.lte('created_at', params.end_time.trim());
      if (opType) q = q.eq('operate_type', opType);
      const { data: rows, error } = await q;
      if (!error && rows?.length) {
        logData = rows.map((r: any) => ({
          id: r.id,
          operate_type: r.operate_type,
          operate_type_text: r.operate_type_text ?? r.operate_type,
          money: Number(r.money ?? 0),
          number_type: Number(r.number_type ?? 1),
          money_before: r.money_before != null ? Number(r.money_before) : undefined,
          money_after: r.money_after != null ? Number(r.money_after) : undefined,
          description: r.description,
          created_at: r.created_at ? new Date(r.created_at).toLocaleString('zh-CN') : ''
        }));
      }
      if (logData.length === 0 && page === 1 && (!opType || opType === 'recharge')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const orderLogs = await fetchRechargeOrdersAsLog(user.id, params, limit);
          if (orderLogs.length) logData = orderLogs;
        }
      }
      const sumMoney = logData.reduce((s, l) => s + (Number(l.money) || 0), 0);
      return {
        code: 200,
        message: '',
        data: {
          data: logData,
          statistic: { sum_money: sumMoney, valid_money: sumMoney }
        }
      };
    }
    // PHP 接口
    const requestParams: any = { page: params.page || 1, limit: params.limit || 20 };
    if (params.start_time && params.end_time) requestParams.created_at = [params.start_time, params.end_time];
    else if (params.created_at) requestParams.created_at = params.created_at;
    if (params.operate_type) requestParams.operate_type = params.operate_type;
    else if (params.type) requestParams.operate_type = params.type;
    const lang = localStorage.getItem('ly_lang') || 'zh_cn';
    return await apiClient.post(`moneylog?lang=${encodeURIComponent(lang)}`, requestParams);
  })();
};

// 获取资金流水类型（有 Supabase 会话时返回本地类型，含 USDT充值）
const MONEY_LOG_TYPES = {
  operate_type: { recharge: 'USDT充值', '1': '管理员操作', '2': '系统赠送', '3': '游戏转入/转出', '4': '返水发放', '5': '签到活动' },
  money_type: {} as Record<string, string>
};

export const getMoneyLogType = (): Promise<MoneyLogTypeResponse> => {
  return (async () => {
    if (USE_SUPABASE_AUTH || (await supabase.auth.getSession()).data?.session?.access_token) {
      return { code: 200, message: '', data: MONEY_LOG_TYPES };
    }
    const lang = localStorage.getItem('ly_lang') || 'zh_cn';
    return apiClient.get(`moneylog/type?lang=${encodeURIComponent(lang)}`);
  })();
};

