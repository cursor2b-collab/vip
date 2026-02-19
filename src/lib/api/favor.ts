/**
 * 游戏收藏相关API
 */
import apiClient from './client';

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

// 添加收藏
export const addFavorite = (params: { game_id: number }): Promise<FavoriteResponse> => {
  // 根据接口清单：POST /favor/add
  return apiClient.post('/favor/add', params);
};

// 删除收藏
export const deleteFavorite = (params: { game_id: number }): Promise<FavoriteResponse> => {
  // 根据接口清单：POST /favor/delete
  return apiClient.post('/favor/delete', params);
};

// 获取收藏列表
export const getFavoriteList = (): Promise<FavoriteListResponse> => {
  // 根据接口清单：GET /favor/list
  return apiClient.get('/favor/list');
};

