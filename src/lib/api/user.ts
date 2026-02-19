/**
 * 用户相关API
 */
import apiClient from './client';
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

// 获取用户信息（刷新余额）
// 使用 auth/me 接口，与 getUserInfo 相同，但保持此函数名以兼容现有代码
export const getUserInfoFromUser = (): Promise<UserInfoResponse> => {
  return apiClient.post('/auth/me', {}).then((res: any) => {
    // 调试：打印所有可能的余额字段
    if (res.code === 200 && res.data) {
      console.log('🔍 getUserInfoFromUser 余额字段检查:', {
        money: res.data.money,
        balance: res.data.balance,
        total_money: res.data.total_money,
        fs_money: res.data.fs_money,
        ml_money: res.data.ml_money,
        '原始数据': res.data
      });
      
      // 尝试多种可能的余额字段名（优先使用money，因为这是中心账户余额）
      const balanceValue = res.data.money !== undefined ? res.data.money :
                          res.data.balance !== undefined ? res.data.balance :
                          res.data.total_money ? parseFloat(res.data.total_money) :
                          0;
      
      return {
        ...res,
        data: {
          ...res.data,
          balance: balanceValue,
          username: res.data.username || res.data.name || '',
          vip: res.data.vip || res.data.vip_level || 0
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

export const getRegSetting = (): Promise<any> => {
  // 根据接口清单：GET /member/reg_setting
  return apiClient.get('/member/reg_setting');
};

// 退出登录
export const logoff = (): Promise<any> => {
  return apiClient.post('logoff', {});
};

// 上传头像
export const uploadAvatar = (formData: FormData): Promise<any> => {
  return apiClient.post('uploadimg', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 一键转账（回收所有游戏平台余额到钱包）
export const transferAll = (): Promise<any> => {
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  console.log('💰 调用 transferAll API, lang:', lang);
  // 尝试使用 /transall 接口
  // 注意：如果后端没有这个接口，会返回404，需要处理
  return apiClient.post(`transall?lang=${lang}`, {}).then((res: any) => {
    console.log('💰 transferAll API 响应:', res);
    return res;
  }).catch((error: any) => {
    console.error('❌ transferAll API 错误:', error);
    // 如果是404，说明接口不存在
    if (error.response?.status === 404 || error.code === 404) {
      throw new Error('回收余额接口不存在，请使用游戏页面内的转出功能');
    }
    throw error;
  });
};

// 更新用户信息
export interface UpdateUserInfoRequest {
  realname?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  line?: string;
  [key: string]: any;
}

export const updateUserInfo = (params: UpdateUserInfoRequest): Promise<any> => {
  // 根据接口清单：POST auth/info/update
  return apiClient.post('auth/info/update', params);
};

// 切换转账模式（自动/手动）
export const changeTransferMode = (status: number): Promise<any> => {
  const lang = localStorage.getItem('ly_lang') || 'zh_cn';
  // 根据接口清单：POST /game/change_trans
  // status: 1 = 自动, 0 = 手动
  return apiClient.post(`game/change_trans?lang=${lang}`, {
    status: status
  });
};

