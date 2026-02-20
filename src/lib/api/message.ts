/**
 * 消息相关API
 * Supabase 登录时从 member_message + notice 表读写，与管理后台 #/member/notice 站内信统一
 */
import apiClient from './client';
import { supabase, USE_SUPABASE_AUTH, SUPABASE_TABLES } from '@/lib/supabase';

export interface Message {
  id: number;
  title: string;
  content: string;
  is_read: number; // 0未读 1已读
  created_at: string;
  [key: string]: any;
}

export interface MessageListRequest {
  page?: number;
  limit?: number;
  type?: string; // 'receive' | 'send'
}

export interface MessageListResponse {
  code: number;
  message: string;
  data: {
    data: Message[];
    total?: number;
    current_page?: number;
    last_page?: number;
  };
}

export interface SendMessageRequest {
  title: string;
  content: string;
  pid?: number; // 回复的消息ID
}

export interface MessageResponse {
  code: number;
  message: string;
  data?: any;
}

// 获取消息列表（Supabase：member_message 关联 notice，仅当前用户且未删除）
async function getMessageListSupabase(params: MessageListRequest): Promise<MessageListResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return { code: 200, message: '', data: { data: [], total: 0 } };
  }
  const limit = Math.min(params.limit ?? 50, 100);
  const from = ((params.page ?? 1) - 1) * limit;
  const { data: rows, error } = await supabase
    .from(SUPABASE_TABLES.member_message)
    .select(`
      id,
      notice_id,
      is_read,
      created_at,
      notice (id, title, content, created_at)
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) {
    console.error('getMessageList Supabase error:', error);
    return { code: 500, message: error.message, data: { data: [], total: 0 } };
  }
  const list: Message[] = (rows ?? []).map((r: any) => {
    const n = (r.notice != null && typeof r.notice === 'object') ? r.notice : {};
    const createdAt = n.created_at ?? r.created_at ?? '';
    return {
      id: r.id,
      title: n.title ?? '',
      content: n.content ?? '',
      is_read: r.is_read ? 1 : 0,
      created_at: typeof createdAt === 'string' ? createdAt : (createdAt ? new Date(createdAt).toISOString() : '')
    };
  });
  const { count } = await supabase
    .from(SUPABASE_TABLES.member_message)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null);
  return {
    code: 200,
    message: '',
    data: { data: list, total: count ?? 0, current_page: params.page ?? 1, last_page: Math.ceil((count ?? 0) / limit) }
  };
}

// 获取消息列表
export const getMessageList = (params: MessageListRequest = {}): Promise<MessageListResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) return getMessageListSupabase(params);
    return apiClient.get('message/list', {
      params: { page: params.page || 1, pageSize: params.limit || 20 }
    }).then((res: any) => {
      const list = res?.data?.list ?? res?.data?.data ?? [];
      return { ...res, data: { ...res.data, data: list, total: res?.data?.total ?? list.length } };
    });
  })();
};

// 获取发送的消息列表
export const getSendMessageList = (params: MessageListRequest = {}): Promise<MessageListResponse> => {
  const useSupabase = USE_SUPABASE_AUTH;
  if (useSupabase) {
    return Promise.resolve({ code: 200, message: '', data: { data: [], total: 0 } });
  }
  return apiClient.get('message/list', {
    params: { page: params.page || 1, pageSize: params.limit || 20 }
  }).then((res: any) => {
    const list = res?.data?.list ?? res?.data?.data ?? [];
    return { ...res, data: { ...res.data, data: list, total: res?.data?.total ?? list.length } };
  });
};

// 标记消息为已读（Supabase：更新 member_message.is_read）
async function readMessageSupabase(id: number): Promise<MessageResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { code: 401, message: '请先登录' };
  const { error } = await supabase
    .from(SUPABASE_TABLES.member_message)
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return { code: 500, message: error.message };
  return { code: 200, message: '' };
}

// 标记消息为已读
export const readMessage = (id: number): Promise<MessageResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) return readMessageSupabase(id);
    return apiClient.post('message/mark-read', { id });
  })();
};

// 删除消息（Supabase：软删 member_message.deleted_at）
async function deleteMessageSupabase(id: number): Promise<MessageResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { code: 401, message: '请先登录' };
  const { error } = await supabase
    .from(SUPABASE_TABLES.member_message)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return { code: 500, message: error.message };
  return { code: 200, message: '' };
}

// 删除消息
export const deleteMessage = (id: number): Promise<MessageResponse> => {
  return (async () => {
    const useSupabase = USE_SUPABASE_AUTH || !!(await supabase.auth.getSession()).data?.session?.access_token;
    if (useSupabase) return deleteMessageSupabase(id);
    return apiClient.post('message/delete', { id });
  })();
};

// 发送消息（站内信为管理后台下发，前端仅接收；Supabase 下不调用后端发送）
export const sendMessage = (params: SendMessageRequest): Promise<MessageResponse> => {
  const url = params.pid ? `/member/message/send/${params.pid}` : '/member/message/send';
  return apiClient.post(url, {
    title: params.title,
    content: params.content
  });
};

