/**
 * 美盛游戏接口客户端（PHP 后端）
 * 请求 /api/v1/game/*（如 game/enter），需登录态 Bearer Token
 *
 * Token 优先级：
 * 1. backend_token（后端登录 /api/v1/auth/login 返回的 JWT，游戏接口专用）
 * 2. token（Supabase JWT，仅无鉴权接口可用，game/enter 会返回 10002）
 */
import axios, { AxiosInstance } from 'axios'

// 开发时走 Vite proxy（/api/v1 → VITE_BACKEND_URL）
// 生产时直接使用后端完整 URL，避免需要前端 Nginx 配置 proxy
const PHP_GAME_BASE = import.meta.env.PROD
  ? `${(import.meta.env.VITE_BACKEND_URL as string || 'https://admin.amjsvip.cc').replace(/\/+$/, '')}/api/v1`
  : '/api/v1'

const phpGameClient: AxiosInstance = axios.create({
  baseURL: PHP_GAME_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})

phpGameClient.interceptors.request.use((config) => {
  // 优先使用后端 JWT（专门用于游戏接口），其次 fallback 到 Supabase token
  const token =
    localStorage.getItem('backend_token') ||
    sessionStorage.getItem('backend_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

phpGameClient.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data ?? err)
)

export default phpGameClient
