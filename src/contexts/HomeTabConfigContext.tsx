import { createContext, useContext, type ReactNode } from 'react';
import type { HomeTabItem } from '@/lib/api/system';

const HomeTabConfigContext = createContext<HomeTabItem[]>([]);

export function HomeTabConfigProvider({
  tabs,
  children,
}: {
  tabs: HomeTabItem[];
  children: ReactNode;
}) {
  return (
    <HomeTabConfigContext.Provider value={tabs}>
      {children}
    </HomeTabConfigContext.Provider>
  );
}

export function useHomeTabConfig(): HomeTabItem[] {
  return useContext(HomeTabConfigContext);
}

/** 获取指定 id 的标签配置（如百家乐 id=1） */
export function useHomeTabById(id: number): HomeTabItem | undefined {
  const tabs = useHomeTabConfig();
  return tabs.find((t) => t.id === id);
}
