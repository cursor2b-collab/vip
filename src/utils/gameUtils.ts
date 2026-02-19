/**
 * 游戏工具函数
 */

// 存储导航函数的全局变量
let globalNavigate: ((path: string) => void) | null = null;

/**
 * 设置全局导航函数（在 App.tsx 中调用）
 */
export function setGameNavigation(navigate: (path: string) => void) {
  globalNavigate = navigate;
}

/**
 * 打开游戏（在当前页面内打开，使用 iframe）
 * @param platformName 平台名称，如 'AG', 'BG', 'PG', 'KY', 'EVO' 等
 * @param gameType 游戏类型：1=真人, 2=电游, 3=电游, 4=彩票, 5=体育, 6=棋牌
 * @param gameCode 游戏代码，如 '0', '74', '87', '830' 等
 */
export function openGame(
  platformName: string,
  gameType: number,
  gameCode: string = '0'
) {
  // 检查登录状态
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    alert('请先登录后再进入游戏');
    if (globalNavigate) {
      globalNavigate('/login');
    } else {
      window.location.href = '/login';
    }
    return;
  }

  // 使用路由跳转到游戏页面，在页面内使用 iframe 打开
  const params = new URLSearchParams({
    platform: platformName,
    gameType: gameType.toString(),
    gameCode: gameCode
  });
  
  
  // 优先使用 React Router 导航（不会刷新页面）
  if (globalNavigate) {
    const gamePath = `/game?${params.toString()}`;
    globalNavigate(gamePath);
  } else {
    // 如果没有设置导航函数，使用 window.location.href（会刷新页面但也能工作）
    // 检查当前 URL 是否使用 hash 路由
    const isHashRouter = window.location.pathname === '/' && window.location.hash;
    const gameUrl = isHashRouter 
      ? `/#/game?${params.toString()}`
      : `/game?${params.toString()}`;
    
    window.location.href = gameUrl;
  }
}

/**
 * 打开新游戏接口的游戏（使用 vendorCode 和 gameCode）- 已注释
 * @param vendorCode 供应商代码，如 'casino-playace', 'slot-pgsoft' 等
 * @param gameCode 游戏代码，如 'lobby', 'P060', 'D058' 等
 * @param gameType 游戏类型：1=真人, 2=电游, 3=电游, 4=彩票, 5=体育, 6=棋牌（可选，默认为1）
 */
// export function openNewGame(
//   vendorCode: string,
//   gameCode: string,
//   gameType: number = 1
// ) {
//   // 检查登录状态
//   const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//   if (!token) {
//     alert('请先登录后再进入游戏');
//     if (globalNavigate) {
//       globalNavigate('/login');
//     } else {
//       window.location.href = '/login';
//     }
//     return;
//   }
//
//   // 使用路由跳转到游戏页面，传递 vendorCode 和 gameCode
//   const params = new URLSearchParams({
//     vendorCode: vendorCode,
//     gameCode: gameCode,
//     gameType: gameType.toString()
//   });
//   
//   // 优先使用 React Router 导航（不会刷新页面）
//   if (globalNavigate) {
//     const gamePath = `/game?${params.toString()}`;
//     globalNavigate(gamePath);
//   } else {
//     // 如果没有设置导航函数，使用 window.location.href（会刷新页面但也能工作）
//     // 检查当前 URL 是否使用 hash 路由
//     const isHashRouter = window.location.pathname === '/' && window.location.hash;
//     const gameUrl = isHashRouter 
//       ? `/#/game?${params.toString()}`
//       : `/game?${params.toString()}`;
//     
//     window.location.href = gameUrl;
//   }
// }

// 新游戏API调用已全部注释掉，提供一个空函数避免编译错误
export function openNewGame(
  vendorCode: string,
  gameCode: string,
  gameType: number = 1
) {
  console.warn('⚠️ openNewGame 已被禁用，新游戏API调用已全部注释掉');
  // 可以回退到旧接口，但需要将 vendorCode 映射回平台代码
  // 这里暂时不实现，因为需要知道具体的映射关系
}

/**
 * 打开游戏（在当前页面内打开，使用 iframe）
 * @param platformName 平台名称，如 'AG', 'BG', 'PG', 'KY', 'EVO' 等
 * @param gameType 游戏类型：1=真人, 2=电游, 3=电游, 4=彩票, 5=体育, 6=棋牌
 * @param gameCode 游戏代码，如 '0', '74', '87', '830' 等
 */
export function openGame2(
  platformName: string
) {
  // 检查登录状态
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    alert('请先登录后再进入游戏');
    if (globalNavigate) {
      globalNavigate('/login');
    } else {
      window.location.href = '/login';
    }
    return;
  }
  if (globalNavigate) {
      globalNavigate(''+ platformName);

    } else {
      window.location.href = platformName;
    }
}


