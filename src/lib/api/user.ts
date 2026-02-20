/**
 * 用户相关API
 */
import phpGameClient from './php-game-client';
import { supabase, SUPABASE_TABLES } from '@/lib/supabase';

/** 晋升条件类型：1=存款额达标 2=投注额达标 3=任一个达标 4=所有达标 */
export interface VipLevel {
  level: number;
  level_name: string;
  /** 该等级 VIP 图标路径，如 /images/newimg/vip-1.webp，留空则用默认 vip-{level}.webp */
  level_icon?: string;
  deposit_money: number;
  bet_money: number;
  level_bonus: number;
  day_bonus: number;
  week_bonus: number;
  month_bonus: number;
  year_bonus: number;
  /** 生日礼物（与每年礼金区分） */
  birthday_bonus: number;
  credit_bonus: number;
  levelup_type: number;
  lang: string;
}

export interface UserInfoResponse {
  code: number;
  message: string;
  data: {
    username: string;
    balance: number;
    vip: number;
    paysum?: number;
  };
}

export interface VipInfoResponse {
  code: number;
  message: string;
  data: {
    levels: VipLevel[];
    total_bet: number;
    total_deposit: number;
    levelup_types: any;
    member_levels: {
      level_bonus: number;
      day_bonus: number;
      week_bonus: number;
      month_bonus: number;
      year_bonus: number;
      birthday_bonus: number;
      credit_bonus: number;
    };
  };
}

export interface VipResponse {
  code: number;
  message: string;
  data: VipLevel[];
}

// 获取用户信息（刷新余额）→ GET /api/v1/auth/profile
export const getUserInfoFromUser = (): Promise<UserInfoResponse> => {
  return phpGameClient.get('auth/profile').then((res: any) => {
    const raw = res?.data?.user ?? res?.data ?? res;
    if (res.code === 200 || res.code === 0) {
      const balanceValue = raw.money !== undefined ? raw.money
        : raw.balance !== undefined ? raw.balance
        : raw.total_money ? parseFloat(raw.total_money) : 0;
      return {
        ...res,
        code: res.code ?? 200,
        data: {
          ...raw,
          money: balanceValue,
          balance: balanceValue,
          username: raw.username ?? raw.name ?? '',
          vip: raw.vip ?? raw.vip_level ?? 0
        }
      };
    }
    return res;
  });
};

// 晋升条件类型：deposit=1, bet=2, any=3, all=4
function conditionTypeToLevelupType(v: string | undefined): number {
  const map: Record<string, number> = { deposit: 1, bet: 2, any: 3, all: 4 };
  return map[String(v || 'any').toLowerCase()] ?? 3;
}

// 从 Supabase level_reward_config 映射为 VipLevel（与 /member/vips 结构一致）
function mapLevelConfigToVipLevel(r: any): VipLevel {
  return {
    level: Number(r.level_id ?? 0),
    level_name: String(r.level_name ?? ''),
    level_icon: r.level_icon ? String(r.level_icon).trim() : undefined,
    deposit_money: Number(r.promote_deposit ?? 0),
    bet_money: Number(r.promote_bet ?? r.required_points ?? 0),
    level_bonus: Number(r.reward_amount ?? 0),
    day_bonus: Number(r.daily_bonus ?? 0),
    week_bonus: Number(r.week_bonus ?? 0),
    month_bonus: Number(r.month_bonus ?? 0),
    year_bonus: Number(r.year_bonus ?? 0),
    birthday_bonus: Number(r.birthday_bonus ?? 0),
    credit_bonus: Number(r.borrow_limit_reward ?? 0),
    levelup_type: conditionTypeToLevelupType(r.condition_type),
    lang: String(r.lang_currency ?? 'zh_cn')
  };
}

async function getVipInfoFromSupabase(): Promise<VipInfoResponse> {
  const { data: rows, error } = await supabase
    .from(SUPABASE_TABLES.level_reward_config)
    .select('*')
    .eq('is_enabled', 1)
    .order('sort_order', { ascending: true });
  if (error) return { code: 500, message: error.message, data: { levels: [], total_bet: 0, total_deposit: 0, levelup_types: {}, member_levels: { level_bonus: 0, day_bonus: 0, week_bonus: 0, month_bonus: 0, year_bonus: 0, birthday_bonus: 0, credit_bonus: 0 } } };
  const levels: VipLevel[] = (rows ?? []).map(mapLevelConfigToVipLevel);
  const firstLevel = levels[0];

  let total_bet = 0;
  let total_deposit = 0;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    const { data: profile } = await supabase
      .from(SUPABASE_TABLES.profiles)
      .select('total_deposit, total_bet')
      .eq('id', session.user.id)
      .maybeSingle();
    if (profile) {
      total_deposit = Number(profile.total_deposit ?? 0) || 0;
      total_bet = Number(profile.total_bet ?? 0) || 0;
    }
  }

  const levelupTypes: Record<number, string> = { 1: '存款额达标', 2: '投注额达标', 3: '任一个达标', 4: '所有达标' };
  return {
    code: 200,
    message: '',
    data: {
      levels,
      total_bet,
      total_deposit,
      levelup_types: levelupTypes,
      member_levels: firstLevel ? {
        level_bonus: firstLevel.level_bonus,
        day_bonus: firstLevel.day_bonus,
        week_bonus: firstLevel.week_bonus,
        month_bonus: firstLevel.month_bonus,
        year_bonus: firstLevel.year_bonus,
        birthday_bonus: firstLevel.birthday_bonus,
        credit_bonus: firstLevel.credit_bonus
      } : { level_bonus: 0, day_bonus: 0, week_bonus: 0, month_bonus: 0, year_bonus: 0, birthday_bonus: 0, credit_bonus: 0 }
    }
  };
}

// 仅 Supabase：VIP 等级与礼金从 level_reward_config + profiles 读取
// 获取VIP信息（完整详情）
export const getUserVipInfo = (): Promise<VipInfoResponse> => {
  return getVipInfoFromSupabase();
};

// 获取VIP信息（兼容旧接口）
export const getUserVip = (): Promise<VipResponse> => {
  return getVipInfoFromSupabase().then((res) => ({
    code: res.code,
    message: res.message,
    data: res.data?.levels ?? []
  }));
};

// 获取注册配置（houduan 无专门接口，从 config 获取或返回默认值）
export const getRegSetting = (): Promise<any> => {
  return phpGameClient.get('config', { params: { group: 'register' } }).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data ?? {}
  })).catch(() => ({ code: 200, message: '', data: {} }));
};

// 退出登录 → POST /api/v1/auth/logout
export const logoff = (): Promise<any> => {
  return phpGameClient.post('auth/logout', {}).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? ''
  })).catch(() => ({ code: 200, message: '' }));
};

// 上传头像（houduan 无独立接口，走 PUT auth/profile 更新 avatar 字段）
export const uploadAvatar = (formData: FormData): Promise<any> => {
  return phpGameClient.post('auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  })).catch(() => ({ code: 200, message: '', data: {} }));
};

// 一键回收所有游戏余额 → POST /api/v1/game/recover-all
export const transferAll = (): Promise<any> => {
  return phpGameClient.post('game/recover-all', {}).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  })).catch((err: any) => ({
    code: err?.code ?? 500,
    message: err?.message ?? '回收余额失败'
  }));
};

// 更新用户信息
export interface UpdateUserInfoRequest {
  realname?: string;
  phone?: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  [key: string]: any;
}

// 更新用户信息 → POST /api/v1/auth/profile
export const updateUserInfo = (params: UpdateUserInfoRequest): Promise<any> => {
  return phpGameClient.post('auth/profile', params).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  }));
};

// 切换转账模式（houduan 无 game/change_trans，降级为成功）
export const changeTransferMode = (_status: number): Promise<any> => {
  return Promise.resolve({ code: 200, message: '' });
};

