/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_USE_NEW_GAME_API?: string;
  /** 与 ht 管理后台统一：Supabase 项目 URL */
  readonly VITE_SUPABASE_URL?: string;
  /** 与 ht 管理后台统一：Supabase 可发布 Key */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** 为 true 时使用 Supabase Auth 登录（与 ht 统一认证） */
  readonly VITE_USE_SUPABASE_AUTH?: string;
  /** 游戏接口代理根地址（旧 bet-proxy，已弃用） */
  readonly VITE_BET_PROXY_URL?: string;
  /** 为 false 时禁用美盛游戏接口（PHP /api/v1/game/*），默认 true */
  readonly VITE_USE_PHP_GAME_BACKEND?: string;
  /** 新 JS 游戏接口根地址（如 https://api.amjsvip.cc），配置后用户端游戏请求走 /ley/* */
  readonly VITE_GAME_API_URL?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
