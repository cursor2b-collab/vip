/**
 * USDT充值API
 * 统一使用后端 houduan 接口（不再依赖 Supabase）
 */
import apiClient from './client';

const EXPIRE_MINUTES = 15;

// 后端订单状态 → 前端状态码映射
// 后端: 0=待处理 1=确认中 2=成功 3=失败 4=已取消 5=超时
// 前端: 1=待确认 2=充值成功 3=充值失败 4=已过期 5=已取消
const STATE_TO_STATUS: Record<number, number> = {
  0: 1, // pending → 待确认
  1: 1, // confirming → 待确认
  2: 2, // success → 充值成功
  3: 3, // failed → 充值失败
  4: 5, // cancelled → 已取消
  5: 4, // timeout → 已过期
};

const STATUS_TEXT: Record<number, string> = {
  1: '待确认', 2: '充值成功', 3: '充值失败', 4: '已过期', 5: '已取消',
};

export interface CreateUsdtOrderRequest {
  amount: number;      // USDT金额
  payment_id: number;  // 支付方式ID
  chain?: string;      // TRC20 / ERC20（可选）
}

export interface UsdtOrderData {
  order_id: number;
  bill_no: string;
  receive_address: string;
  usdt_amount: number;
  original_amount: number;
  cny_amount: number;
  usdt_rate: number;
  usdt_type: string;
  qrcode: string;
  expire_at: string;
  expire_minutes: number;
}

export interface CreateUsdtOrderResponse {
  code: number;
  message: string;
  status?: string;
  data?: UsdtOrderData;
}

export interface UsdtOrderStatus {
  bill_no: string;
  status: number;
  status_text: string;
  usdt_amount: number;
  cny_amount: number;
  receive_address: string;
  tx_hash: string | null;
  from_address: string | null;
  expire_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface GetOrderStatusResponse {
  code: number;
  message: string;
  status?: string;
  data?: UsdtOrderStatus;
}

export interface PendingOrderData {
  has_pending: boolean;
  order?: {
    bill_no: string;
    usdt_amount: number;
    cny_amount: number;
    receive_address: string;
    usdt_type: string;
    remaining_seconds: number;
    expire_at: string;
    created_at: string;
  };
}

export interface GetPendingOrderResponse {
  code: number;
  message: string;
  status?: string;
  data?: PendingOrderData;
}

export interface UsdtOrderListItem {
  id: number;
  bill_no: string;
  usdt_amount: number;
  cny_amount: number;
  status: number;
  status_text: string;
  tx_hash: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface GetOrderListResponse {
  code: number;
  message: string;
  status?: string;
  data?: {
    data: UsdtOrderListItem[];
    total: number;
    current_page: number;
    last_page: number;
  };
}

/**
 * 创建USDT充值订单
 * 1. 从后端获取 USDT 汇率和地址
 * 2. 提交订单到后端（后端存储 CNY 金额）
 */
export const createUsdtOrder = async (params: CreateUsdtOrderRequest): Promise<CreateUsdtOrderResponse> => {
  try {
    // 获取支付方式配置（含汇率和收款地址）
    const methodsRes = await apiClient.get('recharge/methods');
    const methods: any[] = methodsRes.data || [];

    // 优先按 payment_id 匹配，找不到则取第一个 USDT 方式
    let usdtMethod = methods.find((m: any) =>
      m.id === params.payment_id && (m.type || '').toUpperCase() === 'USDT'
    ) || methods.find((m: any) => (m.type || '').toUpperCase() === 'USDT');

    if (!usdtMethod) {
      return { code: 400, message: '暂无可用USDT收款配置', data: undefined };
    }

    const rate = usdtMethod.rate || 7.2;
    const chain = params.chain || 'TRC20';
    const address = chain === 'ERC20'
      ? (usdtMethod.erc20Address || usdtMethod.trc20Address || '')
      : (usdtMethod.trc20Address || usdtMethod.erc20Address || '');

    // 将 USDT 金额转换为 CNY 金额（后端存 CNY）
    const cnyAmount = Math.round(params.amount * rate * 100) / 100;

    // 提交订单
    const submitRes = await apiClient.post('recharge/submit', {
      paytype: 'USDT',
      amount: cnyAmount,
      chain,
    });

    if (submitRes.code !== 0) {
      return {
        code: submitRes.code || 400,
        message: submitRes.message || '创建订单失败',
        data: undefined,
      };
    }

    const d = submitRes.data || {};
    const finalAddress = d.address || address;
    const expireAt = new Date(Date.now() + EXPIRE_MINUTES * 60 * 1000).toISOString();

    const orderData: UsdtOrderData = {
      order_id: d.orderId || 0,
      bill_no: d.trano || '',
      receive_address: finalAddress,
      usdt_amount: params.amount,
      original_amount: params.amount,
      cny_amount: cnyAmount,
      usdt_rate: rate,
      usdt_type: chain,
      qrcode: finalAddress,
      expire_at: expireAt,
      expire_minutes: EXPIRE_MINUTES,
    };

    return { code: 200, message: 'ok', data: orderData };
  } catch (e: any) {
    console.error('❌ 创建USDT订单失败:', e);
    return { code: 500, message: e?.message || '创建订单失败', data: undefined };
  }
};

/**
 * 查询订单状态（传入 bill_no 即后端的 trano）
 */
export const getUsdtOrderStatus = async (billNo: string): Promise<GetOrderStatusResponse> => {
  try {
    const res = await apiClient.get(`recharge/status/${billNo}`);
    if (res.code !== 0) {
      return { code: res.code || 400, message: res.message || '查询失败', data: undefined };
    }
    const d = res.data || {};
    const status = STATE_TO_STATUS[d.state] ?? 1;
    return {
      code: 200,
      message: 'ok',
      data: {
        bill_no: d.trano || billNo,
        status,
        status_text: STATUS_TEXT[status] || d.stateName || '待确认',
        usdt_amount: 0,
        cny_amount: d.amount || 0,
        receive_address: '',
        tx_hash: null,
        from_address: null,
        expire_at: null,
        confirmed_at: null,
        created_at: d.createTime ? new Date(d.createTime).toISOString() : '',
      },
    };
  } catch (e: any) {
    return { code: 500, message: e?.message || '查询失败', data: undefined };
  }
};

/**
 * 获取待处理订单（state=0 或 1 的 USDT 订单）
 */
export const getPendingUsdtOrder = async (): Promise<GetPendingOrderResponse> => {
  try {
    const res = await apiClient.get('recharge/records', { params: { pageSize: 5 } });
    if (res.code !== 0) {
      return { code: res.code || 400, message: res.message || '获取失败', data: { has_pending: false } };
    }
    const list: any[] = (res.data?.list || []);
    // 找最近一条 USDT 待处理订单
    const pending = list.find((r: any) =>
      (r.paytype || '').toUpperCase() === 'USDT' && (r.state === 0 || r.state === 1)
    );

    if (!pending) {
      return { code: 200, message: 'ok', data: { has_pending: false } };
    }

    const createMs = pending.createTime || 0;
    const expireMs = createMs + EXPIRE_MINUTES * 60 * 1000;
    const expireAt = new Date(expireMs).toISOString();
    const remaining = Math.max(0, Math.floor((expireMs - Date.now()) / 1000));

    return {
      code: 200,
      message: 'ok',
      data: {
        has_pending: remaining > 0,
        order: remaining > 0 ? {
          bill_no: pending.trano || '',
          usdt_amount: 0,
          cny_amount: pending.amount || 0,
          receive_address: '',
          usdt_type: 'TRC20',
          remaining_seconds: remaining,
          expire_at: expireAt,
          created_at: new Date(createMs).toISOString(),
        } : undefined,
      },
    };
  } catch (e: any) {
    return { code: 500, message: e?.message || '获取失败', data: { has_pending: false } };
  }
};

/**
 * 取消订单（后端暂不支持，直接返回成功，前端停止轮询即可）
 */
export const cancelUsdtOrder = async (_billNo: string): Promise<{ code: number; message: string }> => {
  return { code: 200, message: 'ok' };
};

/**
 * 获取订单列表
 */
export const getUsdtOrderList = async (
  status?: number,
  limit: number = 10,
  page: number = 1
): Promise<GetOrderListResponse> => {
  try {
    const queryParams: any = { page, pageSize: limit };
    // 映射前端状态码 → 后端 state
    if (status != null) {
      const reverseMap: Record<number, number> = { 1: 0, 2: 2, 3: 3, 4: 5, 5: 4 };
      if (reverseMap[status] !== undefined) queryParams.state = reverseMap[status];
    }
    const res = await apiClient.get('recharge/records', { params: queryParams });
    if (res.code !== 0) {
      return { code: res.code || 400, message: res.message || '获取失败', data: undefined };
    }
    const raw = res.data || {};
    const list: UsdtOrderListItem[] = (raw.list || [])
      .filter((r: any) => (r.paytype || '').toUpperCase() === 'USDT')
      .map((r: any) => {
        const s = STATE_TO_STATUS[r.state] ?? 1;
        return {
          id: r.id,
          bill_no: r.trano,
          usdt_amount: 0,
          cny_amount: r.amount || 0,
          status: s,
          status_text: STATUS_TEXT[s] || r.stateName || '',
          tx_hash: null,
          created_at: r.createTime ? new Date(r.createTime).toISOString() : '',
          confirmed_at: null,
        };
      });
    return {
      code: 200,
      message: 'ok',
      data: {
        data: list,
        total: raw.total || list.length,
        current_page: page,
        last_page: Math.max(1, Math.ceil((raw.total || list.length) / limit)),
      },
    };
  } catch (e: any) {
    return { code: 500, message: e?.message || '获取失败', data: undefined };
  }
};

/**
 * 手动触发检查（复用 getUsdtOrderStatus）
 */
export const checkUsdtOrder = async (billNo?: string): Promise<GetOrderStatusResponse> => {
  if (billNo) return getUsdtOrderStatus(billNo);
  const pending = await getPendingUsdtOrder();
  if (pending.data?.has_pending && pending.data.order) {
    return getUsdtOrderStatus(pending.data.order.bill_no);
  }
  return { code: 200, message: 'ok', data: undefined };
};

// 订单状态常量
export const USDT_ORDER_STATUS = {
  PENDING: 1,
  SUCCESS: 2,
  FAILED: 3,
  EXPIRED: 4,
  CANCELLED: 5,
} as const;

export const USDT_ORDER_STATUS_TEXT: Record<number, string> = {
  [USDT_ORDER_STATUS.PENDING]: '待确认',
  [USDT_ORDER_STATUS.SUCCESS]: '充值成功',
  [USDT_ORDER_STATUS.FAILED]: '充值失败',
  [USDT_ORDER_STATUS.EXPIRED]: '已过期',
  [USDT_ORDER_STATUS.CANCELLED]: '已取消',
};
