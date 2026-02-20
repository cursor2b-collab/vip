/**
 * 取款相关API
 * 统一走 houduan:
 *   GET  /api/v1/withdraw/config   - 配置（最小/最大金额、手续费）
 *   GET  /api/v1/withdraw/accounts - 绑定账户列表
 *   POST /api/v1/withdraw/submit   - 提交提现（accountId + amount + fundPassword）
 *   GET  /api/v1/withdraw/records  - 提现记录
 *   POST /api/v1/withdraw/cancel   - 撤销提现
 */
import phpGameClient from './php-game-client';
import { supabase, USE_SUPABASE_AUTH } from '@/lib/supabase';

export interface WithdrawRequest {
  name?: string;
  money: number | string;
  account?: string;
  member_bank_id: number | string;
  member_bank_text?: string;
  member_remark?: string;
  qk_pwd: string;
  amount?: number;
  bank_id?: number | string;
}

export interface WithdrawResponse {
  code: number;
  message: string;
  data?: any;
}

// 提交取款申请 → POST /api/v1/withdraw/submit
export const submitWithdraw = (params: WithdrawRequest): Promise<WithdrawResponse> => {
  const amount = Number(params.money ?? params.amount ?? 0);

  return (async (): Promise<WithdrawResponse> => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return { code: 401, message: '请先登录', data: null };
        const { data: trano, error } = await supabase.rpc('submit_withdraw_order', {
          p_user_id: user.id,
          p_amount: amount,
          p_accountname: params.name ?? '',
          p_bankname: params.member_bank_text ?? '',
          p_banknumber: params.account ?? '',
          p_paytype: 'bank',
          p_paytypename: '银行卡'
        });
        if (error) return { code: 400, message: error.message || '提现失败', data: null };
        return { code: 200, message: '提交成功', data: { trano } };
      } catch (e: any) {
        return { code: 500, message: e?.message ?? '提现失败', data: null };
      }
    }

    return phpGameClient.post('withdraw/submit', {
      accountId: params.member_bank_id || params.bank_id,
      amount,
      fundPassword: params.qk_pwd
    }).then((res: any) => ({
      code: res?.code === 0 ? 200 : (res?.code ?? 400),
      message: res?.message ?? '',
      data: res?.data
    })).catch((err: any) => ({
      code: err?.code ?? 500,
      message: err?.message ?? '提现失败',
      data: null
    }));
  })();
};

// 获取提现配置 → GET /api/v1/withdraw/config
export const getWithdrawConfig = (): Promise<any> => {
  return phpGameClient.get('withdraw/config').then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data ?? {}
  })).catch(() => ({ code: 200, message: '', data: {} }));
};

// 获取提现记录 → GET /api/v1/withdraw/records
export const getWithdrawRecords = (params: { page?: number; pageSize?: number } = {}): Promise<any> => {
  return phpGameClient.get('withdraw/records', { params: { page: params.page ?? 1, pageSize: params.pageSize ?? 20 } }).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data ?? { list: [], total: 0 }
  })).catch(() => ({ code: 200, message: '', data: { list: [], total: 0 } }));
};

// 撤销提现 → POST /api/v1/withdraw/cancel
export const cancelWithdraw = (trano: string): Promise<WithdrawResponse> => {
  return phpGameClient.post('withdraw/cancel', { trano }).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  }));
};
