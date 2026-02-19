/**
 * 信用支付（免息借呗）相关API
 */
import apiClient from './client';

export interface CreditRule {
  [key: string]: any;
}

export interface CreditRuleResponse {
  code: number;
  message: string;
  data: CreditRule;
}

export interface CreditSearchRequest {
  name?: string;
  page?: number;
  limit?: number;
}

export interface CreditRecord {
  id: number;
  member_name: string;
  amount: number;
  type: string; // 'borrow' | 'lend'
  status: string;
  created_at: string;
  [key: string]: any;
}

export interface CreditSearchResponse {
  code: number;
  message: string;
  table?: string; // HTML表格
  pageNum?: number;
  rowCount?: number;
  data?: {
    data: CreditRecord[];
    total?: number;
  };
}

export interface CreditRecordListResponse {
  code: number;
  message: string;
  list?: string; // HTML列表
  page_count?: number;
  row_count?: number;
}

export interface CreditBorrowRequest {
  name: string;
  realname: string;
  money: number;
  days: number;
}

export interface CreditLendRequest {
  name: string;
  realname: string;
  money: number;
}

export interface CreditCheckRequest {
  name: string;
}

export interface CreditResponse {
  code: number;
  message: string;
  data?: any;
}

// 获取信用支付规则
export const getCreditRule = (): Promise<CreditRuleResponse> => {
  // 根据接口清单：GET /credit/rule
  return apiClient.get('/credit/rule');
};

// 搜索信用支付记录
export const searchCredit = (params: CreditSearchRequest): Promise<CreditSearchResponse> => {
  // 根据接口清单：POST /credit/search
  return apiClient.post('/credit/search', {
    name: params.name || '',
    page: params.page || 1,
    limit: params.limit || 20
  });
};

// 信用借款
export const creditBorrow = (params: CreditBorrowRequest): Promise<CreditResponse> => {
  // 根据接口清单：POST /credit/borrow
  return apiClient.post('/credit/borrow', params);
};

// 信用还款
export const creditLend = (params: CreditLendRequest): Promise<CreditResponse> => {
  // 根据接口清单：POST /credit/lend
  return apiClient.post('/credit/lend', params);
};

// 检查信用支付状态
export const creditCheck = (params: CreditCheckRequest): Promise<CreditResponse> => {
  // 根据接口清单：POST /credit/check
  return apiClient.post('/credit/check', params);
};

// 获取借还款记录列表（用于record页面）
// 注意：后端返回的是HTML格式，需要特殊处理
export const getCreditRecordList = async (params: { page?: number; size?: number }): Promise<CreditRecordListResponse> => {
  // 尝试使用API路由 /credit/record
  try {
    const res = await apiClient.get('/credit/record', {
      params: {
        page: params.page || 1,
        limit: params.size || 5
      }
    });
    
    // 如果API返回JSON，需要转换为HTML格式
    // 这里先返回原始数据，前端处理
    return res as any;
  } catch (err) {
    // 如果API路由失败，可能需要调用web路由
    // 但web路由需要CSRF token，这里先抛出错误
    throw err;
  }
};

