/**
 * 游戏数据Context
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getGameList, getApiGames, type Game } from '@/lib/api/game';

export interface ApiGameItem {
  title: string;
  api_name: string;
  platform_name: string;
  game_type: number;
  game_code: string;
  cover?: string;
  [key: string]: any;
}

interface GameContextType {
  realbetList: Game[];
  gamingList: Game[];
  jokerList: Game[];
  sportList: Game[];
  lotteryList: Game[];
  conciseList: Game[];
  /** 合并所有分类，电游大厅用此列表可显示全部游戏 */
  allGamesList: Game[];
  apiGamesList: ApiGameItem[];
  loading: boolean;
  refreshGames: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [realbetList, setRealbetList] = useState<Game[]>([]);
  const [gamingList, setGamingList] = useState<Game[]>([]);
  const [jokerList, setJokerList] = useState<Game[]>([]);
  const [sportList, setSportList] = useState<Game[]>([]);
  const [lotteryList, setLotteryList] = useState<Game[]>([]);
  const [conciseList, setConciseList] = useState<Game[]>([]);
  const [apiGamesList, setApiGamesList] = useState<ApiGameItem[]>([]);
  const [loading, setLoading] = useState(true);

  const allGamesList = React.useMemo(
    () => [...realbetList, ...gamingList, ...jokerList, ...sportList, ...lotteryList, ...conciseList],
    [realbetList, gamingList, jokerList, sportList, lotteryList, conciseList]
  );

  const refreshGames = async () => {
    setLoading(true);
    try {
      const [res, apiRes] = await Promise.all([getGameList(), getApiGames()]);
      if (apiRes.code === 200 && apiRes.data) {
        setApiGamesList(apiRes.data);
      }
      
      if (res && res.code === 200 && res.data) {
        const games = res.data;
        
        // 重置列表
        setRealbetList([]);
        setGamingList([]);
        setJokerList([]);
        setSportList([]);
        setLotteryList([]);
        setConciseList([]);
        
        // 根据category_id分类
        games.forEach((game: Game) => {
          // 未匹配到的类型统一归入 gaming，避免电游大厅一个都不显示
          const category = game.category_id || 'gaming';
          game.category_id = category;
          // 处理PA视讯改为BG视讯
          if (category === 'realbet') {
            if (game.name === 'PA视讯' || game.platform_name === 'PA') {
              game.name = 'BG视讯';
              game.platform_name = 'BG';
            }
            setRealbetList(prev => [...prev, game]);
          } else if (category === 'joker') {
            setJokerList(prev => [...prev, game]);
          } else if (category === 'gaming') {
            setGamingList(prev => [...prev, game]);
          } else if (category === 'sport') {
            if (game.name === 'AG体育' || game.platform_name === 'AGTY') {
              game.name = 'PA体育';
            }
            if (game.name === '泛亚电竞2') {
              game.name = '泛亚电竞';
            }
            setSportList(prev => [...prev, game]);
          } else if (category === 'lottery') {
            setLotteryList(prev => [...prev, game]);
          } else if (category === 'concise') {
            setConciseList(prev => [...prev, game]);
          } else {
            setGamingList(prev => [...prev, game]);
          }
        });
        
        // 统计各分类的游戏数量
        const stats = {
          realbet: games.filter((g: Game) => g.category_id === 'realbet').length,
          gaming: games.filter((g: Game) => g.category_id === 'gaming').length,
          joker: games.filter((g: Game) => g.category_id === 'joker').length,
          sport: games.filter((g: Game) => g.category_id === 'sport').length,
          lottery: games.filter((g: Game) => g.category_id === 'lottery').length,
          concise: games.filter((g: Game) => g.category_id === 'concise').length
        };
      }
    } catch (_err: any) {
      // 获取游戏列表失败时静默处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshGames();
  }, []);

  return (
    <GameContext.Provider value={{
      realbetList,
      gamingList,
      jokerList,
      sportList,
      lotteryList,
      conciseList,
      allGamesList,
      apiGamesList,
      loading,
      refreshGames
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GameProvider');
  }
  return context;
}



