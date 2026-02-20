/**
 * 游戏收藏相关API
 * 统一走 houduan /api/v1/game/favorite/* 路由
 */
import phpGameClient from './php-game-client';

export interface FavoriteGame {
  id: number;
  game_id: number;
  game_name: string;
  platform_name: string;
  game_code: string;
  cover?: string;
  [key: string]: any;
}

export interface FavoriteListResponse {
  code: number;
  message: string;
  data: FavoriteGame[];
}

export interface FavoriteResponse {
  code: number;
  message: string;
  data?: any;
}

// 添加收藏 → POST /api/v1/game/favorite/add
export const addFavorite = (params: { game_id: number }): Promise<FavoriteResponse> => {
  return phpGameClient.post('game/favorite/add', params).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  }));
};

// 删除收藏 → POST /api/v1/game/favorite/remove
export const deleteFavorite = (params: { game_id: number }): Promise<FavoriteResponse> => {
  return phpGameClient.post('game/favorite/remove', params).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  }));
};

// 获取收藏列表 → GET /api/v1/game/favorites
export const getFavoriteList = (): Promise<FavoriteListResponse> => {
  return phpGameClient.get('game/favorites').then((res: any) => {
    const raw = res?.data?.list ?? res?.data ?? res?.list ?? [];
    const data: FavoriteGame[] = Array.isArray(raw) ? raw : [];
    return { code: res?.code === 0 ? 200 : (res?.code ?? 200), message: res?.message ?? '', data };
  }).catch(() => ({ code: 200, message: '', data: [] }));
};
