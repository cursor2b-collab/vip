/**
 * 取款相关API
 * 使用 Supabase 登录时通过 RPC submit_withdraw_order 扣余额并创建待审核订单，避免 PHP 401 导致闪退
 */
import apiClient from './client';
import { supabase, USE_SUPABASE_AUTH } from '@/lib/supabase';

export interface WithdrawRequest {
  name?: string; // 用户姓名（从userInfo获取）
  money: number | string; // 提现金额
  account?: string; // 提现账户
  member_bank_id: number; // 银行卡ID
  member_bank_text?: string; // 银行卡类型文本
  member_remark?: string; // 备注
  qk_pwd: string; // 提款密码
  
  // 兼容旧版本参数（向后兼容）
  amount?: number; // 兼容amount字段
  bank_id?: number; // 兼容bank_id字段
}

export interface WithdrawResponse {
  code: number;
  message: string;
  data?: any;
}

// 提交取款申请
export const submitWithdraw = (params: WithdrawRequest): Promise<WithdrawResponse> => {
  const amount = Number(params.money ?? params.amount ?? 0);
  const accountname = params.name ?? '';
  const bankname = params.member_bank_text ?? '';
  const banknumber = params.account ?? '';

  return (async (): Promise<WithdrawResponse> => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return { code: 401, message: '请先登录', data: null };
        const { data: trano, error } = await supabase.rpc('submit_withdraw_order', {
          p_user_id: user.id,
          p_amount: amount,
          p_accountname: accountname,
          p_bankname: bankname,
          p_banknumber: banknumber,
          p_paytype: 'bank',
          p_paytypename: '银行卡'
        });
        if (error) {
          const msg = error.message || '提现失败';
          return { code: 400, message: msg, data: null };
        }
        return { code: 200, message: '提交成功', data: { trano } };
      } catch (e: any) {
        return { code: 500, message: e?.message ?? '提现失败', data: null };
      }
    }

    const requestParams: any = {
      money: amount,
      member_bank_id: params.member_bank_id || params.bank_id || 0,
      qk_pwd: params.qk_pwd
    };
    if (params.name) requestParams.name = params.name;
    if (params.account) requestParams.account = params.account;
    if (params.member_bank_text) requestParams.member_bank_text = params.member_bank_text;
    if (params.member_remark) requestParams.member_remark = params.member_remark;
    const lang = localStorage.getItem('ly_lang') || 'zh_cn';
    return apiClient.post(`drawing?lang=${lang}`, requestParams).then((res: any) => ({
      code: res.code || (res.status === 'success' ? 200 : 400),
      message: res.message || '',
      data: res.data
    })).catch((error: any) => ({
      code: error.code || error.response?.status || 500,
      message: error.message || error.response?.data?.message || '提现失败',
      data: null
    }));
  })();
};

