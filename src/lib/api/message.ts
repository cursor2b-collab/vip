/**
 * 消息相关API
 * - 公告列表：GET /api/v1/notice/list（NoticeController，读 caipiao_gonggao，公开接口）
 *   返回：{ code:0, data:{ list:[{id,title,content,type,isRead(bool),createdAt(ms)}], total, unreadCount } }
 *   type 参数：all=全部(不传)、activity=优惠活动、system=系统
 * - 站内信：GET /api/v1/message/list（MessageController，读 caipiao_notice，需登录）
 *   返回：{ code:0, data:{ list:[...], total } }
 */
import apiClient from './client';

export interface Message {
  id: number;
  title: string;
  content: string;
  is_read: number; // 0未读 1已读
  created_at: string;
  type?: string;
  /** 来源：notice=公告(走 notice/mark-read)，message=站内信(走 message/mark-read) */
  source?: 'notice' | 'message';
  [key: string]: any;
}

export interface MessageListRequest {
  page?: number;
  limit?: number;
  /** all=所有通知, promo=优惠通知(对应后端 activity), system=系统推送 */
  type?: 'all' | 'promo' | 'system';
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
  pid?: number;
}

export interface MessageResponse {
  code: number;
  message: string;
  data?: any;
}

// notice/list 返回的每项格式：{ id, title, content, type, isRead(bool), createdAt(毫秒) }
function noticeToMessage(item: any): Message {
  const ts = item.createdAt ?? item.oddtime;
  let created_at = '';
  if (typeof ts === 'number') {
    // createdAt 是毫秒时间戳
    created_at = new Date(ts < 1e12 ? ts * 1000 : ts).toISOString().slice(0, 19).replace('T', ' ');
  } else if (ts) {
    created_at = String(ts);
  }
  return {
    id: item.id,
    title: item.title ?? '',
    content: item.content ?? item.summary ?? '',
    is_read: item.isRead === true || item.is_read === 1 ? 1 : 0,
    type: item.type ?? '',
    created_at,
    source: 'notice',
  };
}

// message/list 返回的每项格式
function messageItemToMessage(m: any): Message {
  const ts = m.sentTime ?? m.createdAt ?? m.created_at;
  let created_at = '';
  if (typeof ts === 'number') {
    created_at = new Date(ts < 1e12 ? ts * 1000 : ts).toISOString().slice(0, 19).replace('T', ' ');
  } else if (ts) {
    created_at = String(ts);
  }
  return {
    id: m.id,
    title: m.title ?? '',
    content: m.content ?? m.summary ?? '',
    is_read: m.isRead === true || m.is_read === 1 ? 1 : 0,
    created_at,
    source: 'message',
  };
}

// 前端 Tab type 映射到后端 type
const TAB_TO_BACKEND_TYPE: Record<string, string> = {
  all: '',        // 不传 type，获取全部
  promo: 'activity', // 优惠通知 → 后端 activity 类型
  system: 'system',  // 系统推送 → 后端 system 类型
};

const PAGE_SIZE = 200;

/**
 * 获取消息列表
 * - 公告：GET /api/v1/notice/list（支持 type 过滤，无需登录也能获取，有 token 时带已读状态）
 * - 所有通知时额外合并站内信：GET /api/v1/message/list
 */
export const getMessageList = (params: MessageListRequest = {}): Promise<MessageListResponse> => {
  return (async () => {
    const type = params.type ?? 'all';
    const backendType = TAB_TO_BACKEND_TYPE[type] ?? '';

    let list: Message[] = [];
    let total = 0;

    // 1）公告列表：notice/list（NoticeController，读 caipiao_gonggao）
    try {
      const queryParams: any = { page: 1, pageSize: PAGE_SIZE };
      if (backendType) queryParams.type = backendType;

      const res: any = await apiClient.get('notice/list', { params: queryParams });

      // 返回格式：{ code:0, data:{ list:[...], total, unreadCount } }
      const rawList = res?.data?.list ?? res?.data?.data ?? (Array.isArray(res?.data) ? res.data : []);
      list = (Array.isArray(rawList) ? rawList : []).map(noticeToMessage);
      total = res?.data?.total ?? list.length;

      console.log('[消息] notice/list 获取到', list.length, '条公告');
    } catch (e) {
      console.error('[消息] notice/list 请求失败:', e);

      // 兜底：用 notices 接口（IndexController::notices，格式不同）
      try {
        const res2: any = await apiClient.get('notices', { params: { page: 1, limit: PAGE_SIZE } });
        // 格式：{ code:0, count, data:[{id,title,content,time:"Y-m-d H:i:s"}] }
        const rawList2 = Array.isArray(res2?.data) ? res2.data : [];
        list = rawList2.map((item: any) => ({
          id: item.id,
          title: item.title ?? '',
          content: item.content ?? '',
          is_read: 0,
          created_at: item.time ?? '',
          source: 'notice' as const,
        }));
        total = res2?.count ?? list.length;
        console.log('[消息] notices 兜底获取到', list.length, '条');
      } catch (_) {
        console.error('[消息] notices 兜底也失败');
        list = [];
        total = 0;
      }
    }

    // 2）所有通知时，额外合并站内信（message/list，读 caipiao_notice，需登录）
    if (type === 'all') {
      try {
        const msgRes: any = await apiClient.get('message/list', {
          params: { page: 1, pageSize: PAGE_SIZE },
        });
        const msgRaw = msgRes?.data?.list ?? msgRes?.data?.data ?? [];
        const msgList = (Array.isArray(msgRaw) ? msgRaw : []).map(messageItemToMessage);
        if (msgList.length > 0) {
          list = [...list, ...msgList].sort((a, b) =>
            (b.created_at || '').localeCompare(a.created_at || '')
          );
          total = list.length;
          console.log('[消息] 合并站内信', msgList.length, '条，共', total, '条');
        }
      } catch (_) {
        // 未登录时 message/list 可能失败，忽略
      }
    }

    return {
      code: 200,
      message: '',
      data: { data: list, total, current_page: 1, last_page: 1 },
    };
  })();
};

/**
 * 标记消息已读
 * - 公告走 POST /api/v1/notice/mark-read（NoticeController）
 * - 站内信走 POST /api/v1/message/mark-read（MessageController）
 */
export const readMessage = (id: number, source?: 'notice' | 'message'): Promise<MessageResponse> => {
  if (source === 'message') {
    return apiClient.post('message/mark-read', { id });
  }
  // 公告（默认）
  return apiClient.post('notice/mark-read', { id });
};

/**
 * 删除消息（仅站内信支持删除，公告不删）
 */
export const deleteMessage = (id: number): Promise<MessageResponse> => {
  return apiClient.post('message/delete', { id });
};

/**
 * 获取未读数量（公告）
 */
export const getNoticeUnreadCount = (): Promise<number> => {
  return apiClient.get('notice/unread-count').then((res: any) => {
    return res?.data?.unreadCount ?? 0;
  }).catch(() => 0);
};

// 兼容旧接口
export const getSendMessageList = () =>
  Promise.resolve({ code: 200, message: '', data: { data: [], total: 0 } });

export const sendMessage = (params: SendMessageRequest): Promise<MessageResponse> => {
  const url = params.pid ? `/member/message/send/${params.pid}` : '/member/message/send';
  return apiClient.post(url, { title: params.title, content: params.content });
};
