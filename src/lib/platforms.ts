/**
 * 游戏平台列表（与管理后台 B77houtai src/api/game-platform.ts DEFAULT_PLATFORMS 保持一致）
 * 用于额度转换页等展示与后台 #/lottery/game-list 相同的平台
 */
export interface PlatformItem {
  code: string;
  name: string;
  type: string;
}

/** 预设游戏平台列表（与后台 lottery/game-list 一致） */
export const DEFAULT_PLATFORMS: PlatformItem[] = [
  { code: 'ag', name: '亚游', type: 'live' },
  { code: 'allbet', name: '欧博', type: 'live' },
  { code: 'ap', name: '平博', type: 'sport' },
  { code: 'bbin', name: '宝盈', type: 'live' },
  { code: 'bg', name: '大游', type: 'live' },
  { code: 'boya', name: '博雅', type: 'chess' },
  { code: 'cmd', name: 'CMD', type: 'sport' },
  { code: 'cq9', name: 'CQ9', type: 'live' },
  { code: 'cr', name: '皇冠', type: 'sport' },
  { code: 'crown', name: '皇冠', type: 'sport' },
  { code: 'db1', name: '多宝视讯', type: 'live' },
  { code: 'db2', name: '多宝老虎机', type: 'slot' },
  { code: 'db3', name: '多宝彩票', type: 'lottery' },
  { code: 'db5', name: '多宝电竞', type: 'sport' },
  { code: 'db6', name: '多宝捕鱼', type: 'fishing' },
  { code: 'db7', name: '多宝棋牌', type: 'chess' },
  { code: 'dg', name: 'DG', type: 'live' },
  { code: 'esb', name: '电竞牛', type: 'sport' },
  { code: 'evo', name: 'EVO', type: 'live' },
  { code: 'fb', name: 'FB', type: 'sport' },
  { code: 'fc', name: 'FC', type: 'slot' },
  { code: 'fg', name: 'FG', type: 'slot' },
  { code: 'ftg', name: 'FTG', type: 'slot' },
  { code: 'gb', name: 'GB', type: 'slot' },
  { code: 'gw', name: 'GW', type: 'lottery' },
  { code: 'hb', name: 'HB', type: 'slot' },
  { code: 'im', name: 'IM', type: 'sport' },
  { code: 'jdb', name: '夺宝', type: 'slot' },
  { code: 'jili', name: 'JILI', type: 'slot' },
  { code: 'joker', name: 'Joker', type: 'slot' },
  { code: 'ka', name: 'KA', type: 'slot' },
  { code: 'km', name: 'KingMaker', type: 'slot' },
  { code: 'ky', name: '开元', type: 'fishing' },
  { code: 'leg', name: '乐游', type: 'fishing' },
  { code: 'lgd', name: 'LGD', type: 'slot' },
  { code: 'mg', name: 'MG', type: 'live' },
  { code: 'mt', name: '美天', type: 'slot' },
  { code: 'mw', name: '大满贯', type: 'slot' },
  { code: 'newbb', name: 'NewBB', type: 'sport' },
  { code: 'og', name: '东方', type: 'live' },
  { code: 'panda', name: '熊猫体育', type: 'sport' },
  { code: 'pg', name: 'PG', type: 'slot' },
  { code: 'pgs', name: 'pgs', type: 'slot' },
  { code: 'png', name: 'PNG', type: 'slot' },
  { code: 'pp', name: '王者', type: 'slot' },
  { code: 'pt', name: 'PT', type: 'live' },
  { code: 'r88', name: 'R88', type: 'slot' },
  { code: 'rt', name: 'RT', type: 'slot' },
  { code: 'sa', name: '沙龙', type: 'live' },
  { code: 'saba', name: '沙巴', type: 'sport' },
  { code: 'sbo', name: 'SBO', type: 'sport' },
  { code: 'sexy', name: 'Sexy', type: 'live' },
  { code: 'sg', name: 'SG', type: 'slot' },
  { code: 'sgwin', name: '双赢', type: 'lottery' },
  { code: 'ss', name: '三昇', type: 'sport' },
  { code: 't1', name: 'T1game', type: 'slot' },
  { code: 'tcg', name: '天成', type: 'lottery' },
  { code: 'tf', name: '雷火电竞', type: 'sport' },
  { code: 'ttg', name: 'TTG', type: 'slot' },
  { code: 'ug', name: 'UG', type: 'sport' },
  { code: 'v8', name: 'V8 Poker', type: 'chess' },
  { code: 'vg', name: '财神棋牌', type: 'fishing' },
  { code: 'vr', name: 'VR', type: 'lottery' },
  { code: 'we', name: 'WE', type: 'live' },
  { code: 'wl', name: '瓦力', type: 'live' },
  { code: 'wm', name: '完美', type: 'live' },
  { code: 'ww', name: '双赢', type: 'lottery' },
  { code: 'xg', name: 'XG', type: 'live' },
  { code: 'xgd', name: '高登', type: 'chess' },
  { code: 'xj', name: '小金', type: 'sport' },
];

/** 按 code 取展示名称 */
export function getPlatformName(code: string): string {
  const key = String(code || '').toLowerCase();
  const item = DEFAULT_PLATFORMS.find((p) => p.code.toLowerCase() === key);
  return item ? item.name : key.toUpperCase();
}
