/**
 * 获取PG游戏列表的示例
 * 数据来源：game_lists 表（通过 /api/games/lists 接口）
 */

import { useGames } from '@/contexts/GameContext';
import { getGameList } from '@/lib/api/game';

/**
 * 方法1: 使用 GameContext（推荐）
 * 在React组件中使用
 * GameContext 会自动从 game_lists 表获取所有游戏数据
 */
export function usePGGames() {
  const { gamingList } = useGames();
  
  // 筛选PG平台的游戏
  const pgGames = gamingList.filter(game => 
    (game.platform_name || '').toUpperCase() === 'PG'
  );
  
  return pgGames;
}

/**
 * 方法2: 直接调用API（使用 /api/games/lists 接口）
 * 可以在任何地方使用（包括非React组件）
 * 注意：getGameList() 会从 game_lists 表获取所有类型的游戏（gameType=1,3,4,5,6）
 */
export async function fetchPGGames() {
  try {
    // getGameList() 会调用 /api/games/lists 接口，从 game_lists 表获取所有游戏
    const response = await getGameList();
    
    if (response.code === 200 && response.data) {
      // 筛选PG平台的电子游戏（game_type=3）
      const pgGames = response.data.filter((game: any) => {
        const platformName = (game.platform_name || '').toUpperCase();
        return platformName === 'PG' && game.game_type === 3;
      });
      
      return pgGames;
    }
    
    return [];
  } catch (error) {
    console.error('获取PG游戏失败:', error);
    return [];
  }
}

/**
 * 方法3: 在组件中使用示例
 */
export function PGGamesComponent() {
  const { gamingList, loading } = useGames();
  
  // 筛选PG平台的游戏
  const pgGames = gamingList.filter(game => 
    (game.platform_name || '').toUpperCase() === 'PG'
  );
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  return (
    <div>
      <h2>PG游戏列表 ({pgGames.length}个)</h2>
      <ul>
        {pgGames.map((game, index) => (
          <li key={index}>
            <div>游戏名称: {game.name}</div>
            <div>平台: {game.platform_name}</div>
            <div>游戏代码: {game.game_code}</div>
            <div>游戏类型: {game.game_type}</div>
            <img src={game.cover} alt={game.name} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 游戏数据结构说明（来自 game_lists 表）：
 * {
 *   id?: number,               // 游戏ID（来自 game_lists 表）
 *   name: string,              // 游戏名称（对应 game_lists.name）
 *   platform_name: string,     // 平台名称，如 'PG'（对应 game_lists.api_name）
 *   game_code: string,         // 游戏代码（对应 game_lists.game_code 或 param_remark 中的 gameCode）
 *   game_type: number,         // 游戏类型：1=真人视讯, 3=电子游戏, 4=彩票, 5=体育, 6=小游戏
 *   cover: string,             // 游戏封面图片URL（优先使用 full_image_url，然后是 img_url，最后是 img_path）
 *   category_id: string,       // 分类ID：'realbet'=真人, 'gaming'=电子游戏, 'lottery'=彩票, 'sport'=体育, 'joker'=小游戏
 *   tags?: string,             // 标签（对应 game_lists.tags）
 *   params?: any,              // 游戏参数（从 game_lists.param_remark JSON 解析）
 *   app_state?: number,        // 应用状态（对应 game_lists.is_open）
 *   raw?: any,                  // 原始游戏数据对象
 * }
 * 
 * 数据来源：
 * - 后端接口：/api/games/lists?gameType={gameType}&isMobile=1
 * - 数据库表：game_lists（GameList 模型）
 * - 获取方式：getGameList() 会并行调用 gameType=1,3,4,5,6 的接口，合并所有结果
 */
