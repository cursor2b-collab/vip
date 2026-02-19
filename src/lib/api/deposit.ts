/**
 * 存款相关API
 * 统一使用后端 houduan 接口（不再依赖 Supabase 或 LTZF）
 */
import apiClient from './client';

export interface PayWayList {
  usdt?: number;
  card?: number;
  alipay?: number;
  wechat?: number;
  wxpay?: number;
}

export interface PayWayResponse {
  code: number;
  message: string;
  data: PayWayList;
}

export interface Bank {
  bank_name: string;
  [key: string]: any;
}

export interface BankListResponse {
  code: number;
  message: string;
  data: Bank[];
}

export interface PayBank {
  bank_data?: {
    bank_name: string;
  };
  bank_no: string;
  bank_owner: string;
  bank_address: string;
  mch_id?: string;
  payimg?: string;
  [key: string]: any;
}

export interface PayBankResponse {
  code: number;
  message: string;
  data: PayBank | PayBank[];
}

export interface RechargeRequest {
  name?: string;
  money: number | string;
  account?: string;
  hk_at?: string;
  payment_account?: string;
  payment_name?: string;
  payment_id?: number;
  payment_type?: string;
  payment_pic?: string;
  payment_bank_type?: string;

  // 兼容旧版本参数
  paytype?: string;
  amount?: number;
  catepay?: string;
  bank?: string;
  bank_address?: string;
  bank_no?: string;
  bank_owner?: string;
  bank_owner_name?: string;
  chain?: string;
}

export interface RechargeResponse {
  code: number;
  message: string;
  data?: any;
}

export interface PayInfoRequest {
  deposit_no: string;
}

export interface PayInfo {
  info: {
    amount: number;
    real_money: number;
    paytype: string;
    bank?: string;
    account?: string;
    name?: string;
  };
  cardlist: {
    mch_id: string;
    payimg: string;
    account?: string;
    name?: string;
  };
  payment?: {
    account?: string;
    name?: string;
  };
}

export interface PayInfo2 {
  id: number,
  bill_no: string,
  member_id: number,
  name: string,
  origin_money: string,
  forex: string,
  lang: string,
  money: string,
  payment_type: string,
  account: string,
  payment_desc: string,
  payment_detail: {
    payment_id: number,
    payment_account: string,
    payment_name: string,
    usdt_rate: string,
    usdt_type: string,
  },
  payment_pic: string,
  status: number,
  diff_money: string,
  before_money: string,
  after_money: string,
  score: string,
  fail_reason: null,
  hk_at: string,
  confirm_at: null,
  user_id: number,
  created_at: string,
  updated_at: string,
  status_text: string,
  payment_type_text: string,
}

export interface PayInfoResponse {
  code: number;
  message: string;
  data: PayInfo;
}

export interface OnlinePayment {
  id: number;
  account: string;
  name: string;
  qrcode: string;
  type: string;
  type_text: string;
  desc: string;
  min?: number;
  max?: number;
  is_open: number;
  [key: string]: any;
}

export interface OnlinePaymentListResponse {
  code: number;
  message: string;
  data: OnlinePayment[];
}

export interface NormalPayment {
  id: number;
  account: string;
  name: string;
  desc: string;
  type: string;
  qrcode: string;
  memo: string;
  params?: any;
  rate: string;
  min: number;
  max: number;
  is_open: number;
  remark_code?: number;
  type_text: string;
  [key: string]: any;
}

export interface NormalPaymentListResponse {
  code: number;
  message: string;
  data: NormalPayment[];
}

export interface RechargeOnlineRequest {
  money: number | string;
  payment_type: string;
  payment_id: number;
}

export interface RechargeOnlineResponse {
  code: number;
  message: string;
  data?: {
    pay_url?: string;
    bill_no?: string;
    deposit_no?: string;
  };
}

// 规范化后端 paytype 为前端 type 格式
// isOnline=true: alipay→online_alipay, weixin→online_wxpay
// isOnline=false: USDT→company_usdt, alipay→company_alipay, weixin→company_wxpay
function normalizePayType(backendType: string, isOnline: boolean): string {
  const t = backendType.toLowerCase();
  if (isOnline) {
    if (t === 'weixin' || t === 'wechat') return 'online_wxpay';
    return `online_${t}`;
  } else {
    if (t === 'usdt') return 'company_usdt';
    if (t === 'weixin' || t === 'wechat') return 'company_wxpay';
    return `company_${t}`;
  }
}

// 获取支付方式列表（简要，用于显示有哪些渠道）
export const getPayWay = (): Promise<PayWayResponse> => {
  return apiClient.get('recharge/methods', {}).then((res: any) => {
    const methods: any[] = res.data || [];
    const data: PayWayList = {};
    methods.forEach((m: any) => {
      const t = (m.type || '').toLowerCase();
      if (t === 'usdt') data.usdt = (data.usdt || 0) + 1;
      else if (t === 'alipay') data.alipay = (data.alipay || 0) + 1;
      else if (t === 'weixin' || t === 'wechat') { data.wechat = (data.wechat || 0) + 1; data.wxpay = (data.wxpay || 0) + 1; }
      else if (t === 'linepay' || t === 'bank') data.card = (data.card || 0) + 1;
    });
    return { code: 200, message: '', data };
  }).catch(() => ({ code: 200, message: '', data: {} }));
};

// 获取银行列表（后端暂无该接口，返回空）
export const getBankList = (): Promise<BankListResponse> => {
  return apiClient.post('banklist', {}).then((res: any) => {
    return { code: res.code || 200, message: res.message || '', data: res.data || [] };
  }).catch(() => ({ code: 200, message: '', data: [] }));
};

// 获取支付银行信息（后端暂无该接口，返回空）
export const getPayBank = (): Promise<PayBankResponse> => {
  return apiClient.post('getpaybank', {}).then((res: any) => {
    let data = res.data || [];
    if (!Array.isArray(data)) data = [data];
    return { code: res.code || 200, message: res.message || '', data: data.filter((item: any) => item) };
  }).catch(() => ({ code: 200, message: '', data: [] }));
};

// 获取在线支付方式列表（isOnline=true 的方式，经第三方支付）
export const getOnlinePaymentList = (): Promise<OnlinePaymentListResponse> => {
  return apiClient.get('recharge/methods', {}).then((res: any) => {
    const methods: any[] = res.data || [];
    const data: OnlinePayment[] = methods
      .filter((m: any) => m.isOnline)
      .map((m: any) => ({
        id: m.id,
        type: normalizePayType(m.type, true),
        type_text: m.title || m.type,
        account: m.account || '',
        name: m.accountName || m.title || '',
        qrcode: m.qrcode || '',
        desc: m.subtitle || '',
        min: m.minAmount,
        max: m.maxAmount,
        is_open: 1,
        lbpalProductId: m.lbpalProductId || '',
      }));
    return { code: 200, message: '', data };
  }).catch((error: any) => {
    console.error('❌ 获取在线支付方式列表失败:', error);
    return { code: error.response?.status || 500, message: error.message || '获取失败', data: [] };
  });
};

// 获取公司入款支付方式列表（isOnline=false 的方式，如 USDT、银行转账等）
export const getNormalPaymentList = (): Promise<NormalPaymentListResponse> => {
  return apiClient.get('recharge/methods', {}).then((res: any) => {
    const methods: any[] = res.data || [];
    const data: NormalPayment[] = methods
      .filter((m: any) => !m.isOnline)
      .map((m: any) => {
        const backendType = (m.type || '').toUpperCase();
        const frontendType = normalizePayType(m.type, false);
        let params: any = undefined;
        if (backendType === 'USDT') {
          params = {
            usdt_rate: m.rate || 7.2,
            usdt_type_text: 'TRC20',
            usdt_type: 'TRC20',
            trc20Address: m.trc20Address || '',
            erc20Address: m.erc20Address || '',
          };
        }
        return {
          id: m.id,
          type: frontendType,
          type_text: m.title || m.type,
          account: m.trc20Address || m.account || '',
          mch_id: m.trc20Address || m.account || '',
          name: m.accountName || m.title || '',
          desc: m.subtitle || '',
          qrcode: m.qrcode || m.trc20Address || '',
          memo: m.remark || '',
          params,
          rate: '0',
          min: m.minAmount || 0,
          max: m.maxAmount || 999999,
          is_open: 1,
        };
      });
    return { code: 200, message: '', data };
  }).catch((error: any) => {
    console.error('❌ 获取公司入款支付方式列表失败:', error);
    return { code: error.response?.status || 500, message: error.message || '获取失败', data: [] };
  });
};

// 提交充值请求（公司入款 / USDT）
export const recharge = (params: RechargeRequest): Promise<RechargeResponse> => {
  // 映射到后端 submit 接口参数
  const paytype = params.payment_type || params.paytype || 'USDT';
  // 去掉 company_ 前缀（后端不使用前缀）
  const backendPaytype = paytype.replace(/^company_/, '').replace(/^online_/, '');
  const amount = Number(params.money || params.amount || 0);
  const chain = params.catepay || params.chain || '';

  const requestParams: any = {
    paytype: backendPaytype,
    amount,
  };
  if (chain) requestParams.chain = chain;
  if (params.name || params.bank_owner_name) requestParams.payname = params.name || params.bank_owner_name;

  console.log('💰 提交充值请求（公司入款）:', requestParams);
  return apiClient.post('recharge/submit', requestParams).then((res: any) => {
    console.log('💰 充值响应:', res);
    return {
      code: res.code === 0 ? 200 : (res.code || 400),
      message: res.message || (res.code === 0 ? '订单创建成功' : ''),
      data: res.data,
    };
  }).catch((error: any) => {
    console.error('❌ 充值失败:', error);
    return {
      code: error.code || error.response?.status || 500,
      message: error.message || error.response?.data?.message || '充值失败',
      data: null,
    };
  });
};

export const rechargeEdit = (payment_pic: string, id: string): Promise<RechargeResponse> => {
  const requestParams: any = { payment_pic: payment_pic || '', id: id || '' };
  return apiClient.post(`recharge/edit/normal?id=${id}`, requestParams).then((res: any) => {
    return {
      code: res.code || (res.status === 'success' ? 200 : 400),
      message: res.message || '',
      data: res.data,
    };
  }).catch((error: any) => {
    return {
      code: error.code || error.response?.status || 500,
      message: error.message || error.response?.data?.message || '充值失败',
      data: null,
    };
  });
};

// 在线充值（第三方支付：alipay、weixin 等，通过后端调 LBPAL 渠道）
export const rechargeOnline = (params: RechargeOnlineRequest): Promise<RechargeOnlineResponse> => {
  // 去掉 online_ 前缀，得到后端 paytype（alipay、weixin 等）
  const backendPaytype = String(params.payment_type || '').replace(/^online_/, '');

  const requestParams: any = {
    paytype: backendPaytype,
    amount: Number(params.money || 0),
  };

  console.log('💰 提交在线充值请求:', requestParams);
  return apiClient.post('recharge/submit', requestParams).then((res: any) => {
    console.log('💰 在线充值响应（原始）:', res);
    const payUrl = res.data?.pay_url || res.pay_url || '';
    const trano = res.data?.trano || res.trano || '';
    return {
      code: res.code === 0 ? 200 : (res.code || 400),
      message: res.message || '',
      data: {
        pay_url: payUrl,
        bill_no: trano,
        deposit_no: trano,
      },
    };
  }).catch((error: any) => {
    console.error('❌ 在线充值失败:', error);
    return {
      code: error.code || error.response?.status || 500,
      message: error.message || error.response?.data?.message || '在线充值失败',
      data: undefined,
    };
  });
};

// 上传充值凭证图片
export const uploadRechargePic = (file: File): Promise<{ code: number; message: string; data?: { file_url: string } }> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('recharge/picture/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res: any) => {
    const fileUrl = res.file_url || res.data?.file_url || '';
    return {
      code: res.code || (res.status === 'success' ? 200 : 400),
      message: res.message || '',
      data: fileUrl ? { file_url: fileUrl } : undefined,
    };
  }).catch((error: any) => {
    return {
      code: error.code || error.response?.status || 500,
      message: error.message || error.response?.data?.message || '上传凭证图片失败',
      data: undefined,
    };
  });
};

// 获取支付信息（二维码等）
export const getPayInfo = (params: PayInfoRequest): Promise<PayInfoResponse> => {
  return apiClient.post('payinfo', params).then((res: any) => {
    const data = res.data || {};
    const payInfoData: PayInfo = {
      info: {
        amount: data.info?.amount || data.amount || 0,
        real_money: data.info?.real_money || data.real_money || 0,
        paytype: data.info?.paytype || data.paytype || '',
        bank: data.info?.bank || data.bank,
        account: data.info?.account || data.account || data.payment?.account,
        name: data.info?.name || data.name || data.payment?.name,
      },
      cardlist: {
        mch_id: data.cardlist?.mch_id || data.mch_id || '',
        payimg: data.cardlist?.payimg || data.payimg || data.qrcode || '',
        account: data.cardlist?.account || data.account || data.payment?.account,
        name: data.cardlist?.name || data.name || data.payment?.name,
      },
      payment: {
        account: data.payment?.account || data.account,
        name: data.payment?.name || data.name,
      },
    };
    return { code: res.code || 200, message: res.message || '', data: payInfoData };
  }).catch((error: any) => {
    return {
      code: error.code || error.response?.status || 500,
      message: error.message || error.response?.data?.message || '获取支付信息失败',
      data: {} as PayInfo,
    };
  });
};
