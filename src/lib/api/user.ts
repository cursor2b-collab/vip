/**
 * 用户相关API（VIP 等级统一走 houduan：level-rewards/configs + level-rewards）
 */
import phpGameClient from './php-game-client';

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

const DEFAULT_VIP_INFO_DATA: VipInfoResponse['data'] = {
  levels: [],
  total_bet: 0,
  total_deposit: 0,
  levelup_types: {},
  member_levels: { level_bonus: 0, day_bonus: 0, week_bonus: 0, month_bonus: 0, year_bonus: 0, birthday_bonus: 0, credit_bonus: 0 }
};

function defaultVipInfoResponse(code: number, message: string): VipInfoResponse {
  return { code, message, data: DEFAULT_VIP_INFO_DATA };
}

// 从 houduan level-rewards/configs 或其它后端返回映射为 VipLevel（支持 camelCase）
function mapLevelConfigToVipLevel(r: any): VipLevel {
  return {
    level: Number(r.level_id ?? r.levelId ?? r.level ?? 0),
    level_name: String(r.level_name ?? r.levelName ?? r.name ?? ''),
    level_icon: (r.level_icon ?? r.level_icon_url) ? String(r.level_icon ?? r.level_icon_url).trim() : undefined,
    deposit_money: Number(r.promote_deposit ?? r.deposit_money ?? 0),
    bet_money: Number(r.cumulativeRequired ?? r.cumulative_required ?? r.promote_bet ?? r.required_points ?? r.requiredPoints ?? r.bet_money ?? 0),
    level_bonus: Number(r.reward_amount ?? r.rewardAmount ?? r.level_bonus ?? 0),
    day_bonus: Number(r.daily_bonus ?? r.day_bonus ?? 0),
    week_bonus: Number(r.week_bonus ?? r.weeklyBonus ?? r.weekly_bonus ?? 0),
    month_bonus: Number(r.month_bonus ?? r.monthlyBonus ?? r.monthly_bonus ?? 0),
    year_bonus: Number(r.year_bonus ?? 0),
    birthday_bonus: Number(r.birthday_bonus ?? 0),
    credit_bonus: Number(r.borrow_limit_reward ?? r.credit_bonus ?? 0),
    levelup_type: conditionTypeToLevelupType(r.condition_type ?? r.levelup_type),
    lang: String(r.lang_currency ?? r.lang ?? 'zh_cn')
  };
}

/** 从 houduan 获取 VIP 信息：level-rewards/configs（等级配置）+ level-rewards（用户投注额，需登录） */
async function getVipInfoFromHouduan(): Promise<VipInfoResponse> {
  const levelupTypes: Record<number, string> = { 1: '存款额达标', 2: '投注额达标', 3: '任一个达标', 4: '所有达标' };
  try {
    const configRes: any = await phpGameClient.get('level-rewards/configs');
    const list = configRes?.data ?? (Array.isArray(configRes) ? configRes : []);
    if (configRes?.code !== 200 && configRes?.code !== 0) {
      return defaultVipInfoResponse(configRes?.code ?? 500, configRes?.message ?? '获取等级配置失败');
    }
    const levels: VipLevel[] = (Array.isArray(list) ? list : []).map(mapLevelConfigToVipLevel);
    const firstLevel = levels[0];

    let total_bet = 0;
    let total_deposit = 0;
    try {
      const rewardRes: any = await phpGameClient.get('level-rewards');
      if (rewardRes?.code === 200 || rewardRes?.code === 0) {
        total_bet = Number(rewardRes?.data?.totalBetting ?? rewardRes?.data?.total_bet ?? 0);
        total_deposit = Number(rewardRes?.data?.totalDeposit ?? rewardRes?.data?.total_deposit ?? 0);
      }
    } catch (_) {}

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
        } : DEFAULT_VIP_INFO_DATA.member_levels
      }
    };
  } catch (e: any) {
    return defaultVipInfoResponse(500, e?.message ?? 'houduan 接口失败');
  }
}

// 获取VIP信息（完整详情）：统一走 houduan
export const getUserVipInfo = async (): Promise<VipInfoResponse> => {
  return getVipInfoFromHouduan();
};

// 获取VIP信息（兼容旧接口）
export const getUserVip = (): Promise<VipResponse> => {
  return getUserVipInfo().then((res) => ({
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

