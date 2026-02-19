/**
 * 银行卡管理相关API
 * 使用 Supabase 登录时从 user_bank 表读写，避免 /member/bank 401
 */
import apiClient from './client';
import { supabase, USE_SUPABASE_AUTH, SUPABASE_TABLES } from '@/lib/supabase';

export interface Bank {
  id: number;
  bank_name: string;
  bank_no: string;
  bank_owner: string;
  bank_address?: string;
  [key: string]: any;
}

export interface BankListResponse {
  code: number;
  message: string;
  data: Bank[];
}

export interface BankType {
  value: string;
  label: string;
}

export interface BankTypeResponse {
  code: number;
  message: string;
  data: BankType[];
  usdt?: {
    [key: string]: string; // 例如: {omni: 'Omni', erc: 'ERC20', trc: 'TRC20'}
  };
}

export interface WalletType {
  value: string;
  label: string;
}

export interface WalletTypeResponse {
  code: number;
  message: string;
  data: WalletType[];
}

export interface CreateBankRequest {
  bank_type: string; // 后端字段名：bank_type (开户银行)
  card_no: string; // 后端字段名：card_no (银行卡号/钱包地址)
  owner_name: string; // 后端字段名：owner_name (开户人姓名)
  bank_address?: string; // 开户网点
  wallet_type?: string; // 钱包类型（USDT时使用）
  qk_pwd?: string; // 提款密码（绑定/修改时验证）
  // 兼容前端使用的字段名
  bank_name?: string;
  bank_no?: string;
  bank_owner?: string;
}

export interface UpdateBankRequest extends CreateBankRequest {
  id: number;
}

export interface BankResponse {
  code: number;
  message: string;
  data?: Bank;
}

// 获取银行卡列表
export const getBankList = (): Promise<BankListResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return { code: 200, message: '', data: [] };
      const { data: rows, error } = await supabase
        .from(SUPABASE_TABLES.user_bank)
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: true });
      if (error) return { code: 500, message: error.message, data: [] };
      const list: Bank[] = (rows ?? []).map((r: any) => ({
        id: r.id,
        bank_name: r.bank_name ?? '',
        bank_no: r.bank_no ?? '',
        bank_owner: r.owner_name ?? '',
        bank_address: r.bank_address,
        card_no: r.bank_no ?? '',
        wallet_type: r.wallet_type ?? '',
        bank_type: r.bank_name ?? ''
      }));
      return { code: 200, message: '', data: list };
    }
    return apiClient.get('/member/bank');
  })();
};

// 使用 Supabase 登录时的默认银行/账户类型，便于用户绑定提款账户
const DEFAULT_BANK_TYPES: BankType[] = [
  { value: '银行卡', label: '银行卡' },
  { value: 'USDT', label: 'USDT' },
];
// 获取银行卡类型列表（Supabase 登录时后端 /member/bank/type 会 401，直接使用默认类型避免请求）
export const getBankType = (): Promise<BankTypeResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      return {
        code: 200,
        message: '',
        data: DEFAULT_BANK_TYPES,
        usdt: { omni: 'Omni', erc: 'ERC20', trc: 'TRC20' },
      } as BankTypeResponse;
    }
    return apiClient.get('/member/bank/type');
  })();
};

// 添加银行卡
export const createBank = (params: CreateBankRequest): Promise<BankResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return { code: 401, message: '请先登录', data: undefined };
      const insertPayload: Record<string, unknown> = {
        user_id: user.id,
        bank_name: params.bank_type || params.bank_name || '',
        bank_no: params.card_no || params.bank_no || '',
        owner_name: params.owner_name || params.bank_owner || '',
        bank_address: params.bank_address || null,
        updated_at: new Date().toISOString()
      };
      if (params.wallet_type) insertPayload.wallet_type = params.wallet_type;
      const { data: row, error } = await supabase
        .from(SUPABASE_TABLES.user_bank)
        .insert(insertPayload)
        .select()
        .single();
      if (error) {
        const msg = error.message || '';
        const friendly = /row-level security|RLS|policy/i.test(msg)
          ? '无法绑定：请确认已登录当前账号后重试'
          : msg;
        return { code: 400, message: friendly, data: undefined };
      }
      return {
        code: 200,
        message: '',
        data: {
          id: row.id,
          bank_name: row.bank_name,
          bank_no: row.bank_no,
          bank_owner: row.owner_name,
          bank_address: row.bank_address,
          card_no: row.bank_no
        }
      };
    }
    const requestParams: any = {
      bank_type: params.bank_type || params.bank_name || '',
      card_no: params.card_no || params.bank_no || '',
      owner_name: params.owner_name || params.bank_owner || '',
    };
    if (params.bank_address) requestParams.bank_address = params.bank_address;
    if (params.wallet_type) requestParams.wallet_type = params.wallet_type;
    if (params.qk_pwd) requestParams.qk_pwd = params.qk_pwd;
    return apiClient.post('/member/bank', requestParams);
  })();
};

// 更新银行卡
export const updateBank = (params: UpdateBankRequest): Promise<BankResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      const updatePayload: Record<string, unknown> = {
        bank_name: params.bank_type || params.bank_name || '',
        bank_no: params.card_no || params.bank_no || '',
        owner_name: params.owner_name || params.bank_owner || '',
        bank_address: params.bank_address ?? null,
        updated_at: new Date().toISOString()
      };
      if (params.wallet_type !== undefined) updatePayload.wallet_type = params.wallet_type;
      const { data: row, error } = await supabase
        .from(SUPABASE_TABLES.user_bank)
        .update(updatePayload)
        .eq('id', params.id)
        .select()
        .single();
      if (error) {
        const friendly = /row-level security|RLS|policy/i.test(error.message || '')
          ? '无法修改：请确认已登录当前账号后重试'
          : error.message;
        return { code: 400, message: friendly, data: undefined };
      }
      return {
        code: 200,
        message: '',
        data: row ? { id: row.id, bank_name: row.bank_name, bank_no: row.bank_no, bank_owner: row.owner_name, bank_address: row.bank_address, card_no: row.bank_no } : undefined
      };
    }
    const requestParams: any = {
      bank_type: params.bank_type || params.bank_name || '',
      card_no: params.card_no || params.bank_no || '',
      owner_name: params.owner_name || params.bank_owner || '',
    };
    if (params.bank_address) requestParams.bank_address = params.bank_address;
    if (params.wallet_type) requestParams.wallet_type = params.wallet_type;
    if (params.qk_pwd) requestParams.qk_pwd = params.qk_pwd;
    return apiClient.patch(`/member/bank/${params.id}`, requestParams);
  })();
};

// 删除银行卡
export const deleteBank = (id: number): Promise<BankResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      const { error } = await supabase.from(SUPABASE_TABLES.user_bank).delete().eq('id', id);
      if (error) return { code: 400, message: error.message, data: undefined };
      return { code: 200, message: '', data: undefined };
    }
    return apiClient.delete(`/member/bank/${id}`);
  })();
};

// 获取钱包类型列表（已废弃，钱包类型从 getBankType 接口的 usdt 字段获取）
// export const getWalletType = (): Promise<WalletTypeResponse> => {
//   const lang = localStorage.getItem('ly_lang') || 'zh_cn';
//   return apiClient.get(`/member/bank/wallet/type?lang=${lang}`);
// };

