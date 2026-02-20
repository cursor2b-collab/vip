/**
 * 银行卡 / 提现账户管理
 * 统一走 houduan:
 *   GET  /api/v1/withdraw/accounts     - 账户列表
 *   GET  /api/v1/withdraw/config       - 配置（含银行类型）
 *   POST /api/v1/withdraw/account/add  - 添加账户
 *   POST /api/v1/withdraw/account/delete - 删除账户
 *   POST /api/v1/withdraw/account/default - 设为默认
 */
import phpGameClient from './php-game-client';
import { supabase, USE_SUPABASE_AUTH, SUPABASE_TABLES } from '@/lib/supabase';

export interface Bank {
  id: number | string;
  bank_name: string;
  bank_no: string;
  bank_owner: string;
  bank_address?: string;
  type?: string;
  network?: string;
  is_default?: boolean;
  qr_code?: string;
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
  usdt?: { [key: string]: string };
}

export interface WalletTypeResponse {
  code: number;
  message: string;
  data: BankType[];
}

export interface CreateBankRequest {
  bank_type: string;
  card_no: string;
  owner_name: string;
  bank_address?: string;
  wallet_type?: string;
  qk_pwd?: string;
  bank_name?: string;
  bank_no?: string;
  bank_owner?: string;
}

export interface UpdateBankRequest extends CreateBankRequest {
  id: number | string;
}

export interface BankResponse {
  code: number;
  message: string;
  data?: Bank;
}

/** 将 houduan withdraw/accounts 条目映射为前端 Bank 格式 */
function mapAccount(acc: any): Bank {
  return {
    id: acc.id,
    type: acc.type,
    bank_name: acc.bankName ?? acc.bank_name ?? '',
    bank_no: acc.fullAddress ?? acc.cardNoLast4 ?? '',
    bank_owner: acc.accountName ?? '',
    bank_address: acc.bankBranch ?? '',
    network: acc.network ?? '',
    is_default: acc.isDefault ?? false,
    qr_code: acc.qrCode ?? '',
    card_no: acc.fullAddress ?? '',
    wallet_type: acc.network ?? '',
    bank_type: acc.bankName ?? ''
  };
}

// 获取银行卡（提现账户）列表 → GET /api/v1/withdraw/accounts
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
    return phpGameClient.get('withdraw/accounts').then((res: any) => {
      const raw = res?.data ?? res?.list ?? [];
      const data: Bank[] = Array.isArray(raw) ? raw.map(mapAccount) : [];
      return { code: res?.code === 0 ? 200 : (res?.code ?? 200), message: res?.message ?? '', data };
    }).catch(() => ({ code: 200, message: '', data: [] }));
  })();
};

// 获取银行/账户类型 → GET /api/v1/withdraw/config
export const getBankType = (): Promise<BankTypeResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      return {
        code: 200, message: '',
        data: [{ value: '银行卡', label: '银行卡' }, { value: 'USDT', label: 'USDT' }],
        usdt: { omni: 'Omni', erc: 'ERC20', trc: 'TRC20' }
      } as BankTypeResponse;
    }
    return phpGameClient.get('withdraw/config').then((res: any) => {
      const d = res?.data ?? {};
      const types: BankType[] = [
        { value: 'bank', label: '银行卡' },
        { value: 'usdt', label: 'USDT' },
      ];
      if (d.allowAlipay) types.push({ value: 'alipay', label: '支付宝' });
      if (d.allowWechat) types.push({ value: 'wechat', label: '微信' });
      return { code: 200, message: '', data: types, usdt: { trc: 'TRC20', erc: 'ERC20' } };
    }).catch(() => ({
      code: 200, message: '',
      data: [{ value: 'bank', label: '银行卡' }, { value: 'usdt', label: 'USDT' }],
      usdt: { trc: 'TRC20', erc: 'ERC20' }
    }));
  })();
};

// 添加银行卡（提现账户） → POST /api/v1/withdraw/account/add
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
        .insert(insertPayload).select().single();
      if (error) {
        const msg = /row-level security|RLS|policy/i.test(error.message || '')
          ? '无法绑定：请确认已登录当前账号后重试' : error.message;
        return { code: 400, message: msg, data: undefined };
      }
      return { code: 200, message: '', data: { id: row.id, bank_name: row.bank_name, bank_no: row.bank_no, bank_owner: row.owner_name, bank_address: row.bank_address, card_no: row.bank_no } };
    }
    const bankType = (params.bank_type || params.bank_name || '').toLowerCase();
    const isUsdt = bankType === 'usdt';
    const addParams: any = {
      type: isUsdt ? 'usdt' : 'bank',
      accountName: params.owner_name || params.bank_owner || '',
      fundPassword: params.qk_pwd || '',
    };
    if (isUsdt) {
      addParams.usdtNetwork = params.wallet_type || 'TRC20';
      addParams.usdtAddress = params.card_no || params.bank_no || '';
    } else {
      addParams.bankName = params.bank_type || params.bank_name || '';
      addParams.bankAccount = params.card_no || params.bank_no || '';
      addParams.bankBranch = params.bank_address || '';
    }
    return phpGameClient.post('withdraw/account/add', addParams).then((res: any) => ({
      code: res?.code === 0 ? 200 : (res?.code ?? 400),
      message: res?.message ?? '',
      data: res?.data
    }));
  })();
};

// 更新银行卡（先删后加，houduan 无 update 路由）
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
        .update(updatePayload).eq('id', params.id).select().single();
      if (error) return { code: 400, message: error.message, data: undefined };
      return { code: 200, message: '', data: row ? { id: row.id, bank_name: row.bank_name, bank_no: row.bank_no, bank_owner: row.owner_name, bank_address: row.bank_address, card_no: row.bank_no } : undefined };
    }
    // 先删除旧账户
    await phpGameClient.post('withdraw/account/delete', { accountId: params.id }).catch(() => {});
    // 再添加
    return createBank(params);
  })();
};

// 删除银行卡 → POST /api/v1/withdraw/account/delete
export const deleteBank = (id: number | string): Promise<BankResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) {
      const { error } = await supabase.from(SUPABASE_TABLES.user_bank).delete().eq('id', id);
      if (error) return { code: 400, message: error.message, data: undefined };
      return { code: 200, message: '', data: undefined };
    }
    return phpGameClient.post('withdraw/account/delete', { accountId: id }).then((res: any) => ({
      code: res?.code === 0 ? 200 : (res?.code ?? 200),
      message: res?.message ?? '',
      data: res?.data
    }));
  })();
};

// 设置默认银行卡 → POST /api/v1/withdraw/account/default
export const setDefaultBank = (id: number | string): Promise<BankResponse> => {
  return phpGameClient.post('withdraw/account/default', { accountId: id }).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  }));
};
