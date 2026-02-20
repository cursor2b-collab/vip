/**
 * 认证相关API
 * 当 VITE_USE_SUPABASE_AUTH=true 时与 ht 管理后台统一使用 Supabase Auth
 * 余额从 profiles 表读取（USDT 上分写入 profiles.balance）
 */
import apiClient from './client';
import phpGameClient from './php-game-client';
import { supabase, SUPABASE_TABLES } from '@/lib/supabase';

/** 是否使用 Supabase 登录（与 ht 统一，需配置 VITE_USE_SUPABASE_AUTH=true） */
export const USE_SUPABASE_AUTH = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

/** 将用户名转为 Supabase 邮箱，与 ht 一致：不含 @ 则拼接 @supabase-admin.local */
function toSupabaseEmail(name: string): string {
  const n = (name || '').trim();
  return n.includes('@') ? n : `${n}@supabase-admin.local`;
}

/** Supabase 登录 */
export async function loginWithSupabase(name: string, password: string): Promise<{ access_token: string; user: any }> {
  const email = toSupabaseEmail(name);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || '登录失败');
  if (!data.session?.access_token || !data.user) throw new Error('未返回会话');
  return { access_token: data.session.access_token, user: data.user };
}

/** Supabase 注册 */
export async function registerWithSupabase(
  name: string,
  password: string,
  options?: { realname?: string; inviteCode?: string }
): Promise<{ access_token: string; user: any }> {
  const email = toSupabaseEmail(name);
  const inviteCode = (options?.inviteCode || '').trim()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname: options?.realname || name,
        realname: options?.realname || '',
        invite_code: inviteCode || undefined  // 存入 user_metadata，由 handle_new_user 触发器处理
      }
    }
  });
  if (error) throw new Error(error.message || '注册失败')
  if (data.user?.id && inviteCode) {
    await supabase.rpc('complete_invite_registration', {
      p_user_id: data.user.id,
      p_invite_code: inviteCode
    })
  }
  if (data.session?.access_token && data.user) {
    return { access_token: data.session.access_token, user: data.user };
  }
  if (data.user && !data.session) {
    throw new Error('注册成功，请查收邮件确认或联系管理员开启账号');
  }
  throw new Error('注册失败');
}

/** 从 Supabase 当前会话获取用户信息；余额从 profiles 表读取（充值上分写的是 profiles.balance） */
export async function getUserInfoFromSupabase(): Promise<{
  code: number;
  status?: string;
  data?: { id: string; user_id: string; username: string; name: string; userName?: string; email?: string; money?: number; balance?: number; nickname?: string; [key: string]: any };
}> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) {
    return { code: 401, status: 'error', data: undefined };
  }
  const u = session.user;
  const meta = u.user_metadata || {};
  let username = u.email?.split('@')[0] ?? u.id?.slice(0, 8) ?? '';
  let nickname = (meta.nickname as string) || (meta.realname as string) || username;
  let balance = Number(meta.balance ?? meta.money ?? 0) || 0;
  const { data: profile } = await supabase
    .from(SUPABASE_TABLES.profiles)
    .select('balance, username, nickname, vip_level, invite_code')
    .eq('id', u.id)
    .maybeSingle();
  const vipLevel = profile?.vip_level != null ? Number(profile.vip_level) : 1;
  if (profile) {
    balance = Number(profile.balance ?? 0) || 0;
    if (profile.username) username = profile.username;
    if (profile.nickname) nickname = profile.nickname;
  }
  return {
    code: 200,
    status: 'success',
    data: {
      id: u.id,
      user_id: u.id,
      username,
      name: nickname,
      userName: u.email ?? '',
      email: u.email ?? '',
      nickname,
      money: balance,
      balance,
      vip: vipLevel,
      level: vipLevel,
      invite_code: profile?.invite_code ?? undefined,
      ...meta
    }
  };
}

/** Supabase 登出 */
export async function logoutSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

/** 发送邮箱验证码（Supabase OTP，需在 Dashboard 邮件模板中启用 {{ .Token }}） */
export async function sendEmailOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true }
  });
  if (error) throw new Error(error.message || '发送验证码失败');
}

/** 邮箱验证码验证并登录/注册（Supabase verifyOtp） */
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ access_token: string; user: any }> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email'
  });
  if (error) throw new Error(error.message || '验证码错误或已过期');
  if (!data.session?.access_token || !data.user) throw new Error('验证失败');
  return { access_token: data.session.access_token, user: data.user };
}

export interface LoginRequest {
  name: string;
  password: string;
  code: string;
  key: string;
}

export interface RegisterRequest {
  name: string;
  password: string;
  confirmPass: string;
  realname: string;
  paypassword: string;
  lang: string;
  code: string;
  inviteCode: string;
  key: string;
}

export interface AuthResponse {
  code: number;
  message: string;
  data: {
    api_token?: string;
    access_token?: string;
    user?: any;
  };
}

export interface CaptchaResponse {
  code: number;
  message: string;
  data: {
    img?: string;
    image?: string;
    key?: string;
    captcha_key?: string;
  };
}

export interface LanguageResponse {
  code: number;
  message: string;
  data: {
    list: Record<string, string>;
    default?: string;
  };
}

/**
 * 后端登录（POST /api/v1/auth/login）
 * 后端接收 username + password，返回 {code:0, data:{token, username, ...}}
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await phpGameClient.post('auth/login', {
    username: (data.name || '').trim(),
    password: data.password,
    register_site: typeof window !== 'undefined' ? window.location.origin : ''
  }) as any;
  // phpGameClient 拦截器已返回 res.data（响应体）
  // 统一为前端期望的 AuthResponse 格式
  // 响应结构：{code:0, data:{token, user:{id, username, nickname, balance, ...}}}
  const token = res?.data?.token || res?.data?.access_token || res?.token || '';
  const user = res?.data?.user ?? {};
  return {
    code: res?.code === 0 ? 200 : (res?.code ?? 500),
    message: res?.message ?? '',
    data: {
      ...res?.data,
      ...user,           // 将 user 展开：id, username, nickname, balance...
      token,
      access_token: token,
      api_token: token
    }
  };
};

/**
 * 后端注册（POST /api/v1/register）
 * 后端接收 username + password + cpassword，返回 {code:0, data:{token, username, ...}}
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const inviteCode = (data.inviteCode || urlParams?.get('i') || '').trim();
  const res = await phpGameClient.post('register', {
    username: (data.name || '').trim(),
    password: data.password,
    cpassword: data.confirmPass || data.password,
    invite_code: inviteCode || undefined,
    register_site: typeof window !== 'undefined' ? window.location.origin : ''
  }) as any;
  // 注册响应结构：{code:0, data:{token, username, user:{id, username, balance, ...}}}
  const token = res?.data?.token || res?.data?.access_token || res?.token || '';
  const user = res?.data?.user ?? {};
  return {
    code: res?.code === 0 ? 200 : (res?.code ?? 500),
    message: res?.message ?? '',
    data: {
      ...res?.data,
      ...user,           // 展开 user：id, username, nickname, balance...
      token,
      access_token: token,
      api_token: token
    }
  };
};

// 获取验证码（houduan 无 captcha 接口，返回 mock 让前端跳过验证码步骤）
export const getCaptcha = (): Promise<CaptchaResponse> => {
  return Promise.resolve({ code: 200, message: '', data: { img: '', key: 'no-captcha', captcha_key: 'no-captcha' } });
};

// 获取滑块验证码（同上，返回 mock）
export const getSliderCaptcha = (): Promise<CaptchaResponse> => {
  return Promise.resolve({ code: 200, message: '', data: { key: 'no-captcha', captcha_key: 'no-captcha' } });
};

// 获取语言/币种列表（从 houduan /api/v1/config 获取，降级返回默认币种）
export const getLanguages = async (): Promise<LanguageResponse> => {
  const response = await phpGameClient.get('config', { params: { group: 'language' } }).catch(() => null);
  
  // 后端可能返回语言数据而不是币种数据，需要转换
  const currencyMap: Record<string, string> = {
    'zh_cn': '人民币(CNY)',
    'zh_hk': '港币(HKD)',
    'ja': '日元(JPY)',
    'id': '印尼盾(IDR)',
    'vi': '越南盾(VND)',
    'th': '泰铢(THB)',
    'en': '美元(USD)'
  };
  
  if (response.code === 200 && response.data) {
    let languages = response.data.list || {};
    const defaultLang = response.data.default || (Object.keys(languages)[0]) || 'zh_cn';
    
    // 检查后端返回的是否为语言数据（包含"中文"、"English"等）
    const hasLanguageText = Object.values(languages).some(val => 
      typeof val === 'string' && (val.includes('中文') || val.includes('English') || val.includes('ไทย') || val.includes('Name'))
    );
    
    // 如果后端返回的是语言数据，则转换为币种数据
    if (hasLanguageText || Object.keys(languages).length === 0) {
      languages = currencyMap;
      console.log('⚠️ 后端返回语言数据,已转换为币种:', languages);
    } else {
      console.log('✓ 后端返回币种数据:', languages);
    }
    
    return {
      ...response,
      data: {
        list: languages,
        default: defaultLang
      }
    };
  }
  
  return response;
};

/**
 * 获取用户信息
 * - USE_SUPABASE_AUTH=false（默认）：调用后端 GET /api/v1/auth/profile
 * - USE_SUPABASE_AUTH=true：从 Supabase 会话读取（向后兼容）
 */
export const getUserInfo = async (): Promise<any> => {
  if (USE_SUPABASE_AUTH) {
    return getUserInfoFromSupabase();
  }
  // 后端 profile 接口（需要 backend_token 或 token）
  try {
    const res = await phpGameClient.get('auth/profile') as any;
    if (res?.code !== 0 && res?.code !== 200) {
      return { code: res?.code ?? 401, status: 'error', message: res?.message ?? '未登录', data: undefined };
    }
    const raw = res?.data ?? {};
    const u = raw?.user ?? raw;
    const balance = Number(u.balance ?? u.money ?? 0);
    const inviteCode = u.invite_code ?? u.inviteCode ?? raw.invite_code ?? raw.inviteCode ?? raw.code ?? '';
    return {
      code: 200,
      status: 'success',
      data: {
        id: u.id,
        user_id: u.id,
        username: u.username ?? u.name ?? '',
        name: u.nickname ?? u.username ?? u.name ?? '',
        nickname: u.nickname ?? u.username ?? u.name ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        money: balance,
        balance,
        vip: u.vip_level ?? u.vip ?? 1,
        level: u.vip_level ?? u.vip ?? 1,
        groupid: u.groupid ?? 0,
        groupname: u.groupname ?? '',
        invite_code: String(inviteCode || ''),
        ...u
      }
    };
  } catch (e: any) {
    return { code: 401, status: 'error', message: e?.message ?? '获取用户信息失败', data: undefined };
  }
};

/**
 * 登出：清除本地 token（后端 JWT 无状态，无需调用接口）
 * USE_SUPABASE_AUTH=true 时额外调用 Supabase signOut
 */
export const logout = async (): Promise<any> => {
  if (USE_SUPABASE_AUTH) {
    await logoutSupabase();
  }
  return { code: 200 };
};

/**
 * 后端登录（获取后端自有 JWT，用于游戏接口鉴权）
 * 路由：POST /api/v1/auth/login（phpGameClient baseURL = /api/v1）
 * 成功返回 backend_token，失败静默返回 null（不影响主登录流程）
 */
export async function loginWithBackend(name: string, password: string): Promise<string | null> {
  try {
    const res = await phpGameClient.post('auth/login', {
      username: name.trim(),  // 后端接收 username 字段
      password,
      register_site: typeof window !== 'undefined' ? window.location.origin : ''
    }) as { code?: number; data?: { token?: string }; message?: string };
    if (res?.code === 0 && res?.data?.token) {
      return res.data.token;
    }
    return null;
  } catch {
    return null;
  }
}

/** 将后端 JWT 持久化到 localStorage / sessionStorage */
export function saveBackendToken(token: string): void {
  localStorage.setItem('backend_token', token);
  sessionStorage.setItem('backend_token', token);
}

/** 清除后端 JWT */
export function clearBackendToken(): void {
  localStorage.removeItem('backend_token');
  sessionStorage.removeItem('backend_token');
}

/**
 * 向后端注册账号，使与 MySQL caipiao_member 表同步
 * 注册成功或账号已存在后尝试登录，获取 backend_token
 * 失败时静默返回 null，不阻断主注册流程
 */
export async function syncBackendAccount(name: string, password: string): Promise<string | null> {
  try {
    // 先尝试注册（路由：POST /api/v1/register）
    await phpGameClient.post('register', {
      username: name.trim(),
      password,
      cpassword: password,
      register_site: typeof window !== 'undefined' ? window.location.origin : ''
    });
  } catch {
    // 注册失败（如账号已存在）时继续尝试登录
  }
  // 无论注册是否成功，均尝试登录获取 token
  return loginWithBackend(name, password);
}

