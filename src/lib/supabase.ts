/**
 * Supabase 客户端（与管理后台 ht 统一使用同一 Supabase 项目）
 * 环境变量: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] VITE_SUPABASE_URL 或 VITE_SUPABASE_PUBLISHABLE_KEY 未配置')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

/** 是否使用 Supabase 登录（与 ht 管理后台统一认证时可设为 true） */
export const USE_SUPABASE_AUTH =
  import.meta.env.VITE_USE_SUPABASE_AUTH === 'true'

/** 是否使用 Supabase 作为业务数据源（轮播图/公告等），与 ht 一致 */
export const USE_SUPABASE_DATA =
  import.meta.env.VITE_USE_SUPABASE_DATA === 'true' || USE_SUPABASE_AUTH

/** 数据库表名（与 Supabase 项目 pkapmnmmpaudroleorjw 一致） */
export const SUPABASE_TABLES = {
  system_banner: 'system_banner',
  notice: 'notice',
  caipiao_game: 'caipiao_game',
  caipiao_game_category: 'caipiao_game_category',
  usdt_receive_config: 'usdt_receive_config',
  usdt_recharge_orders: 'usdt_recharge_orders',
  profiles: 'profiles',
  balance_log: 'balance_log',
  level_reward_config: 'level_reward_config',
  level_reward_record: 'level_reward_record',
  user_bank: 'user_bank',
  activity: 'activity',
  activity_type: 'activity_type',
} as const
